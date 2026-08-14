// src/commands/moderation/maintenance.js
'use strict';

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType, PermissionOverwriteManager } = require('discord.js');
const supabase = require('../../config/supabase');
const { parseTime, discordTimestamp } = require('../../modules/time');

module.exports = {
  category: 'moderation',
  data: new SlashCommandBuilder()
    .setName('maintenance')
    .setDescription('Manage server maintenance mode.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('on')
        .setDescription('Turn ON maintenance mode for a role (hides channels).')
        .addRoleOption(o => o.setName('role').setDescription('Role to put under maintenance (defaults to @everyone)').setRequired(false))
        .addStringOption(o => o.setName('duration').setDescription('Maintenance duration (e.g. 30m, 2h, 1d)').setRequired(false))
        .addBooleanOption(o => o.setName('temp_channels').setDescription('Create temporary maintenance chat/vc?').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('off')
        .setDescription('Turn OFF maintenance mode for a role (restores channel access).')
        .addRoleOption(o => o.setName('role').setDescription('Role to remove from maintenance (defaults to @everyone)').setRequired(false))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const role = interaction.options.getRole('role') || interaction.guild.roles.everyone;
    const guildId = interaction.guild.id;

    await interaction.deferReply();

    // Check bot perms
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.editReply({ content: '❌ I need **Manage Channels** permission to execute maintenance commands.' });
    }

    // ── MAINTENANCE: ON ───────────────────────────────────────────────────────
    if (sub === 'on') {
      const durationStr = interaction.options.getString('duration');
      const createTemp = interaction.options.getBoolean('temp_channels') ?? true;

      // Check if already under maintenance
      const { data: existing } = await supabase
        .from('lockdowns')
        .select('*')
        .eq('guild_id', guildId)
        .eq('type', 'maintenance')
        .eq('role_id', role.id)
        .single();

      if (existing) {
        return interaction.editReply({ content: `❌ Server is already under maintenance for role ${role}.` });
      }

      let durationMs = 0;
      let expireTime = null;

      if (durationStr) {
        durationMs = parseTime(durationStr);
        if (!durationMs || durationMs < 5000) {
          return interaction.editReply({ content: '❌ Invalid duration format. Use formats like `30s`, `10m`, `2h`, `1d`.' });
        }
        expireTime = new Date(Date.now() + durationMs);
      }

      // Fetch all channels
      await interaction.guild.channels.fetch();
      const allChannels = [...interaction.guild.channels.cache.values()];

      // Target text/voice channels that are visible to this role and modifiable by the bot
      const targetChannels = allChannels.filter(ch => 
        ch.type !== ChannelType.GuildCategory && 
        ch.name !== 'maintenance-chat' && 
        ch.name !== 'maintenance-vc' &&
        ch.permissionsFor(role).has(PermissionFlagsBits.ViewChannel) &&
        ch.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ManageChannels)
      );

      if (targetChannels.length === 0) {
        return interaction.editReply({ content: `❌ No visible channels found to hide for role ${role}.` });
      }

      const affectedChannelIds = [];
      for (const ch of targetChannels) {
        try {
          await ch.permissionOverwrites.edit(role, {
            ViewChannel: false,
          }, { reason: `Maintenance ON by ${interaction.user.tag}` });
          affectedChannelIds.push(ch.id);
        } catch {
          // Ignore failure for individual channels
        }
      }

      // Insert maintenance record in db
      await supabase.from('lockdowns').insert({
        guild_id: guildId,
        type: 'maintenance',
        channel_id: interaction.channel.id,
        author_id: interaction.user.id,
        role_id: role.id,
        channel_ids: affectedChannelIds,
        expire_time: expireTime ? expireTime.toISOString() : null
      });

      // Optionally create temp channels
      if (createTemp) {
        const overwrites = [
          {
            id: role.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
          },
          {
            id: interaction.guild.members.me.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels],
          }
        ];

        // If not everyone role, hide from everyone else
        if (role.id !== interaction.guild.roles.everyone.id) {
          overwrites.push({
            id: interaction.guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel]
          });
        }

        await interaction.guild.channels.create({
          name: 'maintenance-chat',
          type: ChannelType.GuildText,
          permissionOverwrites: overwrites,
          reason: 'Maintenance temp channel'
        }).catch(console.error);

        await interaction.guild.channels.create({
          name: 'maintenance-vc',
          type: ChannelType.GuildVoice,
          permissionOverwrites: overwrites,
          reason: 'Maintenance temp VC'
        }).catch(console.error);
      }

      const embed = new EmbedBuilder()
        .setColor(0xffaa00)
        .setTitle('🚧 Maintenance Started')
        .setDescription(`Maintenance mode is now **ON** for role ${role}. Hidden **${affectedChannelIds.length}** channel(s).`)
        .addFields(
          { name: 'Duration', value: expireTime ? `${durationStr} (Expires ${discordTimestamp(expireTime, 'R')})` : 'Permanent', inline: true },
          { name: 'Temp Channels', value: createTemp ? 'Created `#maintenance-chat` & `🔊 maintenance-vc`' : 'None', inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }

    // ── MAINTENANCE: OFF ──────────────────────────────────────────────────────
    else if (sub === 'off') {
      const { data: record } = await supabase
        .from('lockdowns')
        .select('*')
        .eq('guild_id', guildId)
        .eq('type', 'maintenance')
        .eq('role_id', role.id)
        .single();

      if (!record) {
        return interaction.editReply({ content: `❌ Role ${role} is not currently under maintenance.` });
      }

      let restoredCount = 0;
      if (record.channel_ids && record.channel_ids.length > 0) {
        for (const chId of record.channel_ids) {
          const ch = await interaction.guild.channels.fetch(chId).catch(() => null);
          if (ch) {
            try {
              await ch.permissionOverwrites.edit(role, {
                ViewChannel: null,
              }, { reason: `Maintenance OFF by ${interaction.user.tag}` });
              restoredCount++;
            } catch {
              // Ignore failure for individual channels
            }
          }
        }
      }

      // Cleanup temp channels
      const mtChat = interaction.guild.channels.cache.find(c => c.name === 'maintenance-chat');
      const mtVc = interaction.guild.channels.cache.find(c => c.name === 'maintenance-vc');
      if (mtChat) await mtChat.delete().catch(() => null);
      if (mtVc) await mtVc.delete().catch(() => null);

      // Delete from db
      await supabase.from('lockdowns').delete().eq('id', record.id);

      const embed = new EmbedBuilder()
        .setColor(0x00ff88)
        .setTitle('🚧 Maintenance Ended')
        .setDescription(`Maintenance mode has been turned **OFF** for role ${role}. Restored access to **${restoredCount}** channel(s).`)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  },
};
