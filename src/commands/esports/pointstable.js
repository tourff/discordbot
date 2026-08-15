// src/commands/esports/pointstable.js
// ─────────────────────────────────────────────────────────────────────────────
// Esports Points Table Generator
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pointstable')
    .setDescription('Calculate and generate formatted esports match points table')
    .addStringOption(opt =>
      opt.setName('title')
        .setDescription('Tournament or Match Title (e.g. Scrims Match 1 - Miramar)')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('data')
        .setDescription('Format: TeamName,PlacePts,Kills | TeamName2,PlacePts,Kills')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('footer')
        .setDescription('Optional footer text')
        .setRequired(false)
    ),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const title = interaction.options.getString('title');
    const rawData = interaction.options.getString('data');
    const footerText = interaction.options.getString('footer') || 'Jarvis Esports Engine • Made by trj7';

    // Parse team records
    // e.g. "Soul,10,12 | GodL,6,8 | Hydra,5,2"
    const entries = rawData.split('|').map(e => e.trim()).filter(Boolean);

    if (entries.length === 0) {
      return interaction.reply({
        content: '⚠️ Invalid data format. Example format: `Team Soul,10,12 | Team GodL,6,8 | Team Hydra,5,2`',
        ephemeral: true
      });
    }

    const teams = [];

    for (const item of entries) {
      const parts = item.split(',').map(p => p.trim());
      if (parts.length < 3) continue;

      const teamName = parts[0];
      const placePts = parseInt(parts[1], 10) || 0;
      const kills = parseInt(parts[2], 10) || 0;
      const totalPts = placePts + kills;

      teams.push({ name: teamName, placePts, kills, totalPts });
    }

    if (teams.length === 0) {
      return interaction.reply({
        content: '⚠️ Could not parse team stats. Please ensure format is `TeamName,PlacePts,Kills` separated by `|`.',
        ephemeral: true
      });
    }

    // Sort by Total Points descending, then Place Points, then Kills
    teams.sort((a, b) => b.totalPts - a.totalPts || b.placePts - a.placePts || b.kills - a.kills);

    // Build Table Header & Rows
    let table = '```\n';
    table += '#  TEAM NAME            PLACE  KILLS  TOTAL\n';
    table += '─'.repeat(45) + '\n';

    teams.forEach((t, i) => {
      const rank = String(i + 1).padStart(2, '0');
      const name = t.name.length > 18 ? t.name.substring(0, 15) + '...' : t.name.padEnd(18, ' ');
      const place = String(t.placePts).padStart(4, ' ');
      const kills = String(t.kills).padStart(6, ' ');
      const total = String(t.totalPts).padStart(6, ' ');

      table += `${rank} ${name} ${place} ${kills} ${total}\n`;
    });

    table += '```';

    const embed = new EmbedBuilder()
      .setColor(0x8b5cf6)
      .setTitle(`🏆 ${title}`)
      .setDescription(table)
      .addFields(
        { name: '🥇 #1 Champion', value: `**${teams[0].name}** (${teams[0].totalPts} pts)`, inline: true },
        { name: '🔥 Top Fragger Team', value: `**${[...teams].sort((a, b) => b.kills - a.kills)[0].name}** (${[...teams].sort((a, b) => b.kills - a.kills)[0].kills} kills)`, inline: true }
      )
      .setFooter({ text: footerText })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
