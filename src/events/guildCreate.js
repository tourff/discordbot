// src/events/guildCreate.js
// ─────────────────────────────────────────────────────────────────────────────
// Fires whenever the bot joins a new Discord server (guild).
//   1. Automatically identifies who invited the bot via Audit Logs (Bot Adder).
//   2. Stores the Bot Adder ID and Server Owner ID in Supabase.
//   3. Sets the default access mode for the guild.
//   4. Sends a setup / control guide to the server or bot adder.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { EmbedBuilder, AuditLogEvent, PermissionFlagsBits, ChannelType } = require('discord.js');
const { setSetting } = require('../modules/settings');

module.exports = {
  name: 'guildCreate',

  /**
   * @param {import('discord.js').Guild} guild
   */
  async execute(guild) {
    console.log(`[guildCreate] Bot joined a new server: "${guild.name}" (ID: ${guild.id}) with ${guild.memberCount} members.`);

    const client = guild.client;
    let adderId = guild.ownerId; // Fallback to Server Owner
    let adderUser = null;

    // ── 1. Fetch Audit Log to identify who invited the bot ────────────────────
    try {
      if (guild.members.me?.permissions.has(PermissionFlagsBits.ViewAuditLog)) {
        const auditLogs = await guild.fetchAuditLogs({
          limit: 1,
          type: AuditLogEvent.BotAdd,
        });
        const botAddLog = auditLogs.entries.first();
        if (botAddLog && botAddLog.target?.id === client.user.id && botAddLog.executor) {
          adderId = botAddLog.executor.id;
          adderUser = botAddLog.executor;
          console.log(`[guildCreate] Bot was added to "${guild.name}" by: ${adderUser.tag} (${adderId})`);
        }
      }
    } catch (auditErr) {
      console.warn(`[guildCreate] Could not inspect audit logs for ${guild.id}:`, auditErr.message);
    }

    // ── 2. Store Bot Adder & Default Access Mode in DB ─────────────────────────
    await setSetting(guild.id, 'BOT_ADDER_ID', adderId);
    await setSetting(guild.id, 'BOT_ACCESS_MODE', 'public'); // Default: public for member cmds, admin for setup

    // ── 3. Send greeting & control guide ──────────────────────────────────────
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('👋 Thanks for adding me!')
      .setDescription(
        `Thank you for inviting **${client.user.username}** to **${guild.name}**!\n\n` +
        `🛡️ **Bot Management & Permissions:**\n` +
        `• **Server Owner & Bot Adder:** By default, you have complete administrative access over the bot.\n` +
        `• **Access Control:** You can decide whether everyone can use the bot, or restrict it so **only you / admins** can use it.\n` +
        `• Run </botcontrol status:0> to view current settings.\n` +
        `• Run </botcontrol mode:0> to toggle between \`public\` and \`restricted\` mode.\n` +
        `• Run </setup view:0> to configure welcome channels, logs, and roles.`
      )
      .addFields(
        { name: '👑 Server Owner', value: `<@${guild.ownerId}>`, inline: true },
        { name: '🤖 Added By', value: `<@${adderId}>`, inline: true },
        { name: '⚙️ Default Mode', value: '`public` (Use `/botcontrol mode restricted` to limit)', inline: false }
      )
      .setTimestamp();

    // Try to send to systemChannel or first writable text channel
    try {
      let targetChannel = guild.systemChannel;
      if (!targetChannel || !targetChannel.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.SendMessages)) {
        targetChannel = guild.channels.cache.find(
          c => c.type === ChannelType.GuildText && c.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.SendMessages)
        );
      }
      if (targetChannel) {
        await targetChannel.send({ embeds: [embed] }).catch(() => null);
      }
    } catch (e) {
      // Non-fatal if channel send fails
    }
  },
};
