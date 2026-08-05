// src/commands/utility/setup-roles.js
// ─────────────────────────────────────────────────────────────────────────────
// Sends a persistent embed with role-selection buttons to the roles channel.
// Moderators run /setup-roles and supply a list of "roleId:Label" pairs.
//
// Example usage:
//   /setup-roles roles:1234567890:🎮 Gamer,9876543210:🎵 Music Fan
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-roles')
    .setDescription('Post a role-selection embed with buttons in the current channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addStringOption(opt =>
      opt
        .setName('roles')
        .setDescription('Comma-separated list of "roleId:Label" pairs. E.g. 123:🎮 Gamer,456:🎵 Music')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('title').setDescription('Embed title (default: "Choose Your Roles")').setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('description').setDescription('Embed description text.').setRequired(false)
    ),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const rawRoles  = interaction.options.getString('roles');
    const title     = interaction.options.getString('title')       ?? '🎭 Choose Your Roles';
    const desc      = interaction.options.getString('description') ?? 'Click a button below to add or remove a role.';

    // Parse "roleId:Label" pairs
    const pairs = rawRoles.split(',').map(s => s.trim()).filter(Boolean);
    if (pairs.length === 0) {
      return interaction.editReply({ content: '❌ No valid role pairs provided.' });
    }

    // Discord allows max 5 buttons per row, 5 rows = 25 buttons total
    const rows = [];
    let currentRow = new ActionRowBuilder();
    let buttonCount = 0;

    for (const pair of pairs) {
      const colonIdx = pair.indexOf(':');
      if (colonIdx === -1) continue;

      const roleId = pair.slice(0, colonIdx).trim();
      const label  = pair.slice(colonIdx + 1).trim();

      const role = interaction.guild.roles.cache.get(roleId);
      if (!role) {
        console.warn(`[setup-roles] Role ${roleId} not found.`);
        continue;
      }

      const button = new ButtonBuilder()
        .setCustomId(`role_${roleId}`)
        .setLabel(label || role.name)
        .setStyle(ButtonStyle.Secondary);

      currentRow.addComponents(button);
      buttonCount++;

      // Start a new row after every 5 buttons
      if (buttonCount % 5 === 0) {
        rows.push(currentRow);
        currentRow = new ActionRowBuilder();
      }
    }

    // Push last partial row
    if (currentRow.components.length > 0) {
      rows.push(currentRow);
    }

    if (rows.length === 0) {
      return interaction.editReply({ content: '❌ Could not find any of the specified roles.' });
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(title)
      .setDescription(desc)
      .setFooter({ text: 'Clicking a button toggles the role on/off.' })
      .setTimestamp();

    await interaction.channel.send({ embeds: [embed], components: rows });
    await interaction.editReply({ content: '✅ Role selection panel posted!' });
  },
};
