// src/modules/socialResolver.js
// ─────────────────────────────────────────────────────────────────────────────
// Shared helper to resolve and validate social media feeds (especially YouTube)
// into valid XML RSS/Atom URLs for automated Discord notifications.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const Parser = require('rss-parser');
const parser = new Parser({
  customFields: {
    item: [
      ['media:thumbnail', 'mediaThumbnail', { keepArray: false }],
      ['media:group',     'mediaGroup',     { keepArray: false }],
    ],
  },
});

const cache = new Map();

/**
 * Resolves any YouTube URL (handle, custom URL, channel ID, video link)
 * into a valid Atom XML feed URL and fetches channel metadata.
 * @param {string} rawUrl
 * @param {string} platform - 'youtube' | 'facebook' | 'instagram' | 'tiktok' | 'custom'
 * @returns {Promise<{ feedUrl: string, channelId: string, title: string, latestPost: object|null, valid: boolean }>}
 */
async function resolveSocialFeed(rawUrl, platform = 'youtube') {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('Please provide a valid URL or channel handle.');
  }

  let url = rawUrl.trim();
  const plat = (platform || 'youtube').toLowerCase();

  // ── YouTube Resolution ───────────────────────────────────────────────────
  if (plat === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be') || url.startsWith('@')) {
    let channelId = null;

    // Case 1: Already an XML feed URL
    if (url.includes('feeds/videos.xml?channel_id=')) {
      const m = url.match(/channel_id=([a-zA-Z0-9_-]+)/);
      if (m) channelId = m[1];
    }
    // Case 2: Raw Channel ID (UC...)
    else if (url.startsWith('UC') && url.length >= 20 && !url.includes('/') && !url.includes('.')) {
      channelId = url;
    }
    // Case 3: /channel/UC...
    else if (url.includes('channel/')) {
      const m = url.match(/channel\/(UC[a-zA-Z0-9_-]+)/);
      if (m) channelId = m[1];
    }
    // Case 4: Handle @name or channel custom URL
    else {
      let fetchUrl = url;
      if (fetchUrl.startsWith('@')) fetchUrl = `https://www.youtube.com/${fetchUrl}`;
      else if (!fetchUrl.startsWith('http://') && !fetchUrl.startsWith('https://')) {
        fetchUrl = `https://www.youtube.com/@${fetchUrl}`;
      }

      const res = await fetch(fetchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      });

      if (!res.ok) {
        throw new Error(`YouTube channel returned HTTP status ${res.status}. Please ensure the channel is public.`);
      }

      const html = await res.text();
      const mRss = html.match(/feeds\/videos\.xml\?channel_id=([a-zA-Z0-9_-]+)/);
      const mMeta = html.match(/<meta itemprop="identifier" content="([a-zA-Z0-9_-]+)"/);
      const mJson = html.match(/"channelId":"(UC[a-zA-Z0-9_-]+)"/);
      const mExt = html.match(/"externalId":"(UC[a-zA-Z0-9_-]+)"/);

      channelId = mRss?.[1] || mMeta?.[1] || mJson?.[1] || mExt?.[1];

      // Video URL fallback
      if (!channelId && (url.includes('watch?v=') || url.includes('youtu.be/'))) {
        try {
          const oEmbedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
          if (oEmbedRes.ok) {
            const oData = await oEmbedRes.json();
            if (oData.author_url) {
              const aRes = await fetch(oData.author_url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
              });
              const aHtml = await aRes.text();
              const aRss = aHtml.match(/feeds\/videos\.xml\?channel_id=([a-zA-Z0-9_-]+)/);
              const aMeta = aHtml.match(/<meta itemprop="identifier" content="([a-zA-Z0-9_-]+)"/);
              channelId = aRss?.[1] || aMeta?.[1];
            }
          }
        } catch {}
      }
    }

    if (!channelId) {
      throw new Error('Could not resolve YouTube Channel ID. Please provide your channel ID (starts with UC...) or valid channel URL.');
    }

    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    cache.set(url, feedUrl);

    // Validate by parsing XML
    const parsedFeed = await parser.parseURL(feedUrl);
    const title = parsedFeed.title || 'YouTube Channel';
    const latestItem = parsedFeed.items?.[0] || null;

    return {
      feedUrl,
      channelId,
      title,
      latestPost: latestItem ? {
        title: latestItem.title,
        link: latestItem.link,
        pubDate: latestItem.pubDate
      } : null,
      valid: true
    };
  }

  // ── Generic RSS / Atom ───────────────────────────────────────────────────
  let testUrl = url;
  if (!testUrl.startsWith('http://') && !testUrl.startsWith('https://')) {
    testUrl = `https://${testUrl}`;
  }

  const parsedFeed = await parser.parseURL(testUrl);
  const latestItem = parsedFeed.items?.[0] || null;

  return {
    feedUrl: testUrl,
    channelId: '',
    title: parsedFeed.title || 'Social Feed',
    latestPost: latestItem ? {
      title: latestItem.title,
      link: latestItem.link,
      pubDate: latestItem.pubDate
    } : null,
    valid: true
  };
}

/**
 * Fast resolver for background cron polling with in-memory caching.
 * @param {string} rawUrl
 * @param {string} platform
 * @returns {Promise<string|null>}
 */
async function ensureXmlFeedUrl(rawUrl, platform) {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  if (cache.has(trimmed)) return cache.get(trimmed);

  try {
    const res = await resolveSocialFeed(trimmed, platform);
    return res.feedUrl;
  } catch {
    return trimmed;
  }
}

module.exports = {
  resolveSocialFeed,
  ensureXmlFeedUrl,
};
