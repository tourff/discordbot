// src/modules/tourneyManager.js
'use strict';

const supabase = require('../config/supabase');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

async function handleTourneyRegistration(message) {
  // 1. Check if channel is a tourney registration channel
  const { data: tourney } = await supabase
    .from('tourneys')
    .select('*')
    .eq('registration_channel_id', message.channel.id)
    .eq('enabled', true)
    .single();

  if (!tourney || !tourney.is_open) return false;

  // 2. Validate mentions
  const userMentions = message.mentions.users.filter(u => !u.bot).size;
  if (userMentions < (tourney.required_mentions || 4)) {
    if (tourney.autodelete_rejects) await message.delete().catch(() => null);
    const warning = await message.channel.send(`⚠️ ${message.author}, you must mention at least **${tourney.required_mentions}** teammates.`).catch(() => null);
    if (warning) setTimeout(() => warning.delete().catch(() => null), 5000);
    return true; 
  }

  // 3. Extract team name
  let teamName = 'Unknown Team';
  const match = message.content.match(/team\s*name[:\s-]*([^\n]*)/i) || message.content.match(/team[:\s-]*([^\n]*)/i);
  if (match && match[1]) {
    teamName = match[1].trim().substring(0, 50);
  } else {
    const firstLine = message.content.split('\n')[0].trim();
    if (firstLine.length > 2 && firstLine.length < 30) teamName = firstLine;
  }

  // 4. Duplicate checks
  if (tourney.no_duplicate_name) {
    const { data: dupName } = await supabase.from('tourney_slots').select('id').eq('tourney_id', tourney.id).ilike('team_name', teamName).single();
    if (dupName) {
      const w = await message.channel.send(`❌ ${message.author}, team name **${teamName}** is already registered.`).catch(() => null);
      if (w) setTimeout(() => w.delete().catch(() => null), 5000);
      return true;
    }
  }

  if (!tourney.multiregister) {
    const { data: dupUser } = await supabase.from('tourney_slots').select('id').eq('tourney_id', tourney.id).eq('user_id', message.author.id).single();
    if (dupUser) {
      const w = await message.channel.send(`❌ ${message.author}, you are already registered for this tourney.`).catch(() => null);
      if (w) setTimeout(() => w.delete().catch(() => null), 5000);
      return true;
    }
  }

  // 5. Submit for confirmation instead of immediate slot
  const members = message.mentions.users.filter(u => !u.bot).map(u => u.id);
  members.push(message.author.id);
  const uniqueMembers = [...new Set(members)];

  const { data: slotData, error } = await supabase.from('tourney_slots').insert({
    tourney_id: tourney.id,
    user_id: message.author.id,
    team_name: teamName,
    members: uniqueMembers,
    jump_url: message.url,
    status: 'pending'
  }).select().single();

  if (error) {
    console.error('[tourney] error saving reg:', error);
    return true;
  }

  // Delete message, post pending embed in reg channel or confirm channel
  await message.delete().catch(() => null);
  
  if (tourney.confirm_channel_id) {
    const confirmChannel = message.guild.channels.cache.get(tourney.confirm_channel_id);
    if (confirmChannel) {
      const embed = new EmbedBuilder()
        .setColor(0xFFA500)
        .setTitle('⏳ Pending Registration')
        .addFields(
          { name: 'Team', value: teamName, inline: true },
          { name: 'Leader', value: `<@${message.author.id}>`, inline: true },
          { name: 'Content', value: message.content }
        )
        .setFooter({ text: `Slot ID: ${slotData.id}` });
      
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`tourney_approve_${slotData.id}`).setLabel('Approve').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`tourney_deny_${slotData.id}`).setLabel('Deny').setStyle(ButtonStyle.Danger)
      );

      await confirmChannel.send({ embeds: [embed], components: [row] });
    }
  }

  // Ping user that their reg is pending
  const w = await message.channel.send(`⏳ ${message.author}, your registration for **${teamName}** is pending approval.`).catch(() => null);
  if (w) setTimeout(() => w.delete().catch(() => null), 10000);

  return true;
}

module.exports = {
  handleTourneyRegistration
};
