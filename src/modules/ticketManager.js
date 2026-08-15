// src/modules/ticketManager.js
// ─────────────────────────────────────────────────────────────────────────────
// Interactive Button Ticket System
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const { supabase } = require('../config/supabase');
const { getSetting } = require('./autoMod');

/**
 * Handle user clicking "[📩 Open Ticket]"
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function handleTicketCreate(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const guild = interaction.guild;
  const user = interaction.user;

  // Check if user already has an open ticket
  const { data: existing } = await supabase
    .from('tickets')
    .select('*')
    .eq('guild_id', guild.id)
    .eq('user_id', user.id)
    .eq('status', 'open')
    .single();

  if (existing && guild.channels.cache.has(existing.channel_id)) {
    return interaction.editReply({
      content: `⚠️ You already have an open ticket in <#${existing.channel_id}>.`
    });
  }

  const categoryId = await getSetting(guild.id, 'TICKET_CATEGORY_ID');
  const staffRoleId = await getSetting(guild.id, 'TICKET_STAFF_ROLE_ID');

  const permissionOverwrites = [
    {
      id: guild.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
      ],
    },
    {
      id: guild.members.me.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    },
  ];

  if (staffRoleId && guild.roles.cache.has(staffRoleId)) {
    permissionOverwrites.push({
      id: staffRoleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    });
  }

  try {
    const channelName = `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: categoryId && guild.channels.cache.has(categoryId) ? categoryId : null,
      permissionOverwrites,
    });

    await supabase.from('tickets').insert([{
      guild_id: guild.id,
      channel_id: channel.id,
      user_id: user.id,
      status: 'open'
    }]);

    const welcomeMsg = await getSetting(guild.id, 'TICKET_WELCOME_MESSAGE') || 'Thank you for reaching out. Please describe your inquiry or issue below and our staff team will assist you shortly.';

    const embed = new EmbedBuilder()
      .setColor(0x6366f1)
      .setTitle(`🎫 Support Ticket #${channel.name}`)
      .setDescription(`Welcome <@${user.id}>!\n\n${welcomeMsg}`)
      .addFields(
        { name: '👤 Member', value: `<@${user.id}> (${user.id})`, inline: true },
        { name: '⏰ Created At', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
      )
      .setFooter({ text: 'Jarvis Ticket System • Made by trj7' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_close')
        .setLabel('Close Ticket')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('ticket_transcript')
        .setLabel('Save Transcript')
        .setEmoji('📄')
        .setStyle(ButtonStyle.Secondary)
    );

    await channel.send({ content: staffRoleId ? `<@&${staffRoleId}> <@${user.id}>` : `<@${user.id}>`, embeds: [embed], components: [row] });

    await interaction.editReply({ content: `✅ Ticket created successfully! Head over to <#${channel.id}>.` });
  } catch (err) {
    console.error('[Ticket Create] Error:', err);
    await interaction.editReply({ content: '❌ Failed to create support ticket channel.' });
  }
}

/**
 * Handle Ticket Close button
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function handleTicketClose(interaction) {
  await interaction.deferReply();

  const channel = interaction.channel;
  await supabase
    .from('tickets')
    .update({ status: 'closed', closed_at: new Date().toISOString() })
    .eq('channel_id', channel.id);

  const embed = new EmbedBuilder()
    .setColor(0xf43f5e)
    .setTitle('🔒 Ticket Closed')
    .setDescription(`This ticket was closed by <@${interaction.user.id}>.\nThis channel will be archived or deleted shortly.`)
    .setFooter({ text: 'Jarvis Ticket System' });

  const deleteRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_delete')
      .setLabel('Delete Channel')
      .setEmoji('🗑️')
      .setStyle(ButtonStyle.Danger)
  );

  await interaction.editReply({ embeds: [embed], components: [deleteRow] });
}

/**
 * Handle Ticket Delete button
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function handleTicketDelete(interaction) {
  await interaction.reply({ content: '🗑️ Deleting ticket channel in 5 seconds...' });
  setTimeout(async () => {
    await interaction.channel.delete().catch(console.error);
  }, 5000);
}

module.exports = {
  handleTicketCreate,
  handleTicketClose,
  handleTicketDelete
};
