// src/modules/snipeCache.js
// In-memory cache for last deleted message per channel
'use strict';

// Map<channelId, { content, authorId, authorTag, authorAvatar, deletedAt, attachmentUrl }>
const snipeCache = new Map();

module.exports = {
  set(channelId, data) {
    snipeCache.set(channelId, { ...data, deletedAt: new Date() });
  },
  get(channelId) {
    return snipeCache.get(channelId) ?? null;
  },
};
