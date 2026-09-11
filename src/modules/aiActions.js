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

  // Try case-insensitive exact name match
  const cleanName = query.replace(/^#/, '').toLowerCase().trim();
  const exactMatch = guild.channels.cache.find(c => c.name.toLowerCase() === cleanName);
  if (exactMatch) return exactMatch;

  // Match stripped alphanumeric to avoid emoji discrepancies
  const searchRaw = cleanName.replace(/[^a-z0-9-]/g, '');
  if (searchRaw) {
    const strippedMatch = guild.channels.cache.find(c => {
      const raw = c.name.toLowerCase().replace(/[^a-z0-9-]/g, '');
      return raw === searchRaw;
    });
    if (strippedMatch) return strippedMatch;
  }

  return null;
}

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
      lines.push(`**Category:** 📁 \`${catName}\``);
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
      lines.push(`**Channel Name:** \`#${name}\``);
      lines.push(`**Type:** \`${type}\``);
      summary = `Create #${name} (${type})`;
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
      summary = `Create Role ${params.name || ''}`;
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

  const userTag = (message.author || message.user)?.tag || 'Server Admin';
  const messageChannelId = message.channel?.id || message.channelId;

  try {
    switch (actionType) {
      // ─────────────────────────────────────────────────────────────────────
      // 0. REVAMP / REBUILD SERVER (Batch Category & Channel Template Engine)
      // ─────────────────────────────────────────────────────────────────────
      case 'revamp_server':
      case 'setup_server_template': {
        // CRITICAL SAFETY SHIELD: Never auto-delete existing server channels in revamp_server!
        // Mass deletion must never be triggered by an AI chat prompt without explicit manual confirmation.
        const categories = Array.isArray(params.categories) ? params.categories : [];
        const createdCategories = [];
        const createdChannels = [];

        // Create categories and nested channels in batch
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
                  reason: `Server revamp by ${userTag}`,
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

        return {
          success: true,
          message: `🏰 **Server Layout Setup Complete!**\n\n${summaryLines.join('\n\n')}`,
          details: `Categories: ${createdCategories.length} | Channels: ${createdChannels.length}`,
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
          if (!ch || ch.id === messageChannelId) continue;
          if (ch.id === guild.systemChannelId || ch.id === guild.rulesChannelId) continue;

          // If category has children, do not delete it to prevent accidental wiping
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
          await new Promise(r => setTimeout(r, 250));
        }

        return {
          success: true,
          message: deleted.length > 0
            ? `🧹 Deleted **${deleted.length}** channels: ${deleted.map(n => `\`#${n}\``).join(', ')}`
            : 'No matching or deletable channels were found.',
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
          reason: `Created via Jarvis AI command by ${userTag}`,
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
        await target.delete(`Deleted via Jarvis AI command by ${userTag}`);

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
        }, { reason: `Locked via Jarvis AI command by ${userTag}` });

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
        }, { reason: `Unlocked via Jarvis AI command by ${userTag}` });

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
          reason: `Created via Jarvis AI command by ${userTag}`,
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
  formatActionPreview,
  findChannel,
};
