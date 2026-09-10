// src/commands/utility/botcontrol.js
// ─────────────────────────────────────────────────────────────────────────────
// /botcontrol — Manage bot access, exclusivity, and permissions for this server.
// Accessible ONLY by Server Owner, Bot Adder, or Server Administrators.
//
// Subcommands:
//   /botcontrol mode [public | restricted | admins_only]
//   /botcontrol allow <user_or_role>
//   /botcontrol deny <user_or_role>
//   /botcontrol status
//   /botcontrol setadder <user>
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');

const {
  canManageBot,
  getBotAdder,
  setBotAdder,
  getAccessMode,
  setAccessMode,
  addPermission,
  removePermission,
  getPermissions,
} = require('../../modules/permissions');

module.exports = {
  category: 'utility',
  data: new SlashCommandBuilder()
    .setName('botcontrol')
    .setDescription('Manage bot exclusivity, access modes, and permissions for this server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

    // ── /botcontrol mode ────────────────────────────────────────────────────
    .addSubcommand(sub =>
      sub
        .setName('mode')
        .setDescription('Set who is allowed to use this bot in this server.')
        .addStringOption(opt =>
          opt
            .setName('setting')
            .setDescription('Choose the access control mode.')
            .setRequired(true)
            .addChoices(
              { name: '🌐 Public (Everyone can use general/music commands; admin commands protected)', value: 'public' },
              { name: '🔒 Restricted (Only Bot Adder, Server Owner & authorized roles can use the bot)', value: 'restricted' },
              { name: '🛡️ Admins Only (Only Administrators & authorized roles can use the bot)', value: 'admins_only' }
            )
        )
    )

    // ── /botcontrol allow ───────────────────────────────────────────────────
    .addSubcommand(sub =>
      sub
        .setName('allow')
        .setDescription('Authorize a role or user to use the bot.')
        .addMentionableOption(opt =>
          opt
            .setName('target')
            .setDescription('Select a role or user to permit.')
            .setRequired(true)
        )
    )

    // ── /botcontrol deny ────────────────────────────────────────────────────
    .addSubcommand(sub =>
      sub
        .setName('deny')
        .setDescription('Revoke bot usage authorization from a role or user.')
        .addMentionableOption(opt =>
          opt
            .setName('target')
            .setDescription('Select a role or user to revoke.')
            .setRequired(true)
        )
    )

    // ── /botcontrol status ──────────────────────────────────────────────────
    .addSubcommand(sub =>
      sub
        .setName('status')
        .setDescription('View current bot access mode, bot adder, and authorized permissions.')
    )

    // ── /botcontrol setadder ────────────────────────────────────────────────
    .addSubcommand(sub =>
      sub
        .setName('setadder')
        .setDescription('Change or designate the Bot Adder (Bot Manager) for this server.')
        .addUserOption(opt =>
          opt
            .setName('user')
            .setDescription('Select the new bot manager.')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    // ── Security Check ──────────────────────────────────────────────────────
    const allowed = await canManageBot(interaction.member);
    if (!allowed) {
      return interaction.reply({
        content: "You don't have admin or manage guild permission for this guild.",
        ephemeral: true,
      });
    }

    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild;

    // ─────────────────────────────────────────────────────────────────────────
    // 1. /botcontrol mode
    // ─────────────────────────────────────────────────────────────────────────
    if (sub === 'mode') {
      const newMode = interaction.options.getString('setting');
      await setAccessMode(guild.id, newMode);

      let desc = '';
      if (newMode === 'restricted') {
        const adderId = await getBotAdder(guild.id, guild.ownerId);
        desc = `🔒 **Restricted Mode Activated**\n\n` +
          `Only the member who added the bot (<@${adderId}>), the Server Owner (<@${guild.ownerId}>), and explicitly permitted roles/users can use any bot commands.\n` +
          `Regular members will be blocked with an exclusivity warning.`;
      } else if (newMode === 'admins_only') {
        desc = `🛡️ **Admins Only Mode Activated**\n\n` +
          `Only Server Administrators and authorized roles can use the bot in this server.`;
      } else {
        desc = `🌐 **Public Mode Activated**\n\n` +
          `All server members can now enjoy general commands (music, leveling, economy, etc.).\n` +
          `Administrative, setup, and moderation commands remain strictly protected for Admins / Bot Adder.`;
      }

      const embed = new EmbedBuilder()
        .setColor(newMode === 'restricted' ? 0xFEE75C : 0x57F287)
        .setTitle('⚙️ Bot Access Mode Updated')
        .setDescription(desc)
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. /botcontrol allow
    // ─────────────────────────────────────────────────────────────────────────
    if (sub === 'allow') {
      const mentionable = interaction.options.getMentionable('target');
      const isRole = Boolean(mentionable.guild && mentionable.color !== undefined);
      const type = isRole ? 'role' : 'user';

      const success = await addPermission(guild.id, type, mentionable.id);
      if (!success) {
        return interaction.reply({ content: '❌ Failed to save permission. Please try again.', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle('✅ Permission Granted')
        .setDescription(`Successfully authorized ${type === 'role' ? `role <@&${mentionable.id}>` : `user <@${mentionable.id}>`} to use the bot.`)
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. /botcontrol deny
    // ─────────────────────────────────────────────────────────────────────────
    if (sub === 'deny') {
      const mentionable = interaction.options.getMentionable('target');
      const isRole = Boolean(mentionable.guild && mentionable.color !== undefined);
      const type = isRole ? 'role' : 'user';

      const success = await removePermission(guild.id, type, mentionable.id);
      if (!success) {
        return interaction.reply({ content: '❌ Failed to remove permission.', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor(0xED4245)
        .setTitle('🚫 Permission Revoked')
        .setDescription(`Revoked bot authorization from ${type === 'role' ? `role <@&${mentionable.id}>` : `user <@${mentionable.id}>`}.`)
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. /botcontrol status
    // ─────────────────────────────────────────────────────────────────────────
    if (sub === 'status') {
      await interaction.deferReply();

      const [currentMode, adderId, permissions] = await Promise.all([
        getAccessMode(guild.id),
        getBotAdder(guild.id, guild.ownerId),
        getPermissions(guild.id),
      ]);

      const allowedRoles = permissions.filter(p => p.type === 'role').map(p => `<@&${p.target_id}>`);
      const allowedUsers = permissions.filter(p => p.type === 'user').map(p => `<@${p.target_id}>`);

      const modeLabels = {
        public: '🌐 Public (Members can use general/music cmds, admin cmds restricted)',
        restricted: '🔒 Restricted (Only Bot Adder, Owner & authorized roles)',
        admins_only: '🛡️ Admins Only (Only Admins & authorized roles)',
      };

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`🛡️ Bot Control & Permissions — ${guild.name}`)
        .addFields(
          { name: '👑 Server Owner', value: `<@${guild.ownerId}>`, inline: true },
          { name: '🤖 Added By (Bot Manager)', value: adderId ? `<@${adderId}>` : '*Unknown / Owner*', inline: true },
          { name: '⚙️ Access Mode', value: modeLabels[currentMode] || currentMode, inline: false },
          { name: '👥 Authorized Roles', value: allowedRoles.length > 0 ? allowedRoles.join(', ') : '*None set (Only admins/adder have access)*', inline: false },
          { name: '👤 Authorized Users', value: allowedUsers.length > 0 ? allowedUsers.join(', ') : '*None set*', inline: false }
        )
        .setFooter({ text: 'Use /botcontrol mode to change access, or /botcontrol allow to permit roles' })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. /botcontrol setadder
    // ─────────────────────────────────────────────────────────────────────────
    if (sub === 'setadder') {
      // Only Server Owner or current Bot Adder can transfer
      const currentAdder = await getBotAdder(guild.id, guild.ownerId);
      if (interaction.user.id !== guild.ownerId && interaction.user.id !== currentAdder) {
        return interaction.reply({
          content: '❌ Only the Server Owner or current Bot Adder can designate a new Bot Manager.',
          ephemeral: true,
        });
      }

      const targetUser = interaction.options.getUser('user');
      await setBotAdder(guild.id, targetUser.id);

      const embed = new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle('✅ Bot Manager Transferred')
        .setDescription(`**${targetUser.tag}** (<@${targetUser.id}>) is now designated as the Bot Adder / Manager for this server.`)
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }
  },
};
