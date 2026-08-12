// src/commands/esports/tourney.js
'use strict';

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const supabase = require('../../config/supabase');

module.exports = {
  category: 'esports',
  data: new SlashCommandBuilder()
    .setName('tourney')
    .setDescription('Launch the interactive Tournament Manager.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    await interaction.deferReply();

    const { data: tourneys } = await supabase
      .from('tourneys')
      .select('*')
      .eq('guild_id', interaction.guild.id);

    const embed = new EmbedBuilder()
      .setColor(0xFF00FF)
      .setTitle("🏆 Jarvis Tournament Manager")
      .setDescription(tourneys && tourneys.length > 0 
        ? tourneys.map((t, i) => \`\\\`\${i + 1}.\\\` \${t.enabled ? '✅' : '❌'} **\${t.name}**\`).join('\\n')
        : "\`\`\`Click Create button for new Tournament.\`\`\`"
      )
      .setFooter({ text: \`Total Tournaments in this server: \${tourneys?.length || 0}\` });

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('tourney_create')
        .setLabel('Create Tourney')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('tourney_edit')
        .setLabel('Edit Settings')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!tourneys || tourneys.length === 0),
      new ButtonBuilder()
        .setCustomId('tourney_toggle_reg')
        .setLabel('Open/Close Reg')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!tourneys || tourneys.length === 0)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('tourney_confirm')
        .setLabel('Pending Confirmations')
        .setStyle(ButtonStyle.Success)
        .setDisabled(!tourneys || tourneys.length === 0),
      new ButtonBuilder()
        .setCustomId('tourney_groups')
        .setLabel('Manage Groups')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!tourneys || tourneys.length === 0)
    );

    await interaction.editReply({
      embeds: [embed],
      components: [row1, row2]
    });
  },
};
