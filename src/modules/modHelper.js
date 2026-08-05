// src/modules/modHelper.js
// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers for moderation commands:
//   • createModCase()  — saves a case in Supabase + returns the case object
//   • logModAction()   — posts a rich embed to #mod-logs
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { EmbedBuilder } = require('discord.js');
const supabase         = require('../config/supabase');
const { getModLogsChannelId } = require('./settings');

/** Map action names to embed colors */
const ACTION_COLORS = {
  kick:   0xffa500, // Orange
  ban:    0xed4245, // Red
  mute:   0xfee75c, // Yellow
  unmute: 0x57f287, // Green
  warn:   0xeb459e, // Pink
};

/**
 * Saves a moderation case to Supabase and returns the saved row.
 *
 * @param {object} opts
 * @param {string} opts.guildId
 * @param {string} opts.userId
 * @param {string} opts.moderatorId
 * @param {string} opts.action       - 'kick' | 'ban' | 'mute' | 'unmute' | 'warn'
 * @param {string} opts.reason
 * @returns {Promise<object|null>} The inserted row or null on error.
 */
async function createModCase({ guildId, userId, moderatorId, action, reason }) {
  const { data, error } = await supabase
    .from('mod_cases')
    .insert({
      guild_id:     guildId,
      user_id:      userId,
      moderator_id: moderatorId,
      action,
      reason,
    })
    .select()
    .single();

  if (error) {
    console.error('[modHelper] Supabase insert error:', error);
    return null;
  }
  return data;
}

/**
 * Sends a formatted mod-action embed to the #mod-logs channel.
 *
 * @param {import('discord.js').Guild} guild
 * @param {object} modCase  - The object returned by createModCase
 * @param {import('discord.js').User} targetUser
 * @param {import('discord.js').User} moderatorUser
 */
async function logModAction(guild, modCase, targetUser, moderatorUser) {
  const channelId = await getModLogsChannelId(guild.id);
  if (!channelId) return;

  const logChannel = guild.channels.cache.get(channelId);
  if (!logChannel) return;

  const color = ACTION_COLORS[modCase.action] ?? 0x99aab5;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`🔨 Case #${modCase.id} — ${modCase.action.toUpperCase()}`)
    .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: '👤 Target',    value: `${targetUser.tag} (${targetUser.id})`,         inline: true },
      { name: '🛡️ Moderator', value: `${moderatorUser.tag} (${moderatorUser.id})`,   inline: true },
      { name: '📋 Reason',    value: modCase.reason || 'No reason provided.' },
      { name: '🕐 Time',      value: `<t:${Math.floor(new Date(modCase.created_at).getTime() / 1000)}:F>` }
    )
    .setFooter({ text: `Case ID: ${modCase.id}` })
    .setTimestamp();

  await logChannel.send({ embeds: [embed] }).catch(console.error);
}

module.exports = { createModCase, logModAction };
