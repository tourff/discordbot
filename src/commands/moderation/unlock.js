// src/commands/moderation/unlock.js
'use strict';

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const supabase = require('../../config/supabase');

module.exports = {
  category: 'moderation',
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlock a channel, category, or the entire server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption(o =>
      o.setName('type')
        .setDescription('What to unlock')
        .setRequired(true)
        .addChoices(
          { name: 'Channel', value: 'channel' },
          { name: 'Category', value: 'category' },
          { name: 'Server', value: 'server' }
        )
    )
    .addChannelOption(o =>
      o.setName('target_channel')
        .setDescription('Target channel or category (defaults to current channel/category)')
        .setRequired(false)
    )
    .addStringOption(o =>
      o.setName('reason')
        .setDescription('Reason for unlocking')
        .setRequired(false)
    ),

  async execute(interaction) {
    const type = interaction.options.getString('type');
    const targetChannel = interaction.options.getChannel('target_channel') || interaction.channel;
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const guildId = interaction.guild.id;

    await interaction.deferReply();

    // Check manage channel perms for bot
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.editReply({ content: '❌ I need **Manage Channels** permission to run unlock commands.' });
    }

    try {
      // ── TYPE: CHANNEL ───────────────────────────────────────────────────────
      if (type === 'channel') {
        if (targetChannel.type === ChannelType.GuildCategory) {
          return interaction.editReply({ content: '❌ Selected channel is a Category. Please select "Category" in type option.' });
        }

        await targetChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
          SendMessages: null,
          AddReactions: null,
        }, { reason: `Unlocked by ${interaction.user.tag}: ${reason}` });

        // Delete from lockdowns db
        await supabase.from('lockdowns').delete().eq('guild_id', guildId).eq('channel_id', targetChannel.id);

        const embed = new EmbedBuilder()
          .setColor(0x00ff88)
          .setTitle('🔓 Channel Unlocked')
          .setDescription(`${targetChannel} has been unlocked.`)
          .addFields(
            { name: 'Reason', value: reason },
            { name: 'Unlocked by', value: `${interaction.user}` }
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        if (targetChannel.id !== interaction.channel.id) {
          await targetChannel.send({ embeds: [embed] }).catch(() => null);
        }
      }

      // ── TYPE: CATEGORY ──────────────────────────────────────────────────────
      else if (type === 'category') {
        const category = targetChannel.type === ChannelType.GuildCategory ? targetChannel : targetChannel.parent;
        if (!category) {
          return interaction.editReply({ content: '❌ The target channel is not inside a category.' });
        }

        const channels = category.children.cache;
        let success = 0;

        for (const [, ch] of channels) {
          try {
            await ch.permissionOverwrites.edit(interaction.guild.roles.everyone, {
              SendMessages: null,
              AddReactions: null,
            }, { reason: `Category Unlocked by ${interaction.user.tag}: ${reason}` });

            await supabase.from('lockdowns').delete().eq('guild_id', guildId).eq('channel_id', ch.id);
            success++;
          } catch (e) {
            // Ignore individual failures
          }
        }

        const embed = new EmbedBuilder()
          .setColor(0x00ff88)
          .setTitle('🔓 Category Unlocked')
          .setDescription(`All channels inside category **${category.name}** have been unlocked. (${success} channels success)`)
          .addFields(
            { name: 'Reason', value: reason },
            { name: 'Unlocked by', value: `${interaction.user}` }
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      }

      // ── TYPE: SERVER ────────────────────────────────────────────────────────
      else if (type === 'server') {
        // Fetch active server lockdowns in db
        const { data: serverLockdowns } = await supabase
          .from('lockdowns')
          .select('*')
          .eq('guild_id', guildId)
          .eq('type', 'guild');

        let channelsToUnlock = [];

        if (serverLockdowns && serverLockdowns.length > 0) {
          // Unlock channels saved in database lockdown records
          for (const lock of serverLockdowns) {
            if (lock.channel_ids && lock.channel_ids.length > 0) {
              channelsToUnlock.push(...lock.channel_ids);
            }
          }
        } else {
          // Hard fallback: unlock all text channels whereeveryone doesn't have send permission
          await interaction.guild.channels.fetch();
          channelsToUnlock = [...interaction.guild.channels.cache.values()]
            .filter(ch => ch.type !== ChannelType.GuildCategory)
            .map(ch => ch.id);
        }

        // Deduplicate
        channelsToUnlock = [...new Set(channelsToUnlock)];

        let success = 0;
        for (const chId of channelsToUnlock) {
          const ch = await interaction.guild.channels.fetch(chId).catch(() => null);
          if (ch) {
            try {
              await ch.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                SendMessages: null,
                AddReactions: null,
              }, { reason: `Server Unlock by ${interaction.user.tag}: ${reason}` });
              success++;
            } catch {
              // Ignore failure for individual channels
            }
          }
        }

        // Clean up database guild lockdowns
        await supabase.from('lockdowns').delete().eq('guild_id', guildId).eq('type', 'guild');

        const embed = new EmbedBuilder()
          .setColor(0x00ff88)
          .setTitle('🔓 Server Unlocked')
          .setDescription(`The entire server has been unlocked! (${success} channels unlocked)`)
          .addFields(
            { name: 'Reason', value: reason },
            { name: 'Unlocked by', value: `${interaction.user}` }
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      }
    } catch (err) {
      console.error('[unlock]', err);
      await interaction.editReply({ content: `❌ Failed to execute unlock operation: ${err.message}` });
    }
  },
};
