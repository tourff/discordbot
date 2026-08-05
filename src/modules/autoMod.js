// src/modules/autoMod.js
// ─────────────────────────────────────────────────────────────────────────────
// Auto-moderation module:
//   1. Blacklisted word filter
//   2. Unauthorized URL / Discord invite filter
//   3. Anti-spam: delete messages if >5 within 3 seconds
//
// Extend BAD_WORDS and ALLOWED_URL_PATTERNS to suit your server.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getModLogsChannelId } = require('./settings');

// ── Configuration ─────────────────────────────────────────────────────────────

/** Words to auto-delete (case-insensitive). Add your own. */
const BAD_WORDS = [
  'badword1',
  'badword2',
  'slur1',
];

/**
 * Regex to detect Discord invite links and generic URLs.
 * The bot will delete these unless the author has MANAGE_MESSAGES.
 */
const INVITE_REGEX = /(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/[a-zA-Z0-9]+/i;
const URL_REGEX    = /https?:\/\/[^\s]+/i;

/** Anti-spam: max messages per window */
const SPAM_LIMIT  = 5;
const SPAM_WINDOW = 3000; // ms

// ── In-memory spam tracker ────────────────────────────────────────────────────
// Map<userId, { count: number, timer: NodeJS.Timeout, messages: Message[] }>
const spamTracker = new Map();

// ── Helper ────────────────────────────────────────────────────────────────────
/**
 * Sends a DM warning to the user and optionally logs to mod-logs.
 */
async function warnUser(message, reason) {
  await message.delete().catch(() => null);

  const dmEmbed = new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle('⚠️ Auto-Moderation')
    .setDescription(`Your message in **${message.guild.name}** was removed.\n\n**Reason:** ${reason}`)
    .setTimestamp();

  await message.author.send({ embeds: [dmEmbed] }).catch(() => null);

  const logChannelId = await getModLogsChannelId(message.guild.id);
  if (!logChannelId) return;
  const logChannel = message.guild.channels.cache.get(logChannelId);
  if (!logChannel) return;

  const logEmbed = new EmbedBuilder()
    .setColor(0xffa500)
    .setTitle('🤖 AutoMod Action')
    .addFields(
      { name: '👤 User',    value: `${message.author.tag} (${message.author.id})`, inline: true },
      { name: '📢 Channel', value: message.channel.toString(),                      inline: true },
      { name: '📋 Reason',  value: reason },
      { name: '📝 Content', value: message.content.slice(0, 1024) || '*empty*' }
    )
    .setTimestamp();

  await logChannel.send({ embeds: [logEmbed] }).catch(console.error);
}

// ── Main export ───────────────────────────────────────────────────────────────
/**
 * @param {import('discord.js').Message} message
 * @param {import('discord.js').Client}  _client
 */
async function autoMod(message, _client) {
  const content  = message.content.toLowerCase();
  const isMod    = message.member?.permissions.has(PermissionFlagsBits.ManageMessages);

  // Mods/admins bypass automod
  if (isMod) return;

  // ── 1. Bad-word filter ──────────────────────────────────────────────────────
  const foundWord = BAD_WORDS.find(w => content.includes(w));
  if (foundWord) {
    await warnUser(message, `Use of a blacklisted word.`);
    return;
  }

  // ── 2. Discord invite filter ────────────────────────────────────────────────
  if (INVITE_REGEX.test(message.content)) {
    await warnUser(message, 'Posting Discord invite links is not allowed.');
    return;
  }

  // ── 3. URL filter (optional — comment out if you want URLs allowed) ─────────
  // if (URL_REGEX.test(message.content)) {
  //   await warnUser(message, 'Posting URLs requires permission.');
  //   return;
  // }

  // ── 4. Anti-spam ────────────────────────────────────────────────────────────
  const userId = message.author.id;

  if (!spamTracker.has(userId)) {
    spamTracker.set(userId, { count: 0, messages: [], timer: null });
  }

  const data = spamTracker.get(userId);
  data.count++;
  data.messages.push(message);

  // Reset the window timer on every message
  clearTimeout(data.timer);
  data.timer = setTimeout(() => {
    spamTracker.delete(userId);
  }, SPAM_WINDOW);

  if (data.count > SPAM_LIMIT) {
    // Bulk delete all tracked messages from this user
    const toDelete = data.messages.filter(m => m.deletable);
    if (toDelete.length > 0) {
      await message.channel.bulkDelete(toDelete, true).catch(() => null);
    }
    spamTracker.delete(userId);

    const dmEmbed = new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle('🚫 Spam Detected')
      .setDescription(`Slow down! You were sending messages too fast in **${message.guild.name}**.`)
      .setTimestamp();

    await message.author.send({ embeds: [dmEmbed] }).catch(() => null);

    const logChannel = message.guild.channels.cache.get(await getModLogsChannelId(message.guild.id));
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setColor(0xffa500)
        .setTitle('🤖 AutoMod — Spam')
        .addFields(
          { name: '👤 User',    value: `${message.author.tag} (${message.author.id})`, inline: true },
          { name: '📢 Channel', value: message.channel.toString(),                      inline: true },
          { name: '🗑️ Deleted', value: `${toDelete.length} messages` }
        )
        .setTimestamp();
      await logChannel.send({ embeds: [logEmbed] }).catch(console.error);
    }
  }
}

module.exports = { autoMod };
