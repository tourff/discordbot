// src/commands/utility/source.js
'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');

module.exports = {
  category: 'utility',
  data: new SlashCommandBuilder()
    .setName('source')
    .setDescription('Get links to the bot\'s source code on GitHub.')
    .addStringOption(o =>
      o.setName('command')
        .setDescription('Optional command to get the source code of')
        .setRequired(false)
    ),

  async execute(interaction) {
    const repoUrl = 'https://github.com/quotientbot/Quotient-Bot';
    const query = interaction.options.getString('command')?.toLowerCase().trim();

    if (!query) {
      const embed = new EmbedBuilder()
        .setColor(0x00FFB3)
        .setTitle('📦 Bot Source Code')
        .setDescription(
          `**Original Quotient Source:** [Click Here](${repoUrl})\n` +
          `**Quotient Legacy Fork:** [Private/Public Repository](https://github.com/CycloneAddons/Quotient-Legacy)\n\n` +
          `*To view the source of a specific command, use* \`/source command: <name>\``
        )
        .setFooter({ text: 'Revived and maintained by Cyclone Addons ❤️' });

      return interaction.reply({ embeds: [embed] });
    }

    const command = interaction.client.commands.get(query);
    if (!command) {
      return interaction.reply({ content: `❌ Command \`/${query}\` not found.`, ephemeral: true });
    }

    // Try to get file path
    // In node, we can inspect where a module was required from using require.resolve
    let location = `src/commands/${command.category.toLowerCase()}/${query}.js`;

    const finalUrl = `${repoUrl}/blob/main/${location}`;

    const embed = new EmbedBuilder()
      .setColor(0x00FFB3)
      .setTitle(`🔍 Source for \`/${query}\``)
      .setDescription(`[Click here to view the source on GitHub](${finalUrl})`)
      .setFooter({ text: 'Revived and maintained by Cyclone Addons ❤️' });

    await interaction.reply({ embeds: [embed] });
  },
};
