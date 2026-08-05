// src/events/guildMemberRemove.js
// ─────────────────────────────────────────────────────────────────────────────
// Fires when a member leaves (or is kicked/banned).
// Logs the departure to the #server-logs channel.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'guildMemberRemove',

  /**
   * @param {import('discord.js').GuildMember | import('discord.js').PartialGuildMember} member
   */
  async execute(member) {
    const channelId = process.env.SERVER_LOGS_CHANNEL_ID;
    if (!channelId) return;

    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    const roles = member.roles?.cache
      .filter(r => r.id !== member.guild.id) // exclude @everyone
      .map(r => r.toString())
      .join(', ') || 'None';

    const embed = new EmbedBuilder()
      .setColor(0xed4245) // Red
      .setTitle('👋 Member Left')
      .setThumbnail(member.user?.displayAvatarURL({ dynamic: true }) ?? null)
      .addFields(
        { name: '👤 User',  value: member.user?.tag ?? 'Unknown',  inline: true },
        { name: '🆔 ID',    value: member.id,                       inline: true },
        { name: '📅 Joined', value: member.joinedAt
            ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>`
            : 'Unknown',                                              inline: true },
        { name: '🎭 Roles', value: roles.slice(0, 1024) }
      )
      .setFooter({ text: 'Server Logs' })
      .setTimestamp();

    await channel.send({ embeds: [embed] }).catch(console.error);
  },
};
