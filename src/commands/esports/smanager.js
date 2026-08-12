// src/commands/esports/smanager.js
'use strict';

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const supabase = require('../../config/supabase');

module.exports = {
  category: 'esports',
  data: new SlashCommandBuilder()
    .setName('smanager')
    .setDescription('Launch the interactive Scrims Manager.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    await interaction.deferReply();

    const { data: scrims } = await supabase
      .from('scrims')
      .select('*')
      .eq('guild_id', interaction.guild.id);

    const embed = new EmbedBuilder()
      .setColor(0x00FFB3)
      .setTitle("🏆 Jarvis Smart Scrims Manager")
      .setDescription(scrims && scrims.length > 0 
        ? scrims.map((s, i) => \`\\\`\${i + 1}.\\\` \${s.enabled ? '✅' : '❌'} **\${s.name}**\`).join('\\n')
        : "\`\`\`Click Create button for new Scrim.\`\`\`"
      )
      .setFooter({ text: \`Total Scrims in this server: \${scrims?.length || 0}\` });

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('smanager_create')
        .setLabel('Create Scrim')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('smanager_edit')
        .setLabel('Edit Settings')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!scrims || scrims.length === 0),
      new ButtonBuilder()
        .setCustomId('smanager_toggle_reg')
        .setLabel('Instant Start/Stop Reg')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!scrims || scrims.length === 0)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('smanager_reserve')
        .setLabel('Reserve Slots')
        .setStyle(ButtonStyle.Success)
        .setDisabled(!scrims || scrims.length === 0),
      new ButtonBuilder()
        .setCustomId('smanager_ban')
        .setLabel('Ban/Unban')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(!scrims || scrims.length === 0),
      new ButtonBuilder()
        .setCustomId('smanager_slotlist')
        .setLabel('Manage Slotlist')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!scrims || scrims.length === 0)
    );

    await interaction.editReply({
      embeds: [embed],
      components: [row1, row2]
    });
  },
};
