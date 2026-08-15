// src/modules/birthdayManager.js
// ─────────────────────────────────────────────────────────────────────────────
// Birthday Celebrations Module
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { EmbedBuilder } = require('discord.js');
const { supabase } = require('../config/supabase');
const { getSetting } = require('./autoMod');

/**
 * Check and announce today's birthdays for all guilds
 * @param {import('discord.js').Client} client
 */
async function checkTodaysBirthdays(client) {
  try {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1; // 1-12

    const { data: birthdays } = await supabase
      .from('user_birthdays')
      .select('*')
      .eq('birth_day', currentDay)
      .eq('birth_month', currentMonth);

    if (!birthdays || birthdays.length === 0) return;

    for (const b of birthdays) {
      const guild = client.guilds.cache.get(b.guild_id);
      if (!guild) continue;

      const channelId = await getSetting(guild.id, 'BIRTHDAY_CHANNEL_ID');
      const channel = guild.channels.cache.get(channelId);
      if (!channel) continue;

      const member = await guild.members.fetch(b.user_id).catch(() => null);
      if (!member) continue;

      const embed = new EmbedBuilder()
        .setColor(0xf472b6)
        .setTitle('🎂 Happy Birthday!')
        .setDescription(`🎉 Today is <@${b.user_id}>'s special day! Let's wish them an amazing birthday filled with joy and happiness! 🥳🎈`)
        .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
        .setFooter({ text: 'Jarvis Celebrations • Made by trj7' })
        .setTimestamp();

      await channel.send({ content: `🎂 <@${b.user_id}>`, embeds: [embed] }).catch(console.error);

      // Optional temporary birthday role
      const bdayRoleId = await getSetting(guild.id, 'BIRTHDAY_ROLE_ID');
      if (bdayRoleId && guild.roles.cache.has(bdayRoleId)) {
        await member.roles.add(bdayRoleId).catch(console.error);
      }
    }
  } catch (err) {
    console.error('[Birthday Check] Error:', err);
  }
}

module.exports = {
  checkTodaysBirthdays
};
