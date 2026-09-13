// src/modules/emojiResolver.js
// ─────────────────────────────────────────────────────────────────────────────
// Universal Animated & Custom Emoji Resolver for Jarvis Bot.
// Handles automatic resolution of:
//   1. Colon syntax: :diamond: -> <a:diamond:1548651187300204605>
//   2. Broken external emoji tags: <a:Arrowrcolor:865499679533957141> -> <a:Arrowrcolor:1548650829932662795>
//   3. Embed description & field resolution without breaking author/footer
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

// Built-in Application Emojis cache with known working IDs
const APP_EMOJIS_FALLBACK = [
  { name: 'arrow_lookright', id: '1548650753990852669', animated: true },
  { name: 'Arrowrcolor',     id: '1548650829932662795', animated: true },
  { name: 'carydance',       id: '1548650843585388604', animated: true },
  { name: 'arrow_lookleft',  id: '1548650845732864070', animated: true },
  { name: 'diamond',         id: '1548651187300204605', animated: true },
  { name: 'loading',         id: '1548651190919630858', animated: true },
];

let appEmojisCache = new Map(APP_EMOJIS_FALLBACK.map(e => [e.name.toLowerCase(), e]));

/**
 * Synchronizes application emojis from Discord API.
 * @param {import('discord.js').Client} client
 */
async function syncApplicationEmojis(client) {
  try {
    if (!client.application) {
      await client.application?.fetch();
    }
    const emojis = await client.application?.emojis?.fetch();
    if (emojis && emojis.size > 0) {
      emojis.forEach(e => {
        appEmojisCache.set(e.name.toLowerCase(), {
          name: e.name,
          id: e.id,
          animated: Boolean(e.animated),
          tag: `<${e.animated ? 'a' : ''}:${e.name}:${e.id}>`
        });
      });
      console.log(`[emojiResolver] Synced ${emojis.size} application emojis.`);
    }
  } catch (err) {
    console.warn('[emojiResolver] Could not sync application emojis from API, using fallback cache:', err.message);
  }
}

/**
 * Finds a matching emoji from available caches.
 * @param {string} name
 * @param {import('discord.js').Guild} [guild]
 * @param {import('discord.js').Client} [client]
 * @returns {object|null}
 */
function findEmojiByName(name, guild, client) {
  const lower = name.toLowerCase();

  // 1. Check target guild first (custom server emojis take top priority)
  if (guild?.emojis?.cache) {
    const guildEmoji = guild.emojis.cache.find(e => e.name.toLowerCase() === lower);
    if (guildEmoji) {
      return {
        name: guildEmoji.name,
        id: guildEmoji.id,
        animated: Boolean(guildEmoji.animated),
        tag: `<${guildEmoji.animated ? 'a' : ''}:${guildEmoji.name}:${guildEmoji.id}>`
      };
    }
  }

  // 2. Check bot application emojis (globally usable in all servers)
  if (client?.application?.emojis?.cache) {
    const appEmoji = client.application.emojis.cache.find(e => e.name.toLowerCase() === lower);
    if (appEmoji) {
      return {
        name: appEmoji.name,
        id: appEmoji.id,
        animated: Boolean(appEmoji.animated),
        tag: `<${appEmoji.animated ? 'a' : ''}:${appEmoji.name}:${appEmoji.id}>`
      };
    }
  }

  // Check fallback application cache
  if (appEmojisCache.has(lower)) {
    const e = appEmojisCache.get(lower);
    return {
      ...e,
      tag: `<${e.animated ? 'a' : ''}:${e.name}:${e.id}>`
    };
  }

  // 3. Check client global guild emojis cache (all servers the bot is in)
  if (client?.emojis?.cache) {
    const clientEmoji = client.emojis.cache.find(e => e.name.toLowerCase() === lower);
    if (clientEmoji) {
      return {
        name: clientEmoji.name,
        id: clientEmoji.id,
        animated: Boolean(clientEmoji.animated),
        tag: `<${clientEmoji.animated ? 'a' : ''}:${clientEmoji.name}:${clientEmoji.id}>`
      };
    }
  }

  return null;
}

/**
 * Resolves emoji names and tags in any text string.
 * Supports:
 *   - `:name:` -> `<a:name:id>`
 *   - External inaccessible `<a:name:brokenId>` -> working accessible `<a:name:validId>`
 *
 * @param {string} text
 * @param {import('discord.js').Guild} [guild]
 * @param {import('discord.js').Client} [client]
 * @returns {string}
 */
function resolveEmojis(text, guild = null, client = null) {
  if (!text || typeof text !== 'string') return text;

  let result = text;

  // ── Step 1: Auto-heal external / broken emoji tags (<a:name:id> or <:name:id>) ──
  // If the ID is not in guild or bot cache, try to replace it with a matching working emoji
  result = result.replace(/<(a?):([a-zA-Z0-9_~]+):([0-9]+)>/g, (fullMatch, animFlag, name, id) => {
    // Check if the bot can already use this ID directly
    const inGuild = guild?.emojis?.cache?.has(id);
    const inApp = client?.application?.emojis?.cache?.has(id) || [...appEmojisCache.values()].some(e => e.id === id);
    const inClient = client?.emojis?.cache?.has(id);

    if (inGuild || inApp || inClient) {
      return fullMatch; // Valid and accessible, leave intact!
    }

    // It is an external inaccessible ID that Discord will strip! Search for matching replacement
    const replacement = findEmojiByName(name, guild, client);
    if (replacement) {
      return replacement.tag;
    }

    return fullMatch;
  });

  // ── Step 2: Replace colon notation (:name:) that is NOT already inside <a:name:id> ──
  result = result.replace(/(?<!<a?):([a-zA-Z0-9_~]+):(?!([0-9]+>))/g, (fullMatch, name) => {
    const match = findEmojiByName(name, guild, client);
    if (match) {
      return match.tag;
    }
    return fullMatch;
  });

  return result;
}

/**
 * Resolves emojis inside an EmbedBuilder object (description & fields).
 * Note: Discord does not render animated emojis in author or footer, so those are kept intact.
 *
 * @param {import('discord.js').EmbedBuilder} embed
 * @param {import('discord.js').Guild} [guild]
 * @param {import('discord.js').Client} [client]
 * @returns {import('discord.js').EmbedBuilder}
 */
function resolveEmbedEmojis(embed, guild = null, client = null) {
  if (!embed) return embed;

  if (embed.data?.description) {
    embed.setDescription(resolveEmojis(embed.data.description, guild, client));
  }

  if (embed.data?.title) {
    embed.setTitle(resolveEmojis(embed.data.title, guild, client));
  }

  if (embed.data?.fields && Array.isArray(embed.data.fields)) {
    const updatedFields = embed.data.fields.map(f => ({
      name: resolveEmojis(f.name, guild, client),
      value: resolveEmojis(f.value, guild, client),
      inline: Boolean(f.inline)
    }));
    embed.setFields(updatedFields);
  }

  return embed;
}

/**
 * Returns all accessible animated and static emojis as a clean list for directory & help.
 * @param {import('discord.js').Client} [client]
 * @param {import('discord.js').Guild} [guild]
 * @returns {Array<object>}
 */
function getAllAvailableEmojis(client = null, guild = null) {
  const list = [];
  const seenIds = new Set();

  // Application emojis
  appEmojisCache.forEach(e => {
    if (!seenIds.has(e.id)) {
      seenIds.add(e.id);
      list.push({
        name: e.name,
        id: e.id,
        animated: e.animated,
        tag: `<${e.animated ? 'a' : ''}:${e.name}:${e.id}>`,
        source: 'Application (Global)'
      });
    }
  });

  // Client emojis
  if (client?.emojis?.cache) {
    client.emojis.cache.forEach(e => {
      if (!seenIds.has(e.id)) {
        seenIds.add(e.id);
        list.push({
          name: e.name,
          id: e.id,
          animated: Boolean(e.animated),
          tag: `<${e.animated ? 'a' : ''}:${e.name}:${e.id}>`,
          source: e.guild?.name || 'Bot Guild'
        });
      }
    });
  }

  // Guild emojis
  if (guild?.emojis?.cache) {
    guild.emojis.cache.forEach(e => {
      if (!seenIds.has(e.id)) {
        seenIds.add(e.id);
        list.push({
          name: e.name,
          id: e.id,
          animated: Boolean(e.animated),
          tag: `<${e.animated ? 'a' : ''}:${e.name}:${e.id}>`,
          source: guild.name
        });
      }
    });
  }

  return list;
}

module.exports = {
  resolveEmojis,
  resolveEmbedEmojis,
  syncApplicationEmojis,
  findEmojiByName,
  getAllAvailableEmojis
};
