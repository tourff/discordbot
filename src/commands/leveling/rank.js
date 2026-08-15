// src/commands/utility/rank.js
'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { supabase } = require('../../config/supabase');
const { getRequiredXP } = require('../../modules/leveling');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('View your server level, XP progress, and rank')
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('The user whose rank you want to check')
        .setRequired(false)
    ),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    await interaction.deferReply();

    try {
      const { data: userLevel } = await supabase
        .from('user_levels')
        .select('*')
        .eq('guild_id', interaction.guild.id)
        .eq('user_id', target.id)
        .single();

      const level = userLevel?.level || 1;
      const xp = Number(userLevel?.xp || 0);
      const reqXP = getRequiredXP(level);
      const msgCount = userLevel?.message_count || 0;

      // Calculate percentage
      const percent = Math.min(100, Math.max(0, Math.floor((xp / reqXP) * 100)));
      const filledBars = Math.floor(percent / 10);
      const emptyBars = 10 - filledBars;
      const progressBar = '▰'.repeat(filledBars) + '▱'.repeat(emptyBars);

      const embed = new EmbedBuilder()
        .setColor(0x6366f1)
        .setAuthor({ name: `${target.username}'s Rank Card`, iconURL: target.displayAvatarURL() })
        .setThumbnail(target.displayAvatarURL({ size: 256 }))
        .addFields(
          { name: '🎖️ Current Level', value: `\`Level ${level}\``, inline: true },
          { name: '⚡ Progress', value: `\`${xp} / ${reqXP} XP\` (${percent}%)`, inline: true },
          { name: '💬 Total Messages', value: `\`${msgCount}\``, inline: true },
          { name: '📊 XP Bar', value: `\`${progressBar}\``, inline: false }
        )
        .setFooter({ text: 'Jarvis Progression • Made by trj7' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('[Rank Command] Error:', err);
      await interaction.editReply({ content: '❌ Failed to load rank card.' });
    }
  },
};
