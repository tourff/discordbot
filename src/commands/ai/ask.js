// src/commands/utility/ask.js
'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { generateAIResponse } = require('../../modules/aiAssistant');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ask')
    .setDescription('Ask Jarvis AI anything with intelligent real-time answers')
    .addStringOption(opt =>
      opt.setName('prompt')
        .setDescription('Your question or prompt for Jarvis')
        .setRequired(true)
    ),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const prompt = interaction.options.getString('prompt');
    await interaction.deferReply();

    const response = await generateAIResponse(prompt);

    if (response.length > 2000) {
      const embed = new EmbedBuilder()
        .setColor(0x6366f1)
        .setAuthor({ name: 'Jarvis AI Intelligence', iconURL: interaction.client.user.displayAvatarURL() })
        .setTitle('Query Response')
        .setDescription(response.slice(0, 4000))
        .setFooter({ text: `Asked by ${interaction.user.tag} • Made by trj7` })
        .setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setColor(0x6366f1)
      .setAuthor({ name: 'Jarvis AI Intelligence', iconURL: interaction.client.user.displayAvatarURL() })
      .addFields(
        { name: '💬 Prompt', value: `*${prompt.length > 250 ? prompt.slice(0, 250) + '...' : prompt}*` },
        { name: '🧠 Response', value: response }
      )
      .setFooter({ text: `Engineered by trj7` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
