// src/modules/settings.js
// ─────────────────────────────────────────────────────────────────────────────
// Guild settings helper — reads/writes from Supabase `bot_settings` table.
// Includes an in-memory cache so we don't hit the DB on every message.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const supabase = require('../config/supabase');

// In-memory cache: Map<guildId, Map<key, value>>
const cache = new Map();

// Cache TTL in milliseconds (5 seconds for near-instant reactivity with dashboard & slash commands)
const CACHE_TTL = 5 * 1000;
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

  // ── 2. Fetch from Supabase ─────────────────────────────────────────────────
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

  let value = data?.value ?? null;

  // ── 3. Check environment variable fallback (ONLY for primary dev guild) ───────
  // Server-specific IDs (channels, roles) must NEVER leak into other guilds
  if (value === null && process.env[key]) {
    if (!process.env.GUILD_ID || guildId === process.env.GUILD_ID) {
      value = process.env[key];
    }
  }

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
const getWelcomeImageUrl       = (guildId) => getSetting(guildId, 'WELCOME_IMAGE_URL');
const getGoodbyeChannelId      = (guildId) => getSetting(guildId, 'GOODBYE_CHANNEL_ID');
const getGoodbyeMessage        = (guildId) => getSetting(guildId, 'GOODBYE_MESSAGE');
const getGoodbyeImageUrl       = (guildId) => getSetting(guildId, 'GOODBYE_IMAGE_URL');
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

/**
 * Gets all configured social feeds for a guild.
 * Checks SOCIAL_FEEDS first. If absent or empty, falls back to legacy single-key configs.
 * @param {string} guildId
 * @returns {Promise<Array<object>>}
 */
async function getSocialFeeds(guildId) {
  const rawFeeds = await getSetting(guildId, 'SOCIAL_FEEDS');
  if (rawFeeds) {
    try {
      const parsed = JSON.parse(rawFeeds);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.error(`[settings] Failed to parse SOCIAL_FEEDS for guild ${guildId}:`, e);
    }
  }

  // Fallback / auto-migration from legacy single-feed platform keys
  const legacyPlatforms = ['YOUTUBE', 'FACEBOOK', 'INSTAGRAM', 'TIKTOK'];
  const legacyFeeds = [];

  for (const plat of legacyPlatforms) {
    const [url, channelId, message] = await Promise.all([
      getSetting(guildId, `${plat}_URL`),
      getSetting(guildId, `${plat}_CHANNEL_ID`),
      getSetting(guildId, `${plat}_MESSAGE`),
    ]);

    if (url && channelId) {
      legacyFeeds.push({
        id: `legacy_${plat.toLowerCase()}`,
        platform: plat.toLowerCase(),
        name: `${plat.charAt(0) + plat.slice(1).toLowerCase()} Feed`,
        url,
        channelId,
        message: message || '',
        ping: 'none',
        enabled: true,
      });
    }
  }

  return legacyFeeds;
}

/**
 * Saves all social feeds for a guild.
 * @param {string} guildId
 * @param {Array<object>} feeds
 * @returns {Promise<boolean>}
 */
async function saveSocialFeeds(guildId, feeds) {
  return setSetting(guildId, 'SOCIAL_FEEDS', JSON.stringify(feeds || []));
}

module.exports = {
  getSetting,
  setSetting,
  deleteSetting,
  invalidateCache,
  getWelcomeChannelId,
  getWelcomeMessage,
  getWelcomeImageUrl,
  getGoodbyeChannelId,
  getGoodbyeMessage,
  getGoodbyeImageUrl,
  getModLogsChannelId,
  getServerLogsChannelId,
  getDefaultMemberRoleId,
  getSocialPlatformConfig,
  getSocialFeeds,
  saveSocialFeeds,
};

