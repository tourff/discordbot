'use strict';

const { PermissionFlagsBits } = require('discord.js');
const supabase = require('../config/supabase');
const { getSetting, setSetting } = require('./settings');

// In-memory cache for permissions to avoid querying Supabase on every interaction
const permCache = new Map(); // guildId -> { permissions: Array, timestamp: number }
const CACHE_TTL = 60 * 1000; // 1 minute

/**
 * List of admin / setup / moderation commands that require elevated permissions.
 */
const ADMIN_COMMAND_NAMES = new Set([
  'setup',
  'setupsocial',
  'category',
  'setup-roles',
  'botcontrol',
  'autopurge',
  'captcha-setup',
  'maintenance',
  'mass-create',
  'mass-delete',
  'mass-message',
  'mass-role',
  'lock',
  'unlock',
  'roleall',
  'rrole',
]);

const ADMIN_CATEGORIES = new Set([
  'moderation',
  'welcome',
]);

/**
 * Checks if a command is considered administrative / management level.
 * @param {object} command
 * @returns {boolean}
 */
function isCommandAdminLevel(command) {
  if (!command) return false;
  const name = command.data?.name?.toLowerCase();
  const category = command.category?.toLowerCase();

  if (name && ADMIN_COMMAND_NAMES.has(name)) return true;
  if (category && ADMIN_CATEGORIES.has(category)) return true;

  // Check if default_member_permissions requires Admin, ManageGuild, Ban, or Kick
  const defaultPerms = command.data?.default_member_permissions;
  if (defaultPerms) {
    const bitfield = BigInt(defaultPerms);
    const adminFlag = BigInt(PermissionFlagsBits.Administrator);
    const manageGuildFlag = BigInt(PermissionFlagsBits.ManageGuild);
    const banFlag = BigInt(PermissionFlagsBits.BanMembers);
    const kickFlag = BigInt(PermissionFlagsBits.KickMembers);
    if ((bitfield & adminFlag) || (bitfield & manageGuildFlag) || (bitfield & banFlag) || (bitfield & kickFlag)) {
      return true;
    }
  }

  return false;
}

/**
 * Retrieves who added the bot in a guild (or falls back to server owner).
 * @param {string} guildId
 * @param {string} [fallbackOwnerId]
 * @returns {Promise<string>}
 */
async function getBotAdder(guildId, fallbackOwnerId = null) {
  const adderId = await getSetting(guildId, 'BOT_ADDER_ID');
  return adderId || fallbackOwnerId || null;
}

/**
 * Sets who is designated as the bot adder / manager for a guild.
 * @param {string} guildId
 * @param {string} userId
 */
async function setBotAdder(guildId, userId) {
  return await setSetting(guildId, 'BOT_ADDER_ID', userId);
}

/**
 * Gets the current bot access mode for a guild ('public' | 'restricted' | 'admins_only').
 * @param {string} guildId
 * @returns {Promise<string>}
 */
async function getAccessMode(guildId) {
  const mode = await getSetting(guildId, 'BOT_ACCESS_MODE');
  return mode || 'public';
}

/**
 * Sets the bot access mode for a guild.
 * @param {string} guildId
 * @param {'public'|'restricted'|'admins_only'} mode
 */
async function setAccessMode(guildId, mode) {
  return await setSetting(guildId, 'BOT_ACCESS_MODE', mode);
}

/**
 * Checks if a member has permission to run /botcontrol or manage bot configuration.
 * Only Server Owner, Bot Adder, or Server Administrator can do this.
 * @param {import('discord.js').GuildMember} member
 * @returns {Promise<boolean>}
 */
async function canManageBot(member) {
  if (!member || !member.guild) return false;

  // 1. Server Owner always can manage
  if (member.id === member.guild.ownerId) return true;

  // 2. Server Administrator always can manage
  if (member.permissions?.has && (
    member.permissions.has(PermissionFlagsBits.Administrator) ||
    member.permissions.has('Administrator') ||
    member.permissions.has(8n) ||
    member.permissions.has(8)
  )) return true;

  // 3. Bot Adder can manage
  const botAdderId = await getBotAdder(member.guild.id, member.guild.ownerId);
  if (botAdderId && member.id === botAdderId) return true;

  return false;
}

/**
 * Checks if a user has permission to use a specific command in a guild.
 *
 * @param {import('discord.js').GuildMember} member
 * @param {object} [command]
 * @returns {Promise<{ allowed: boolean, reason?: string }>}
 */
async function checkPermission(member, command) {
  if (!member || !member.guild) {
    return { allowed: true };
  }

  const guild = member.guild;
  const isOwner = member.id === guild.ownerId;
  const isAdmin = member.permissions?.has ? (
    member.permissions.has(PermissionFlagsBits.Administrator) ||
    member.permissions.has('Administrator') ||
    member.permissions.has(8n) ||
    member.permissions.has(8)
  ) : false;
  const hasManageGuild = member.permissions?.has ? (
    member.permissions.has(PermissionFlagsBits.ManageGuild) ||
    member.permissions.has('ManageGuild') ||
    member.permissions.has(32n) ||
    member.permissions.has(32)
  ) : false;

  // Fetch bot adder
  const botAdderId = await getBotAdder(guild.id, guild.ownerId);
  const isBotAdder = botAdderId && member.id === botAdderId;

  // ── 1. Owner, Bot Adder, and Administrator ALWAYS have full access ─────────
  if (isOwner || isBotAdder || isAdmin) {
    return { allowed: true };
  }

  // ── 2. Check /botcontrol command specifically ─────────────────────────────
  if (command?.data?.name === 'botcontrol') {
    return {
      allowed: false,
      reason: "🚫 Only the Server Owner, the member who added the bot, or Server Administrators can configure bot control settings.",
    };
  }

  // ── 3. Fetch explicit permissions for this guild (from DB / cache) ────────
  let permList = [];
  const cached = permCache.get(guild.id);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    permList = cached.permissions;
  } else {
    const { data, error } = await supabase
      .from('bot_permissions')
      .select('type, target_id')
      .eq('guild_id', guild.id);

    if (error) {
      if (error.code !== 'PGRST205') {
        console.error('[Permissions] Error fetching permissions:', error);
      }
    } else {
      permList = data || [];
      permCache.set(guild.id, { permissions: permList, timestamp: Date.now() });
    }
  }

  // Check if member or member's roles are explicitly permitted
  const isUserPermitted = permList.some(p => p.type === 'user' && p.target_id === member.id);
  let memberRoleIds = [];
  if (member.roles?.cache) {
    if (typeof member.roles.cache.map === 'function') {
      memberRoleIds = member.roles.cache.map(r => r.id || r);
    } else if (Array.isArray(member.roles.cache)) {
      memberRoleIds = member.roles.cache.map(r => r.id || r);
    } else if (typeof member.roles.cache.values === 'function') {
      memberRoleIds = Array.from(member.roles.cache.values()).map(r => r.id || r);
    }
  }
  const isRolePermitted = permList.some(p => p.type === 'role' && memberRoleIds.includes(p.target_id));
  const isExplicitlyPermitted = isUserPermitted || isRolePermitted;

  // ── 4. Check Access Mode & Command Type ───────────────────────────────────
  const mode = await getAccessMode(guild.id);
  const isAdminCmd = isCommandAdminLevel(command);

  // Restricted Mode: Only Adder, Owner, Admins, or explicitly authorized users/roles can use the bot
  if (mode === 'restricted') {
    if (!isExplicitlyPermitted) {
      return {
        allowed: false,
        reason: "🔒 This bot is in restricted mode on this server. Only the server owner, the member who added the bot, or authorized roles can use it.",
      };
    }
    // If explicitly permitted, still prevent regular members from using Admin / Moderation commands unless they have ManageGuild
    if (isAdminCmd && !hasManageGuild && !isExplicitlyPermitted) {
      return {
        allowed: false,
        reason: "You don't have admin or manage guild permission for this guild.",
      };
    }
    return { allowed: true };
  }

  // Admins Only Mode: All commands require Admin or ManageGuild or explicit authorization
  if (mode === 'admins_only') {
    if (!hasManageGuild && !isExplicitlyPermitted) {
      return {
        allowed: false,
        reason: "You don't have admin or manage guild permission for this guild.",
      };
    }
    return { allowed: true };
  }

  // Public Mode (Default, like Carl-bot):
  // General commands (music, leveling, economy, tickets, etc.) can be used by everyone.
  // Setup / Moderation / Admin commands require Admin, ManageGuild, or explicit authorization!
  if (isAdminCmd) {
    if (!hasManageGuild && !isExplicitlyPermitted) {
      return {
        allowed: false,
        reason: "You don't have admin or manage guild permission for this guild.",
      };
    }
  }

  return { allowed: true };
}

/**
 * Legacy compatibility wrapper.
 * @param {import('discord.js').GuildMember} member
 * @param {object} [command]
 * @returns {Promise<boolean>}
 */
async function hasPermission(member, command) {
  const result = await checkPermission(member, command);
  return result.allowed;
}

/**
 * Adds a permission rule.
 */
async function addPermission(guildId, type, targetId) {
  const { error } = await supabase
    .from('bot_permissions')
    .insert([{ guild_id: guildId, type, target_id }]);

  if (error) {
    if (error.code === '23505') return true; // Unique constraint violation (already exists)
    console.error('[Permissions] Error adding permission:', error);
    return false;
  }

  permCache.delete(guildId); // Invalidate cache
  return true;
}

/**
 * Removes a permission rule.
 */
async function removePermission(guildId, type, targetId) {
  const { error } = await supabase
    .from('bot_permissions')
    .delete()
    .match({ guild_id: guildId, type, target_id });

  if (error) {
    console.error('[Permissions] Error removing permission:', error);
    return false;
  }

  permCache.delete(guildId); // Invalidate cache
  return true;
}

/**
 * Retrieves all permissions for a guild.
 */
async function getPermissions(guildId) {
  const { data, error } = await supabase
    .from('bot_permissions')
    .select('id, type, target_id')
    .eq('guild_id', guildId);

  if (error) {
    console.error('[Permissions] Error fetching permissions:', error);
    return [];
  }
  return data;
}

module.exports = {
  checkPermission,
  hasPermission,
  canManageBot,
  getBotAdder,
  setBotAdder,
  getAccessMode,
  setAccessMode,
  addPermission,
  removePermission,
  getPermissions,
  isCommandAdminLevel,
};

