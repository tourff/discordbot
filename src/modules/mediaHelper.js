// src/modules/mediaHelper.js
// ─────────────────────────────────────────────────────────────────────────────
// Helper utility for handling welcome/goodbye media (Images, GIFs, and Videos).
// Supports tags like {image: URL}, {gif: URL}, {video: URL}, {banner: URL}.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

/**
 * Strips whitespace, quotes, and brackets from raw URL inputs.
 * @param {string|null} raw
 * @returns {string|null}
 */
function cleanMediaUrl(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let url = raw.trim().replace(/^["'`<\s]+|["'`>\s]+$/g, '');
  if (!url || url.toLowerCase() === 'none') return null;
  return url;
}

/**
 * Extracts custom media tags from a message string.
 * Supports {image: URL}, {gif: URL}, {video: URL}, {banner: URL}, {media: URL}.
 * @param {string} text
 * @returns {{ cleanText: string, mediaUrl: string|null }}
 */
function extractMediaFromText(text) {
  if (!text || typeof text !== 'string') return { cleanText: text, mediaUrl: null };

  const match = text.match(/{(?:image|gif|video|banner|media):\s*([^}]+)\s*}/i);
  if (match) {
    const mediaUrl = cleanMediaUrl(match[1]);
    const cleanText = text.replace(match[0], '').trim();
    return { cleanText, mediaUrl };
  }

  return { cleanText: text, mediaUrl: null };
}

/**
 * Determines whether a URL is an image or animated GIF suitable for EmbedBuilder.setImage(url).
 * @param {string} rawUrl
 * @returns {boolean}
 */
function isEmbeddableImage(rawUrl) {
  const url = cleanMediaUrl(rawUrl);
  if (!url) return false;
  const clean = url.split('?')[0].toLowerCase();
  return (
    clean.endsWith('.gif') ||
    clean.endsWith('.png') ||
    clean.endsWith('.jpg') ||
    clean.endsWith('.jpeg') ||
    clean.endsWith('.webp') ||
    url.includes('cdn.discordapp.com/attachments/') ||
    url.includes('media.tenor.com') ||
    url.includes('c.tenor.com') ||
    url.includes('i.imgur.com') ||
    url.includes('giphy.com/media')
  );
}

/**
 * Checks if a URL is a video stream/file.
 * @param {string} rawUrl
 * @returns {boolean}
 */
function isVideoUrl(rawUrl) {
  const url = cleanMediaUrl(rawUrl);
  if (!url) return false;
  const clean = url.split('?')[0].toLowerCase();
  return clean.endsWith('.mp4') || clean.endsWith('.mov') || clean.endsWith('.webm') || clean.endsWith('.mkv');
}

/**
 * Applies media (image/gif/video) to Discord channel send payload.
 * If image/gif, attaches to embed.setImage(url).
 * If video or tenor page URL, attaches via message files or content.
 *
 * @param {import('discord.js').EmbedBuilder} embed
 * @param {string|null} mediaUrl
 * @param {string|null} [fallbackBannerUrl=null]
 * @returns {{ embeds: Array<import('discord.js').EmbedBuilder>, content?: string, files?: Array<any> }}
 */
function buildMediaPayload(embed, mediaUrl, fallbackBannerUrl = null) {
  const payload = { embeds: [embed] };
  const targetUrl = cleanMediaUrl(mediaUrl) || cleanMediaUrl(fallbackBannerUrl);

  if (!targetUrl) return payload;

  if (isVideoUrl(targetUrl)) {
    // Video URL: attach as file or provide in content so Discord renders interactive player
    payload.files = [{ attachment: targetUrl, name: 'banner_video.mp4' }];
  } else if (isEmbeddableImage(targetUrl)) {
    embed.setImage(targetUrl);
  } else if (targetUrl.includes('tenor.com/view/')) {
    // Tenor page link: Discord unfurls Tenor links in message content with interactive GIF
    payload.content = targetUrl;
  } else {
    // Default try setting as embed image
    embed.setImage(targetUrl);
  }

  return payload;
}

module.exports = {
  cleanMediaUrl,
  extractMediaFromText,
  isEmbeddableImage,
  isVideoUrl,
  buildMediaPayload,
};
