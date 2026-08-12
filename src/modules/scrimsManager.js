// src/modules/scrimsManager.js
'use strict';

const supabase = require('../config/supabase');

/**
 * Handles core scrim registration logic.
 * This runs when a user posts a message in a scrim registration channel.
 */
async function handleScrimRegistration(message) {
  // 1. Check if channel is a scrim registration channel
  const { data: scrim } = await supabase
    .from('scrims')
    .select('*')
    .eq('registration_channel_id', message.channel.id)
    .eq('enabled', true)
    .single();

  if (!scrim || !scrim.is_open) return false;

  // 2. Validate mentions
  const userMentions = message.mentions.users.filter(u => !u.bot).size;
  if (userMentions < (scrim.required_mentions || 4)) {
    if (scrim.autodelete_rejects) {
      await message.delete().catch(() => null);
    }
    const warning = await message.channel.send(`⚠️ ${message.author}, you must mention at least **${scrim.required_mentions}** teammates.`).catch(() => null);
    if (warning) setTimeout(() => warning.delete().catch(() => null), 5000);
    return true; // We handled it
  }

  // 3. Extract team name (basic heuristic: look for "team", or first line)
  let teamName = 'Unknown Team';
  const match = message.content.match(/team\s*name[:\s-]*([^\n]*)/i) || message.content.match(/team[:\s-]*([^\n]*)/i);
  if (match && match[1]) {
    teamName = match[1].trim().substring(0, 50);
  } else {
    // Fallback to first line
    const firstLine = message.content.split('\n')[0].trim();
    if (firstLine.length > 2 && firstLine.length < 30) {
      teamName = firstLine;
    }
  }

  // 4. Duplicate checks
  if (scrim.no_duplicate_name) {
    const { data: dupName } = await supabase
      .from('scrim_slots')
      .select('id')
      .eq('scrim_id', scrim.id)
      .ilike('team_name', teamName)
      .single();
    if (dupName) {
      const w = await message.channel.send(`❌ ${message.author}, team name **${teamName}** is already registered.`).catch(() => null);
      if (w) setTimeout(() => w.delete().catch(() => null), 5000);
      return true;
    }
  }

  // Check multi-register
  if (!scrim.multiregister) {
    const { data: dupUser } = await supabase
      .from('scrim_slots')
      .select('id')
      .eq('scrim_id', scrim.id)
      .eq('user_id', message.author.id)
      .single();
    if (dupUser) {
      const w = await message.channel.send(`❌ ${message.author}, you are already registered for this scrim.`).catch(() => null);
      if (w) setTimeout(() => w.delete().catch(() => null), 5000);
      return true;
    }
  }

  // 5. Get available slot
  // Fetch current slots to find max assigned slot
  const { data: slots } = await supabase
    .from('scrim_slots')
    .select('slot_num')
    .eq('scrim_id', scrim.id);
  
  const assignedNums = slots ? slots.map(s => s.slot_num) : [];
  let nextSlot = -1;
  for (let i = 1; i <= scrim.total_slots; i++) {
    if (!assignedNums.includes(i)) {
      nextSlot = i;
      break;
    }
  }

  if (nextSlot === -1) {
    // Scrim is full! Auto-close it.
    await closeScrim(scrim, message.client);
    return true; // Stop processing, no slots left
  }

  // 6. Assign slot
  const members = message.mentions.users.filter(u => !u.bot).map(u => u.id);
  members.push(message.author.id);
  const uniqueMembers = [...new Set(members)];

  await supabase.from('scrim_slots').insert({
    scrim_id: scrim.id,
    slot_num: nextSlot,
    user_id: message.author.id,
    team_name: teamName,
    members: uniqueMembers,
    jump_url: message.url
  });

  // Add ✅ reaction
  await message.react('✅').catch(() => null);

  // Give success role
  if (scrim.role_id) {
    const role = message.guild.roles.cache.get(scrim.role_id);
    if (role && message.member.manageable) {
      await message.member.roles.add(role, 'Scrim Registration Success').catch(() => null);
    }
  }

  // Check if it was the last slot
  if (assignedNums.length + 1 >= scrim.total_slots) {
    await closeScrim(scrim, message.client);
  }

  return true;
}

/**
 * Closes a scrim registration and posts the slotlist.
 */
async function closeScrim(scrim, client) {
  // Update DB to closed
  await supabase.from('scrims').update({ is_open: false }).eq('id', scrim.id);

  try {
    const guild = await client.guilds.fetch(scrim.guild_id);
    const regChannel = guild.channels.cache.get(scrim.registration_channel_id);
    
    if (regChannel) {
      await regChannel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false });
      await regChannel.send('🔒 **Registration is now closed!** Slots are full.').catch(() => null);
    }

    // Generate and post slotlist
    if (scrim.slotlist_channel_id) {
      const slotChannel = guild.channels.cache.get(scrim.slotlist_channel_id);
      if (slotChannel) {
        const { data: slots } = await supabase
          .from('scrim_slots')
          .select('*')
          .eq('scrim_id', scrim.id)
          .order('slot_num', { ascending: true });
        
        let listStr = `📜 **Slotlist for ${scrim.name || 'Scrim'}**\n\n`;
        for (let i = 1; i <= scrim.total_slots; i++) {
          const slot = slots?.find(s => s.slot_num === i);
          if (slot) {
            listStr += `\`Slot ${i}\` — **${slot.team_name}** (<@${slot.user_id}>)\n`;
          } else {
            listStr += `\`Slot ${i}\` — *Available*\n`;
          }
        }

        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
          .setColor(0x00ff88)
          .setTitle(`🏆 ${scrim.name || 'Scrim'} Slotlist`)
          .setDescription(listStr)
          .setTimestamp();
        
        const content = scrim.ping_role_id ? `<@&${scrim.ping_role_id}>` : undefined;
        await slotChannel.send({ content, embeds: [embed] });
      }
    }
  } catch (err) {
    console.error('[closeScrim] Error:', err);
  }
}

module.exports = {
  handleScrimRegistration,
  closeScrim
};
