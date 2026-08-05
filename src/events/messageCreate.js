// src/events/messageCreate.js
// ─────────────────────────────────────────────────────────────────────────────
// Handles every message:
//   • Auto-moderation: bad words, unauthorized URLs/invites
//   • Anti-spam: rate limiting (>5 messages in 3 seconds)
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { autoMod } = require('../modules/autoMod');

module.exports = {
  name: 'messageCreate',

  /**
   * @param {import('discord.js').Message} message
   * @param {import('discord.js').Client}  client
   */
  async execute(message, client) {
    // Ignore bots and DMs
    if (message.author.bot || !message.guild) return;

    await autoMod(message, client).catch(console.error);
  },
};
