// src/commands/utility/balance.js
'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getBalance } = require('../../modules/economy');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check your current Jarvis Coin wallet balance')
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('The user whose balance to view')
        .setRequired(false)
    ),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const balance = await getBalance(target.id);

    const embed = new EmbedBuilder()
      .setColor(0xf59e0b)
      .setAuthor({ name: `${target.username}'s Wallet`, iconURL: target.displayAvatarURL() })
      .setDescription(`🪙 **Jarvis Coins:** \`${balance.toLocaleString()} Coins\``)
      .setFooter({ text: 'Jarvis Economy • Made by trj7' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
