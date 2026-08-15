// src/commands/utility/leaderboard.js
'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { supabase } = require('../../config/supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the top 10 most active members on the server'),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply();

    try {
      const { data: topUsers, error } = await supabase
        .from('user_levels')
        .select('*')
        .eq('guild_id', interaction.guild.id)
        .order('level', { ascending: false })
        .order('xp', { ascending: false })
        .limit(10);

      if (error || !topUsers || topUsers.length === 0) {
        return interaction.editReply({ content: '📊 No leaderboard data available yet. Start chatting to gain XP!' });
      }

      const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
      const lines = topUsers.map((u, i) => {
        const medal = medals[i] || `${i + 1}.`;
        return `${medal} <@${u.user_id}> — **Level ${u.level}** (${Number(u.xp).toLocaleString()} XP)`;
      });

      const embed = new EmbedBuilder()
        .setColor(0x818cf8)
        .setTitle(`🏆 ${interaction.guild.name} — XP Leaderboard`)
        .setDescription(lines.join('\n\n'))
        .setFooter({ text: 'Jarvis Leaderboard • Made by trj7' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('[Leaderboard Command] Error:', err);
      await interaction.editReply({ content: '❌ Failed to load leaderboard.' });
    }
  },
};
