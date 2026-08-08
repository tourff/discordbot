'use strict';

const supabase = require('../config/supabase');

/**
 * Checks if a user has permission to use the bot in a specific guild.
 * Defaults to Server Administrators having access if no permissions are set.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {Promise<boolean>}
 */
async function hasPermission(member) {
  // Always allow server administrators
  if (member.permissions.has('Administrator')) {
    return true;
  }

  // Fetch all permissions for this guild
  const { data, error } = await supabase
    .from('bot_permissions')
    .select('type, target_id')
    .eq('guild_id', member.guild.id);

  if (error) {
    console.error('[Permissions] Error fetching permissions:', error);
    // Fail closed or open? Let's fail open for admins, but closed for normal users
    return false;
  }

  // If no permissions are set for the guild, ONLY admins can use it
  if (!data || data.length === 0) {
    return false;
  }

  // Check if user is explicitly permitted
  const isUserPermitted = data.some(p => p.type === 'user' && p.target_id === member.id);
  if (isUserPermitted) return true;

  // Check if any of the user's roles are explicitly permitted
  const memberRoleIds = member.roles.cache.map(r => r.id);
  const isRolePermitted = data.some(p => p.type === 'role' && memberRoleIds.includes(p.target_id));
  if (isRolePermitted) return true;

  return false;
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
  hasPermission,
  addPermission,
  removePermission,
  getPermissions
};
