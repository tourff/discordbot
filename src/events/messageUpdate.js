// src/events/messageUpdate.js
// ─────────────────────────────────────────────────────────────────────────────
// Logs edited messages (before → after) to #server-logs.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'messageUpdate',

  /**
   * @param {import('discord.js').Message | import('discord.js').PartialMessage} oldMessage
   * @param {import('discord.js').Message | import('discord.js').PartialMessage} newMessage
   */
  async execute(oldMessage, newMessage) {
    if (!newMessage.guild || newMessage.author?.bot) return;

    // Skip embed-only changes (link previews being added)
    if (oldMessage.content === newMessage.content) return;

    const channelId = process.env.SERVER_LOGS_CHANNEL_ID;
    if (!channelId) return;

    const logChannel = newMessage.guild.channels.cache.get(channelId);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(0xeb459e) // Pink
      .setTitle('✏️ Message Edited')
      .setURL(newMessage.url)
      .addFields(
        { name: '👤 Author',  value: newMessage.author?.toString() ?? 'Unknown', inline: true },
        { name: '📢 Channel', value: newMessage.channel?.toString() ?? 'Unknown', inline: true },
        { name: '📝 Before',  value: oldMessage.content?.slice(0, 1024) || '*Unknown*' },
        { name: '📝 After',   value: newMessage.content?.slice(0, 1024) || '*Empty*'  }
      )
      .setFooter({ text: `User ID: ${newMessage.author?.id ?? '?'}` })
      .setTimestamp();

    await logChannel.send({ embeds: [embed] }).catch(console.error);
  },
};
