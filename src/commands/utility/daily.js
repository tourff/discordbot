// src/commands/utility/daily.js
'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { modifyBalance } = require('../../modules/economy');

const dailyCooldowns = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Claim your daily Jarvis coin bonus'),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const userId = interaction.user.id;
    const now = Date.now();
    const lastClaim = dailyCooldowns.get(userId) || 0;

    // 24 hours cooldown = 86,400,000 ms
    const cooldownTime = 24 * 60 * 60 * 1000;
    if (now - lastClaim < cooldownTime) {
      const remaining = cooldownTime - (now - lastClaim);
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      return interaction.reply({
        content: `⏳ You have already claimed your daily bonus! Come back in **${hours}h ${mins}m**.`,
        ephemeral: true
      });
    }

    dailyCooldowns.set(userId, now);
    const reward = 250;
    const newBal = await modifyBalance(userId, reward);

    const embed = new EmbedBuilder()
      .setColor(0xf59e0b)
      .setTitle('🪙 Daily Bonus Claimed!')
      .setDescription(`You received **+${reward} Jarvis Coins**! 🎉\n**New Balance:** \`${newBal.toLocaleString()} Coins\``)
      .setFooter({ text: 'Jarvis Economy • Made by trj7' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
