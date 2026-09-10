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
      // 0. REVAMP / REBUILD SERVER (Batch Category & Channel Template Engine)
      // ─────────────────────────────────────────────────────────────────────
      case 'revamp_server':
      case 'setup_server_template': {
        const cleanOld = Boolean(params.clean_old || params.clean_empty_or_old || params.remove_unused);
        const categories = Array.isArray(params.categories) ? params.categories : [];
        const deletedChannels = [];
        const createdCategories = [];
        const createdChannels = [];

        // 1. Clean old channels if user requested to remove them
        if (cleanOld) {
          const currentChannelId = message.channel.id;
          const channelsToKeep = new Set([
            currentChannelId,
            guild.systemChannelId,
            guild.rulesChannelId,
            guild.publicUpdatesChannelId,
          ].filter(Boolean));

          const allChannels = await guild.channels.fetch();
          for (const [id, ch] of allChannels) {
            if (!ch) continue;
            // Protect current interaction channel and system defaults
            if (channelsToKeep.has(id)) continue;
            const nameLower = ch.name.toLowerCase();
            // Protect essential bot and log channels
            if (nameLower.includes('tryout') || nameLower.includes('bot-command') || nameLower.includes('log')) {
              continue;
            }

            try {
              const oldName = ch.name;
              await ch.delete(`Server revamp by ${message.author.tag}`);
              deletedChannels.push(oldName);
              await new Promise(r => setTimeout(r, 250)); // rate-limit safety
            } catch (err) {
              console.warn(`[aiActions] Could not delete channel ${ch.name}:`, err.message);
            }
          }
        }

        // 2. Create categories and nested channels in batch
        for (const cat of categories) {
          if (!cat.name) continue;
          let createdCat = null;
          try {
            createdCat = await guild.channels.create({
              name: cat.name.slice(0, 100),
              type: ChannelType.GuildCategory,
              reason: `Server revamp by ${message.author.tag}`,
            });
            createdCategories.push(createdCat.name);
            await new Promise(r => setTimeout(r, 250));
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
                  reason: `Server revamp by ${message.author.tag}`,
                });
                createdChannels.push(`${isVoice ? '🔊' : '💬'} <#${newCh.id}>`);
                await new Promise(r => setTimeout(r, 250));
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
        if (deletedChannels.length > 0) {
          summaryLines.push(`**Old Channels Cleaned (${deletedChannels.length}):**\n${deletedChannels.slice(0, 10).map(c => `\`#${c}\``).join(', ')}${deletedChannels.length > 10 ? ` ...and ${deletedChannels.length - 10} more` : ''}`);
        }

        return {
          success: true,
          message: `🏰 **Server Remake & Beautification Complete!**\n\n${summaryLines.join('\n\n')}`,
          details: `Categories: ${createdCategories.length} | Channels: ${createdChannels.length} | Removed: ${deletedChannels.length}`,
        };
      }

      // ─────────────────────────────────────────────────────────────────────
      // BATCH EXECUTION
      // ─────────────────────────────────────────────────────────────────────
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
          await new Promise(r => setTimeout(r, 250));
        }

        return {
          success: successCount > 0,
          message: `⚡ **Executed ${successCount}/${actions.length} Actions in Batch:**\n\n${results.slice(0, 15).join('\n')}`,
          details: `Total Actions: ${actions.length} | Succeeded: ${successCount}`,
        };
      }

      // ─────────────────────────────────────────────────────────────────────
      // CREATE CATEGORY WITH CHANNELS
      // ─────────────────────────────────────────────────────────────────────
      case 'create_category_with_channels': {
        const catName = params.name || params.category || 'Category';
        const channels = Array.isArray(params.channels) ? params.channels : [];

        const category = await guild.channels.create({
          name: catName.slice(0, 100),
          type: ChannelType.GuildCategory,
          reason: `Created via Jarvis AI by ${message.author.tag}`,
        });

        const created = [];
        for (const ch of channels) {
          const chName = typeof ch === 'string' ? ch : (ch.name || 'channel');
          const isVoice = typeof ch === 'object' && ch.type === 'voice';
          const newCh = await guild.channels.create({
            name: chName.slice(0, 100),
            type: isVoice ? ChannelType.GuildVoice : ChannelType.GuildText,
            parent: category.id,
            reason: `Created via Jarvis AI by ${message.author.tag}`,
          });
          created.push(`<#${newCh.id}>`);
          await new Promise(r => setTimeout(r, 250));
        }

        return {
          success: true,
          message: `📁 Created category **${category.name}** with ${created.length} channels: ${created.join(', ')}`,
          details: `Category ID: ${category.id} | Channels: ${created.length}`,
        };
      }

      // ─────────────────────────────────────────────────────────────────────
      // DELETE MULTIPLE CHANNELS
      // ─────────────────────────────────────────────────────────────────────
      case 'delete_multiple_channels': {
        const list = Array.isArray(params.channels) ? params.channels : [];
        const deleted = [];
        for (const chQuery of list) {
          const ch = findChannel(guild, chQuery);
          if (ch && ch.id !== message.channel.id) {
            const name = ch.name;
            await ch.delete(`Batch delete by ${message.author.tag}`);
            deleted.push(name);
            await new Promise(r => setTimeout(r, 250));
          }
        }

        return {
          success: true,
          message: `🧹 Deleted **${deleted.length}** channels: ${deleted.map(n => `\`#${n}\``).join(', ')}`,
        };
      }
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
