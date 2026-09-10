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
} = require('discord.js');

const supabase = require('../config/supabase');
const { setSetting } = require('./settings');
const { setAccessMode } = require('./permissions');

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

  // Try case-insensitive name match
  const cleanName = query.replace(/^#/, '').toLowerCase().trim();
  return (
    guild.channels.cache.find(
      c => c.name.toLowerCase() === cleanName || c.name.toLowerCase().includes(cleanName)
    ) || null
  );
}

/**
 * Executes a server management action based on parsed AI payload.
 *
 * @param {import('discord.js').Message} message - The Discord message that triggered the request
 * @param {string} actionType - The action to perform
 * @param {object} params - Parameters for the action
 * @returns {Promise<{ success: boolean, message: string, details?: string }>}
 */
async function executeServerAction(message, actionType, params = {}) {
  const guild = message.guild;
  if (!guild) {
    return { success: false, message: 'This command can only be used inside a Discord server.' };
  }

  try {
    switch (actionType) {
      // ─────────────────────────────────────────────────────────────────────
      // 1. CREATE CHANNEL
      // ─────────────────────────────────────────────────────────────────────
      case 'create_channel': {
        const name = (params.name || 'new-channel').toLowerCase().replace(/\s+/g, '-').slice(0, 100);
        const typeStr = (params.type || 'text').toLowerCase();

        let channelType = ChannelType.GuildText;
        if (typeStr === 'voice') channelType = ChannelType.GuildVoice;
        else if (typeStr === 'category') channelType = ChannelType.GuildCategory;
        else if (typeStr === 'announcement' || typeStr === 'news') channelType = ChannelType.GuildAnnouncement;

        const newChannel = await guild.channels.create({
          name,
          type: channelType,
          reason: `Created via Jarvis AI command by ${message.author.tag}`,
        });

        return {
          success: true,
          message: `Successfully created ${typeStr} channel <#${newChannel.id}> (\`${newChannel.name}\`)!`,
          details: `Type: ${typeStr} | ID: ${newChannel.id}`,
        };
      }

      // ─────────────────────────────────────────────────────────────────────
      // 2. DELETE CHANNEL
      // ─────────────────────────────────────────────────────────────────────
      case 'delete_channel': {
        const target = findChannel(guild, params.channel || params.name);
        if (!target) {
          return { success: false, message: `Could not find a channel matching "${params.channel || params.name}".` };
        }

        const channelName = target.name;
        await target.delete(`Deleted via Jarvis AI command by ${message.author.tag}`);

        return {
          success: true,
          message: `Successfully deleted channel **#${channelName}**.`,
        };
      }

      // ─────────────────────────────────────────────────────────────────────
      // 3. SETUP WELCOME SYSTEM
      // ─────────────────────────────────────────────────────────────────────
      case 'setup_welcome': {
        let channelId = null;
        if (params.channel) {
          const ch = findChannel(guild, params.channel);
          if (ch) channelId = ch.id;
        }

        if (channelId) {
          await setSetting(guild.id, 'WELCOME_CHANNEL_ID', channelId);
        }

        if (params.message) {
          await setSetting(guild.id, 'WELCOME_MESSAGE', params.message);
        }

        const details = [];
        if (channelId) details.push(`Channel: <#${channelId}>`);
        if (params.message) details.push(`Message: "${params.message}"`);

        return {
          success: true,
          message: `✅ Welcome system updated successfully!`,
          details: details.join(' | ') || 'Welcome settings saved.',
        };
      }

      // ─────────────────────────────────────────────────────────────────────
      // 4. SETUP GOODBYE SYSTEM
      // ─────────────────────────────────────────────────────────────────────
      case 'setup_goodbye': {
        let channelId = null;
        if (params.channel) {
          const ch = findChannel(guild, params.channel);
          if (ch) channelId = ch.id;
        }

        if (channelId) {
          await setSetting(guild.id, 'GOODBYE_CHANNEL_ID', channelId);
        }

        if (params.message) {
          await setSetting(guild.id, 'GOODBYE_MESSAGE', params.message);
        }

        return {
          success: true,
          message: `✅ Goodbye system updated successfully!`,
          details: channelId ? `Channel: <#${channelId}>` : 'Goodbye message updated.',
        };
      }

      // ─────────────────────────────────────────────────────────────────────
      // 5. LOCK CHANNEL
      // ─────────────────────────────────────────────────────────────────────
      case 'lock_channel': {
        const target = findChannel(guild, params.channel) || message.channel;
        if (!target.isTextBased()) {
          return { success: false, message: 'Only text channels can be locked.' };
        }

        await target.permissionOverwrites.edit(guild.roles.everyone, {
          SendMessages: false,
        }, { reason: `Locked via Jarvis AI command by ${message.author.tag}` });

        return {
          success: true,
          message: `🔒 Successfully locked <#${target.id}>. Members can no longer send messages.`,
        };
      }

      // ─────────────────────────────────────────────────────────────────────
      // 6. UNLOCK CHANNEL
      // ─────────────────────────────────────────────────────────────────────
      case 'unlock_channel': {
        const target = findChannel(guild, params.channel) || message.channel;
        if (!target.isTextBased()) {
          return { success: false, message: 'Only text channels can be unlocked.' };
        }

        await target.permissionOverwrites.edit(guild.roles.everyone, {
          SendMessages: null, // Reset to default
        }, { reason: `Unlocked via Jarvis AI command by ${message.author.tag}` });

        return {
          success: true,
          message: `🔓 Successfully unlocked <#${target.id}>. Members can now chat again.`,
        };
      }

      // ─────────────────────────────────────────────────────────────────────
      // 7. PURGE MESSAGES
      // ─────────────────────────────────────────────────────────────────────
      case 'purge_messages': {
        const target = findChannel(guild, params.channel) || message.channel;
        const count = Math.min(Math.max(parseInt(params.amount || params.count, 10) || 10, 1), 100);

        const deleted = await target.bulkDelete(count, true);
        return {
          success: true,
          message: `🧹 Successfully purged **${deleted.size}** messages in <#${target.id}>.`,
        };
      }

      // ─────────────────────────────────────────────────────────────────────
      // 8. CREATE ROLE
      // ─────────────────────────────────────────────────────────────────────
      case 'create_role': {
        const roleName = params.name || 'New Role';
        const color = params.color || null;

        const roleOptions = {
          name: roleName,
          reason: `Created via Jarvis AI command by ${message.author.tag}`,
        };
        if (color) roleOptions.color = color;

        const newRole = await guild.roles.create(roleOptions);
        return {
          success: true,
          message: `🎭 Successfully created role <@&${newRole.id}> (\`${newRole.name}\`)!`,
          details: `Role ID: ${newRole.id}`,
        };
      }

      // ─────────────────────────────────────────────────────────────────────
      // 9. CREATE TOURNAMENT
      // ─────────────────────────────────────────────────────────────────────
      case 'create_tournament': {
        const tourneyName = params.name || 'Tournament Championship';
        const totalSlots = parseInt(params.slots, 10) || 50;

        // Check if registration channel should be auto-created
        const regChannel = await guild.channels.create({
          name: `${tourneyName.toLowerCase().replace(/\s+/g, '-')}-reg`,
          type: ChannelType.GuildText,
          topic: `Registration channel for ${tourneyName}`,
          reason: `Auto-created for tournament by ${message.author.tag}`,
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
            message: `Created channel <#${regChannel.id}> for **${tourneyName}**, but encountered a DB notice. You can configure it via </tourney:0>.`,
          };
        }

        return {
          success: true,
          message: `🏆 Successfully created tournament **${tourneyName}** with **${totalSlots}** slots!`,
          details: `Registration Channel: <#${regChannel.id}> | Use </tourney:0> for advanced bracket controls.`,
        };
      }

      // ─────────────────────────────────────────────────────────────────────
      // 10. SET BOT ACCESS MODE
      // ─────────────────────────────────────────────────────────────────────
      case 'set_bot_mode': {
        const mode = (params.mode || 'public').toLowerCase();
        if (!['public', 'restricted', 'admins_only'].includes(mode)) {
          return { success: false, message: 'Mode must be one of: `public`, `restricted`, `admins_only`.' };
        }

        await setAccessMode(guild.id, mode);
        return {
          success: true,
          message: `⚙️ Bot access mode for this server has been updated to **${mode}**!`,
        };
      }

      default:
        return { success: false, message: `Unknown action: "${actionType}".` };
    }
  } catch (err) {
    console.error(`[aiActions] Error executing ${actionType}:`, err);
    return {
      success: false,
      message: `Failed to execute action "${actionType}": ${err.message}`,
    };
  }
}

module.exports = {
  executeServerAction,
};
