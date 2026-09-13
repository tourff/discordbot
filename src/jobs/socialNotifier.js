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

  const { resolveEmojis } = require('../modules/emojiResolver');
  if (embed.data?.description) {
    embed.setDescription(resolveEmojis(embed.data.description, channel.guild, client));
  }

  const rawTextMsg = formatNotificationMessage(feed.message, { platform, item, feed });
  const textMsg = resolveEmojis(rawTextMsg, channel.guild, client);

  await channel.send({ content: textMsg, embeds: [embed] }).catch(console.error);
}

const { ensureXmlFeedUrl } = require('../modules/socialResolver');

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

/**
 * Normalizes post IDs from RSS feed items (especially YouTube video IDs).
 * @param {object} item
 * @returns {string|null}
 */
function extractPostId(item) {
  if (!item) return null;
  if (typeof item.id === 'string' && item.id.startsWith('yt:video:')) {
    return item.id.replace('yt:video:', '');
  }
  if (typeof item.link === 'string') {
    const vMatch = item.link.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    if (vMatch) return vMatch[1];
    const sMatch = item.link.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
    if (sMatch) return sMatch[1];
  }
  return item.guid || item.link || item.id || null;
}

          const latestItem = items[0];
          const latestId = extractPostId(latestItem);
          if (!latestId) continue;

          // Always scope tracking key by guild.id to prevent cross-server collision
          const safeFeedId = feed.id || (feed.url ? feed.url.replace(/[^a-zA-Z0-9]/g, '_').slice(-30) : platform.key);
          const feedTrackingKey = `feed_${guild.id}_${safeFeedId}`;

          let lastId = await getLastId(feedTrackingKey);

          // Check fallback legacy keys if this guild-scoped key is not yet recorded
          if (!lastId) {
            lastId = await getLastId(`${platform.key}_${guild.id}`);
          }

          // First-run bootstrap: store current latest ID quietly without blasting old past videos
          if (!lastId) {
            await saveLastId(feedTrackingKey, latestId);
            console.log(`[socialNotifier] Bootstrapped ${feed.name || platform.label} for ${guild.name} with latest ID: ${latestId}`);
            continue;
          }

          // If already up-to-date, nothing to send
          if (lastId === latestId) {
            continue;
          }

          // Check if lastId is anywhere in the current RSS feed items
          const foundIndex = items.findIndex(item => extractPostId(item) === lastId);
          if (foundIndex === -1) {
            // The previously stored ID is from a different channel or too far in the past.
            // Quietly re-synchronize without spamming old posts!
            console.warn(`[socialNotifier] Last ID (${lastId}) not found in ${feed.name || platform.label} for ${guild.name}. Re-syncing to latest (${latestId}) without spam.`);
            await saveLastId(feedTrackingKey, latestId);
            continue;
          }

          // Collect items newer than lastId
          const newItems = items.slice(0, foundIndex);

          // Freshness check: only notify for posts published in the last 24 hours
          const freshItems = newItems.filter(item => {
            if (!item.pubDate) return true;
            const ageMs = Date.now() - new Date(item.pubDate).getTime();
            return ageMs < (24 * 60 * 60 * 1000); // 24 hours maximum age
          });

          // Save the latest post ID immediately to prevent duplicate runs
          await saveLastId(feedTrackingKey, latestId);

          if (freshItems.length > 0) {
            // Send in chronological order (oldest of the fresh new items first)
            for (const item of freshItems.reverse().slice(-2)) {
              await sendNotification(client, feed, platform, item);
            }
            console.log(`[socialNotifier] ${feed.name || platform.label} (${guild.name}): sent ${freshItems.length} fresh notification(s).`);
          } else {
            console.log(`[socialNotifier] ${feed.name || platform.label} (${guild.name}): ${newItems.length} post(s) found but skipped because they are older than 24h.`);
          }
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

