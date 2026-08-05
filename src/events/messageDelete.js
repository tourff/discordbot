// src/events/messageDelete.js
// ─────────────────────────────────────────────────────────────────────────────
// Logs deleted messages to #server-logs.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'messageDelete',

  /**
   * @param {import('discord.js').Message | import('discord.js').PartialMessage} message
   */
  async execute(message) {
    // Skip partial messages with no content and bot messages
    if (!message.guild || message.author?.bot) return;

    const channelId = process.env.SERVER_LOGS_CHANNEL_ID;
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
