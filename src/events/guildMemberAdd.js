// src/events/guildMemberAdd.js
// ─────────────────────────────────────────────────────────────────────────────
// Fires when a new member joins the server.
//   1. Assigns the default member role (set via /setup member-role).
//   2. Sends a rich embed welcome message to the welcome channel.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { EmbedBuilder } = require('discord.js');
const { getWelcomeChannelId, getDefaultMemberRoleId } = require('../modules/settings');

module.exports = {
  name: 'guildMemberAdd',

  /**
   * @param {import('discord.js').GuildMember} member
   */
  async execute(member) {
    const { guild } = member;

    // ── 1. Assign default member role ────────────────────────────────────────
    const roleId = await getDefaultMemberRoleId(guild.id);
    if (roleId) {
      const role = guild.roles.cache.get(roleId);
      if (role) {
        await member.roles.add(role).catch((err) =>
          console.error('[guildMemberAdd] Could not assign default role:', err)
        );
      } else {
        console.warn(`[guildMemberAdd] Role ${roleId} not found in cache.`);
      }
    }

    // ── 2. Send welcome embed ─────────────────────────────────────────────────
    const channelId = await getWelcomeChannelId(guild.id);
    if (!channelId) return;

    const channel = guild.channels.cache.get(channelId);
    if (!channel) return;

    const memberCount = guild.memberCount;

    const embed = new EmbedBuilder()
      .setColor(0x5865f2) // Discord Blurple
      .setTitle(`👋 Welcome to ${guild.name}!`)
      .setDescription(
        `Hey ${member}, glad you joined us!\n\n` +
        `📋 Please read the rules before chatting.\n` +
        `🎭 Head over to the roles channel to grab your roles.`
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: '👤 User', value: `${member.user.tag}`, inline: true },
        { name: '🆔 ID',   value: member.id,            inline: true },
        { name: '👥 Members', value: `You are member #${memberCount}!`, inline: true }
      )
      .setImage(guild.bannerURL({ size: 1024 }) ?? null)
      .setFooter({ text: `${guild.name} • Member joined`, iconURL: guild.iconURL() })
      .setTimestamp();

    await channel.send({ embeds: [embed] }).catch((err) =>
      console.error('[guildMemberAdd] Failed to send welcome message:', err)
    );
  },
};
