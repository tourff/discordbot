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
];

// ── Supabase helpers ──────────────────────────────────────────────────────────

/**
 * Retrieves the last known post ID for a platform.
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
 * Saves (upserts) the last post ID for a platform.
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
 * Sends a Discord embed notification for a new post.
 * @param {import('discord.js').Client} client
 * @param {string} channelId
 * @param {string} customMessage
 * @param {object} platform
 * @param {object} item     - Parsed RSS item
 */
async function sendNotification(client, channelId, customMessage, platform, item) {
  if (!channelId) return;

  const channel = client.channels.cache.get(channelId);
  if (!channel) return;

  let thumbnail = null;
  if (item.mediaThumbnail?.$ ?.url)    thumbnail = item.mediaThumbnail.$.url;
  if (item.mediaGroup?.['media:thumbnail']?.[0]?.$.url) {
    thumbnail = item.mediaGroup['media:thumbnail'][0].$.url;
  }
  if (item.enclosure?.url)             thumbnail = item.enclosure.url;

  const url = item.link ?? item.guid;

  const embed = new EmbedBuilder()
    .setColor(platform.color)
    .setAuthor({ name: `${platform.emoji} New ${platform.label} Post!` })
    .setTitle(item.title?.slice(0, 256) ?? 'New post')
    .setURL(url)
    .setDescription(
      item.contentSnippet
        ? item.contentSnippet.slice(0, 300) + (item.contentSnippet.length > 300 ? '…' : '')
        : null
    )
    .setTimestamp(item.pubDate ? new Date(item.pubDate) : new Date())
    .setFooter({ text: `${platform.label} • New Content` });

  if (thumbnail) embed.setImage(thumbnail);

  const ping = process.env.SOCIAL_PING_EVERYONE === 'true' ? '@everyone ' : '';
  const textMsg = customMessage ? customMessage : `New post on ${platform.label}! ${url}`;

  await channel.send({ content: `${ping}${textMsg}`, embeds: [embed] }).catch(console.error);
}

// ── Main poll function ────────────────────────────────────────────────────────

/**
 * Polls all configured RSS feeds and sends notifications for new posts.
 * @param {import('discord.js').Client} client
 */
async function pollFeeds(client) {
  const { getSocialPlatformConfig } = require('../modules/settings');

  for (const guild of client.guilds.cache.values()) {
    for (const platform of PLATFORMS) {
      try {
        const config = await getSocialPlatformConfig(guild.id, platform.key.toUpperCase());
        
        if (!config.url || !config.channelId) continue; // Not configured for this guild

        const feed    = await parser.parseURL(config.url);
        const items   = feed.items;
        if (!items || items.length === 0) continue;

        const latestItem = items[0];
        const latestId   = latestItem.guid ?? latestItem.link ?? latestItem.id;
        if (!latestId) continue;

        const dbPlatformKey = `${platform.key}_${guild.id}`;
        const lastId = await getLastId(dbPlatformKey);

        if (lastId === latestId) continue; // No new posts

        // First-run bootstrap: just store the current ID without sending
        if (lastId === null) {
          await saveLastId(dbPlatformKey, latestId);
          console.log(`[socialNotifier] Bootstrapped ${platform.label} for ${guild.name} with ID: ${latestId}`);
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
          await sendNotification(client, config.channelId, config.message, platform, item);
        }

        await saveLastId(dbPlatformKey, latestId);
        console.log(`[socialNotifier] ${platform.label} (${guild.name}): sent ${newItems.length} notification(s).`);
      } catch (err) {
        console.error(`[socialNotifier] Error polling ${platform.label} for ${guild.name}:`, err.message);
      }
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
