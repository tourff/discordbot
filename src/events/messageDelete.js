// src/events/messageDelete.js
// ─────────────────────────────────────────────────────────────────────────────
// Logs deleted messages to #server-logs.
// Also populates the snipe cache for /snipe command.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { EmbedBuilder } = require('discord.js');
const { getServerLogsChannelId } = require('../modules/settings');
const snipeCache = require('../modules/snipeCache');

module.exports = {
  name: 'messageDelete',

  /**
   * @param {import('discord.js').Message | import('discord.js').PartialMessage} message
   */
  async execute(message) {
    // Skip partial messages with no content and bot messages
    if (!message.guild || message.author?.bot) return;

    // ── Snipe cache (for /snipe command) ──────────────────────────────────────
    if (!message.partial && message.content) {
      snipeCache.set(message.channel.id, {
        content: message.content,
        authorId: message.author.id,
        authorTag: message.author.tag,
        authorAvatar: message.author.displayAvatarURL(),
        attachmentUrl: message.attachments.first()?.proxyURL ?? null,
      });
    }

    const channelId = await getServerLogsChannelId(message.guild.id);
    if (!channelId) return;

    const logChannel = message.guild.channels.cache.get(channelId);
    if (!logChannel) return;

    // Don't log if deleted from the log channel itself
    if (message.channelId === channelId) return;

    const embed = new EmbedBuilder()
      .setColor(0xfee75c) // Yellow
      .setTitle('🗑️ Message Deleted')
      .addFields(
        { name: '👤 Author',  value: message.author?.toString() ?? 'Unknown', inline: true },
        { name: '📢 Channel', value: message.channel?.toString() ?? 'Unknown', inline: true },
        { name: '📝 Content', value: message.content?.slice(0, 1024) || '*No text content*' }
      )
      .setFooter({ text: `User ID: ${message.author?.id ?? '?'}` })
      .setTimestamp();

    await logChannel.send({ embeds: [embed] }).catch(console.error);
  },
};
