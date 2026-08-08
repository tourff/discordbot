// src/modules/settings.js
// ─────────────────────────────────────────────────────────────────────────────
// Guild settings helper — reads/writes from Supabase `bot_settings` table.
// Includes an in-memory cache so we don't hit the DB on every message.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const supabase = require('../config/supabase');

// In-memory cache: Map<guildId, Map<key, value>>
const cache = new Map();

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;
const cacheTimestamps = new Map();

/**
 * Get a setting value for a guild.
 * Checks memory cache first, then falls back to env var, then Supabase.
 *
 * @param {string} guildId
 * @param {string} key
 * @returns {Promise<string|null>}
 */
async function getSetting(guildId, key) {
  // ── 1. Check in-memory cache ──────────────────────────────────────────────
  const cacheKey = `${guildId}:${key}`;
  const cachedAt = cacheTimestamps.get(cacheKey);

  if (cachedAt && Date.now() - cachedAt < CACHE_TTL) {
    const guildCache = cache.get(guildId);
    if (guildCache && guildCache.has(key)) {
      return guildCache.get(key);
    }
  }

  // ── 2. Check environment variable fallback ─────────────────────────────────
  // Env var names map 1:1 with setting keys (e.g. key='WELCOME_CHANNEL_ID')
  if (process.env[key]) {
    return process.env[key];
  }

  // ── 3. Fetch from Supabase ─────────────────────────────────────────────────
  const { data, error } = await supabase
    .from('bot_settings')
    .select('value')
    .eq('guild_id', guildId)
    .eq('key', key)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error(`[settings] getSetting error (${key}):`, error);
    return null;
  }

  const value = data?.value ?? null;

  // Store in cache
  if (!cache.has(guildId)) cache.set(guildId, new Map());
  cache.get(guildId).set(key, value);
  cacheTimestamps.set(cacheKey, Date.now());

  return value;
}

/**
 * Save a setting value for a guild (upsert).
 *
 * @param {string} guildId
 * @param {string} key
 * @param {string} value
 * @returns {Promise<boolean>} true on success
 */
async function setSetting(guildId, key, value) {
  const { error } = await supabase
    .from('bot_settings')
    .upsert({ guild_id: guildId, key, value }, { onConflict: 'guild_id,key' });

  if (error) {
    console.error(`[settings] setSetting error (${key}):`, error);
    return false;
  }

  // Invalidate cache for this entry
  if (!cache.has(guildId)) cache.set(guildId, new Map());
  cache.get(guildId).set(key, value);
  cacheTimestamps.set(`${guildId}:${key}`, Date.now());

  return true;
}

/**
 * Invalidate the entire cache for a guild (useful after bulk updates).
 * @param {string} guildId
 */
function invalidateCache(guildId) {
  cache.delete(guildId);
}

/**
 * Delete a setting for a guild.
 * @param {string} guildId
 * @param {string} key
 * @returns {Promise<boolean>} true on success
 */
async function deleteSetting(guildId, key) {
  const { error } = await supabase
    .from('bot_settings')
    .delete()
    .eq('guild_id', guildId)
    .eq('key', key);

  if (error) {
    console.error(`[settings] deleteSetting error (${key}):`, error);
    return false;
  }

  if (cache.has(guildId)) cache.get(guildId).delete(key);
  cacheTimestamps.delete(`${guildId}:${key}`);

  return true;
}

// ── Convenience getters ───────────────────────────────────────────────────────

/** @param {string} guildId */
const getWelcomeChannelId      = (guildId) => getSetting(guildId, 'WELCOME_CHANNEL_ID');
const getWelcomeMessage        = (guildId) => getSetting(guildId, 'WELCOME_MESSAGE');
const getGoodbyeChannelId      = (guildId) => getSetting(guildId, 'GOODBYE_CHANNEL_ID');
const getGoodbyeMessage        = (guildId) => getSetting(guildId, 'GOODBYE_MESSAGE');
const getModLogsChannelId      = (guildId) => getSetting(guildId, 'MOD_LOGS_CHANNEL_ID');
const getServerLogsChannelId   = (guildId) => getSetting(guildId, 'SERVER_LOGS_CHANNEL_ID');
const getDefaultMemberRoleId   = (guildId) => getSetting(guildId, 'DEFAULT_MEMBER_ROLE_ID');

/**
 * Gets the social config (url, channelId, message) for a specific platform.
 * @param {string} guildId
 * @param {string} platform ('YOUTUBE', 'FACEBOOK', 'TIKTOK', 'INSTAGRAM')
 */
async function getSocialPlatformConfig(guildId, platform) {
  const [url, channelId, message] = await Promise.all([
    getSetting(guildId, `${platform}_URL`),
    getSetting(guildId, `${platform}_CHANNEL_ID`),
    getSetting(guildId, `${platform}_MESSAGE`),
  ]);
  return { url, channelId, message };
}

module.exports = {
  getSetting,
  setSetting,
  deleteSetting,
  invalidateCache,
  getWelcomeChannelId,
  getWelcomeMessage,
  getGoodbyeChannelId,
  getGoodbyeMessage,
  getModLogsChannelId,
  getServerLogsChannelId,
  getDefaultMemberRoleId,
  getSocialPlatformConfig,
};
