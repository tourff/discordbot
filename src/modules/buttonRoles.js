// src/modules/buttonRoles.js
// ─────────────────────────────────────────────────────────────────────────────
// Handles button-based role toggling.
// Button custom IDs must follow the pattern: "role_<roleId>"
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

/**
 * Toggles a role on/off for the button-clicking member.
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function handleButtonRole(interaction) {
  await interaction.deferReply({ ephemeral: true });

  // Extract the role ID from the button's custom ID
  const roleId = interaction.customId.replace('role_', '');
  const role   = interaction.guild.roles.cache.get(roleId);

  if (!role) {
    return interaction.editReply({ content: '❌ That role no longer exists. Please contact an admin.' });
  }

  const member = interaction.member;

  // Toggle: add if they don't have it, remove if they do
  if (member.roles.cache.has(roleId)) {
    await member.roles.remove(role);
    await interaction.editReply({ content: `✅ Removed the **${role.name}** role from you.` });
  } else {
    await member.roles.add(role);
    await interaction.editReply({ content: `✅ Gave you the **${role.name}** role!` });
  }
}

module.exports = { handleButtonRole };
