// src/commands/utility/invite.js
'use strict';

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  category: 'utility',
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Get invite links for the bot and the support server.'),

  async execute(interaction) {
    const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${interaction.client.user.id}&permissions=8&scope=bot%20applications.commands`;
    const supportUrl = 'https://discord.gg/quotient'; // Support server placeholder or configuration

    const embed = new EmbedBuilder()
      .setColor(0x00FFB3)
      .setTitle('📥 Invite Quotient')
      .setDescription('Use the buttons below to invite the bot or join our support server!')
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Invite Bot')
        .setURL(inviteUrl)
        .setStyle(ButtonStyle.Link),
      new ButtonBuilder()
        .setLabel('Support Server')
        .setURL(supportUrl)
        .setStyle(ButtonStyle.Link)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
