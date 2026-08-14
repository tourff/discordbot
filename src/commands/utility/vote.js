// src/commands/utility/vote.js
'use strict';

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const supabase = require('../../config/supabase');

module.exports = {
  category: 'utility',
  data: new SlashCommandBuilder()
    .setName('vote')
    .setDescription('Vote for the bot to get rewards.'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const voteLink = 'https://top.gg/bot/902856923311919104/vote'; // Replace with actual bot top.gg link if needed

    // Fetch user votes
    const { data: record } = await supabase
      .from('votes')
      .select('total_votes')
      .eq('user_id', userId)
      .single();

    const totalVotes = record?.total_votes || 0;

    const embed = new EmbedBuilder()
      .setColor(0x00FFB3)
      .setTitle('🗳️ Vote for Quotient')
      .setDescription(
        `**Rewards:**\n` +
        `• 🎖️ Voter Role (lasts for 12 hours)\n` +
        `• 💰 1x Quo Coin (usable in bot economy)\n\n` +
        `**Your Total Votes:** \`${totalVotes}\``
      )
      .setFooter({ text: 'Thank you for supporting us!' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Vote on Top.gg')
        .setURL(voteLink)
        .setStyle(ButtonStyle.Link)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
