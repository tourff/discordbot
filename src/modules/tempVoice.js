// src/modules/tempVoice.js
// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Temporary Voice Channels ("Join to Create")
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { supabase } = require('../config/supabase');
const { getSetting } = require('./autoMod');

/**
 * Handle member joining/leaving voice channels
 * @param {import('discord.js').VoiceState} oldState
 * @param {import('discord.js').VoiceState} newState
 */
async function handleTempVoice(oldState, newState) {
  const guild = newState.guild || oldState.guild;
  if (!guild) return;

  const hubChannelId = await getSetting(guild.id, 'TEMP_VOICE_HUB_CHANNEL_ID');
  if (!hubChannelId) return;

  // 1. User joined the "Join to Create" Hub Channel
  if (newState.channelId === hubChannelId) {
    const member = newState.member;
    if (!member) return;

    try {
      const hubChannel = guild.channels.cache.get(hubChannelId);
      const parentCategory = hubChannel?.parentId;

      const roomName = `🔊 ${member.displayName}'s Lounge`;
      const tempChannel = await guild.channels.create({
        name: roomName,
        type: ChannelType.GuildVoice,
        parent: parentCategory || null,
        permissionOverwrites: [
          {
            id: member.id,
            allow: [
              PermissionFlagsBits.ManageChannels,
              PermissionFlagsBits.MuteMembers,
              PermissionFlagsBits.DeafenMembers,
              PermissionFlagsBits.MoveMembers,
            ],
          },
        ],
      });

      // Track in database
      await supabase.from('temp_voice_channels').insert([{
        channel_id: tempChannel.id,
        guild_id: guild.id,
        owner_id: member.id,
      }]);

      // Move member into new channel
      await member.voice.setChannel(tempChannel).catch(console.error);

    } catch (err) {
      console.error('[Temp Voice Create] Error:', err);
    }
  }

  // 2. User left a channel -> check if it's an empty temp voice channel
  if (oldState.channelId && oldState.channelId !== hubChannelId) {
    const oldChannel = oldState.channel;
    if (oldChannel && oldChannel.type === ChannelType.GuildVoice && oldChannel.members.size === 0) {
      const { data: tempRoom } = await supabase
        .from('temp_voice_channels')
        .select('*')
        .eq('channel_id', oldChannel.id)
        .single();

      if (tempRoom) {
        await supabase.from('temp_voice_channels').delete().eq('channel_id', oldChannel.id);
        await oldChannel.delete('[Jarvis Temp Voice] Room empty').catch(console.error);
      }
    }
  }
}

module.exports = {
  handleTempVoice
};
