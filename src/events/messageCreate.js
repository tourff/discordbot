// src/events/messageCreate.js
// ─────────────────────────────────────────────────────────────────────────────
// Handles every message:
//   • Auto-moderation: bad words, unauthorized URLs/invites
//   • Anti-spam: rate limiting (>5 messages in 3 seconds)
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { autoMod } = require('../modules/autoMod');
const { handleEasytag, handleTagcheck } = require('../modules/esportsHandlers');
const { handleScrimRegistration } = require('../modules/scrimsManager');
const { handleTourneyRegistration } = require('../modules/tourneyManager');
const { handleAIChatChannel } = require('../modules/aiAssistant');
const { handleMessageXP } = require('../modules/leveling');

module.exports = {
  name: 'messageCreate',

  /**
   * @param {import('discord.js').Message} message
   * @param {import('discord.js').Client}  client
   */
  async execute(message, client) {
    // Ignore bots and DMs
    if (message.author.bot || !message.guild) return;

    // AI Auto-Chat in designated channel
    const aiHandled = await handleAIChatChannel(message).catch(console.error);
    if (aiHandled) return;

    // Run esports tag handlers
    const easytagHandled = await handleEasytag(message).catch(console.error);
    if (easytagHandled) return; // Original message was deleted/replaced

    const tagcheckHandled = await handleTagcheck(message).catch(console.error);
    if (tagcheckHandled) return; // Requirements not met, warned/deleted

    const scrimHandled = await handleScrimRegistration(message).catch(console.error);
    if (scrimHandled) return; // Processed by scrim manager

    const tourneyHandled = await handleTourneyRegistration(message).catch(console.error);
    if (tourneyHandled) return; // Processed by tourney manager

    // AutoMod check
    await autoMod(message, client).catch(console.error);

    // Award XP
    await handleMessageXP(message).catch(console.error);
  },
};

