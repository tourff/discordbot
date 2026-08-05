// src/commands/utility/setup.js
// ─────────────────────────────────────────────────────────────────────────────
// /setup — Configure all bot settings from inside Discord.
// No need to touch Render env vars for channels/roles.
//
// Subcommands:
//   /setup welcome-channel   #channel
//   /setup mod-logs          #channel
//   /setup server-logs       #channel
//   /setup social-channel    #channel
//   /setup member-role       @role
//   /setup view              (show current config)
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');

const { setSetting, getSetting } = require('../../modules/settings');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Configure bot settings for this server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

    // ── /setup welcome-channel ──────────────────────────────────────────────
    .addSubcommand(sub =>
      sub
        .setName('welcome-channel')
        .setDescription('Set the channel where welcome messages are sent.')
        .addChannelOption(opt =>
          opt.setName('channel').setDescription('Select a channel.').setRequired(true)
        )
    )

    // ── /setup mod-logs ─────────────────────────────────────────────────────
    .addSubcommand(sub =>
      sub
        .setName('mod-logs')
        .setDescription('Set the channel for moderation action logs.')
        .addChannelOption(opt =>
          opt.setName('channel').setDescription('Select a channel.').setRequired(true)
        )
    )

    // ── /setup server-logs ──────────────────────────────────────────────────
    .addSubcommand(sub =>
      sub
        .setName('server-logs')
        .setDescription('Set the channel for server event logs (edits, deletes, joins).')
        .addChannelOption(opt =>
          opt.setName('channel').setDescription('Select a channel.').setRequired(true)
        )
    )

    // ── /setup social-channel ───────────────────────────────────────────────
    .addSubcommand(sub =>
      sub
        .setName('social-channel')
        .setDescription('Set the channel for social media (YouTube, TikTok, etc.) notifications.')
        .addChannelOption(opt =>
          opt.setName('channel').setDescription('Select a channel.').setRequired(true)
        )
    )

    // ── /setup member-role ──────────────────────────────────────────────────
    .addSubcommand(sub =>
      sub
        .setName('member-role')
        .setDescription('Set the role automatically assigned to new members on join.')
        .addRoleOption(opt =>
          opt.setName('role').setDescription('Select a role.').setRequired(true)
        )
    )

    // ── /setup view ─────────────────────────────────────────────────────────
    .addSubcommand(sub =>
      sub
        .setName('view')
        .setDescription('View the current bot configuration for this server.')
    ),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const sub     = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    // ── /setup view ──────────────────────────────────────────────────────────
    if (sub === 'view') {
      const [welcome, modLogs, serverLogs, social, memberRole] = await Promise.all([
        getSetting(guildId, 'WELCOME_CHANNEL_ID'),
        getSetting(guildId, 'MOD_LOGS_CHANNEL_ID'),
        getSetting(guildId, 'SERVER_LOGS_CHANNEL_ID'),
        getSetting(guildId, 'SOCIAL_NOTIF_CHANNEL_ID'),
        getSetting(guildId, 'DEFAULT_MEMBER_ROLE_ID'),
      ]);

      const fmt = (id, type = 'channel') =>
        id ? (type === 'channel' ? `<#${id}>` : `<@&${id}>`) : '❌ Not set';

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('⚙️ Bot Configuration')
        .setDescription('Use `/setup <subcommand>` to change any setting.')
        .addFields(
          { name: '👋 Welcome Channel',  value: fmt(welcome),     inline: true },
          { name: '🔨 Mod Logs',         value: fmt(modLogs),     inline: true },
          { name: '📋 Server Logs',      value: fmt(serverLogs),  inline: true },
          { name: '📢 Social Channel',   value: fmt(social),      inline: true },
          { name: '🎭 Default Role',     value: fmt(memberRole, 'role'), inline: true },
        )
        .setFooter({ text: 'Settings are saved in the database — no restart needed.' })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    // ── Channel / role setters ───────────────────────────────────────────────
    const settingMap = {
      'welcome-channel': { key: 'WELCOME_CHANNEL_ID',    label: '👋 Welcome Channel',  type: 'channel' },
      'mod-logs':        { key: 'MOD_LOGS_CHANNEL_ID',   label: '🔨 Mod Logs',          type: 'channel' },
      'server-logs':     { key: 'SERVER_LOGS_CHANNEL_ID',label: '📋 Server Logs',       type: 'channel' },
      'social-channel':  { key: 'SOCIAL_NOTIF_CHANNEL_ID',label:'📢 Social Channel',    type: 'channel' },
      'member-role':     { key: 'DEFAULT_MEMBER_ROLE_ID', label: '🎭 Default Role',      type: 'role'    },
    };

    const config = settingMap[sub];
    if (!config) return interaction.editReply({ content: '❌ Unknown subcommand.' });

    const target =
      config.type === 'channel'
        ? interaction.options.getChannel('channel')
        : interaction.options.getRole('role');

    const ok = await setSetting(guildId, config.key, target.id);

    if (!ok) {
      return interaction.editReply({
        content: '❌ Failed to save setting. Check that the Supabase connection is working.',
      });
    }

    const mention =
      config.type === 'channel' ? `<#${target.id}>` : `<@&${target.id}>`;

    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle('✅ Setting Saved')
      .setDescription(`**${config.label}** has been set to ${mention}.`)
      .setFooter({ text: 'No restart needed — takes effect immediately.' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
