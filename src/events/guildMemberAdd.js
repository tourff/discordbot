// src/events/guildMemberAdd.js
// ─────────────────────────────────────────────────────────────────────────────
// Fires when a new member joins the server.
//   1. Assigns the default member role (set via /setup member-role).
//   2. Sends a rich embed welcome message to the welcome channel.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { EmbedBuilder } = require('discord.js');
const { getWelcomeChannelId, getWelcomeMessage, getDefaultMemberRoleId, getSetting } = require('../modules/settings');

module.exports = {
  name: 'guildMemberAdd',

  /**
   * @param {import('discord.js').GuildMember} member
   */
  async execute(member) {
    const { guild } = member;

    // ── 1. Assign default and specific autoroles ──────────────────────────────
    const rolesToAdd = [];

    // Check specific autoroles for bots/humans
    if (member.user.bot) {
      const botRoleId = await getSetting(guild.id, 'AUTOROLE_BOTS_ROLE_ID');
      if (botRoleId) rolesToAdd.push(botRoleId);
    } else {
      const humanRoleId = await getSetting(guild.id, 'AUTOROLE_HUMANS_ROLE_ID');
      if (humanRoleId) rolesToAdd.push(humanRoleId);
      
      // Fallback/Legacy default role
      const defaultRoleId = await getDefaultMemberRoleId(guild.id);
      if (defaultRoleId) rolesToAdd.push(defaultRoleId);
    }

    for (const rId of rolesToAdd) {
      const role = guild.roles.cache.get(rId);
      if (role) {
        await member.roles.add(role).catch((err) =>
          console.error(`[guildMemberAdd] Could not assign role ${rId}:`, err)
        );
      } else {
        console.warn(`[guildMemberAdd] Role ${rId} not found in cache.`);
      }
    }

    // ── 2. Send welcome embed ─────────────────────────────────────────────────
    const channelId = await getWelcomeChannelId(guild.id);
    if (!channelId) return;

    const channel = guild.channels.cache.get(channelId);
    if (!channel) return;

    const memberCount = guild.memberCount;

    const customMessage = await getWelcomeMessage(guild.id);
    const description = customMessage 
      ? customMessage.replace(/{user}/g, `${member}`).replace(/{server}/g, guild.name)
      : `Hey ${member}, glad you joined us!\n\n📋 Please read the rules before chatting.\n🎭 Head over to the roles channel to grab your roles.`;

    const embed = new EmbedBuilder()
      .setColor(0x5865f2) // Discord Blurple
      .setTitle(`👋 Welcome to ${guild.name}!`)
      .setDescription(description)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setImage(guild.bannerURL({ size: 1024 }) ?? null)
      .setFooter({ text: `${guild.name} • Member joined`, iconURL: guild.iconURL() })
      .setTimestamp();

    await channel.send({ embeds: [embed] }).catch((err) =>
      console.error('[guildMemberAdd] Failed to send welcome message:', err)
    );
  },
};
