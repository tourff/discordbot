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
  const cleanName = query.replace(/^#/, '').toLowerCase().trim();
  const exactMatch = guild.channels.cache.find(c => c.name.toLowerCase() === cleanName);
  if (exactMatch) return exactMatch;

  // Match stripped alphanumeric to avoid emoji discrepancies
  const searchRaw = cleanName.replace(/[^a-z0-9\u0980-\u09FF-]/g, '');
  if (searchRaw) {
    const strippedMatch = guild.channels.cache.find(c => {
      const raw = c.name.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF-]/g, '');
      return raw === searchRaw;
    });
    if (strippedMatch) return strippedMatch;
  }

  return null;
}

/**
 * Finds a role in the guild by ID, mention, or name.
 * @param {import('discord.js').Guild} guild
 * @param {string} query
 * @returns {import('discord.js').Role|null}
 */
function findRole(guild, query) {
  if (!query) return null;
  const cleanId = query.replace(/[<@&>]/g, '').trim();

  const byId = guild.roles.cache.get(cleanId);
  if (byId) return byId;

  const cleanName = query.toLowerCase().trim();
  return guild.roles.cache.find(r => r.name.toLowerCase() === cleanName) || null;
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
      lines.push(`**Role Name:** \`${params.name || 'New Role'}\``);
      if (params.color) lines.push(`**Color:** \`${params.color}\``);
      if (params.hoist) lines.push(`**Show Separately:** ✅ Yes (hoisted)`);
      if (params.mentionable) lines.push(`**Mentionable:** ✅ Yes`);
      if (Array.isArray(params.permissions) && params.permissions.length > 0) {
        lines.push(`**Permissions:** ${params.permissions.map(p => `\`${p}\``).join(', ')}`);
      }
      summary = `Create Role ${params.name || ''}`;
      break;
    }

    case 'set_role_permissions': {
      title = '🔐 Proposed Role Permission Update';
      const roleQuery = params.role || params.name || 'unknown';
      const targetRole = findRole(guild, roleQuery);
      if (targetRole) {
        lines.push(`**Role:** <@&${targetRole.id}> (\`${targetRole.name}\`)`);
      } else {
        lines.push(`**Role:** \`${roleQuery}\``);
      }
      if (Array.isArray(params.permissions) && params.permissions.length > 0) {
        lines.push(`**New Permissions:** ${params.permissions.map(p => `\`${p}\``).join(', ')}`);
      }
      if (params.hoist !== undefined) lines.push(`**Show Separately:** ${params.hoist ? '✅ Yes' : '❌ No'}`);
      if (params.mentionable !== undefined) lines.push(`**Mentionable:** ${params.mentionable ? '✅ Yes' : '❌ No'}`);
      if (params.color) lines.push(`**Color:** \`${params.color}\``);
      summary = `Update permissions for ${targetRole?.name || roleQuery}`;
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
      const chQuery = params.channel || params.name || 'unknown';
      const targetQuery = params.role || params.user || params.target || 'unknown';
      const targetCh = findChannel(guild, chQuery);
      const targetRole = findRole(guild, targetQuery);
      if (targetCh) {
        lines.push(`**Channel:** <#${targetCh.id}> (\`#${targetCh.name}\`)`);
      } else {
        lines.push(`**Channel:** \`${chQuery}\``);
      }
      if (targetRole) {
        lines.push(`**Role:** <@&${targetRole.id}> (\`${targetRole.name}\`)`);
      } else {
        lines.push(`**Role/User:** \`${targetQuery}\``);
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
      summary = `Channel permissions for #${targetCh?.name || chQuery} → ${targetRole?.name || targetQuery}`;
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
      // CREATE ROLE (with full permission support)
      // ───────────────────────────────────────────────────────────────────────
      case 'create_role': {
        const roleName = params.name || 'New Role';
        const color = params.color || null;
        const hoist = Boolean(params.hoist);
        const mentionable = Boolean(params.mentionable);

        // Resolve permissions from human-readable names
        const permBits = resolvePermissions(params.permissions || []);

        const roleOptions = {
          name: roleName,
          hoist,
          mentionable,
          reason: `Created via Jarvis AI command by ${userTag}`,
        };
        if (color) roleOptions.color = color;
        if (permBits !== 0n) roleOptions.permissions = new PermissionsBitField(permBits);

        const newRole = await guild.roles.create(roleOptions);

        const permSummary = Array.isArray(params.permissions) && params.permissions.length > 0
          ? `\n🔐 **Permissions:** ${params.permissions.join(', ')}`
          : '';

        return {
          success: true,
          message: `🎭 Role <@&${newRole.id}> (\`${newRole.name}\`) সফলভাবে তৈরি হয়েছে!${permSummary}${hoist ? '\n📌 Members list-এ আলাদা দেখা যাবে।' : ''}${mentionable ? '\n🔔 Role mentionable।' : ''}`,
          details: `Role ID: ${newRole.id}`,
        };
      }

      // ───────────────────────────────────────────────────────────────────────
      // SET ROLE PERMISSIONS (update existing role — new action)
      // ───────────────────────────────────────────────────────────────────────
      case 'set_role_permissions': {
        const roleQuery = params.role || params.name;
        if (!roleQuery) {
          return { success: false, message: '❌ কোন role-এর permission পরিবর্তন করতে চান সেটা বলুন।' };
        }

        const targetRole = findRole(guild, roleQuery);
        if (!targetRole) {
          return { success: false, message: `❌ \`${roleQuery}\` নামের কোনো role খুঁজে পাওয়া যায়নি।` };
        }

        if (targetRole.managed) {
          return { success: false, message: `❌ \`${targetRole.name}\` একটি managed role (bot/integration role), এটা পরিবর্তন করা যাবে না।` };
        }

        const updates = {};
        if (Array.isArray(params.permissions) && params.permissions.length > 0) {
          const permBits = resolvePermissions(params.permissions);
          if (permBits !== 0n) updates.permissions = new PermissionsBitField(permBits);
        }
        if (params.hoist !== undefined) updates.hoist = Boolean(params.hoist);
        if (params.mentionable !== undefined) updates.mentionable = Boolean(params.mentionable);
        if (params.color) updates.color = params.color;
        if (params.new_name || params.newName) updates.name = params.new_name || params.newName;

        if (Object.keys(updates).length === 0) {
          return { success: false, message: '❌ কোনো update parameter দেওয়া হয়নি।' };
        }

        await targetRole.edit({
          ...updates,
          reason: `Permissions updated via Jarvis AI by ${userTag}`,
        });

        const permSummary = Array.isArray(params.permissions) && params.permissions.length > 0
          ? `\n🔐 **নতুন Permissions:** ${params.permissions.join(', ')}`
          : '';

        return {
          success: true,
          message: `✅ <@&${targetRole.id}> (\`${targetRole.name}\`) role সফলভাবে আপডেট হয়েছে!${permSummary}`,
          details: `Role ID: ${targetRole.id}`,
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
      // SET CHANNEL PERMISSIONS — add/deny/reset role or user permissions
      // ───────────────────────────────────────────────────────────────────────
      case 'set_channel_permissions': {
        const chQuery = params.channel || params.name;
        const targetQuery = params.role || params.user || params.target;
        const allowPerms  = Array.isArray(params.allow)   ? params.allow   : [];
        const denyPerms   = Array.isArray(params.deny)    ? params.deny    : [];
        const neutralPerms = Array.isArray(params.neutral) ? params.neutral : [];

        if (!chQuery) {
          return { success: false, message: '❌ কোন channel-এর permission পরিবর্তন করতে চান সেটা বলুন।' };
        }
        if (!targetQuery) {
          return { success: false, message: '❌ কোন role বা user-এর জন্য permission দিতে চান সেটা বলুন।' };
        }
        if (allowPerms.length === 0 && denyPerms.length === 0 && neutralPerms.length === 0) {
          return { success: false, message: '❌ কী permission allow বা deny করতে চান সেটা বলুন।' };
        }

        const targetChannel = findChannel(guild, chQuery);
        if (!targetChannel) {
          return { success: false, message: `❌ \`${chQuery}\` নামের কোনো channel খুঁজে পাওয়া যায়নি।` };
        }

        // Resolve target: @everyone, role, or user
        let permTarget = null;
        let targetName = targetQuery;
        const lowerQuery = targetQuery.toLowerCase().trim();

        if (lowerQuery === '@everyone' || lowerQuery === 'everyone' || lowerQuery === 'সবাই') {
          permTarget = guild.roles.everyone;
          targetName = '@everyone';
        } else {
          permTarget = findRole(guild, targetQuery);
          if (permTarget) {
            targetName = permTarget.name;
          } else {
            // Try by user ID/mention
            const cleanId = targetQuery.replace(/[<@!>]/g, '').trim();
            const member = guild.members.cache.get(cleanId);
            if (member) {
              permTarget = member;
              targetName = member.displayName;
            }
          }
        }

        if (!permTarget) {
          return { success: false, message: `❌ \`${targetQuery}\` নামের কোনো role বা user খুঁজে পাওয়া যায়নি।` };
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

        await targetChannel.permissionOverwrites.edit(permTarget, permOverwrites, {
          reason: `Channel permissions updated via Jarvis AI by ${userTag}`,
        });

        const allowList   = allowPerms.length   > 0 ? `✅ Allow: ${allowPerms.join(', ')}`   : '';
        const denyList    = denyPerms.length    > 0 ? `❌ Deny: ${denyPerms.join(', ')}`    : '';
        const neutralList = neutralPerms.length > 0 ? `⬜ Reset: ${neutralPerms.join(', ')}` : '';

        return {
          success: true,
          message: `🔐 \`#${targetChannel.name}\` channel-এ \`${targetName}\`-এর permission সফলভাবে আপডেট হয়েছে!\n${[allowList, denyList, neutralList].filter(Boolean).join('\n')}`,
          details: `Channel: ${targetChannel.id} | Target: ${permTarget.id || permTarget.user?.id}`,
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
  resolvePermissions,
  resolvePermToKey,
};
