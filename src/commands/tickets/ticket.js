// src/commands/tickets/ticket.js
// ─────────────────────────────────────────────────────────────────────────────
// Full Ticket System command
//   /ticket setup       — Deploy the panel in this channel
//   /ticket config      — Set staff role, category, transcript channel, welcome message
//   /ticket stats       — Show open/closed ticket counts
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { setSetting, getSetting } = require('../../modules/autoMod');
const { supabase } = require('../../config/supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Manage the interactive ticket support system')

    // ── /ticket setup ────────────────────────────────────────────────────────
    .addSubcommand(sub =>
      sub.setName('setup')
        .setDescription('Deploy the ticket panel embed in this channel')
        .addStringOption(opt =>
          opt.setName('title')
            .setDescription('Panel title (default: 📩 Support Ticket Desk)')
            .setRequired(false)
        )
        .addStringOption(opt =>
          opt.setName('description')
            .setDescription('Panel description text')
            .setRequired(false)
        )
        .addStringOption(opt =>
          opt.setName('color')
            .setDescription('Hex embed colour, e.g. #6366f1')
            .setRequired(false)
        )
    )

    // ── /ticket config ───────────────────────────────────────────────────────
    .addSubcommand(sub =>
      sub.setName('config')
        .setDescription('Configure the ticket system settings')
        .addRoleOption(opt =>
          opt.setName('staff_role')
            .setDescription('Role that can view and manage all tickets')
            .setRequired(false)
        )
        .addChannelOption(opt =>
          opt.setName('category')
            .setDescription('Category channel where ticket channels will be created')
            .setRequired(false)
        )
        .addChannelOption(opt =>
          opt.setName('transcript_channel')
            .setDescription('Channel where transcripts will be auto-saved')
            .setRequired(false)
        )
        .addStringOption(opt =>
          opt.setName('welcome_message')
            .setDescription('Message shown inside each new ticket')
            .setRequired(false)
        )
    )

    // ── /ticket stats ────────────────────────────────────────────────────────
    .addSubcommand(sub =>
      sub.setName('stats')
        .setDescription('Show ticket statistics for this server')
    ),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '🚫 You must be an Administrator to use this command.', ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();

    // ── setup ─────────────────────────────────────────────────────────────────
    if (sub === 'setup') {
      const title       = interaction.options.getString('title')       || '📩 Support Ticket Desk';
      const description = interaction.options.getString('description') || 'Need assistance, have a question, or want to report something? Click **Open Ticket** below to start a private conversation with our staff team.';
      const colorInput  = interaction.options.getString('color')       || '#6366f1';
      const color       = parseInt(colorInput.replace('#', ''), 16) || 0x6366f1;

      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)
        .addFields(
          { name: '🔒 Private & Secure',   value: 'Only you and our staff team can see your ticket.', inline: true },
          { name: '⚡ Quick Response',      value: 'Our staff respond as soon as possible.',           inline: true },
          { name: '📂 Multiple Categories', value: 'Choose the category that fits your request.',      inline: true },
        )
        .setFooter({ text: 'Jarvis Ticket System • Powered by trj7' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_create')
          .setLabel('Open Ticket')
          .setEmoji('📩')
          .setStyle(ButtonStyle.Primary)
      );

      await interaction.channel.send({ embeds: [embed], components: [row] });
      return interaction.reply({ content: '✅ Ticket panel deployed successfully in this channel!', ephemeral: true });
    }

    // ── config ────────────────────────────────────────────────────────────────
    if (sub === 'config') {
      const staffRole          = interaction.options.getRole('staff_role');
      const category           = interaction.options.getChannel('category');
      const transcriptChannel  = interaction.options.getChannel('transcript_channel');
      const welcomeMessage     = interaction.options.getString('welcome_message');

      const updates = [];

      if (staffRole) {
        await setSetting(interaction.guild.id, 'TICKET_STAFF_ROLE_ID', staffRole.id);
        updates.push(`✅ Staff role → ${staffRole}`);
      }
      if (category) {
        await setSetting(interaction.guild.id, 'TICKET_CATEGORY_ID', category.id);
        updates.push(`✅ Ticket category → ${category.name}`);
      }
      if (transcriptChannel) {
        await setSetting(interaction.guild.id, 'TICKET_TRANSCRIPT_CHANNEL_ID', transcriptChannel.id);
        updates.push(`✅ Transcript channel → ${transcriptChannel}`);
      }
      if (welcomeMessage) {
        await setSetting(interaction.guild.id, 'TICKET_WELCOME_MESSAGE', welcomeMessage);
        updates.push(`✅ Welcome message updated`);
      }

      if (updates.length === 0) {
        // Show current config
        const staffRoleId         = await getSetting(interaction.guild.id, 'TICKET_STAFF_ROLE_ID');
        const categoryId          = await getSetting(interaction.guild.id, 'TICKET_CATEGORY_ID');
        const transcriptChannelId = await getSetting(interaction.guild.id, 'TICKET_TRANSCRIPT_CHANNEL_ID');
        const welcome             = await getSetting(interaction.guild.id, 'TICKET_WELCOME_MESSAGE');

        const embed = new EmbedBuilder()
          .setColor(0x6366f1)
          .setTitle('⚙️ Ticket System Configuration')
          .addFields(
            { name: '👥 Staff Role',          value: staffRoleId         ? `<@&${staffRoleId}>`         : '*(not set)*', inline: true },
            { name: '📁 Ticket Category',      value: categoryId          ? `<#${categoryId}>`           : '*(not set)*', inline: true },
            { name: '📄 Transcript Channel',   value: transcriptChannelId ? `<#${transcriptChannelId}>` : '*(not set)*', inline: true },
            { name: '💬 Welcome Message',      value: welcome             ? welcome.slice(0, 200)        : '*(default)*', inline: false },
          )
          .setFooter({ text: 'Use /ticket config [option] to update these values.' });

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x22c55e)
            .setTitle('✅ Ticket Config Updated')
            .setDescription(updates.join('\n'))
        ],
        ephemeral: true,
      });
    }

    // ── stats ─────────────────────────────────────────────────────────────────
    if (sub === 'stats') {
      const { count: total }  = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('guild_id', interaction.guild.id);
      const { count: open }   = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('guild_id', interaction.guild.id).eq('status', 'open');
      const { count: closed } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('guild_id', interaction.guild.id).eq('status', 'closed');

      const embed = new EmbedBuilder()
        .setColor(0x6366f1)
        .setTitle('🎫 Ticket Statistics')
        .addFields(
          { name: '📊 Total Tickets', value: `${total || 0}`,  inline: true },
          { name: '🟢 Open',          value: `${open || 0}`,   inline: true },
          { name: '🔴 Closed',        value: `${closed || 0}`, inline: true },
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
