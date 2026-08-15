// src/commands/utility/summarize.js
'use strict';

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { generateAIResponse } = require('../../modules/aiAssistant');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('summarize')
    .setDescription('AI summarizes recent chat history for this channel')
    .addIntegerOption(opt =>
      opt.setName('count')
        .setDescription('Number of recent messages to analyze (10 - 50)')
        .setMinValue(10)
        .setMaxValue(50)
        .setRequired(false)
    ),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const count = interaction.options.getInteger('count') || 25;
    await interaction.deferReply({ ephemeral: true });

    try {
      const messages = await interaction.channel.messages.fetch({ limit: count });
      const chatLogs = messages
        .filter(m => !m.author.bot && m.content.trim().length > 0)
        .map(m => `${m.author.username}: ${m.content}`)
        .reverse()
        .join('\n');

      if (!chatLogs) {
        return interaction.editReply({ content: '⚠️ Not enough message history found to summarize.' });
      }

      const prompt = `Please provide a concise, engaging summary of the following Discord chat conversation with key bullet points and decisions:\n\n${chatLogs}`;
      const summary = await generateAIResponse(prompt, 'You are Jarvis, an AI summarizer. Extract key topics, decisions, and highlights into clean bullet points.');

      const embed = new EmbedBuilder()
        .setColor(0x818cf8)
        .setTitle(`📝 Chat Summary (${count} messages)`)
        .setDescription(summary)
        .setFooter({ text: 'Jarvis Intelligence • Made by trj7' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('[Summarize] Error:', err);
      await interaction.editReply({ content: '❌ Failed to summarize chat history.' });
    }
  },
};
