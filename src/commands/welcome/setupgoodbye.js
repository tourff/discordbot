const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { getGoodbyeChannelId, getGoodbyeMessage } = require('../../modules/settings');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setupgoodbye')
    .setDescription('Configure the goodbye system dashboard.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  
  async execute(interaction) {
    const channelId = await getGoodbyeChannelId(interaction.guild.id);
    const message = await getGoodbyeMessage(interaction.guild.id) || "Default Goodbye Message";

    const embed = new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle('👋 Goodbye System Configuration')
      .setDescription('Use the menu and buttons below to fully customize your goodbye system.')
      .addFields(
        { name: 'Current Channel', value: channelId ? `<#${channelId}>` : 'Not set', inline: true },
        { name: 'Current Message', value: `\`\`\`text\n${message.substring(0, 1000)}\n\`\`\``, inline: false }
      );

    const selectMenuRow = new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('goodbye_channel_select')
        .setPlaceholder('Select Goodbye Channel')
        .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
    );

    const buttonsRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('goodbye_msg_btn')
        .setLabel('Edit Message')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📝'),
      new ButtonBuilder()
        .setCustomId('goodbye_disable_btn')
        .setLabel('Disable System')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🗑️')
    );

    await interaction.reply({ embeds: [embed], components: [selectMenuRow, buttonsRow], ephemeral: true });
  },
};
