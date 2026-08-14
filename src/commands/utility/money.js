// src/commands/utility/money.js
'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const supabase = require('../../config/supabase');

module.exports = {
  category: 'utility',
  data: new SlashCommandBuilder()
    .setName('money')
    .setDescription('Check your current balance of Quo Coins.'),

  async execute(interaction) {
    const userId = interaction.user.id;

    // Fetch user profile
    const { data: record, error } = await supabase
      .from('user_profiles')
      .select('money')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[money]', error);
      return interaction.reply({ content: '❌ Failed to fetch coin balance.', ephemeral: true });
    }

    const money = record?.money || 0;

    const embed = new EmbedBuilder()
      .setColor(0x00FFB3)
      .setTitle('💰 Your Quo Coins')
      .setThumbnail(interaction.user.displayAvatarURL())
      .setDescription(
        `You have a total of **\`${money} Quo Coins\`**.\n\n` +
        `*Quo Coins can be earned by voting using the \`/vote\` command.*`
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
