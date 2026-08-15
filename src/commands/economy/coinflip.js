// src/commands/utility/coinflip.js
'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getBalance, modifyBalance } = require('../../modules/economy');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Double or nothing — gamble your Jarvis coins on a coin flip')
    .addIntegerOption(opt =>
      opt.setName('amount')
        .setDescription('Amount of coins to gamble')
        .setMinValue(10)
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('choice')
        .setDescription('Heads or Tails?')
        .setRequired(true)
        .addChoices(
          { name: 'Heads', value: 'heads' },
          { name: 'Tails', value: 'tails' }
        )
    ),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');
    const choice = interaction.options.getString('choice');
    const userBal = await getBalance(interaction.user.id);

    if (userBal < amount) {
      return interaction.reply({
        content: `❌ You do not have enough coins! Your balance is **${userBal.toLocaleString()} Coins**.`,
        ephemeral: true
      });
    }

    const outcomes = ['heads', 'tails'];
    const result = outcomes[Math.floor(Math.random() * outcomes.length)];
    const won = result === choice;

    const newBal = won
      ? await modifyBalance(interaction.user.id, amount)
      : await modifyBalance(interaction.user.id, -amount);

    const embed = new EmbedBuilder()
      .setColor(won ? 0x10b981 : 0xf43f5e)
      .setTitle(`🪙 Coin Flip: ${result.toUpperCase()}!`)
      .setDescription(
        won
          ? `🎉 **You won +${amount.toLocaleString()} Coins!**\n**New Balance:** \`${newBal.toLocaleString()} Coins\``
          : `💀 **You lost -${amount.toLocaleString()} Coins.**\n**New Balance:** \`${newBal.toLocaleString()} Coins\``
      )
      .setFooter({ text: 'Jarvis Casino • Made by trj7' });

    await interaction.reply({ embeds: [embed] });
  },
};
