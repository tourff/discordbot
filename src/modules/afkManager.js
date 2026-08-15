// src/modules/afkManager.js
// ─────────────────────────────────────────────────────────────────────────────
// AFK State Manager
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { supabase } = require('../config/supabase');

/**
 * Set a user's AFK state
 * @param {string} guildId
 * @param {string} userId
 * @param {string} reason
 */
async function setAFK(guildId, userId, reason = 'AFK') {
  await supabase.from('user_afk').upsert({
    guild_id: guildId,
    user_id: userId,
    reason: reason.substring(0, 150),
    afk_since: new Date().toISOString()
  }, { onConflict: 'guild_id,user_id' });
}

/**
 * Remove a user's AFK state
 * @param {string} guildId
 * @param {string} userId
 */
async function removeAFK(guildId, userId) {
  const { data } = await supabase
    .from('user_afk')
    .delete()
    .eq('guild_id', guildId)
    .eq('user_id', userId)
    .select()
    .single();

  return data;
}

/**
 * Check if mentioned users are AFK and alert
 * @param {import('discord.js').Message} message
 */
async function handleAFKMessage(message) {
  if (!message.guild || message.author.bot) return;

  // 1. Check if the message author was AFK -> remove AFK and welcome back
  const { data: authorAfk } = await supabase
    .from('user_afk')
    .select('*')
    .eq('guild_id', message.guild.id)
    .eq('user_id', message.author.id)
    .single();

  if (authorAfk) {
    await removeAFK(message.guild.id, message.author.id);
    const welcomeBack = await message.reply(`👋 Welcome back ${message.author}! I removed your AFK status.`).catch(() => null);
    if (welcomeBack) setTimeout(() => welcomeBack.delete().catch(() => null), 6000);
  }

  // 2. Check if author mentioned someone who is AFK
  if (message.mentions.users.size > 0) {
    const mentionedIds = Array.from(message.mentions.users.keys()).filter(id => id !== message.author.id);
    if (mentionedIds.length === 0) return;

    const { data: afkUsers } = await supabase
      .from('user_afk')
      .select('*')
      .eq('guild_id', message.guild.id)
      .in('user_id', mentionedIds);

    if (afkUsers && afkUsers.length > 0) {
      for (const u of afkUsers) {
        const since = new Date(u.afk_since);
        const timeAgo = `<t:${Math.floor(since.getTime() / 1000)}:R>`;
        const reply = await message.reply(`💤 **<@${u.user_id}> is currently AFK:** ${u.reason} (${timeAgo})`).catch(() => null);
        if (reply) setTimeout(() => reply.delete().catch(() => null), 8000);
      }
    }
  }
}

module.exports = {
  setAFK,
  removeAFK,
  handleAFKMessage
};
