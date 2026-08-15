// src/modules/statsCounters.js
// ─────────────────────────────────────────────────────────────────────────────
// Live Server Statistics Voice Counters
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { getSetting, setSetting } = require('./autoMod');

/**
 * Refresh stats channels for a guild
 * @param {import('discord.js').Guild} guild
 */
async function updateServerStats(guild) {
  try {
    const isEnabled = await getSetting(guild.id, 'STATS_COUNTERS_ENABLED');
    if (isEnabled !== 'true') return;

    const totalChannelId = await getSetting(guild.id, 'STATS_TOTAL_CHANNEL_ID');
    const onlineChannelId = await getSetting(guild.id, 'STATS_ONLINE_CHANNEL_ID');
    const boostsChannelId = await getSetting(guild.id, 'STATS_BOOSTS_CHANNEL_ID');

    // Fetch members to ensure accurate presence counts
    await guild.members.fetch().catch(() => null);

    const totalMembers = guild.memberCount;
    const onlineMembers = guild.members.cache.filter(m => m.presence && m.presence.status !== 'offline').size;
    const boostCount = guild.premiumSubscriptionCount || 0;

    if (totalChannelId) {
      const ch = guild.channels.cache.get(totalChannelId);
      if (ch) await ch.setName(`👥 Members: ${totalMembers.toLocaleString()}`).catch(() => null);
    }

    if (onlineChannelId) {
      const ch = guild.channels.cache.get(onlineChannelId);
      if (ch) await ch.setName(`🟢 Online: ${onlineMembers.toLocaleString()}`).catch(() => null);
    }

    if (boostsChannelId) {
      const ch = guild.channels.cache.get(boostsChannelId);
      if (ch) await ch.setName(`🚀 Boosts: ${boostCount}`).catch(() => null);
    }
  } catch (err) {
    console.error('[Server Stats Update] Error:', err);
  }
}

module.exports = {
  updateServerStats
};
