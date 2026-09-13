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

    const { resolveEmojis } = require('../modules/emojiResolver');
    const { extractMediaFromText, buildMediaPayload } = require('../modules/mediaHelper');
    const { getWelcomeImageUrl } = require('../modules/settings');

    const customMessage = await getWelcomeMessage(guild.id);
    let rawDescription = customMessage 
      ? customMessage
          .replace(/{user}/g, `${member}`)
          .replace(/{username}/g, member.user.username)
          .replace(/{server}/g, guild.name)
          .replace(/{membercount}/gi, `${memberCount}`)
          .replace(/{count}/gi, `${memberCount}`)
      : `Hey ${member}, glad you joined us!\n\n📋 Please read the rules before chatting.\n🎭 Head over to the roles channel to grab your roles.`;

    // Extract {image: URL} or {gif: URL} or {video: URL} if present inside the message text
    const { cleanText, mediaUrl: extractedMediaUrl } = extractMediaFromText(rawDescription);
    const configuredImageUrl = await getWelcomeImageUrl(guild.id);
    const mediaUrl = configuredImageUrl || extractedMediaUrl;

    const description = resolveEmojis(cleanText, guild, member.client);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2) // Discord Blurple
      .setTitle(`👋 Welcome to ${guild.name}!`)
      .setDescription(description)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setFooter({ text: `${guild.name} • Member joined`, iconURL: guild.iconURL() })
      .setTimestamp();

    const payload = buildMediaPayload(embed, mediaUrl, guild.bannerURL({ size: 1024 }));

    await channel.send(payload).catch((err) =>
      console.error('[guildMemberAdd] Failed to send welcome message:', err)
    );
  },
};
