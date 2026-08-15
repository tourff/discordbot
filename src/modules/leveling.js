// src/modules/leveling.js
// ─────────────────────────────────────────────────────────────────────────────
// XP & Leveling Engine
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { supabase } = require('../config/supabase');
const { getSetting } = require('./autoMod');
const { EmbedBuilder } = require('discord.js');

// Cooldown map: `${guildId}-${userId}` -> timestamp
const xpCooldowns = new Map();

/**
 * Formula: XP needed for next level = 5 * (lvl ^ 2) + 50 * lvl + 100
 */
function getRequiredXP(level) {
  return 5 * (level * level) + 50 * level + 100;
}

/**
 * Award XP to a member on message
 * @param {import('discord.js').Message} message
 */
async function handleMessageXP(message) {
  if (!message.guild || message.author.bot) return;

  const key = `${message.guild.id}-${message.author.id}`;
  const now = Date.now();

  // 60-second cooldown per XP gain
  if (xpCooldowns.has(key) && now - xpCooldowns.get(key) < 60000) {
    return;
  }
  xpCooldowns.set(key, now);

  const levelingEnabled = await getSetting(message.guild.id, 'LEVELING_ENABLED');
  if (levelingEnabled === 'false') return;

  // Random XP between 15 and 25
  const xpEarned = Math.floor(Math.random() * 11) + 15;

  try {
    const { data: userLevel, error } = await supabase
      .from('user_levels')
      .select('*')
      .eq('guild_id', message.guild.id)
      .eq('user_id', message.author.id)
      .single();

    let curXP = 0;
    let curLevel = 1;
    let msgCount = 0;

    if (!error && userLevel) {
      curXP = Number(userLevel.xp) + xpEarned;
      curLevel = Number(userLevel.level);
      msgCount = Number(userLevel.message_count) + 1;
    } else {
      curXP = xpEarned;
      curLevel = 1;
      msgCount = 1;
    }

    // Check level up
    let reqXP = getRequiredXP(curLevel);
    let leveledUp = false;

    while (curXP >= reqXP) {
      curXP -= reqXP;
      curLevel += 1;
      reqXP = getRequiredXP(curLevel);
      leveledUp = true;
    }

    await supabase.from('user_levels').upsert({
      guild_id: message.guild.id,
      user_id: message.author.id,
      xp: curXP,
      level: curLevel,
      message_count: msgCount,
      last_xp_at: new Date().toISOString()
    }, { onConflict: 'guild_id,user_id' });

    if (leveledUp) {
      const channelId = await getSetting(message.guild.id, 'LEVEL_UP_CHANNEL_ID') || message.channel.id;
      const targetChannel = message.guild.channels.cache.get(channelId) || message.channel;

      const embed = new EmbedBuilder()
        .setColor(0x818cf8)
        .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
        .setTitle('🎉 Level Up!')
        .setDescription(`Congratulations <@${message.author.id}>, you reached **Level ${curLevel}**! 🚀`)
        .setFooter({ text: 'Jarvis Leveling • Made by trj7' });

      targetChannel.send({ embeds: [embed] }).catch(console.error);

      // Check role rewards
      const { data: rewards } = await supabase
        .from('level_rewards')
        .select('*')
        .eq('guild_id', message.guild.id)
        .lte('level', curLevel);

      if (rewards && rewards.length > 0) {
        for (const r of rewards) {
          if (!message.member.roles.cache.has(r.role_id)) {
            await message.member.roles.add(r.role_id).catch(() => null);
          }
        }
      }
    }
  } catch (err) {
    console.error('[Leveling] Error:', err);
  }
}

module.exports = {
  handleMessageXP,
  getRequiredXP
};
