// src/modules/aiActions.js
// ─────────────────────────────────────────────────────────────────────────────
// AI Server Maintenance Action Dispatcher
// Executes Discord server modifications requested via natural language chat.
// Every action is strictly gated behind Administrator / Manage Guild verification.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  PermissionsBitField,
} = require('discord.js');

const supabase = require('../config/supabase');
const { setSetting } = require('./settings');
const { setAccessMode } = require('./permissions');

// ─────────────────────────────────────────────────────────────────────────────
// PERMISSION NAME → Discord PermissionFlagsBits mapper
// Supports Banglish, English, and common shorthand names
// ─────────────────────────────────────────────────────────────────────────────
const PERMISSION_MAP = {
  // Admin / General
  'administrator':            PermissionFlagsBits.Administrator,
  'admin':                    PermissionFlagsBits.Administrator,
  'shob permission':          PermissionFlagsBits.Administrator,
  'sob permission':           PermissionFlagsBits.Administrator,
  'full permission':          PermissionFlagsBits.Administrator,

  // Server Management
  'manage guild':             PermissionFlagsBits.ManageGuild,
  'manage server':            PermissionFlagsBits.ManageGuild,
  'server manage':            PermissionFlagsBits.ManageGuild,

  // Member Management
  'kick members':             PermissionFlagsBits.KickMembers,
  'kick':                     PermissionFlagsBits.KickMembers,
  'ban members':              PermissionFlagsBits.BanMembers,
  'ban':                      PermissionFlagsBits.BanMembers,
  'manage nicknames':         PermissionFlagsBits.ManageNicknames,
  'nickname manage':          PermissionFlagsBits.ManageNicknames,
  'timeout members':          PermissionFlagsBits.ModerateMembers,
  'mute members':             PermissionFlagsBits.MuteMembers,
  'deafen members':           PermissionFlagsBits.DeafenMembers,
  'move members':             PermissionFlagsBits.MoveMembers,

  // Channel / Role Management
  'manage channels':          PermissionFlagsBits.ManageChannels,
  'channel manage':           PermissionFlagsBits.ManageChannels,
  'manage roles':             PermissionFlagsBits.ManageRoles,
  'role manage':              PermissionFlagsBits.ManageRoles,
  'manage webhooks':          PermissionFlagsBits.ManageWebhooks,
  'manage expressions':       PermissionFlagsBits.ManageGuildExpressions,
  'manage emojis':            PermissionFlagsBits.ManageGuildExpressions,
  'manage events':            PermissionFlagsBits.ManageEvents,
  'manage threads':           PermissionFlagsBits.ManageThreads,
  'manage messages':          PermissionFlagsBits.ManageMessages,

  // Text Permissions
  'send messages':            PermissionFlagsBits.SendMessages,
  'message send':             PermissionFlagsBits.SendMessages,
  'embed links':              PermissionFlagsBits.EmbedLinks,
  'attach files':             PermissionFlagsBits.AttachFiles,
  'read message history':     PermissionFlagsBits.ReadMessageHistory,
  'mention everyone':         PermissionFlagsBits.MentionEveryone,
  'use external emojis':      PermissionFlagsBits.UseExternalEmojis,
  'add reactions':            PermissionFlagsBits.AddReactions,
  'use slash commands':       PermissionFlagsBits.UseApplicationCommands,
  'use application commands': PermissionFlagsBits.UseApplicationCommands,

  // Voice Permissions
  'connect':                  PermissionFlagsBits.Connect,
  'speak':                    PermissionFlagsBits.Speak,
  'stream':                   PermissionFlagsBits.Stream,
  'video':                    PermissionFlagsBits.Stream,
  'priority speaker':         PermissionFlagsBits.PrioritySpeaker,
  'use voice activity':       PermissionFlagsBits.UseVAD,
  'request to speak':         PermissionFlagsBits.RequestToSpeak,

  // View
  'view channels':            PermissionFlagsBits.ViewChannel,
  'view channel':             PermissionFlagsBits.ViewChannel,
  'read channels':            PermissionFlagsBits.ViewChannel,

  // Moderation
  'view audit log':           PermissionFlagsBits.ViewAuditLog,
  'create instant invite':    PermissionFlagsBits.CreateInstantInvite,
  'change nickname':          PermissionFlagsBits.ChangeNickname,
};

/**
 * Resolves a list of permission name strings to a BigInt permission bitfield.
 * @param {string[]} permNames
 * @returns {bigint}
 */
function resolvePermissions(permNames) {
  if (!Array.isArray(permNames) || permNames.length === 0) return 0n;

  let bits = 0n;
  for (const name of permNames) {
    const normalized = name.trim().toLowerCase();
    if (PERMISSION_MAP[normalized] !== undefined) {
      bits |= PERMISSION_MAP[normalized];
    } else {
      // Try matching against PermissionFlagsBits directly by key
      const directKey = Object.keys(PermissionFlagsBits).find(
        k => k.toLowerCase() === normalized.replace(/\s+/g, '')
      );
      if (directKey) bits |= PermissionFlagsBits[directKey];
    }
  }
  return bits;
}

/**
 * Resolves a single human-readable permission name to its PermissionFlagsBits key string.
 * Used for building channel.permissionOverwrites.edit() objects.
 * @param {string} permName
 * @returns {string|null}
 */
function resolvePermToKey(permName) {
  const normalized = permName.trim().toLowerCase();
  const bit = PERMISSION_MAP[normalized];
  if (bit !== undefined) {
    return Object.keys(PermissionFlagsBits).find(k => PermissionFlagsBits[k] === bit) || null;
  }
  // Try direct PascalCase key match
  const directKey = Object.keys(PermissionFlagsBits).find(
    k => k.toLowerCase() === normalized.replace(/\s+/g, '')
  );
  return directKey || null;
}

/**
 * Finds a channel in the guild by ID, mention, or name.
 * Supports emojis, prefixes, and partial matches.
 * @param {import('discord.js').Guild} guild
 * @param {string} query
 * @returns {import('discord.js').GuildBasedChannel|null}
 */
function findChannel(guild, query) {
  if (!query) return null;
  const cleanId = query.replace(/[<#>]/g, '').trim();

  // Try direct ID
  const byId = guild.channels.cache.get(cleanId);
  if (byId) return byId;

  // Try case-insensitive exact name match
  const cleanName = query.replace(/^#+/, '').toLowerCase().trim();
  const exactMatch = guild.channels.cache.find(c => c.name.toLowerCase() === cleanName);
  if (exactMatch) return exactMatch;

  // Match stripped alphanumeric to avoid emoji/symbol discrepancies
  const searchRaw = cleanName.replace(/[^a-z0-9\u0980-\u09FF]/g, '');
  if (searchRaw) {
    // 1. Exact stripped match
    const strippedMatch = guild.channels.cache.find(c => {
      const raw = c.name.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]/g, '');
      return raw === searchRaw;
    });
    if (strippedMatch) return strippedMatch;

    // 2. Substring stripped match (e.g. "live" matches "🔴・live" or "🔊 🔴・live")
    const substringMatch = guild.channels.cache.find(c => {
      const raw = c.name.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]/g, '');
      return raw.includes(searchRaw) || searchRaw.includes(raw);
    });
    if (substringMatch) return substringMatch;
  }

  // 3. Name inclusion match
  const nameInclude = guild.channels.cache.find(c => {
    const cLower = c.name.toLowerCase();
    return cLower.includes(cleanName) || cleanName.includes(cLower);
  });
  if (nameInclude) return nameInclude;

  return null;
}

/**
 * Finds a role in the guild by ID, mention, or name.
 * Cleans leading '@' and handles emojis/formatting.
 * @param {import('discord.js').Guild} guild
 * @param {string} query
 * @returns {import('discord.js').Role|null}
 */
function findRole(guild, query) {
  if (!query) return null;
  const cleanId = query.replace(/[<@&>]/g, '').trim();

  // Try direct ID
  const byId = guild.roles.cache.get(cleanId);
  if (byId) return byId;

  const cleanName = query.replace(/^@+/, '').toLowerCase().trim();
  if (cleanName === 'everyone' || cleanName === 'সবাই') {
    return guild.roles.everyone;
  }

  // 1. Exact case-insensitive match
  const exactMatch = guild.roles.cache.find(r => r.name.toLowerCase() === cleanName);
  if (exactMatch) return exactMatch;

  // 2. Stripped alphanumeric match (removes emojis, badges, slashes, brackets)
  const searchRaw = cleanName.replace(/[^a-z0-9\u0980-\u09FF]/g, '');
  if (searchRaw) {
    const strippedExact = guild.roles.cache.find(r => {
      const raw = r.name.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]/g, '');
      return raw === searchRaw;
    });
    if (strippedExact) return strippedExact;

    // 3. Substring match on stripped alphanumeric
    const strippedInclude = guild.roles.cache.find(r => {
      const raw = r.name.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]/g, '');
      return raw.includes(searchRaw) || searchRaw.includes(raw);
    });
    if (strippedInclude) return strippedInclude;
  }

  // 4. Substring match on lowercased name
  const nameInclude = guild.roles.cache.find(r => {
    const rLower = r.name.toLowerCase();
    return rLower.includes(cleanName) || cleanName.includes(rLower);
  });
  if (nameInclude) return nameInclude;

  return null;
}

/**
 * Finds a guild member by ID, mention, username, or displayName.
 * @param {import('discord.js').Guild} guild
 * @param {string} query
 * @returns {import('discord.js').GuildMember|null}
 */
function findMember(guild, query) {
  if (!query) return null;
  const cleanId = query.replace(/[<@!>]/g, '').trim();

  const byId = guild.members.cache.get(cleanId);
  if (byId) return byId;

  const cleanName = query.replace(/^@+/, '').toLowerCase().trim();

  // Exact match by username, displayName, or tag
  const exactMatch = guild.members.cache.find(m =>
    m.user?.username.toLowerCase() === cleanName ||
    m.displayName.toLowerCase() === cleanName ||
    (m.user?.tag && m.user.tag.toLowerCase() === cleanName)
  );
  if (exactMatch) return exactMatch;

  // Partial match
  const partialMatch = guild.members.cache.find(m =>
    m.displayName.toLowerCase().includes(cleanName) ||
    m.user?.username.toLowerCase().includes(cleanName)
  );
  if (partialMatch) return partialMatch;

  return null;
}

/**
 * Finds a category channel in the guild by name or ID.
 * @param {import('discord.js').Guild} guild
 * @param {string} query
 * @returns {import('discord.js').CategoryChannel|null}
 */
function findCategory(guild, query) {
  if (!query) return null;
  const cleanId = query.replace(/[<#>]/g, '').trim();

  const byId = guild.channels.cache.get(cleanId);
  if (byId && byId.type === ChannelType.GuildCategory) return byId;

  const cleanName = query.toLowerCase().trim();
  const exactMatch = guild.channels.cache.find(
    c => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === cleanName
  );
  if (exactMatch) return exactMatch;

  // Partial / stripped match for emoji-prefixed category names
  const stripped = cleanName.replace(/[^a-z0-9\u0980-\u09FF-\s]/g, '').trim();
  if (stripped) {
    return guild.channels.cache.find(c => {
      if (c.type !== ChannelType.GuildCategory) return false;
      const raw = c.name.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF-\s]/g, '').trim();
      return raw.includes(stripped) || stripped.includes(raw);
    }) || null;
  }

  return null;
}

/**
 * Resolves multiple channels or categories from flexible parameters.
 * Supports arrays, comma-separated strings, single strings, and category inheritance.
 * @param {import('discord.js').Guild} guild
 * @param {object} params
 * @returns {{ targetChannels: import('discord.js').GuildBasedChannel[], unresolvedQueries: string[], queries: string[] }}
 */
function resolveChannels(guild, params = {}) {
  const channelQueries = [];

  function addQueries(val) {
    if (!val) return;
    if (Array.isArray(val)) {
      val.forEach(item => addQueries(item));
    } else if (typeof val === 'string') {
      if (val.includes(',')) {
        val.split(',').map(s => s.trim()).filter(Boolean).forEach(s => channelQueries.push(s));
      } else if (val.trim()) {
        channelQueries.push(val.trim());
      }
    }
  }

  addQueries(params.channels);
  addQueries(params.channel);
  if (channelQueries.length === 0) {
    addQueries(params.name);
  }

  const targetChannels = [];
  const seenIds = new Set();
  const unresolvedQueries = [];

  // If a category is specified
  if (params.category) {
    const cat = findCategory(guild, params.category);
    if (cat) {
      // If no channels explicitly given, target all channels in that category
      if (channelQueries.length === 0) {
        const typeFilter = (params.channel_type || '').toLowerCase();
        const children = guild.channels.cache.filter(c => {
          if (c.parentId !== cat.id) return false;
          if (typeFilter === 'voice') return c.type === ChannelType.GuildVoice;
          if (typeFilter === 'text') return c.type === ChannelType.GuildText;
          return true;
        });

        children.forEach(c => {
          if (!seenIds.has(c.id)) {
            seenIds.add(c.id);
            targetChannels.push(c);
          }
        });

        if (params.include_category !== false && !seenIds.has(cat.id)) {
          seenIds.add(cat.id);
          targetChannels.push(cat);
        }
      }
    } else if (channelQueries.length === 0) {
      unresolvedQueries.push(params.category);
    }
  }

  // Resolve explicit queries
  for (const q of channelQueries) {
    const cat = findCategory(guild, q);
    if (cat && !guild.channels.cache.some(c => c.type !== ChannelType.GuildCategory && c.name.toLowerCase() === q.toLowerCase())) {
      if (!seenIds.has(cat.id)) {
        seenIds.add(cat.id);
        targetChannels.push(cat);
      }
      const children = guild.channels.cache.filter(c => c.parentId === cat.id);
      children.forEach(c => {
        if (!seenIds.has(c.id)) {
          seenIds.add(c.id);
          targetChannels.push(c);
        }
      });
      continue;
    }

    const ch = findChannel(guild, q);
    if (ch) {
      if (!seenIds.has(ch.id)) {
        seenIds.add(ch.id);
        targetChannels.push(ch);
      }
    } else {
      unresolvedQueries.push(q);
    }
  }

  return { targetChannels, unresolvedQueries, queries: channelQueries };
}

/**
 * Resolves multiple roles or users from flexible parameters.
 * Supports arrays, comma-separated strings, single strings, and @everyone.
 * @param {import('discord.js').Guild} guild
 * @param {object} params
 * @returns {{ resolvedTargets: Array<{ target: import('discord.js').Role|import('discord.js').GuildMember, name: string, type: 'role'|'user'|'everyone' }>, notFound: string[], queries: string[] }}
 */
function resolveTargets(guild, params = {}) {
  const targetQueries = [];

  function addQueries(val) {
    if (!val) return;
    if (Array.isArray(val)) {
      val.forEach(item => addQueries(item));
    } else if (typeof val === 'string') {
      if (val.includes(',')) {
        val.split(',').map(s => s.trim()).filter(Boolean).forEach(s => targetQueries.push(s));
      } else if (val.trim()) {
        targetQueries.push(val.trim());
      }
    }
  }

  addQueries(params.roles);
  addQueries(params.role);
  addQueries(params.targets);
  addQueries(params.target);
  addQueries(params.users);
  addQueries(params.user);

  const resolvedTargets = [];
  const seenIds = new Set();
  const notFound = [];

  for (const q of targetQueries) {
    const trimmed = q.trim();
    if (!trimmed) continue;
    const lower = trimmed.toLowerCase();

    if (lower === '@everyone' || lower === 'everyone' || lower === 'সবাই') {
      if (!seenIds.has(guild.roles.everyone.id)) {
        seenIds.add(guild.roles.everyone.id);
        resolvedTargets.push({ target: guild.roles.everyone, name: '@everyone', type: 'everyone' });
      }
      continue;
    }

    const role = findRole(guild, trimmed);
    if (role) {
      if (!seenIds.has(role.id)) {
        seenIds.add(role.id);
        resolvedTargets.push({ target: role, name: role.name, type: 'role' });
      }
      continue;
    }

    const member = findMember(guild, trimmed);
    if (member) {
      if (!seenIds.has(member.id)) {
        seenIds.add(member.id);
        resolvedTargets.push({ target: member, name: member.displayName, type: 'user' });
      }
      continue;
    }

    notFound.push(trimmed);
  }

  return { resolvedTargets, notFound, queries: targetQueries };
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMAT ACTION PREVIEW — shows the user what will happen before confirmation
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Formats a preview description of an action for the user before confirmation.
 * @param {import('discord.js').Guild} guild
 * @param {string} actionType
 * @param {object} params
 * @returns {{ title: string, description: string, isDestructive: boolean, summary: string }}
 */
function formatActionPreview(guild, actionType, params = {}) {
  let isDestructive = false;
  let title = '📋 Proposed Server Action';
  const lines = [];
  let summary = '';

  switch (actionType) {
    case 'revamp_server':
    case 'setup_server_template': {
      title = '🏰 Proposed Server Layout Plan';
      const categories = Array.isArray(params.categories) ? params.categories : [];
      let totalChannels = 0;

      lines.push('### 📐 Proposed Channels & Categories:');
      lines.push('*Review the layout below. You can chat with me to change names, add, or remove channels before confirming.*\n');

      for (const cat of categories) {
        const catName = cat.name || 'Unnamed Category';
        const channels = Array.isArray(cat.channels) ? cat.channels : [];
        totalChannels += channels.length;
        lines.push(`📁 **${catName}**`);
        for (const ch of channels) {
          const chName = typeof ch === 'string' ? ch : (ch.name || 'channel');
          const isVoice = typeof ch === 'object' && ch.type === 'voice';
          lines.push(`  └─ ${isVoice ? '🔊' : '💬'} \`${chName}\``);
        }
        lines.push('');
      }

      summary = `Categories: ${categories.length} | Channels: ${totalChannels}`;
      break;
    }

    case 'create_category_with_channels': {
      title = '📁 Proposed Category & Channels';
      const catName = params.name || params.category || 'Category';
      const channels = Array.isArray(params.channels) ? params.channels : [];
      const isPrivate = Boolean(params.private);
      lines.push(`**Category:** 📁 \`${catName}\` ${isPrivate ? '🔒 *(Private — @everyone hidden)*' : ''}`);
      lines.push('**Channels to create:**');
      channels.forEach(ch => {
        const chName = typeof ch === 'string' ? ch : (ch.name || 'channel');
        const isVoice = typeof ch === 'object' && ch.type === 'voice';
        lines.push(`• ${isVoice ? '🔊' : '💬'} \`${chName}\``);
      });
      summary = `1 Category, ${channels.length} Channels`;
      break;
    }

    case 'create_channel': {
      title = '➕ Proposed New Channel';
      const name = params.name || 'new-channel';
      const type = params.type || 'text';
      const category = params.category || null;
      lines.push(`**Channel Name:** \`#${name}\``);
      lines.push(`**Type:** \`${type}\``);
      if (category) {
        const cat = findCategory(guild, category);
        lines.push(`**Category:** ${cat ? `\`${cat.name}\`` : `\`${category}\` *(will be searched at creation)*`}`);
      }
      summary = `Create #${name} (${type})${category ? ` in ${category}` : ''}`;
      break;
    }

    case 'move_channel_to_category': {
      title = '📂 Proposed Channel Move';
      const chQuery = params.channel || params.name || 'unknown';
      const catQuery = params.category || 'unknown';
      const targetCh = findChannel(guild, chQuery);
      const targetCat = findCategory(guild, catQuery);
      if (targetCh) {
        lines.push(`**Channel:** <#${targetCh.id}> (\`#${targetCh.name}\`)`);
        if (targetCh.parent) {
          lines.push(`**Current Category:** \`${targetCh.parent.name}\``);
        } else {
          lines.push(`**Current Category:** *(none)*`);
        }
      } else {
        lines.push(`**Channel:** \`${chQuery}\` *(searching by name)*`);
      }
      lines.push(`**Move To:** ${targetCat ? `\`${targetCat.name}\`` : `\`${catQuery}\` *(will be searched at execution)*`}`);
      summary = `Move #${targetCh?.name || chQuery} → ${targetCat?.name || catQuery}`;
      break;
    }

    case 'rename_channel': {
      title = '✏️ Proposed Channel Rename';
      const chQuery = params.channel || params.name || 'unknown';
      const newName = params.new_name || params.newName || 'new-name';
      const targetCh = findChannel(guild, chQuery);
      if (targetCh) {
        lines.push(`**Channel:** <#${targetCh.id}>`);
        lines.push(`**Old Name:** \`#${targetCh.name}\``);
      } else {
        lines.push(`**Channel:** \`${chQuery}\``);
      }
      lines.push(`**New Name:** \`#${newName}\``);
      summary = `Rename #${targetCh?.name || chQuery} → #${newName}`;
      break;
    }

    case 'rename_role': {
      title = '✏️ Proposed Role Rename';
      const roleQuery = params.role || params.name || 'unknown';
      const newName = params.new_name || params.newName || 'New Name';
      const targetRole = findRole(guild, roleQuery);
      if (targetRole) {
        lines.push(`**Role:** <@&${targetRole.id}>`);
        lines.push(`**Old Name:** \`${targetRole.name}\``);
      } else {
        lines.push(`**Role:** \`${roleQuery}\``);
      }
      lines.push(`**New Name:** \`${newName}\``);
      summary = `Rename ${targetRole?.name || roleQuery} → ${newName}`;
      break;
    }

    case 'delete_channel': {
      isDestructive = true;
      title = '⚠️ Proposed Channel Deletion';
      const chName = params.channel || params.name || 'unknown';
      const target = findChannel(guild, chName);
      if (target) {
        lines.push(`> ⚠️ **Warning:** The channel <#${target.id}> (\`#${target.name}\`) will be **permanently deleted**.`);
        if (target.parent) {
          lines.push(`> Located in category: **${target.parent.name}**`);
        }
      } else {
        lines.push(`> ⚠️ Target channel: \`${chName}\` (Not found in server cache)`);
      }
      summary = `Delete #${target ? target.name : chName}`;
      break;
    }

    case 'delete_multiple_channels': {
      isDestructive = true;
      title = '⚠️ Proposed Channels Deletion';
      const list = Array.isArray(params.channels) ? params.channels : [];
      lines.push('> ⚠️ **Warning:** The following channels will be **permanently deleted**:');
      list.forEach(chQuery => {
        const ch = findChannel(guild, chQuery);
        if (ch) {
          lines.push(`• <#${ch.id}> (\`#${ch.name}\`) [${ch.type === ChannelType.GuildCategory ? 'Category' : 'Channel'}]`);
        } else {
          lines.push(`• \`${chQuery}\` *(Not found)*`);
        }
      });
      summary = `Delete ${list.length} channels`;
      break;
    }

    case 'purge_messages': {
      isDestructive = true;
      title = '🧹 Proposed Message Purge';
      const amount = params.amount || params.count || 10;
      lines.push(`> ⚠️ **Warning:** Will permanently purge the last **${amount}** messages in this channel.`);
      summary = `Purge ${amount} messages`;
      break;
    }

    case 'setup_welcome': {
      title = '👋 Proposed Welcome Setup';
      if (params.channel) lines.push(`**Welcome Channel:** \`${params.channel}\``);
      if (params.message) lines.push(`**Message:** "${params.message}"`);
      summary = 'Update Welcome Settings';
      break;
    }

    case 'setup_goodbye': {
      title = '👋 Proposed Goodbye Setup';
      if (params.channel) lines.push(`**Goodbye Channel:** \`${params.channel}\``);
      if (params.message) lines.push(`**Message:** "${params.message}"`);
      summary = 'Update Goodbye Settings';
      break;
    }

    case 'lock_channel': {
      title = '🔒 Proposed Channel Lock';
      lines.push(`Locking channel: \`${params.channel || 'current channel'}\``);
      summary = 'Lock Channel';
      break;
    }

    case 'unlock_channel': {
      title = '🔓 Proposed Channel Unlock';
      lines.push(`Unlocking channel: \`${params.channel || 'current channel'}\``);
      summary = 'Unlock Channel';
      break;
    }

    case 'create_role': {
      title = '🎭 Proposed Role Creation';
      const rolesList = Array.isArray(params.roles) ? params.roles : [params];
      if (rolesList.length > 1) {
        lines.push(`Creating **${rolesList.length}** roles:`);
        rolesList.forEach((r, idx) => {
          const rName = typeof r === 'string' ? r : (r.name || `Role ${idx + 1}`);
          const rColor = typeof r === 'object' && r.color ? ` (Color: \`${r.color}\`)` : '';
          const rPerms = typeof r === 'object' && Array.isArray(r.permissions) && r.permissions.length > 0 ? ` [${r.permissions.join(', ')}]` : '';
          lines.push(`• \`${rName}\`${rColor}${rPerms}`);
        });
        summary = `Create ${rolesList.length} Roles`;
      } else {
        lines.push(`**Role Name:** \`${params.name || 'New Role'}\``);
        if (params.color) lines.push(`**Color:** \`${params.color}\``);
        if (params.hoist) lines.push(`**Show Separately:** ✅ Yes (hoisted)`);
        if (params.mentionable) lines.push(`**Mentionable:** ✅ Yes`);
        if (Array.isArray(params.permissions) && params.permissions.length > 0) {
          lines.push(`**Permissions:** ${params.permissions.map(p => `\`${p}\``).join(', ')}`);
        }
        summary = `Create Role ${params.name || ''}`;
      }
      break;
    }

    case 'set_role_permissions': {
      title = '🔐 Proposed Role Permission Update';
      const { resolvedTargets, queries: roleQueries } = resolveTargets(guild, { roles: params.roles || params.role || params.name });
      const rolesFound = resolvedTargets.filter(t => t.type === 'role');
      if (rolesFound.length > 0) {
        lines.push(`**Roles (${rolesFound.length}):** ${rolesFound.map(r => `<@&${r.target.id}> (\`${r.name}\`)`).join(', ')}`);
      } else {
        lines.push(`**Role(s):** \`${roleQueries.join(', ') || params.role || params.name || 'unknown'}\``);
      }
      if (Array.isArray(params.permissions) && params.permissions.length > 0) {
        lines.push(`**New Permissions:** ${params.permissions.map(p => `\`${p}\``).join(', ')}`);
      }
      if (params.hoist !== undefined) lines.push(`**Show Separately:** ${params.hoist ? '✅ Yes' : '❌ No'}`);
      if (params.mentionable !== undefined) lines.push(`**Mentionable:** ${params.mentionable ? '✅ Yes' : '❌ No'}`);
      if (params.color) lines.push(`**Color:** \`${params.color}\``);
      summary = `Update permissions for ${rolesFound.length || 1} role(s)`;
      break;
    }

    case 'manage_member_roles':
    case 'assign_role':
    case 'add_role':
    case 'remove_role': {
      title = '👤 Proposed Member Role Update';
      const userQuery = params.user || params.member || params.username || 'unknown';
      const mode = (params.mode || (actionType === 'remove_role' ? 'remove' : 'add')).toLowerCase();
      const targetMember = findMember(guild, userQuery);
      const { resolvedTargets, queries: roleQueries } = resolveTargets(guild, { roles: params.roles || params.role });
      const rolesFound = resolvedTargets.filter(t => t.type === 'role');

      lines.push(`**Member:** ${targetMember ? `<@${targetMember.id}> (\`${targetMember.displayName}\`)` : `\`${userQuery}\``}`);
      lines.push(`**Action:** ${mode === 'remove' ? '❌ Remove' : '➕ Add'}`);
      if (rolesFound.length > 0) {
        lines.push(`**Roles (${rolesFound.length}):** ${rolesFound.map(r => `<@&${r.target.id}> (\`${r.name}\`)`).join(', ')}`);
      } else {
        lines.push(`**Roles:** \`${roleQueries.join(', ') || params.roles || params.role || 'unknown'}\``);
      }
      summary = `${mode === 'remove' ? 'Remove' : 'Add'} ${rolesFound.length || 1} role(s) to ${targetMember?.displayName || userQuery}`;
      break;
    }

    case 'create_tournament': {
      title = '🏆 Proposed Tournament Setup';
      lines.push(`**Tournament Name:** \`${params.name || 'Tournament'}\``);
      lines.push(`**Total Slots:** \`${params.slots || 50}\``);
      summary = `Setup Tourney ${params.name || ''}`;
      break;
    }

    case 'set_bot_mode': {
      title = '⚙️ Proposed Bot Access Mode';
      lines.push(`**Mode:** \`${params.mode || 'public'}\``);
      summary = `Set Bot Mode: ${params.mode || ''}`;
      break;
    }

    case 'batch': {
      title = '⚡ Proposed Batch Actions';
      const actions = Array.isArray(params.actions) ? params.actions : [];
      lines.push(`Batch containing **${actions.length}** actions:`);
      actions.forEach((act, idx) => {
        lines.push(`${idx + 1}. Action: \`${act.action}\``);
      });
      summary = `${actions.length} Actions`;
      break;
    }

    case 'move_channel_position': {
      title = '📶 Proposed Channel Position Change';
      const chQuery = params.channel || params.name || 'unknown';
      const direction = (params.direction || '').toLowerCase();
      const targetCh = findChannel(guild, chQuery);
      if (targetCh) {
        lines.push(`**Channel:** <#${targetCh.id}> (\`#${targetCh.name}\`)`);
        lines.push(`**Current Position:** \`${targetCh.position}\``);
      } else {
        lines.push(`**Channel:** \`${chQuery}\``);
      }
      const dirLabel = direction === 'up' ? '⬆️ উপরে'
                     : direction === 'down' ? '⬇️ নিচে'
                     : direction === 'top' ? '⬆️⬆️ একদম উপরে'
                     : direction === 'bottom' ? '⬇️⬇️ একদম নিচে'
                     : direction;
      if (dirLabel) lines.push(`**Direction:** ${dirLabel}`);
      if (params.amount && params.amount > 1) lines.push(`**Steps:** \`${params.amount}\``);
      summary = `Move #${targetCh?.name || chQuery} ${direction}`;
      break;
    }

    case 'set_channel_permissions': {
      title = '🔐 Proposed Channel Permission Update';
      const { targetChannels, queries: chQueries } = resolveChannels(guild, params);
      const { resolvedTargets, queries: targetQueries } = resolveTargets(guild, params);

      // Display channels
      if (targetChannels.length > 0) {
        if (targetChannels.length <= 6) {
          lines.push(`**Channels (${targetChannels.length}):** ${targetChannels.map(c => `<#${c.id}> (\`#${c.name}\`)`).join(', ')}`);
        } else {
          lines.push(`**Channels (${targetChannels.length}):** ${targetChannels.slice(0, 5).map(c => `<#${c.id}> (\`#${c.name}\`)`).join(', ')} *(+${targetChannels.length - 5} more)*`);
        }
      } else if (params.category) {
        lines.push(`**Category:** \`${params.category}\``);
      } else {
        lines.push(`**Channel(s):** \`${chQueries.join(', ') || params.channel || 'unknown'}\``);
      }

      // Display roles/users
      if (resolvedTargets.length > 0) {
        if (resolvedTargets.length <= 8) {
          lines.push(`**Roles/Users (${resolvedTargets.length}):** ${resolvedTargets.map(t => t.type === 'role' ? `<@&${t.target.id}> (\`${t.name}\`)` : t.type === 'everyone' ? `\`@everyone\`` : `\`${t.name}\``).join(', ')}`);
        } else {
          lines.push(`**Roles/Users (${resolvedTargets.length}):** ${resolvedTargets.slice(0, 7).map(t => t.type === 'role' ? `<@&${t.target.id}>` : `\`${t.name}\``).join(', ')} *(+${resolvedTargets.length - 7} more)*`);
        }
      } else {
        lines.push(`**Role/User(s):** \`${targetQueries.join(', ') || params.role || params.target || 'unknown'}\``);
      }

      if (Array.isArray(params.allow) && params.allow.length > 0) {
        lines.push(`**✅ Allow:** ${params.allow.map(p => `\`${p}\``).join(', ')}`);
      }
      if (Array.isArray(params.deny) && params.deny.length > 0) {
        lines.push(`**❌ Deny:** ${params.deny.map(p => `\`${p}\``).join(', ')}`);
      }
      if (Array.isArray(params.neutral) && params.neutral.length > 0) {
        lines.push(`**⬜ Neutral (Reset):** ${params.neutral.map(p => `\`${p}\``).join(', ')}`);
      }
      summary = `Permissions for ${targetChannels.length || 1} channel(s) → ${resolvedTargets.length || 1} role/target(s)`;
      break;
    }

    case 'manage_ai_channels': {
      title = '💬 Proposed AI Channel Whitelist Update';
      const mode = (params.mode || 'add').toLowerCase();
      const channels = Array.isArray(params.channels) ? params.channels : (params.channel ? [params.channel] : []);

      if (mode === 'clear') {
        lines.push('⚠️ **AI Channel whitelist clear** করা হবে।');
        lines.push('Bot সব জায়গায় @mention-এ respond করবে (whitelist বন্ধ হত যাবে)।');
        isDestructive = true;
      } else {
        const modeLabel = mode === 'set' ? 'হুবহু সেট করা' : mode === 'remove' ? 'সরানো' : 'যোগ করা';
        lines.push(`**Mode:** \`${modeLabel}\``);
        lines.push('**Channels:**');
        channels.forEach(ch => {
          const found = findChannel(guild, ch);
          lines.push(`• ${found ? `<#${found.id}> (\`#${found.name}\`)` : `\`${ch}\``}`);
        });
        if (mode === 'set') {
          lines.push('\n> নোট: এটি পুরো লিস্ট replace করবে, আগের সব channels মুছে যাবে।');
        }
      }
      summary = `AI channels ${mode}: ${channels.length} channel(s)`;
      break;
    }

    default:
      lines.push(`Action: \`${actionType}\``);
      lines.push(`Parameters: \`${JSON.stringify(params)}\``);
      summary = actionType;
      break;
  }

  return {
    title,
    description: lines.join('\n'),
    isDestructive,
    summary,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXECUTE SERVER ACTION — the main dispatcher
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Executes a server management action based on parsed AI payload.
 *
 * @param {import('discord.js').ChatInputCommandInteraction|import('discord.js').Message} message
 * @param {string} actionType - The action to perform
 * @param {object} params - Parameters for the action
 * @returns {Promise<{ success: boolean, message: string, details?: string }>}
 */
async function executeServerAction(message, actionType, params = {}) {
  const guild = message.guild;
  if (!guild) {
    return { success: false, message: 'This command can only be used inside a Discord server.' };
  }

  const userTag = (message.author || message.user)?.tag || 'Server Admin';
  const messageChannelId = message.channel?.id || message.channelId;

  try {
    switch (actionType) {

      // ───────────────────────────────────────────────────────────────────────
      // REVAMP / REBUILD SERVER (Batch Category & Channel Template Engine)
      // ───────────────────────────────────────────────────────────────────────
      case 'revamp_server':
      case 'setup_server_template': {
        const categories = Array.isArray(params.categories) ? params.categories : [];
        const createdCategories = [];
        const createdChannels = [];

        for (const cat of categories) {
          if (!cat.name) continue;
          let createdCat = null;
          try {
            createdCat = await guild.channels.create({
              name: cat.name.slice(0, 100),
              type: ChannelType.GuildCategory,
              reason: `Server revamp by ${userTag}`,
            });
            createdCategories.push(createdCat.name);
            await new Promise(r => setTimeout(r, 300));
          } catch (err) {
            console.error(`[aiActions] Failed to create category ${cat.name}:`, err);
            continue;
          }

          if (Array.isArray(cat.channels) && cat.channels.length > 0) {
            for (const ch of cat.channels) {
              const chName = typeof ch === 'string' ? ch : (ch.name || 'channel');
              const isVoice = typeof ch === 'object' && ch.type === 'voice';
              try {
                const newCh = await guild.channels.create({
                  name: chName.slice(0, 100),
                  type: isVoice ? ChannelType.GuildVoice : ChannelType.GuildText,
                  parent: createdCat.id,
                  reason: `Server revamp by ${userTag}`,
                });
                createdChannels.push(`${isVoice ? '🔊' : '💬'} <#${newCh.id}>`);
                await new Promise(r => setTimeout(r, 300));
              } catch (err) {
                console.error(`[aiActions] Failed to create channel ${chName}:`, err);
              }
            }
          }
        }

        const summaryLines = [];
        if (createdCategories.length > 0) {
          summaryLines.push(`**Categories Created (${createdCategories.length}):**\n${createdCategories.map(c => `📁 \`${c}\``).join('\n')}`);
        }
        if (createdChannels.length > 0) {
          summaryLines.push(`**Channels Created (${createdChannels.length}):**\n${createdChannels.join(', ')}`);
        }

        return {
          success: true,
          message: `🏰 **Server Layout Setup Complete!**\n\n${summaryLines.join('\n\n')}`,
          details: `Categories: ${createdCategories.length} | Channels: ${createdChannels.length}`,
        };
      }

      // ───────────────────────────────────────────────────────────────────────
      // BATCH EXECUTION
      // ───────────────────────────────────────────────────────────────────────
      case 'batch': {
        const actions = Array.isArray(params.actions) ? params.actions : [];
        if (actions.length === 0) {
          return { success: false, message: 'No actions provided in batch request.' };
        }

        const results = [];
        let successCount = 0;
        for (const act of actions) {
          if (!act.action) continue;
          const res = await executeServerAction(message, act.action, act.parameters || {});
          if (res.success) successCount++;
          results.push(`• ${res.message}`);
          await new Promise(r => setTimeout(r, 300));
        }

        return {
          success: successCount > 0,
          message: `⚡ **Executed ${successCount}/${actions.length} Actions in Batch:**\n\n${results.slice(0, 15).join('\n')}`,
          details: `Total Actions: ${actions.length} | Succeeded: ${successCount}`,
        };
      }

      // ───────────────────────────────────────────────────────────────────────
      // CREATE CATEGORY WITH CHANNELS (supports private flag)
      // ───────────────────────────────────────────────────────────────────────
      case 'create_category_with_channels': {
        const catName = params.name || params.category || 'Category';
        const channels = Array.isArray(params.channels) ? params.channels : [];
        const isPrivate = Boolean(params.private);

        // Build permission overwrites
        const permissionOverwrites = isPrivate
          ? [{ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] }]
          : [];

        const category = await guild.channels.create({
          name: catName.slice(0, 100),
          type: ChannelType.GuildCategory,
          permissionOverwrites,
          reason: `Created via Jarvis AI by ${userTag}`,
        });

        const created = [];
        for (const ch of channels) {
          const chName = typeof ch === 'string' ? ch : (ch.name || 'channel');
          const isVoice = typeof ch === 'object' && ch.type === 'voice';
          const newCh = await guild.channels.create({
            name: chName.slice(0, 100),
            type: isVoice ? ChannelType.GuildVoice : ChannelType.GuildText,
            parent: category.id,
            reason: `Created via Jarvis AI by ${userTag}`,
          });
          created.push(`<#${newCh.id}>`);
          await new Promise(r => setTimeout(r, 300));
        }

        return {
          success: true,
          message: `📁 Created category **${category.name}**${isPrivate ? ' 🔒 (private)' : ''} with **${created.length}** channels: ${created.join(', ')}`,
          details: `Category ID: ${category.id} | Channels: ${created.length}`,
        };
      }

      // ───────────────────────────────────────────────────────────────────────
      // CREATE CHANNEL (supports category/parent)
      // ───────────────────────────────────────────────────────────────────────
      case 'create_channel': {
        const rawName = params.name || 'new-channel';
        const name = rawName.toLowerCase().replace(/\s+/g, '-').slice(0, 100);
        const typeStr = (params.type || 'text').toLowerCase();

        let channelType = ChannelType.GuildText;
        if (typeStr === 'voice') channelType = ChannelType.GuildVoice;
        else if (typeStr === 'category') channelType = ChannelType.GuildCategory;
        else if (typeStr === 'announcement' || typeStr === 'news') channelType = ChannelType.GuildAnnouncement;

        // Resolve category (parent)
        let parentId = null;
        const categoryQuery = params.category || params.parent || null;
        if (categoryQuery) {
          const cat = findCategory(guild, categoryQuery);
          if (cat) {
            parentId = cat.id;
          } else {
            console.warn(`[aiActions] Category "${categoryQuery}" not found for create_channel, creating without parent.`);
          }
        }

        const createOptions = {
          name,
          type: channelType,
          reason: `Created via Jarvis AI command by ${userTag}`,
        };
        if (parentId) createOptions.parent = parentId;

        const newChannel = await guild.channels.create(createOptions);

        return {
          success: true,
          message: `✅ Successfully created ${typeStr} channel <#${newChannel.id}> (\`${newChannel.name}\`)${parentId ? ` inside category \`${guild.channels.cache.get(parentId)?.name || 'Unknown'}\`` : ''}!`,
          details: `Type: ${typeStr} | ID: ${newChannel.id}${parentId ? ` | Parent: ${parentId}` : ''}`,
        };
      }

      // ───────────────────────────────────────────────────────────────────────
      // MOVE CHANNEL TO CATEGORY (new action)
      // ───────────────────────────────────────────────────────────────────────
      case 'move_channel_to_category': {
        const chQuery = params.channel || params.name;
        const catQuery = params.category || params.target_category;

        if (!chQuery) {
          return { success: false, message: '❌ Channel name বলা হয়নি। কোন channel সরাতে চান সেটা বলুন।' };
        }
        if (!catQuery) {
          return { success: false, message: '❌ Category name বলা হয়নি। কোন category-তে সরাতে চান সেটা বলুন।' };
        }

        const targetChannel = findChannel(guild, chQuery);
        if (!targetChannel) {
          return { success: false, message: `❌ \`${chQuery}\` নামের কোনো channel খুঁজে পাওয়া যায়নি।` };
        }

        const targetCategory = findCategory(guild, catQuery);
        if (!targetCategory) {
          return { success: false, message: `❌ \`${catQuery}\` নামের কোনো category খুঁজে পাওয়া যায়নি।` };
        }

        const oldCategoryName = targetChannel.parent?.name || 'None';
        await targetChannel.setParent(targetCategory.id, {
          lockPermissions: false,
          reason: `Moved via Jarvis AI by ${userTag}`,
        });

        return {
          success: true,
          message: `📂 <#${targetChannel.id}> channel সফলভাবে \`${oldCategoryName}\` থেকে \`${targetCategory.name}\` category-তে সরানো হয়েছে!`,
          details: `Channel: ${targetChannel.id} | New Parent: ${targetCategory.id}`,
        };
      }

      // ───────────────────────────────────────────────────────────────────────
      // RENAME CHANNEL (new action)
      // ───────────────────────────────────────────────────────────────────────
      case 'rename_channel': {
        const chQuery = params.channel || params.name;
        const newName = (params.new_name || params.newName || '').toLowerCase().replace(/\s+/g, '-').slice(0, 100);

        if (!chQuery) return { success: false, message: '❌ কোন channel rename করতে চান সেটা বলুন।' };
        if (!newName) return { success: false, message: '❌ নতুন নাম দেওয়া হয়নি।' };

        const targetChannel = findChannel(guild, chQuery);
        if (!targetChannel) {
          return { success: false, message: `❌ \`${chQuery}\` নামের কোনো channel খুঁজে পাওয়া যায়নি।` };
        }

        const oldName = targetChannel.name;
        await targetChannel.setName(newName, `Renamed via Jarvis AI by ${userTag}`);

        return {
          success: true,
          message: `✏️ Channel \`#${oldName}\` সফলভাবে \`#${newName}\` নামে rename করা হয়েছে!`,
          details: `Channel ID: ${targetChannel.id}`,
        };
      }

      // ───────────────────────────────────────────────────────────────────────
      // RENAME ROLE (new action)
      // ───────────────────────────────────────────────────────────────────────
      case 'rename_role': {
        const roleQuery = params.role || params.name;
        const newName = (params.new_name || params.newName || '').slice(0, 100);

        if (!roleQuery) return { success: false, message: '❌ কোন role rename করতে চান সেটা বলুন।' };
        if (!newName) return { success: false, message: '❌ নতুন নাম দেওয়া হয়নি।' };

        const targetRole = findRole(guild, roleQuery);
        if (!targetRole) {
          return { success: false, message: `❌ \`${roleQuery}\` নামের কোনো role খুঁজে পাওয়া যায়নি।` };
        }

        const oldName = targetRole.name;
        await targetRole.setName(newName, `Renamed via Jarvis AI by ${userTag}`);

        return {
          success: true,
          message: `✏️ Role \`${oldName}\` সফলভাবে \`${newName}\` নামে rename করা হয়েছে!`,
          details: `Role ID: ${targetRole.id}`,
        };
      }

      // ───────────────────────────────────────────────────────────────────────
      // DELETE CHANNEL
      // ───────────────────────────────────────────────────────────────────────
      case 'delete_channel': {
        const target = findChannel(guild, params.channel || params.name);
        if (!target) {
          return { success: false, message: `❌ \`${params.channel || params.name}\` নামের কোনো channel খুঁজে পাওয়া যায়নি।` };
        }

        const channelName = target.name;
        await target.delete(`Deleted via Jarvis AI command by ${userTag}`);

        return {
          success: true,
          message: `🗑️ Channel **#${channelName}** সফলভাবে delete করা হয়েছে।`,
        };
      }

      // ───────────────────────────────────────────────────────────────────────
      // DELETE MULTIPLE CHANNELS
      // ───────────────────────────────────────────────────────────────────────
      case 'delete_multiple_channels': {
        const list = Array.isArray(params.channels) ? params.channels : [];
        const deleted = [];
        for (const chQuery of list) {
          const ch = findChannel(guild, chQuery);
          if (!ch || ch.id === messageChannelId) continue;
          if (ch.id === guild.systemChannelId || ch.id === guild.rulesChannelId) continue;

          if (ch.type === ChannelType.GuildCategory) {
            const hasChildren = guild.channels.cache.some(c => c.parentId === ch.id);
            if (hasChildren) {
              console.warn(`[aiActions] Skipping category ${ch.name} because it contains channels.`);
              continue;
            }
          }

          const name = ch.name;
          await ch.delete(`Batch delete by ${userTag}`);
          deleted.push(name);
          await new Promise(r => setTimeout(r, 300));
        }

        return {
          success: true,
          message: deleted.length > 0
            ? `🧹 **${deleted.length}** টি channel delete করা হয়েছে: ${deleted.map(n => `\`#${n}\``).join(', ')}`
            : '⚠️ কোনো matching বা deletable channel পাওয়া যায়নি।',
        };
      }

      // ───────────────────────────────────────────────────────────────────────
      // SETUP WELCOME SYSTEM
      // ───────────────────────────────────────────────────────────────────────
      case 'setup_welcome': {
        let channelId = null;
        if (params.channel) {
          const ch = findChannel(guild, params.channel);
          if (ch) channelId = ch.id;
        }

        if (channelId) await setSetting(guild.id, 'WELCOME_CHANNEL_ID', channelId);
        if (params.message) await setSetting(guild.id, 'WELCOME_MESSAGE', params.message);

        const details = [];
        if (channelId) details.push(`Channel: <#${channelId}>`);
        if (params.message) details.push(`Message: "${params.message}"`);

        return {
          success: true,
          message: `✅ Welcome system সফলভাবে আপডেট হয়েছে!`,
          details: details.join(' | ') || 'Welcome settings saved.',
        };
      }

      // ───────────────────────────────────────────────────────────────────────
      // SETUP GOODBYE SYSTEM
      // ───────────────────────────────────────────────────────────────────────
      case 'setup_goodbye': {
        let channelId = null;
        if (params.channel) {
          const ch = findChannel(guild, params.channel);
          if (ch) channelId = ch.id;
        }

        if (channelId) await setSetting(guild.id, 'GOODBYE_CHANNEL_ID', channelId);
        if (params.message) await setSetting(guild.id, 'GOODBYE_MESSAGE', params.message);

        return {
          success: true,
          message: `✅ Goodbye system সফলভাবে আপডেট হয়েছে!`,
          details: channelId ? `Channel: <#${channelId}>` : 'Goodbye message updated.',
        };
      }

      // ───────────────────────────────────────────────────────────────────────
      // LOCK CHANNEL
      // ───────────────────────────────────────────────────────────────────────
      case 'lock_channel': {
        const target = (params.channel ? findChannel(guild, params.channel) : null) || message.channel;
        if (!target || !target.isTextBased()) {
          return { success: false, message: '❌ শুধুমাত্র text channel lock করা যায়।' };
        }

        await target.permissionOverwrites.edit(
          guild.roles.everyone,
          { SendMessages: false },
          { reason: `Locked via Jarvis AI by ${userTag}` }
        );

        return {
          success: true,
          message: `🔒 <#${target.id}> channel lock করা হয়েছে। Members আর message পাঠাতে পারবে না।`,
        };
      }

      // ───────────────────────────────────────────────────────────────────────
      // UNLOCK CHANNEL
      // ───────────────────────────────────────────────────────────────────────
      case 'unlock_channel': {
        const target = (params.channel ? findChannel(guild, params.channel) : null) || message.channel;
        if (!target || !target.isTextBased()) {
          return { success: false, message: '❌ শুধুমাত্র text channel unlock করা যায়।' };
        }

        await target.permissionOverwrites.edit(
          guild.roles.everyone,
          { SendMessages: null },
          { reason: `Unlocked via Jarvis AI by ${userTag}` }
        );

        return {
          success: true,
          message: `🔓 <#${target.id}> channel unlock করা হয়েছে। Members আবার message পাঠাতে পারবে।`,
        };
      }

      // ───────────────────────────────────────────────────────────────────────
      // PURGE MESSAGES
      // ───────────────────────────────────────────────────────────────────────
      case 'purge_messages': {
        const target = (params.channel ? findChannel(guild, params.channel) : null) || message.channel;
        const count = Math.min(Math.max(parseInt(params.amount || params.count, 10) || 10, 1), 100);

        const deleted = await target.bulkDelete(count, true);
        return {
          success: true,
          message: `🧹 <#${target.id}> থেকে **${deleted.size}** টি message purge করা হয়েছে।`,
        };
      }

      // ───────────────────────────────────────────────────────────────────────
      // CREATE ROLE (with full permission support & multi-role support)
      // ───────────────────────────────────────────────────────────────────────
      case 'create_role': {
        const rolesList = Array.isArray(params.roles) ? params.roles : [params];
        const createdRoles = [];

        for (const r of rolesList) {
          const roleName = typeof r === 'string' ? r : (r.name || 'New Role');
          const color = typeof r === 'object' ? r.color : null;
          const hoist = typeof r === 'object' ? Boolean(r.hoist) : false;
          const mentionable = typeof r === 'object' ? Boolean(r.mentionable) : false;
          const perms = typeof r === 'object' ? (r.permissions || []) : [];

          // Resolve permissions from human-readable names
          const permBits = resolvePermissions(perms);

          const roleOptions = {
            name: roleName,
            hoist,
            mentionable,
            reason: `Created via Jarvis AI command by ${userTag}`,
          };
          if (color) roleOptions.color = color;
          if (permBits !== 0n) roleOptions.permissions = new PermissionsBitField(permBits);

          const newRole = await guild.roles.create(roleOptions);
          createdRoles.push(newRole);
          await new Promise(res => setTimeout(res, 200));
        }

        if (createdRoles.length === 1) {
          const newRole = createdRoles[0];
          const permSummary = Array.isArray(params.permissions) && params.permissions.length > 0
            ? `\n🔐 **Permissions:** ${params.permissions.join(', ')}`
            : '';
          return {
            success: true,
            message: `🎭 Role <@&${newRole.id}> (\`${newRole.name}\`) সফলভাবে তৈরি হয়েছে!${permSummary}${params.hoist ? '\n📌 Members list-এ আলাদা দেখা যাবে।' : ''}${params.mentionable ? '\n🔔 Role mentionable।' : ''}`,
            details: `Role ID: ${newRole.id}`,
          };
        }

        return {
          success: true,
          message: `🎭 **${createdRoles.length} টি Role সফলভাবে তৈরি হয়েছে!**\n\n` +
            createdRoles.map(r => `• <@&${r.id}> (\`${r.name}\`)`).join('\n'),
          details: `Created: ${createdRoles.length}`,
        };
      }

      // ───────────────────────────────────────────────────────────────────────
      // SET ROLE PERMISSIONS (update existing role — supports multiple roles)
      // ───────────────────────────────────────────────────────────────────────
      case 'set_role_permissions': {
        const { resolvedTargets, notFound } = resolveTargets(guild, { roles: params.roles || params.role || params.name });
        const rolesToUpdate = resolvedTargets.filter(t => t.type === 'role').map(t => t.target);

        if (rolesToUpdate.length === 0) {
          return { success: false, message: `❌ কোনো valid role খুঁজে পাওয়া যায়নি${notFound.length > 0 ? ` (\`${notFound.join(', ')}\`)` : ''}।` };
        }

        const updates = {};
        if (Array.isArray(params.permissions) && params.permissions.length > 0) {
          const permBits = resolvePermissions(params.permissions);
          if (permBits !== 0n) updates.permissions = new PermissionsBitField(permBits);
        }
        if (params.hoist !== undefined) updates.hoist = Boolean(params.hoist);
        if (params.mentionable !== undefined) updates.mentionable = Boolean(params.mentionable);
        if (params.color) updates.color = params.color;
        if ((params.new_name || params.newName) && rolesToUpdate.length === 1) updates.name = params.new_name || params.newName;

        if (Object.keys(updates).length === 0) {
          return { success: false, message: '❌ কোনো update parameter দেওয়া হয়নি।' };
        }

        const updated = [];
        for (const r of rolesToUpdate) {
          if (r.managed) continue;
          await r.edit({
            ...updates,
            reason: `Permissions updated via Jarvis AI by ${userTag}`,
          });
          updated.push(r);
          await new Promise(res => setTimeout(res, 150));
        }

        const permSummary = Array.isArray(params.permissions) && params.permissions.length > 0
          ? `\n🔐 **নতুন Permissions:** ${params.permissions.join(', ')}`
          : '';

        if (updated.length === 1) {
          return {
            success: true,
            message: `✅ <@&${updated[0].id}> (\`${updated[0].name}\`) role সফলভাবে আপডেট হয়েছে!${permSummary}`,
            details: `Role ID: ${updated[0].id}`,
          };
        }

        return {
          success: updated.length > 0,
          message: `✅ **${updated.length} টি Role-এর settings সফলভাবে আপডেট হয়েছে!**\n\n` +
            updated.map(r => `• <@&${r.id}> (\`${r.name}\`)`).join('\n') +
            permSummary,
          details: `Updated roles: ${updated.length}`,
        };
      }

      // ───────────────────────────────────────────────────────────────────────
      // MANAGE MEMBER ROLES (add / remove multiple roles to/from a member)
      // ───────────────────────────────────────────────────────────────────────
      case 'manage_member_roles':
      case 'assign_role':
      case 'add_role':
      case 'remove_role': {
        const userQuery = params.user || params.member || params.username;
        const mode = (params.mode || (actionType === 'remove_role' ? 'remove' : 'add')).toLowerCase();
        if (!userQuery) {
          return { success: false, message: '❌ কোন member-কে role দিতে বা সরাতে চান সেটা বলুন।' };
        }

        const targetMember = findMember(guild, userQuery);
        if (!targetMember) {
          return { success: false, message: `❌ \`${userQuery}\` নামের কোনো member খুঁজে পাওয়া যায়নি।` };
        }

        const { resolvedTargets, notFound } = resolveTargets(guild, { roles: params.roles || params.role });
        const rolesToProcess = resolvedTargets.filter(t => t.type === 'role').map(t => t.target);

        if (rolesToProcess.length === 0) {
          return {
            success: false,
            message: `❌ কোনো valid role খুঁজে পাওয়া যায়নি${notFound.length > 0 ? ` (\`${notFound.join(', ')}\`)` : ''}।`
          };
        }

        // Check bot hierarchy
        const botMember = guild.members.me;
        const higherRoles = rolesToProcess.filter(r => r.position >= botMember.roles.highest.position);
        if (higherRoles.length > 0) {
          return {
            success: false,
            message: `❌ বট-এর চেয়ে উপরে থাকা role (${higherRoles.map(r => `\`${r.name}\``).join(', ')}) দেওয়া বা সরানো সম্ভব নয়। সার্ভার সেটিংসে বটের রোল উপরে তুলুন।`
          };
        }

        const modifiedRoles = [];
        for (const role of rolesToProcess) {
          if (mode === 'remove') {
            if (targetMember.roles.cache.has(role.id)) {
              await targetMember.roles.remove(role, `Updated via Jarvis AI by ${userTag}`);
              modifiedRoles.push(role.name);
            }
          } else {
            if (!targetMember.roles.cache.has(role.id)) {
              await targetMember.roles.add(role, `Updated via Jarvis AI by ${userTag}`);
              modifiedRoles.push(role.name);
            }
          }
          await new Promise(r => setTimeout(r, 100));
        }

        const modeText = mode === 'remove' ? 'সরানো' : 'যোগ করা';
        return {
          success: true,
          message: `👤 **<@${targetMember.id}>-এর জন্য role ${modeText} হয়েছে!**\n\n` +
            `🎭 **Roles (${modifiedRoles.length}):** ${modifiedRoles.map(r => `\`${r}\``).join(', ')}`,
          details: `User: ${targetMember.id} | Mode: ${mode} | Count: ${modifiedRoles.length}`,
        };
      }

      // ───────────────────────────────────────────────────────────────────────
      // CREATE TOURNAMENT
      // ───────────────────────────────────────────────────────────────────────
      case 'create_tournament': {
        const tourneyName = params.name || 'Tournament Championship';
        const totalSlots = parseInt(params.slots, 10) || 50;

        const regChannel = await guild.channels.create({
          name: `${tourneyName.toLowerCase().replace(/\s+/g, '-')}-reg`,
          type: ChannelType.GuildText,
          topic: `Registration channel for ${tourneyName}`,
          reason: `Auto-created for tournament by ${userTag}`,
        });

        const { data, error } = await supabase
          .from('tourneys')
          .insert([{
            guild_id: guild.id,
            name: tourneyName,
            registration_channel_id: regChannel.id,
            total_slots: totalSlots,
            required_mentions: 4,
            enabled: true,
            is_open: true,
          }])
          .select()
          .single();

        if (error) {
          console.error('[aiActions] Tourney insert error:', error);
          return {
            success: true,
            message: `Channel <#${regChannel.id}> তৈরি করা হয়েছে **${tourneyName}** tournament-এর জন্য, কিন্তু DB-তে সমস্যা হয়েছে। </tourney:0> দিয়ে configure করুন।`,
          };
        }

        return {
          success: true,
          message: `🏆 **${tourneyName}** tournament সফলভাবে তৈরি হয়েছে! **${totalSlots}** টি slot আছে।`,
          details: `Registration Channel: <#${regChannel.id}> | Use </tourney:0> for advanced bracket controls.`,
        };
      }

      // ───────────────────────────────────────────────────────────────────────
      // SET BOT ACCESS MODE
      // ───────────────────────────────────────────────────────────────────────
      case 'set_bot_mode': {
        const mode = (params.mode || 'public').toLowerCase();
        if (!['public', 'restricted', 'admins_only'].includes(mode)) {
          return { success: false, message: 'Mode must be one of: `public`, `restricted`, `admins_only`.' };
        }

        await setAccessMode(guild.id, mode);
        return {
          success: true,
          message: `⚙️ Bot access mode **${mode}** করা হয়েছে!`,
        };
      }

      // ───────────────────────────────────────────────────────────────────────
      // MOVE CHANNEL/CATEGORY POSITION (up / down / top / bottom)
      // ───────────────────────────────────────────────────────────────────────
      case 'move_channel_position': {
        const chQuery = params.channel || params.name;
        if (!chQuery) {
          return { success: false, message: '❌ কোন channel সরাতে চান সেটা বলুন।' };
        }

        const targetChannel = findChannel(guild, chQuery);
        if (!targetChannel) {
          return { success: false, message: `❌ \`${chQuery}\` নামের কোনো channel বা category খুঁজে পাওয়া যায়নি।` };
        }

        const direction = (params.direction || '').toLowerCase();
        const amount = Math.max(1, parseInt(params.amount || params.steps || 1, 10));
        const absolutePos = (params.position !== undefined && params.position !== null)
          ? parseInt(params.position, 10)
          : null;

        const currentPos = targetChannel.position;
        let newPos;

        if (absolutePos !== null && !isNaN(absolutePos)) {
          newPos = absolutePos;
        } else if (direction === 'up' || direction === 'উপরে') {
          newPos = Math.max(0, currentPos - amount);
        } else if (direction === 'down' || direction === 'নিচে') {
          newPos = currentPos + amount;
        } else if (direction === 'top' || direction === 'first') {
          newPos = 0;
        } else if (direction === 'bottom' || direction === 'last') {
          newPos = 999;
        } else {
          return { success: false, message: '❌ Direction বলুন: `up` (উপরে) অথবা `down` (নিচে)।' };
        }

        await targetChannel.setPosition(newPos, {
          reason: `Position changed via Jarvis AI by ${userTag}`,
        });

        const dirText = direction === 'up' || direction === 'উপরে' ? '⬆️ উপরে'
                      : direction === 'down' || direction === 'নিচে' ? '⬇️ নিচে'
                      : direction === 'top' ? '⬆️ একদম উপরে'
                      : direction === 'bottom' ? '⬇️ একদম নিচে'
                      : `position \`${newPos}\`-এ`;

        return {
          success: true,
          message: `📶 \`${targetChannel.name}\` সফলভাবে ${dirText} সরানো হয়েছে!`,
          details: `Previous Position: ${currentPos} | New Position: ${targetChannel.position}`,
        };
      }

      // ───────────────────────────────────────────────────────────────────────
      // SET CHANNEL PERMISSIONS — add/deny/reset multiple roles or users in multiple channels
      // ───────────────────────────────────────────────────────────────────────
      case 'set_channel_permissions': {
        const { targetChannels, unresolvedQueries: unresCh } = resolveChannels(guild, params);
        const { resolvedTargets, notFound: notFoundTargets } = resolveTargets(guild, params);
        const allowPerms   = Array.isArray(params.allow)   ? params.allow   : [];
        const denyPerms    = Array.isArray(params.deny)    ? params.deny    : [];
        const neutralPerms = Array.isArray(params.neutral) ? params.neutral : [];

        if (targetChannels.length === 0) {
          return {
            success: false,
            message: `❌ কোনো valid channel খুঁজে পাওয়া যায়নি${unresCh.length > 0 ? ` (\`${unresCh.join(', ')}\`)` : ''}। Channel নাম সঠিকভাবে উল্লেখ করুন।`
          };
        }
        if (resolvedTargets.length === 0) {
          return {
            success: false,
            message: `❌ কোনো valid role বা user খুঁজে পাওয়া যায়নি${notFoundTargets.length > 0 ? ` (\`${notFoundTargets.join(', ')}\`)` : ''}। Role নাম সঠিকভাবে উল্লেখ করুন।`
          };
        }
        if (allowPerms.length === 0 && denyPerms.length === 0 && neutralPerms.length === 0) {
          return { success: false, message: '❌ কী permission allow বা deny করতে চান সেটা বলুন।' };
        }

        // Build Discord.js permissionOverwrites object
        const permOverwrites = {};
        for (const p of allowPerms) {
          const key = resolvePermToKey(p);
          if (key) permOverwrites[key] = true;
        }
        for (const p of denyPerms) {
          const key = resolvePermToKey(p);
          if (key) permOverwrites[key] = false;
        }
        for (const p of neutralPerms) {
          const key = resolvePermToKey(p);
          if (key) permOverwrites[key] = null;
        }

        if (Object.keys(permOverwrites).length === 0) {
          return { success: false, message: '❌ কোনো valid permission দেওয়া হয়নি। সঠিক permission নাম ব্যবহার করুন।' };
        }

        let updatedCount = 0;
        let failCount = 0;

        for (const ch of targetChannels) {
          for (const item of resolvedTargets) {
            try {
              await ch.permissionOverwrites.edit(item.target, permOverwrites, {
                reason: `Channel permissions updated via Jarvis AI by ${userTag}`,
              });
              updatedCount++;
              await new Promise(r => setTimeout(r, 100));
            } catch (err) {
              console.error(`[aiActions] Failed to set perms on ${ch.name} for ${item.name}:`, err);
              failCount++;
            }
          }
        }

        const allowList   = allowPerms.length   > 0 ? `✅ Allow: ${allowPerms.join(', ')}`   : '';
        const denyList    = denyPerms.length    > 0 ? `❌ Deny: ${denyPerms.join(', ')}`    : '';
        const neutralList = neutralPerms.length > 0 ? `⬜ Reset: ${neutralPerms.join(', ')}` : '';

        const chSummary = targetChannels.map(c => `\`#${c.name}\``).join(', ');
        const roleSummary = resolvedTargets.map(t => t.type === 'everyone' ? '`@everyone`' : `\`${t.name}\``).join(', ');

        if (targetChannels.length === 1 && resolvedTargets.length === 1) {
          return {
            success: updatedCount > 0,
            message: `🔐 \`#${targetChannels[0].name}\` channel-এ \`${resolvedTargets[0].name}\`-এর permission সফলভাবে আপডেট হয়েছে!\n${[allowList, denyList, neutralList].filter(Boolean).join('\n')}`,
            details: `Channel: ${targetChannels[0].id} | Target: ${resolvedTargets[0].target.id}`,
          };
        }

        return {
          success: updatedCount > 0,
          message: `🔐 **Channel Permissions সফলভাবে আপডেট হয়েছে!**\n\n` +
            `📁 **Channels (${targetChannels.length}):** ${chSummary}\n` +
            `👑 **Roles/Users (${resolvedTargets.length}):** ${roleSummary}\n\n` +
            `${[allowList, denyList, neutralList].filter(Boolean).join('\n')}` +
            `${failCount > 0 ? `\n⚠️ (${failCount} টি permission overwrite ব্যর্থ হয়েছে, বট-এর রোলের পজিশন চেক করুন)` : ''}`,
          details: `Channels: ${targetChannels.length} | Roles/Targets: ${resolvedTargets.length} | Total Updates: ${updatedCount}`,
        };
      }

      // ───────────────────────────────────────────────────────────────────────
      // MANAGE AI CHANNEL WHITELIST
      // ───────────────────────────────────────────────────────────────────────
      case 'manage_ai_channels': {
        const mode = (params.mode || 'add').toLowerCase();
        const channelQueries = Array.isArray(params.channels)
          ? params.channels
          : params.channel ? [params.channel] : [];

        // Clear mode — remove whitelist entirely
        if (mode === 'clear') {
          await setSetting(guild.id, 'AI_ALLOWED_CHANNEL_IDS', '');
          return {
            success: true,
            message: '🗑️ AI channel whitelist **clear** করা হয়েছে! Bot এখন @mention-এ সব channel-এ respond করবে।',
          };
        }

        if (channelQueries.length === 0) {
          return { success: false, message: '❌ কোন channel উল্লেখ করা হয়নি।' };
        }

        // Resolve channel IDs
        const resolvedIds = [];
        const notFound = [];
        for (const q of channelQueries) {
          const ch = findChannel(guild, q);
          if (ch) {
            resolvedIds.push(ch.id);
          } else {
            // Maybe it's already a raw ID
            if (/^\d{17,19}$/.test(q.trim())) {
              resolvedIds.push(q.trim());
            } else {
              notFound.push(q);
            }
          }
        }

        // Load existing whitelist
        const currentSetting = await (async () => {
          const { getSetting: getS } = require('./settings');
          return (await getS(guild.id, 'AI_ALLOWED_CHANNEL_IDS')) || '';
        })();
        const existingIds = currentSetting.split(',').map(id => id.trim()).filter(Boolean);

        let finalIds;
        if (mode === 'set') {
          finalIds = [...new Set(resolvedIds)];
        } else if (mode === 'remove') {
          finalIds = existingIds.filter(id => !resolvedIds.includes(id));
        } else {
          // add (default)
          finalIds = [...new Set([...existingIds, ...resolvedIds])];
        }

        await setSetting(guild.id, 'AI_ALLOWED_CHANNEL_IDS', finalIds.join(','));

        const channelMentions = finalIds.map(id => `<#${id}>`).join(', ') || '*(none)*';
        const modeLabel = mode === 'set' ? 'সেট' : mode === 'remove' ? 'সরানো' : 'যোগ';
        const notFoundWarn = notFound.length > 0 ? `\n⚠️ খুঁজে পাওয়া যায়নি: ${notFound.join(', ')}` : '';

        return {
          success: true,
          message: `💬 AI channel whitelist আপডেট হয়েছে! (mode: \`${modeLabel}\`)\n\n**এখন active channels:** ${channelMentions}${notFoundWarn}`,
          details: `Total channels: ${finalIds.length} | Mode: ${mode}`,
        };
      }

      // ───────────────────────────────────────────────────────────────────────
      // SETUP TICKET SYSTEM — configure + optionally deploy panel
      // ───────────────────────────────────────────────────────────────────────
      case 'setup_ticket': {
        const { setSetting: saveSetting } = require('./settings');
        const results = [];

        const staffRoleQuery = params.staff_role || params.staffRole;
        const categoryQuery  = params.category   || params.ticket_category;
        const panelChannel   = params.panel_channel || params.panelChannel;
        const transcriptCh   = params.transcript_channel || params.transcriptChannel;
        const welcomeMsg     = params.welcome_message || params.welcomeMessage;

        if (staffRoleQuery) {
          const role = findRole(guild, staffRoleQuery);
          if (role) {
            await saveSetting(guild.id, 'TICKET_STAFF_ROLE_ID', role.id);
            results.push(`✅ Staff Role → ${role}`);
          } else {
            results.push(`⚠️ Staff role \`${staffRoleQuery}\` খুঁজে পাওয়া যায়নি`);
          }
        }

        if (categoryQuery) {
          const cat = findCategory(guild, categoryQuery);
          if (cat) {
            await saveSetting(guild.id, 'TICKET_CATEGORY_ID', cat.id);
            results.push(`✅ Ticket Category → \`${cat.name}\``);
          } else {
            results.push(`⚠️ Category \`${categoryQuery}\` খুঁজে পাওয়া যায়নি`);
          }
        }

        if (transcriptCh) {
          const ch = findChannel(guild, transcriptCh);
          if (ch) {
            await saveSetting(guild.id, 'TICKET_TRANSCRIPT_CHANNEL_ID', ch.id);
            results.push(`✅ Transcript Channel → <#${ch.id}>`);
          } else {
            results.push(`⚠️ Transcript channel \`${transcriptCh}\` খুঁজে পাওয়া যায়নি`);
          }
        }

        if (welcomeMsg) {
          await saveSetting(guild.id, 'TICKET_WELCOME_MESSAGE', welcomeMsg);
          results.push(`✅ Welcome message সেট হয়েছে`);
        }

        // Optionally deploy ticket panel in a channel
        if (panelChannel) {
          const ch = findChannel(guild, panelChannel);
          if (ch) {
            const { EmbedBuilder: Embed, ActionRowBuilder: ARB, ButtonBuilder: BB, ButtonStyle: BS } = require('discord.js');
            const panelEmbed = new Embed()
              .setColor(0x6366f1)
              .setTitle('📩 Support Ticket Desk')
              .setDescription('Need help, want to report something, or have a partnership offer? Click **Open Ticket** below to start a private conversation with our staff team.')
              .addFields(
                { name: '🔒 Private & Secure',   value: 'Only you and staff can see your ticket.', inline: true },
                { name: '⚡ Quick Response',      value: 'Our team responds as soon as possible.',  inline: true },
              )
              .setFooter({ text: 'Jarvis Ticket System' })
              .setTimestamp();
            const row = new ARB().addComponents(
              new BB().setCustomId('ticket_create').setLabel('Open Ticket').setEmoji('📩').setStyle(BS.Primary)
            );
            await ch.send({ embeds: [panelEmbed], components: [row] });
            results.push(`✅ Ticket panel deployed in <#${ch.id}>`);
          } else {
            results.push(`⚠️ Panel channel \`${panelChannel}\` খুঁজে পাওয়া যায়নি`);
          }
        }

        if (results.length === 0) {
          return { success: false, message: '❌ কোনো parameter দেওয়া হয়নি। `staff_role`, `category`, `panel_channel`, `transcript_channel`, অথবা `welcome_message` দিন।' };
        }

        return {
          success: true,
          message: `🎫 **Ticket System কনফিগার হয়েছে!**\n\n${results.join('\n')}`,
        };
      }

      // ───────────────────────────────────────────────────────────────────────
      // SETUP WELCOME / GOODBYE
      // ───────────────────────────────────────────────────────────────────────
      case 'setup_welcome': {
        const { setSetting: saveSetting } = require('./settings');
        const channelQuery = params.channel;
        const welcomeText  = params.message || 'Hey {user}, glad you joined **{server}**! 🎉\n\nPlease read the rules and enjoy your stay.';

        if (!channelQuery) {
          return { success: false, message: '❌ Welcome channel-এর নাম দিন। উদাহরণ: `channel: "welcome"`' };
        }

        const ch = findChannel(guild, channelQuery);
        if (!ch) return { success: false, message: `❌ Channel \`${channelQuery}\` খুঁজে পাওয়া যায়নি।` };

        await saveSetting(guild.id, 'WELCOME_CHANNEL_ID', ch.id);
        await saveSetting(guild.id, 'WELCOME_MESSAGE', welcomeText);

        return {
          success: true,
          message: `👋 **Welcome System সেট হয়েছে!**\n\n✅ Channel → <#${ch.id}>\n✅ Message → \`${welcomeText.slice(0, 100)}...\`\n\n*{user} = member mention, {server} = server name*`,
        };
      }

      case 'setup_goodbye': {
        const { setSetting: saveSetting } = require('./settings');
        const channelQuery = params.channel;
        const goodbyeText  = params.message || '{user} has left **{server}**. Goodbye! 👋';

        if (!channelQuery) {
          return { success: false, message: '❌ Goodbye channel-এর নাম দিন। উদাহরণ: `channel: "general"`' };
        }

        const ch = findChannel(guild, channelQuery);
        if (!ch) return { success: false, message: `❌ Channel \`${channelQuery}\` খুঁজে পাওয়া যায়নি।` };

        await saveSetting(guild.id, 'GOODBYE_CHANNEL_ID', ch.id);
        await saveSetting(guild.id, 'GOODBYE_MESSAGE', goodbyeText);

        return {
          success: true,
          message: `👋 **Goodbye System সেট হয়েছে!**\n\n✅ Channel → <#${ch.id}>\n✅ Message → \`${goodbyeText.slice(0, 100)}\``,
        };
      }

      // ───────────────────────────────────────────────────────────────────────
      // SETUP LEVELING
      // ───────────────────────────────────────────────────────────────────────
      case 'setup_leveling': {
        const { setSetting: saveSetting } = require('./settings');
        const results = [];

        if (params.channel) {
          const ch = findChannel(guild, params.channel);
          if (ch) {
            await saveSetting(guild.id, 'LEVELING_CHANNEL_ID', ch.id);
            results.push(`✅ Level-up notification channel → <#${ch.id}>`);
          } else {
            results.push(`⚠️ Channel \`${params.channel}\` খুঁজে পাওয়া যায়নি`);
          }
        }

        if (params.xp_rate !== undefined) {
          await saveSetting(guild.id, 'LEVELING_XP_RATE', String(params.xp_rate));
          results.push(`✅ XP rate → \`${params.xp_rate}\` per message`);
        }

        if (params.enabled !== undefined) {
          await saveSetting(guild.id, 'LEVELING_ENABLED', params.enabled ? '1' : '0');
          results.push(`✅ Leveling system → \`${params.enabled ? 'চালু' : 'বন্ধ'}\``);
        }

        if (results.length === 0) {
          return { success: false, message: '❌ `channel`, `xp_rate`, বা `enabled` এর মধ্যে অন্তত একটি দিন।' };
        }

        return {
          success: true,
          message: `🏆 **Leveling System কনফিগার হয়েছে!**\n\n${results.join('\n')}`,
        };
      }

      // ───────────────────────────────────────────────────────────────────────
      // SETUP BIRTHDAY
      // ───────────────────────────────────────────────────────────────────────
      case 'setup_birthday': {
        const { setSetting: saveSetting } = require('./settings');
        const results = [];

        if (params.channel) {
          const ch = findChannel(guild, params.channel);
          if (ch) {
            await saveSetting(guild.id, 'BIRTHDAY_CHANNEL_ID', ch.id);
            results.push(`✅ Birthday announcement channel → <#${ch.id}>`);
          } else {
            results.push(`⚠️ Channel \`${params.channel}\` খুঁজে পাওয়া যায়নি`);
          }
        }

        if (params.role) {
          const role = findRole(guild, params.role);
          if (role) {
            await saveSetting(guild.id, 'BIRTHDAY_ROLE_ID', role.id);
            results.push(`✅ Birthday role → ${role} (জন্মদিনে দেওয়া হবে)`);
          } else {
            results.push(`⚠️ Role \`${params.role}\` খুঁজে পাওয়া যায়নি`);
          }
        }

        if (params.message) {
          await saveSetting(guild.id, 'BIRTHDAY_MESSAGE', params.message);
          results.push(`✅ Birthday message সেট হয়েছে`);
        }

        if (results.length === 0) {
          return { success: false, message: '❌ `channel`, `role`, বা `message` এর মধ্যে অন্তত একটি দিন।' };
        }

        return {
          success: true,
          message: `🎂 **Birthday System কনফিগার হয়েছে!**\n\n${results.join('\n')}`,
        };
      }

      // ───────────────────────────────────────────────────────────────────────
      // SETUP AUTOMOD (basic spam / bad-word filter settings)
      // ───────────────────────────────────────────────────────────────────────
      case 'setup_automod': {
        const { setSetting: saveSetting } = require('./settings');
        const results = [];

        if (params.log_channel) {
          const ch = findChannel(guild, params.log_channel);
          if (ch) {
            await saveSetting(guild.id, 'MOD_LOG_CHANNEL_ID', ch.id);
            results.push(`✅ Mod log channel → <#${ch.id}>`);
          } else {
            results.push(`⚠️ Channel \`${params.log_channel}\` খুঁজে পাওয়া যায়নি`);
          }
        }

        if (params.anti_spam !== undefined) {
          await saveSetting(guild.id, 'ANTI_SPAM_ENABLED', params.anti_spam ? '1' : '0');
          results.push(`✅ Anti-spam → \`${params.anti_spam ? 'চালু' : 'বন্ধ'}\``);
        }

        if (params.anti_link !== undefined) {
          await saveSetting(guild.id, 'ANTI_LINK_ENABLED', params.anti_link ? '1' : '0');
          results.push(`✅ Anti-link filter → \`${params.anti_link ? 'চালু' : 'বন্ধ'}\``);
        }

        if (params.mute_role) {
          const role = findRole(guild, params.mute_role);
          if (role) {
            await saveSetting(guild.id, 'MUTE_ROLE_ID', role.id);
            results.push(`✅ Mute role → ${role}`);
          } else {
            results.push(`⚠️ Mute role \`${params.mute_role}\` খুঁজে পাওয়া যায়নি`);
          }
        }

        if (results.length === 0) {
          return { success: false, message: '❌ `log_channel`, `anti_spam`, `anti_link`, বা `mute_role` এর মধ্যে একটি দিন।' };
        }

        return {
          success: true,
          message: `🛡️ **AutoMod System কনফিগার হয়েছে!**\n\n${results.join('\n')}`,
        };
      }

      // ───────────────────────────────────────────────────────────────────────
      // DEPLOY TICKET PANEL — just post the panel embed in a channel
      // ───────────────────────────────────────────────────────────────────────
      case 'deploy_ticket_panel': {
        const channelQuery = params.channel;
        const panelTitle   = params.title       || '📩 Support Ticket Desk';
        const panelDesc    = params.description || 'Need help or want to report something? Click **Open Ticket** below to start a private conversation with our staff team.';

        let targetCh;
        if (channelQuery) {
          targetCh = findChannel(guild, channelQuery);
          if (!targetCh) return { success: false, message: `❌ Channel \`${channelQuery}\` খুঁজে পাওয়া যায়নি।` };
        } else {
          targetCh = message.channel;
        }

        const panelEmbed = new EmbedBuilder()
          .setColor(0x6366f1)
          .setTitle(panelTitle)
          .setDescription(panelDesc)
          .addFields(
            { name: '🔒 Private & Secure',   value: 'Only you and staff can see your ticket.', inline: true },
            { name: '⚡ Quick Response',      value: 'Our team responds as soon as possible.',  inline: true },
            { name: '📂 Multiple Categories', value: 'Choose the type that fits your request.', inline: true },
          )
          .setFooter({ text: 'Jarvis Ticket System' })
          .setTimestamp();

        const { ActionRowBuilder: ARB, ButtonBuilder: BB, ButtonStyle: BS } = require('discord.js');
        const row = new ARB().addComponents(
          new BB().setCustomId('ticket_create').setLabel('Open Ticket').setEmoji('📩').setStyle(BS.Primary)
        );

        await targetCh.send({ embeds: [panelEmbed], components: [row] });

        return {
          success: true,
          message: `📩 **Ticket Panel successfully deployed in <#${targetCh.id}>!**`,
        };
      }

      // ───────────────────────────────────────────────────────────────────────
      // SHOW CONFIG — display current bot settings for this server
      // ───────────────────────────────────────────────────────────────────────
      case 'show_config': {
        const { getSetting: getS } = require('./settings');

        const keys = [
          ['TICKET_STAFF_ROLE_ID',          '🎫 Ticket Staff Role',      'role'],
          ['TICKET_CATEGORY_ID',             '📁 Ticket Category',         'channel'],
          ['TICKET_TRANSCRIPT_CHANNEL_ID',   '📄 Transcript Channel',      'channel'],
          ['WELCOME_CHANNEL_ID',             '👋 Welcome Channel',         'channel'],
          ['GOODBYE_CHANNEL_ID',             '👋 Goodbye Channel',         'channel'],
          ['LEVELING_CHANNEL_ID',            '🏆 Leveling Channel',        'channel'],
          ['LEVELING_ENABLED',               '🏆 Leveling Enabled',        'bool'],
          ['BIRTHDAY_CHANNEL_ID',            '🎂 Birthday Channel',         'channel'],
          ['BIRTHDAY_ROLE_ID',               '🎂 Birthday Role',            'role'],
          ['MOD_LOG_CHANNEL_ID',             '🛡️ Mod Log Channel',         'channel'],
          ['ANTI_SPAM_ENABLED',              '🛡️ Anti-Spam',               'bool'],
          ['ANTI_LINK_ENABLED',              '🛡️ Anti-Link',               'bool'],
          ['MUTE_ROLE_ID',                   '🔇 Mute Role',               'role'],
          ['AI_ALLOWED_CHANNEL_IDS',         '🤖 AI Channels',             'channels'],
        ];

        const lines = [];
        for (const [key, label, type] of keys) {
          const val = await getS(guild.id, key);
          let display = '*(not set)*';
          if (val) {
            if (type === 'channel') display = `<#${val}>`;
            else if (type === 'role') display = `<@&${val}>`;
            else if (type === 'channels') display = val.split(',').filter(Boolean).map(id => `<#${id}>`).join(', ') || '*(empty)*';
            else if (type === 'bool') display = val === '1' ? '✅ চালু' : '❌ বন্ধ';
            else display = `\`${val.slice(0, 50)}\``;
          }
          lines.push(`**${label}:** ${display}`);
        }

        // Send as embed in the channel
        const configEmbed = new EmbedBuilder()
          .setColor(0x6366f1)
          .setTitle('⚙️ Current Bot Configuration')
          .setDescription(lines.join('\n'))
          .setFooter({ text: `${guild.name} • Jarvis Config` })
          .setTimestamp();

        await message.channel.send({ embeds: [configEmbed] });

        return {
          success: true,
          message: '⚙️ উপরে current config দেখানো হলো।',
        };
      }

      default:
        return { success: false, message: `❌ অজানা action: "${actionType}". এই কাজটি আমি এখনো করতে পারি না।` };

    }
  } catch (err) {
    console.error(`[aiActions] Error executing ${actionType}:`, err);

    // User-friendly error messages in Bengali
    let errorMsg = err.message || 'Unknown error';
    if (err.code === 50013) errorMsg = 'Bot-এর যথেষ্ট permission নেই। Bot-এর role-টি সার্ভারে উপরে রাখুন।';
    else if (err.code === 50001) errorMsg = 'এই channel/role-এ access নেই।';
    else if (err.code === 30013) errorMsg = 'Channel সংখ্যা সীমা পূর্ণ হয়ে গেছে (max 500)।';
    else if (err.code === 30005) errorMsg = 'Role সংখ্যা সীমা পূর্ণ হয়ে গেছে (max 250)।';

    return {
      success: false,
      message: `⚠️ Action \`${actionType}\` execute করতে সমস্যা হয়েছে: ${errorMsg}`,
    };
  }
}

module.exports = {
  executeServerAction,
  formatActionPreview,
  findChannel,
  findCategory,
  findRole,
  findMember,
  resolveChannels,
  resolveTargets,
  resolvePermissions,
  resolvePermToKey,
};
