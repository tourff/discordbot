const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { getWelcomeChannelId, getWelcomeMessage, getWelcomeImageUrl } = require('../../modules/settings');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setupwelcome')
    .setDescription('Configure the welcome system dashboard.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  
  async execute(interaction) {
    const channelId = await getWelcomeChannelId(interaction.guild.id);
    const message = await getWelcomeMessage(interaction.guild.id) || "Default Welcome Message";
    const imageUrl = await getWelcomeImageUrl(interaction.guild.id);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('👋 Welcome System Configuration')
      .setDescription('Use the menu and buttons below to fully customize your welcome system.')
      .addFields(
        { name: 'Current Channel', value: channelId ? `<#${channelId}>` : 'Not set', inline: true },
        { name: 'Media / Banner URL', value: imageUrl ? `[Click to view media](${imageUrl})\n\`${imageUrl.substring(0, 60)}${imageUrl.length > 60 ? '...' : ''}\`` : 'Server Banner / None', inline: true },
        { name: 'Current Message', value: `\`\`\`text\n${message.substring(0, 1000)}\n\`\`\``, inline: false }
      );

    if (imageUrl && (imageUrl.endsWith('.png') || imageUrl.endsWith('.jpg') || imageUrl.endsWith('.gif') || imageUrl.endsWith('.webp'))) {
      embed.setImage(imageUrl);
    }

    const selectMenuRow = new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('welcome_channel_select')
        .setPlaceholder('Select Welcome Channel')
        .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
    );

    const buttonsRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('welcome_msg_btn')
        .setLabel('Edit Message')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📝'),
      new ButtonBuilder()
        .setCustomId('welcome_banner_btn')
        .setLabel('Set Media / GIF / Video')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🖼️'),
      new ButtonBuilder()
        .setCustomId('welcome_disable_btn')
        .setLabel('Disable System')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🗑️')
    );

    await interaction.reply({ embeds: [embed], components: [selectMenuRow, buttonsRow], ephemeral: true });
  },
};
