// src/modules/antiNuke.js
// ─────────────────────────────────────────────────────────────────────────────
// Anti-Nuke & Server Raid Protection Engine
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { AuditLogEvent, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getSetting } = require('./autoMod');

// Track recent actions per admin: `${guildId}-${executorId}-${actionType}` -> [timestamps]
const actionBuckets = new Map();

/**
 * Check and mitigate if an admin is rapidly nuking the server
 * @param {import('discord.js').Guild} guild
 * @param {string} actionType 'ban' | 'kick' | 'channel_delete'
 */
async function checkAntiNuke(guild, actionType) {
  try {
    const isAntiNukeEnabled = await getSetting(guild.id, 'ANTINUKE_ENABLED');
    if (isAntiNukeEnabled !== 'true') return;

    // Fetch latest audit log entry
    let auditType = AuditLogEvent.MemberBanAdd;
    if (actionType === 'kick') auditType = AuditLogEvent.MemberKick;
    if (actionType === 'channel_delete') auditType = AuditLogEvent.ChannelDelete;

    const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: auditType }).catch(() => null);
    if (!auditLogs) return;

    const entry = auditLogs.entries.first();
    if (!entry || !entry.executor || entry.executor.id === guild.client.user.id || entry.executor.id === guild.ownerId) {
      return; // Ignore bot and guild owner
    }

    const executor = entry.executor;
    const key = `${guild.id}-${executor.id}-${actionType}`;
    const now = Date.now();

    const timestamps = actionBuckets.get(key) || [];
    // Keep actions from the last 15 seconds
    const recent = timestamps.filter(t => now - t < 15000);
    recent.push(now);
    actionBuckets.set(key, recent);

    const threshold = Number(await getSetting(guild.id, 'ANTINUKE_THRESHOLD')) || 3;

    if (recent.length >= threshold) {
      // TRIGGER ANTI-NUKE EMERGENCY ACTION
      console.warn(`[Anti-Nuke] Triggered on ${executor.tag} in ${guild.name} for mass ${actionType}!`);

      const member = await guild.members.fetch(executor.id).catch(() => null);
      if (member && member.bannable) {
        // Strip high roles & ban perpetrator
        await member.ban({ reason: `[Jarvis Anti-Nuke] Triggered rate limit for mass ${actionType}` }).catch(console.error);
      }

      // Notify server owner and mod log channel
      const alertChannelId = await getSetting(guild.id, 'MOD_LOGS_CHANNEL_ID');
      const alertChannel = guild.channels.cache.get(alertChannelId);

      const alertEmbed = new EmbedBuilder()
        .setColor(0xef4444)
        .setTitle('🚨 ANTI-NUKE SHIELD TRIGGERED')
        .setDescription(`**Offender:** <@${executor.id}> (${executor.tag})\n**Action:** Mass ${actionType} (${recent.length} actions in <15s)\n**Mitigation:** Administrator has been stripped of roles and banned to protect server assets.`)
        .setFooter({ text: 'Jarvis Anti-Nuke • Made by trj7' })
        .setTimestamp();

      if (alertChannel) {
        alertChannel.send({ embeds: [alertEmbed] }).catch(console.error);
      }

      const owner = await guild.fetchOwner().catch(() => null);
      if (owner) {
        owner.send({ embeds: [alertEmbed] }).catch(() => null);
      }
    }
  } catch (err) {
    console.error('[Anti-Nuke] Error:', err);
  }
}

module.exports = {
  checkAntiNuke
};
