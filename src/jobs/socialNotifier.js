// src/jobs/socialNotifier.js
// ─────────────────────────────────────────────────────────────────────────────
// Polls social media RSS feeds every 5 minutes and sends Discord embed
// notifications for any new posts since the last check.
//
// Supported platforms:
//   • YouTube  — native Atom feed
//   • Facebook — public page RSS (limited, consider a scraper service)
//   • Instagram — third-party RSS bridge (e.g. rsshub.app/instagram/user/)
//   • TikTok   — third-party RSS bridge (e.g. rsshub.app/tiktok/user/)
//
// Last-seen post IDs are stored in Supabase `social_config` table using a 
// composite key (platform_guildId) so duplicate notifications are never sent.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const cron      = require('node-cron');
const Parser    = require('rss-parser');
const { EmbedBuilder } = require('discord.js');
const supabase  = require('../config/supabase');

const parser = new Parser({
  customFields: {
    item: [
      ['media:thumbnail', 'mediaThumbnail', { keepArray: false }],
      ['media:group',     'mediaGroup',     { keepArray: false }],
    ],
  },
});

// ── Platform config ───────────────────────────────────────────────────────────
const PLATFORMS = [
  { key: 'youtube',   label: 'YouTube',   emoji: '▶️',  color: 0xff0000 },
  { key: 'facebook',  label: 'Facebook',  emoji: '📘',  color: 0x1877f2 },
  { key: 'instagram', label: 'Instagram', emoji: '📸',  color: 0xe1306c },
  { key: 'tiktok',    label: 'TikTok',    emoji: '🎵',  color: 0x010101 },
  { key: 'custom',    label: 'RSS Feed',  emoji: '📡',  color: 0x5865f2 },
];

// ── Supabase helpers ──────────────────────────────────────────────────────────

/**
 * Retrieves the last known post ID for a platform or feed key.
 * @param {string} platform
 * @returns {Promise<string|null>}
 */
async function getLastId(platform) {
  const { data, error } = await supabase
    .from('social_config')
    .select('last_post_id')
    .eq('platform', platform)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
    console.error(`[socialNotifier] getLastId error for ${platform}:`, error);
  }
  return data?.last_post_id ?? null;
}

/**
 * Saves (upserts) the last post ID for a platform or feed key.
 * @param {string} platform
 * @param {string} postId
 */
async function saveLastId(platform, postId) {
  const { error } = await supabase
    .from('social_config')
    .upsert({ platform, last_post_id: postId }, { onConflict: 'platform' });

  if (error) {
    console.error(`[socialNotifier] saveLastId error for ${platform}:`, error);
  }
}

/**
 * Formats custom message with variables {author}, {title}, {url}, {platform}
 * @param {string} template
 * @param {object} context
 * @returns {string}
 */
function formatNotificationMessage(template, { platform, item, feed }) {
  const authorName = item.creator || item.author || feed.name || platform.label;
  const postTitle = item.title || 'New Post';
  const postUrl = item.link || item.guid || '';
  const platformName = platform.label;

  let msg = template && template.trim()
    ? template
    : `📢 **{author}** posted new content on **{platform}**!\n**{title}**\n{url}`;

  msg = msg
    .replace(/\{author\}/gi, authorName)
    .replace(/\{channel\}/gi, authorName)
    .replace(/\{title\}/gi, postTitle)
    .replace(/\{url\}/gi, postUrl)
    .replace(/\{link\}/gi, postUrl)
    .replace(/\{platform\}/gi, platformName);

  // Ping handling
  const pingOption = feed.ping;
  let pingPrefix = '';
  if (pingOption === '@everyone' && !msg.includes('@everyone')) {
    pingPrefix = '@everyone ';
  } else if (pingOption === '@here' && !msg.includes('@here')) {
    pingPrefix = '@here ';
  } else if (!pingOption && process.env.SOCIAL_PING_EVERYONE === 'true' && !msg.includes('@everyone')) {
    pingPrefix = '@everyone ';
  }

  return `${pingPrefix}${msg}`.trim();
}

/**
 * Sends a Discord embed notification for a new post.
 * @param {import('discord.js').Client} client
 * @param {object} feed
 * @param {object} platform
 * @param {object} item     - Parsed RSS item
 */
async function sendNotification(client, feed, platform, item) {
  const channelId = feed.channelId;
  if (!channelId) return;

  // Try cache first, then fetch from API (handles bot restart / uncached channels)
  let channel = client.channels.cache.get(channelId);
  if (!channel) {
    try {
      channel = await client.channels.fetch(channelId);
    } catch (err) {
      console.error(`[socialNotifier] Could not fetch channel ${channelId}:`, err.message);
      return;
    }
  }
  if (!channel) return;

  let thumbnail = null;
  if (item.mediaThumbnail?.$?.url)    thumbnail = item.mediaThumbnail.$.url;
  if (item.mediaGroup?.['media:thumbnail']?.[0]?.$.url) {
    thumbnail = item.mediaGroup['media:thumbnail'][0].$.url;
  }
  if (item.enclosure?.url)             thumbnail = item.enclosure.url;

  const url = item.link ?? item.guid;
  const authorName = item.creator || item.author || feed.name || platform.label;

  const embed = new EmbedBuilder()
    .setColor(platform.color)
    .setAuthor({ name: `${platform.emoji} New ${platform.label} Post - ${feed.name || authorName}`.slice(0, 100) })
    .setTitle(item.title?.slice(0, 256) ?? 'New post')
    .setURL(url)
    .setDescription(
      item.contentSnippet
        ? item.contentSnippet.slice(0, 300) + (item.contentSnippet.length > 300 ? '…' : '')
        : null
    )
    .setTimestamp(item.pubDate ? new Date(item.pubDate) : new Date())
    .setFooter({ text: `${platform.label} • ${feed.name || 'Social Feed'}` });

  if (thumbnail) embed.setImage(thumbnail);

  const textMsg = formatNotificationMessage(feed.message, { platform, item, feed });

  await channel.send({ content: textMsg, embeds: [embed] }).catch(console.error);
}

const feedUrlCache = new Map();

/**
 * Resolves any YouTube URL (handle, custom link, channel ID) to the verified XML RSS feed URL.
 * @param {string} rawUrl
 * @param {string} platform
 * @returns {Promise<string|null>}
 */
async function ensureXmlFeedUrl(rawUrl, platform) {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  const plat = (platform || '').toLowerCase();

  if (plat === 'youtube' || trimmed.includes('youtube.com') || trimmed.includes('youtu.be') || trimmed.startsWith('@')) {
    if (trimmed.includes('feeds/videos.xml?channel_id=')) {
      return trimmed;
    }
    if (feedUrlCache.has(trimmed)) {
      return feedUrlCache.get(trimmed);
    }

    if (trimmed.startsWith('UC') && trimmed.length >= 20 && !trimmed.includes('/') && !trimmed.includes('.')) {
      const resolved = `https://www.youtube.com/feeds/videos.xml?channel_id=${trimmed}`;
      feedUrlCache.set(trimmed, resolved);
      return resolved;
    }

    const cMatch = trimmed.match(/channel\/(UC[a-zA-Z0-9_-]+)/);
    if (cMatch) {
      const resolved = `https://www.youtube.com/feeds/videos.xml?channel_id=${cMatch[1]}`;
      feedUrlCache.set(trimmed, resolved);
      return resolved;
    }

    try {
      let fetchUrl = trimmed;
      if (fetchUrl.startsWith('@')) fetchUrl = `https://www.youtube.com/${fetchUrl}`;
      else if (!fetchUrl.startsWith('http')) fetchUrl = `https://www.youtube.com/@${fetchUrl}`;

      const res = await fetch(fetchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      });
      if (res.ok) {
        const html = await res.text();
        const mRss = html.match(/feeds\/videos\.xml\?channel_id=([a-zA-Z0-9_-]+)/);
        const mMeta = html.match(/<meta itemprop="identifier" content="([a-zA-Z0-9_-]+)"/);
        const mJson = html.match(/"channelId":"(UC[a-zA-Z0-9_-]+)"/);
        const mExt = html.match(/"externalId":"(UC[a-zA-Z0-9_-]+)"/);
        const channelId = mRss?.[1] || mMeta?.[1] || mJson?.[1] || mExt?.[1];

        if (channelId) {
          const resolved = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
          feedUrlCache.set(trimmed, resolved);
          return resolved;
        }
      }
    } catch (err) {
      console.warn(`[socialNotifier] Could not resolve YouTube handle "${trimmed}":`, err.message);
    }
  }

  return trimmed;
}

// ── Main poll function ────────────────────────────────────────────────────────

/**
 * Polls all configured RSS feeds and sends notifications for new posts.
 * @param {import('discord.js').Client} client
 */
async function pollFeeds(client) {
  const { getSocialFeeds } = require('../modules/settings');

  for (const guild of client.guilds.cache.values()) {
    try {
      const feeds = await getSocialFeeds(guild.id);
      if (!Array.isArray(feeds) || feeds.length === 0) continue;

      for (const feed of feeds) {
        if (feed.enabled === false) continue;
        if (!feed.url || !feed.channelId) continue;

        const platformKey = (feed.platform || 'custom').toLowerCase();
        const platform = PLATFORMS.find(p => p.key === platformKey) || {
          key: platformKey,
          label: feed.platform ? feed.platform.toUpperCase() : 'Feed',
          emoji: '📡',
          color: 0x5865f2,
        };

        try {
          const xmlUrl = await ensureXmlFeedUrl(feed.url, feed.platform);
          if (!xmlUrl) continue;
          const parsedFeed = await parser.parseURL(xmlUrl);
          const items = parsedFeed.items;
          if (!items || items.length === 0) continue;

          const latestItem = items[0];
          const latestId = latestItem.guid ?? latestItem.link ?? latestItem.id;
          if (!latestId) continue;

          // Unique key for tracking last seen post for this feed
          const feedTrackingKey = feed.id ? `feed_${feed.id}` : `${platform.key}_${guild.id}`;
          let lastId = await getLastId(feedTrackingKey);

          // If not found by feed id, check legacy key as fallback
          if (!lastId && feed.platform) {
            const legacyKey = `${feed.platform.toLowerCase()}_${guild.id}`;
            lastId = await getLastId(legacyKey);
          }

          if (lastId === latestId) continue; // No new posts

          // First-run bootstrap: just store the current ID without sending
          if (lastId === null) {
            await saveLastId(feedTrackingKey, latestId);
            console.log(`[socialNotifier] Bootstrapped ${feed.name || platform.label} for ${guild.name} with ID: ${latestId}`);
            continue;
          }

          // Collect all items newer than the last seen ID
          const newItems = [];
          for (const item of items) {
            const itemId = item.guid ?? item.link ?? item.id;
            if (itemId === lastId) break;
            newItems.push(item);
          }

          // Send newest-first but in reverse so Discord shows them chronologically
          for (const item of newItems.reverse()) {
            await sendNotification(client, feed, platform, item);
          }

          await saveLastId(feedTrackingKey, latestId);
          console.log(`[socialNotifier] ${feed.name || platform.label} (${guild.name}): sent ${newItems.length} notification(s).`);
        } catch (feedErr) {
          console.error(`[socialNotifier] Error polling feed "${feed.name || feed.url}" for ${guild.name}:`, feedErr.message);
        }
      }
    } catch (err) {
      console.error(`[socialNotifier] Error loading social feeds for guild ${guild.name}:`, err.message);
    }
  }
}

// ── Cron job setup ────────────────────────────────────────────────────────────

/**
 * Starts the social media polling cron job.
 * Called once after the Discord client emits 'ready'.
 * @param {import('discord.js').Client} client
 */
function startSocialCron(client) {
  console.log(`[socialNotifier] Starting dynamic RSS poll cron for all guilds.`);

  // Run immediately on startup, then every 5 minutes
  pollFeeds(client).catch(console.error);

  cron.schedule('*/5 * * * *', () => {
    pollFeeds(client).catch(console.error);
  });
}

module.exports = startSocialCron;

