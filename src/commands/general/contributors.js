// src/commands/utility/contributors.js
'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  category: 'utility',
  data: new SlashCommandBuilder()
    .setName('contributors')
    .setDescription('See the amazing people who contributed to Quotient.'),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const response = await fetch('https://api.github.com/repos/quotientbot/Quotient-Bot/contributors');
      if (!response.ok) throw new Error(`GitHub API returned status ${response.status}`);
      
      const contributors = await response.json();

      if (!contributors || !Array.isArray(contributors)) {
        throw new Error('Invalid response from GitHub API');
      }

      const description = contributors
        .slice(0, 15) // Top 15 contributors
        .map((c, i) => `\`${(i + 1).toString().padStart(2, '0')}.\` [${c.login}](${c.html_url}) (${c.contributions} contributions)`)
        .join('\n') + '\n\n`–` Revived and maintained by [Cyclone Addons](https://github.com/CycloneAddons)';

      const embed = new EmbedBuilder()
        .setColor(0x00FFB3)
        .setTitle('👥 Project Contributors')
        .setDescription(description)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('[contributors]', err);
      
      const fallbackEmbed = new EmbedBuilder()
        .setColor(0xff4444)
        .setTitle('👥 Project Contributors')
        .setDescription(
          `Failed to fetch dynamic contributors list.\n\n` +
          `**Top Contributors:**\n` +
          `• deadshot\n` +
          `• Cyclone Addons\n` +
          `• And other original Quotient developers!`
        );

      await interaction.editReply({ embeds: [fallbackEmbed] });
    }
  },
};
