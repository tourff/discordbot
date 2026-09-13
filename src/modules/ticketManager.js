// src/modules/ticketManager.js
// ─────────────────────────────────────────────────────────────────────────────
// Full-featured Ticket System
//   • Multiple ticket types (General Support, Bug Report, Partnership, Other)
//   • Category selection via Select Menu
//   • Staff claim/unclaim
//   • Close → Reopen → Delete flow
//   • Auto transcript (saved to transcript channel if configured)
//   • Duplicate open-ticket prevention
//   • Supabase persistence
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require('discord.js');
const { supabase } = require('../config/supabase');
const { getSetting } = require('./autoMod');

// ─── Ticket Types ────────────────────────────────────────────────────────────
const TICKET_TYPES = [
  { value: 'support',     label: '🛠️ General Support',    description: 'Need help with something?',          emoji: '🛠️' },
  { value: 'report',      label: '🚨 Report a User',       description: 'Report rule-breaking behaviour.',    emoji: '🚨' },
  { value: 'partnership', label: '🤝 Partnership',         description: 'Collaboration or partnership offer.', emoji: '🤝' },
  { value: 'other',       label: '📌 Other',               description: 'Something else entirely.',           emoji: '📌' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Get the DB row for a ticket channel, or null if not found.
 * @param {string} channelId
 */
async function getTicketRow(channelId) {
  const { data } = await supabase
    .from('tickets')
    .select('*')
    .eq('channel_id', channelId)
    .single();
  return data || null;
}

/**
 * Build the in-channel control button row shown to staff + owner.
 * @param {boolean} isClosed Whether the ticket is currently closed.
 * @param {boolean} isClaimed Whether a staff member has claimed it.
 * @param {string|null} claimedById Discord user ID of the claimer (if any).
 */
function buildControlRow(isClosed = false, isClaimed = false) {
  const row = new ActionRowBuilder();

  if (!isClosed) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_close')
        .setLabel('Close')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('ticket_claim')
        .setLabel(isClaimed ? 'Unclaim' : 'Claim')
        .setEmoji(isClaimed ? '❌' : '✋')
        .setStyle(isClaimed ? ButtonStyle.Secondary : ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('ticket_transcript')
        .setLabel('Transcript')
        .setEmoji('📄')
        .setStyle(ButtonStyle.Secondary),
    );
  } else {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_reopen')
        .setLabel('Reopen')
        .setEmoji('🔓')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('ticket_transcript')
        .setLabel('Transcript')
        .setEmoji('📄')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('ticket_delete')
        .setLabel('Delete')
        .setEmoji('🗑️')
        .setStyle(ButtonStyle.Danger),
    );
  }

  return row;
}

// ─── Step 1 — Show the ticket-type select menu ───────────────────────────────
/**
 * Called when user clicks the "Open Ticket" button on the panel.
 * Shows a category select menu.
 */
async function handleTicketCreate(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const guild = interaction.guild;
  const user  = interaction.user;

  // Duplicate check
  const { data: existing } = await supabase
    .from('tickets')
    .select('*')
    .eq('guild_id', guild.id)
    .eq('user_id', user.id)
    .eq('status', 'open')
    .single();

  if (existing && guild.channels.cache.has(existing.channel_id)) {
    return interaction.editReply({
      content: `⚠️ You already have an open ticket in <#${existing.channel_id}>. Please resolve it before opening a new one.`,
    });
  }

  // Show category selector
  const select = new StringSelectMenuBuilder()
    .setCustomId('ticket_type_select')
    .setPlaceholder('Choose a ticket category…')
    .addOptions(TICKET_TYPES.map(t => ({
      label:       t.label,
      value:       t.value,
      description: t.description,
      emoji:       t.emoji,
    })));

  const row = new ActionRowBuilder().addComponents(select);

  await interaction.editReply({
    content: '**📩 Open a Ticket**\nPlease select the category that best describes your request:',
    components: [row],
  });
}

// ─── Step 2 — Create the private ticket channel ──────────────────────────────
/**
 * Called when user selects a ticket type from the select menu.
 */
async function handleTicketTypeSelect(interaction) {
  await interaction.deferUpdate();

  const guild  = interaction.guild;
  const user   = interaction.user;
  const type   = interaction.values[0];
  const typeInfo = TICKET_TYPES.find(t => t.value === type) || TICKET_TYPES[0];

  // Double-check duplicate (race condition guard)
  const { data: existing } = await supabase
    .from('tickets')
    .select('*')
    .eq('guild_id', guild.id)
    .eq('user_id', user.id)
    .eq('status', 'open')
    .single();

  if (existing && guild.channels.cache.has(existing.channel_id)) {
    return interaction.editReply({
      content: `⚠️ You already have an open ticket in <#${existing.channel_id}>.`,
      components: [],
    });
  }

  const categoryId  = await getSetting(guild.id, 'TICKET_CATEGORY_ID');
  const staffRoleId = await getSetting(guild.id, 'TICKET_STAFF_ROLE_ID');

  // Count total tickets for numbering
  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('guild_id', guild.id);

  const ticketNumber = (count || 0) + 1;

  const permissionOverwrites = [
    { id: guild.id,          deny: [PermissionFlagsBits.ViewChannel] },
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
        PermissionFlagsBits.ManageMessages,
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
    const channel = await guild.channels.create({
      name: `${typeInfo.emoji.replace(/[^\w]/g, '')}-ticket-${String(ticketNumber).padStart(4, '0')}`,
      type: ChannelType.GuildText,
      parent: categoryId && guild.channels.cache.has(categoryId) ? categoryId : null,
      topic: `Ticket #${ticketNumber} | ${typeInfo.label} | ${user.tag}`,
      permissionOverwrites,
    });

    const welcomeMsg = await getSetting(guild.id, 'TICKET_WELCOME_MESSAGE')
      || 'Thank you for reaching out. Please describe your issue in detail and our staff team will assist you shortly.';

    await supabase.from('tickets').insert([{
      guild_id:      guild.id,
      channel_id:    channel.id,
      user_id:       user.id,
      ticket_number: ticketNumber,
      ticket_type:   type,
      status:        'open',
      created_at:    new Date().toISOString(),
    }]);

    const embed = new EmbedBuilder()
      .setColor(0x6366f1)
      .setTitle(`${typeInfo.emoji} Ticket #${String(ticketNumber).padStart(4, '0')} — ${typeInfo.label}`)
      .setDescription(`Welcome <@${user.id}>!\n\n${welcomeMsg}`)
      .addFields(
        { name: '👤 Member',    value: `<@${user.id}> (${user.id})`,                                    inline: true },
        { name: '📂 Category',  value: typeInfo.label,                                                  inline: true },
        { name: '⏰ Opened',    value: `<t:${Math.floor(Date.now() / 1000)}:R>`,                        inline: true },
      )
      .setFooter({ text: 'Jarvis Ticket System • Claim this ticket if you are handling it.' })
      .setTimestamp();

    const controlRow = buildControlRow(false, false);

    const mention = [
      staffRoleId ? `<@&${staffRoleId}>` : '',
      `<@${user.id}>`,
    ].filter(Boolean).join(' ');

    await channel.send({ content: mention, embeds: [embed], components: [controlRow] });

    await interaction.editReply({
      content: `✅ Your ticket has been created! Head to <#${channel.id}>.`,
      components: [],
    });
  } catch (err) {
    console.error('[Ticket Create] Error:', err);
    await interaction.editReply({
      content: '❌ Failed to create ticket channel. Please contact an administrator.',
      components: [],
    });
  }
}

// ─── Claim / Unclaim ─────────────────────────────────────────────────────────
async function handleTicketClaim(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const ticket = await getTicketRow(interaction.channel.id);
  if (!ticket) return interaction.editReply({ content: '❌ This channel is not a tracked ticket.' });

  const staffRoleId = await getSetting(interaction.guild.id, 'TICKET_STAFF_ROLE_ID');
  const isStaff = staffRoleId
    ? interaction.member.roles.cache.has(staffRoleId)
    : interaction.member.permissions.has(PermissionFlagsBits.ManageChannels);

  if (!isStaff) {
    return interaction.editReply({ content: '❌ Only staff members can claim tickets.' });
  }

  const alreadyClaimed = ticket.claimed_by === interaction.user.id;

  if (alreadyClaimed) {
    // Unclaim
    await supabase.from('tickets').update({ claimed_by: null }).eq('channel_id', interaction.channel.id);
    await interaction.channel.setTopic(
      interaction.channel.topic?.replace(/\s*\|\s*Claimed by .+$/, '') || ''
    ).catch(() => null);

    const embed = new EmbedBuilder()
      .setColor(0xf59e0b)
      .setDescription(`✋ <@${interaction.user.id}> has unclaimed this ticket.`);
    await interaction.channel.send({ embeds: [embed] });
    await interaction.editReply({ content: '✅ You have unclaimed this ticket.' });
  } else {
    // Claim
    await supabase.from('tickets').update({ claimed_by: interaction.user.id }).eq('channel_id', interaction.channel.id);
    await interaction.channel.setTopic(
      `${interaction.channel.topic || ''} | Claimed by ${interaction.user.tag}`
    ).catch(() => null);

    const embed = new EmbedBuilder()
      .setColor(0x22c55e)
      .setDescription(`✋ <@${interaction.user.id}> has claimed this ticket and will be assisting you.`);
    await interaction.channel.send({ embeds: [embed] });
    await interaction.editReply({ content: '✅ You have claimed this ticket.' });
  }

  // Refresh control row buttons
  await refreshControlMessage(interaction.channel, ticket.status === 'closed');
}

// ─── Close ────────────────────────────────────────────────────────────────────
async function handleTicketClose(interaction) {
  await interaction.deferReply();

  const ticket = await getTicketRow(interaction.channel.id);
  if (!ticket) return interaction.editReply({ content: '❌ This channel is not a tracked ticket.' });

  await supabase
    .from('tickets')
    .update({ status: 'closed', closed_at: new Date().toISOString(), closed_by: interaction.user.id })
    .eq('channel_id', interaction.channel.id);

  // Deny the ticket owner from sending messages (but keep view)
  await interaction.channel.permissionOverwrites.edit(ticket.user_id, {
    SendMessages: false,
  }).catch(() => null);

  const embed = new EmbedBuilder()
    .setColor(0xf43f5e)
    .setTitle('🔒 Ticket Closed')
    .setDescription(`This ticket was closed by <@${interaction.user.id}>.\n\n*Staff: Use **Reopen** to re-open, or **Delete** to permanently remove.*`)
    .setTimestamp()
    .setFooter({ text: 'Jarvis Ticket System' });

  await interaction.editReply({ embeds: [embed], components: [buildControlRow(true)] });
}

// ─── Reopen ───────────────────────────────────────────────────────────────────
async function handleTicketReopen(interaction) {
  await interaction.deferReply();

  const ticket = await getTicketRow(interaction.channel.id);
  if (!ticket) return interaction.editReply({ content: '❌ This channel is not a tracked ticket.' });

  const staffRoleId = await getSetting(interaction.guild.id, 'TICKET_STAFF_ROLE_ID');
  const isStaff = staffRoleId
    ? interaction.member.roles.cache.has(staffRoleId)
    : interaction.member.permissions.has(PermissionFlagsBits.ManageChannels);

  if (!isStaff) {
    return interaction.editReply({ content: '❌ Only staff members can reopen tickets.' });
  }

  await supabase
    .from('tickets')
    .update({ status: 'open', closed_at: null, closed_by: null })
    .eq('channel_id', interaction.channel.id);

  // Restore the owner's send permission
  await interaction.channel.permissionOverwrites.edit(ticket.user_id, {
    SendMessages: true,
  }).catch(() => null);

  const embed = new EmbedBuilder()
    .setColor(0x22c55e)
    .setTitle('🔓 Ticket Reopened')
    .setDescription(`This ticket was reopened by <@${interaction.user.id}>.`)
    .setTimestamp();

  await interaction.editReply({ embeds: [embed], components: [buildControlRow(false, !!ticket.claimed_by)] });
}

// ─── Transcript ───────────────────────────────────────────────────────────────
async function handleTicketTranscript(interaction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    const messages = [];
    let lastId;

    // Fetch up to 500 messages
    for (let i = 0; i < 5; i++) {
      const fetched = await interaction.channel.messages.fetch({
        limit: 100,
        ...(lastId ? { before: lastId } : {}),
      });
      if (fetched.size === 0) break;
      fetched.forEach(m => messages.push(m));
      lastId = fetched.last()?.id;
      if (fetched.size < 100) break;
    }

    messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    const lines = messages.map(m => {
      const ts = new Date(m.createdTimestamp).toISOString();
      const content = m.content || (m.embeds.length > 0 ? '[Embed]' : '[Attachment/Other]');
      return `[${ts}] ${m.author.tag}: ${content}`;
    });

    const transcriptText = [
      `=== Transcript for #${interaction.channel.name} ===`,
      `Guild: ${interaction.guild.name} (${interaction.guild.id})`,
      `Exported by: ${interaction.user.tag}`,
      `Date: ${new Date().toISOString()}`,
      `Total messages: ${lines.length}`,
      '='.repeat(60),
      '',
      ...lines,
    ].join('\n');

    const buffer   = Buffer.from(transcriptText, 'utf-8');
    const fileName = `transcript-${interaction.channel.name}-${Date.now()}.txt`;

    // Send to transcript channel if configured
    const transcriptChannelId = await getSetting(interaction.guild.id, 'TICKET_TRANSCRIPT_CHANNEL_ID');
    if (transcriptChannelId && interaction.guild.channels.cache.has(transcriptChannelId)) {
      const transcriptChannel = interaction.guild.channels.cache.get(transcriptChannelId);
      const ticket = await getTicketRow(interaction.channel.id);
      const summaryEmbed = new EmbedBuilder()
        .setColor(0x6366f1)
        .setTitle('📄 Ticket Transcript')
        .addFields(
          { name: '🎫 Channel',    value: interaction.channel.name,                             inline: true },
          { name: '👤 Opened by', value: ticket?.user_id ? `<@${ticket.user_id}>` : 'Unknown', inline: true },
          { name: '📨 Messages',  value: `${lines.length}`,                                    inline: true },
        )
        .setTimestamp();
      await transcriptChannel.send({
        embeds: [summaryEmbed],
        files: [{ attachment: buffer, name: fileName }],
      });
    }

    await interaction.editReply({
      content: '📄 Transcript generated successfully!',
      files: [{ attachment: buffer, name: fileName }],
    });
  } catch (err) {
    console.error('[Ticket Transcript] Error:', err);
    await interaction.editReply({ content: '❌ Failed to generate transcript.' });
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────
async function handleTicketDelete(interaction) {
  await interaction.deferReply();

  const staffRoleId = await getSetting(interaction.guild.id, 'TICKET_STAFF_ROLE_ID');
  const isStaff = staffRoleId
    ? interaction.member.roles.cache.has(staffRoleId)
    : interaction.member.permissions.has(PermissionFlagsBits.ManageChannels);

  if (!isStaff) {
    return interaction.editReply({ content: '❌ Only staff members can delete tickets.' });
  }

  await supabase
    .from('tickets')
    .update({ status: 'deleted', deleted_at: new Date().toISOString() })
    .eq('channel_id', interaction.channel.id);

  const embed = new EmbedBuilder()
    .setColor(0xef4444)
    .setDescription('🗑️ This ticket channel will be permanently deleted in **5 seconds**.')
    .setTimestamp();

  await interaction.editReply({ embeds: [embed], components: [] });

  setTimeout(() => {
    interaction.channel.delete(`Ticket deleted by ${interaction.user.tag}`).catch(console.error);
  }, 5000);
}

// ─── Helper: Refresh control row on latest message ───────────────────────────
async function refreshControlMessage(channel, isClosed) {
  try {
    const messages = await channel.messages.fetch({ limit: 20 });
    // Find the last message that has the control buttons
    const controlMsg = messages.find(
      m => m.author.bot && m.components?.length > 0 &&
        m.components[0]?.components?.some(c =>
          ['ticket_close', 'ticket_reopen', 'ticket_claim'].includes(c.customId)
        )
    );
    if (controlMsg) {
      const ticket = await getTicketRow(channel.id);
      await controlMsg.edit({
        components: [buildControlRow(isClosed, !!ticket?.claimed_by)],
      }).catch(() => null);
    }
  } catch { /* non-critical */ }
}

module.exports = {
  handleTicketCreate,
  handleTicketTypeSelect,
  handleTicketClaim,
  handleTicketClose,
  handleTicketReopen,
  handleTicketTranscript,
  handleTicketDelete,
};
