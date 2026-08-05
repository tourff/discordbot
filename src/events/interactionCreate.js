// src/events/interactionCreate.js
// ─────────────────────────────────────────────────────────────────────────────
// Handles ALL incoming interactions:
//   • Slash commands  → dispatch to client.commands
//   • Button clicks   → dispatch to the buttonRoles handler
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { handleButtonRole } = require('../modules/buttonRoles');

module.exports = {
  name: 'interactionCreate',

  /**
   * @param {import('discord.js').Interaction} interaction
   * @param {import('discord.js').Client}       client
   */
  async execute(interaction, client) {

    // ── Slash commands ──────────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction, client);
      } catch (err) {
        console.error(`[interactionCreate] Error executing /${interaction.commandName}:`, err);
        const msg = { content: '❌ An error occurred while running this command.', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(msg).catch(() => null);
        } else {
          await interaction.reply(msg).catch(() => null);
        }
      }
    }

    // ── Button interactions ─────────────────────────────────────────────────
    if (interaction.isButton()) {
      // Button IDs for role assignment are prefixed with "role_"
      if (interaction.customId.startsWith('role_')) {
        await handleButtonRole(interaction).catch(console.error);
      }
    }
  },
};
