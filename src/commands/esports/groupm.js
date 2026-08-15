// src/commands/esports/groupm.js
// ─────────────────────────────────────────────────────────────────────────────
// Tournament & Scrims Group Distribution Manager
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('groupm')
    .setDescription('Automatically distribute registered teams into groups (Group A, B, C...)')
    .addStringOption(opt =>
      opt.setName('teams')
        .setDescription('List of team names separated by commas (e.g. Soul, GodL, Entity, Blind, 8bit)')
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('teams_per_group')
        .setDescription('Number of teams in each group (e.g. 10 or 12)')
        .setMinValue(2)
        .setMaxValue(25)
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('tournament_name')
        .setDescription('Tournament Name for the embed title')
        .setRequired(false)
    ),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: '🚫 You need `Manage Server` permission to manage groups.', ephemeral: true });
    }

    const rawTeams = interaction.options.getString('teams');
    const teamsPerGroup = interaction.options.getInteger('teams_per_group');
    const tourneyName = interaction.options.getString('tournament_name') || 'Tournament Groups';

    const teamList = rawTeams.split(',').map(t => t.trim()).filter(Boolean);

    if (teamList.length === 0) {
      return interaction.reply({ content: '⚠️ Please provide at least one valid team name.', ephemeral: true });
    }

    // Split into chunks
    const groupLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const groups = [];

    for (let i = 0; i < teamList.length; i += teamsPerGroup) {
      const chunk = teamList.slice(i, i + teamsPerGroup);
      const letter = groupLetters[groups.length] || `Group ${groups.length + 1}`;
      groups.push({ letter: `Group ${letter}`, teams: chunk });
    }

    const embed = new EmbedBuilder()
      .setColor(0x6366f1)
      .setTitle(`🗂️ ${tourneyName} — Group Divisions`)
      .setDescription(`Total Teams: **${teamList.length}** • Total Groups: **${groups.length}** (${teamsPerGroup} teams/group)`)
      .setFooter({ text: 'Jarvis Esports Group Manager • Made by trj7' })
      .setTimestamp();

    groups.forEach(g => {
      const list = g.teams.map((t, idx) => `\`${String(idx + 1).padStart(2, '0')}.\` **${t}**`).join('\n');
      embed.addFields({
        name: `📌 ${g.letter} (${g.teams.length} Teams)`,
        value: list || 'No teams',
        inline: groups.length > 2
      });
    });

    await interaction.reply({ embeds: [embed] });
  },
};
