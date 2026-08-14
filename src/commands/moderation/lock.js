// src/commands/moderation/lock.js
'use strict';

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const supabase = require('../../config/supabase');
const { parseTime, discordTimestamp } = require('../../modules/time');

module.exports = {
  category: 'moderation',
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Lock a channel, category, or the entire server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption(o =>
      o.setName('type')
        .setDescription('What to lock')
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
      o.setName('duration')
        .setDescription('Lock duration (e.g. 10m, 2h, 1d). Leave blank for permanent.')
        .setRequired(false)
    )
    .addStringOption(o =>
      o.setName('reason')
        .setDescription('Reason for locking')
        .setRequired(false)
    ),

  async execute(interaction) {
    const type = interaction.options.getString('type');
    const targetChannel = interaction.options.getChannel('target_channel') || interaction.channel;
    const durationStr = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const guildId = interaction.guild.id;

    let durationMs = 0;
    let expireTime = null;

    if (durationStr) {
      durationMs = parseTime(durationStr);
      if (!durationMs || durationMs < 5000) {
        return interaction.reply({ content: '❌ Invalid duration format. Use formats like `30s`, `10m`, `2h`, `1d`.', ephemeral: true });
      }
      expireTime = new Date(Date.now() + durationMs);
    }

    await interaction.deferReply();

    // Check manage channel perms for bot
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.editReply({ content: '❌ I need **Manage Channels** permission to run lockdown commands.' });
    }

    try {
      // ── TYPE: CHANNEL ───────────────────────────────────────────────────────
      if (type === 'channel') {
        if (targetChannel.type === ChannelType.GuildCategory) {
          return interaction.editReply({ content: '❌ Selected channel is a Category. Please select "Category" in type option.' });
        }

        await targetChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
          SendMessages: false,
          AddReactions: false,
        }, { reason: `Locked by ${interaction.user.tag}: ${reason}` });

        if (expireTime) {
          await supabase.from('lockdowns').insert({
            guild_id: guildId,
            type: 'channel',
            channel_id: targetChannel.id,
            author_id: interaction.user.id,
            expire_time: expireTime.toISOString()
          });
        }

        const embed = new EmbedBuilder()
          .setColor(0xff4444)
          .setTitle('🔒 Channel Locked')
          .setDescription(`${targetChannel} has been locked.`)
          .addFields(
            { name: 'Duration', value: expireTime ? `${durationStr} (Expires ${discordTimestamp(expireTime, 'R')})` : 'Permanent', inline: true },
            { name: 'Reason', value: reason, inline: true }
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
              SendMessages: false,
              AddReactions: false,
            }, { reason: `Category Locked by ${interaction.user.tag}: ${reason}` });

            if (expireTime) {
              await supabase.from('lockdowns').insert({
                guild_id: guildId,
                type: 'channel',
                channel_id: ch.id,
                author_id: interaction.user.id,
                expire_time: expireTime.toISOString()
              });
            }
            success++;
          } catch (e) {
            // Ignore channel locked failures
          }
        }

        const embed = new EmbedBuilder()
          .setColor(0xff4444)
          .setTitle('🔒 Category Locked')
          .setDescription(`All channels inside category **${category.name}** have been locked. (${success} channels success)`)
          .addFields(
            { name: 'Duration', value: expireTime ? `${durationStr} (Expires ${discordTimestamp(expireTime, 'R')})` : 'Permanent', inline: true },
            { name: 'Reason', value: reason, inline: true }
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      }

      // ── TYPE: SERVER ────────────────────────────────────────────────────────
      else if (type === 'server') {
        // Fetch all channels
        await interaction.guild.channels.fetch();

        const allChannels = [...interaction.guild.channels.cache.values()];
        const targetChannels = allChannels.filter(ch => 
          ch.type !== ChannelType.GuildCategory && 
          ch.permissionsFor(interaction.guild.roles.everyone).has(PermissionFlagsBits.SendMessages) &&
          ch.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ManageChannels)
        );

        if (targetChannels.length === 0) {
          return interaction.editReply({ content: '❌ No channels with send message permissions found to lock.' });
        }

        const lockedChannelIds = [];
        for (const ch of targetChannels) {
          try {
            await ch.permissionOverwrites.edit(interaction.guild.roles.everyone, {
              SendMessages: false,
              AddReactions: false,
            }, { reason: `Server Lockdown by ${interaction.user.tag}: ${reason}` });
            lockedChannelIds.push(ch.id);
          } catch {
            // Ignore failures for specific channels
          }
        }

        if (expireTime) {
          await supabase.from('lockdowns').insert({
            guild_id: guildId,
            type: 'guild',
            channel_id: interaction.channel.id, // Log channel or response channel
            author_id: interaction.user.id,
            channel_ids: lockedChannelIds,
            expire_time: expireTime.toISOString()
          });
        }

        const embed = new EmbedBuilder()
          .setColor(0xff4444)
          .setTitle('🚨 Server Lockdown')
          .setDescription(`The entire server has been locked down! (Locked **${lockedChannelIds.length}** channels)`)
          .addFields(
            { name: 'Duration', value: expireTime ? `${durationStr} (Expires ${discordTimestamp(expireTime, 'R')})` : 'Permanent', inline: true },
            { name: 'Reason', value: reason, inline: true }
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      }
    } catch (err) {
      console.error('[lock]', err);
      await interaction.editReply({ content: `❌ Failed to execute lock operation: ${err.message}` });
    }
  },
};
