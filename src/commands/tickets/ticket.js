// src/commands/utility/ticket.js
'use strict';

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Manage the interactive ticket support system')
    .addSubcommand(sub =>
      sub.setName('setup')
        .setDescription('Post the interactive Open Ticket button embed in this channel')
        .addStringOption(opt =>
          opt.setName('title')
            .setDescription('Embed title (e.g. Server Support & Inquiries)')
            .setRequired(false)
        )
        .addStringOption(opt =>
          opt.setName('description')
            .setDescription('Embed description')
            .setRequired(false)
        )
    ),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '🚫 You must be an Administrator to configure tickets.', ephemeral: true });
    }

    const title = interaction.options.getString('title') || '📩 Support Ticket Desk';
    const description = interaction.options.getString('description') || 'Need assistance, have a question, or want to report an issue? Click the button below to open a private support ticket with our staff team.';

    const embed = new EmbedBuilder()
      .setColor(0x6366f1)
      .setTitle(title)
      .setDescription(description)
      .addFields(
        { name: '🔒 Private & Secure', value: 'Only you and server staff can view your ticket.', inline: true },
        { name: '⚡ Fast Assistance', value: 'Our support team responds as soon as possible.', inline: true }
      )
      .setFooter({ text: 'Jarvis Ticket Desk • Made by trj7' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_create')
        .setLabel('Open Ticket')
        .setEmoji('📩')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: '✅ Ticket panel successfully deployed in this channel!', ephemeral: true });
  },
};
