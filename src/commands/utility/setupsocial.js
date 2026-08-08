const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');

function getMainDashboard() {
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('🌐 Social Media Notification Setup')
    .setDescription('Select a platform below to configure its RSS feed, channel, and custom message.');

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('social_menu_YOUTUBE').setLabel('YouTube').setStyle(ButtonStyle.Secondary).setEmoji('▶️'),
    new ButtonBuilder().setCustomId('social_menu_FACEBOOK').setLabel('Facebook').setStyle(ButtonStyle.Secondary).setEmoji('📘'),
    new ButtonBuilder().setCustomId('social_menu_TIKTOK').setLabel('TikTok').setStyle(ButtonStyle.Secondary).setEmoji('🎵'),
    new ButtonBuilder().setCustomId('social_menu_INSTAGRAM').setLabel('Instagram').setStyle(ButtonStyle.Secondary).setEmoji('📸')
  );

  return { embeds: [embed], components: [row] };
}

async function getSubDashboard(guildId, platform) {
  const { getSocialPlatformConfig } = require('../../modules/settings');
  const config = await getSocialPlatformConfig(guildId, platform);
  
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`⚙️ ${platform} Setup`)
    .setDescription(`Configure notifications for ${platform}.`)
    .addFields(
      { name: 'Channel', value: config.channelId ? `<#${config.channelId}>` : 'Not set', inline: true },
      { name: 'RSS Link', value: config.url ? `\`${config.url}\`` : 'Not set', inline: true },
      { name: 'Message', value: config.message ? `\`\`\`text\n${config.message.substring(0, 1000)}\n\`\`\`` : 'Not set', inline: false }
    );

  const selectRow = new ActionRowBuilder().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId(`social_channel_${platform}`)
      .setPlaceholder('Select Notification Channel')
      .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
  );

  const btnRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`social_urlbtn_${platform}`).setLabel('Set Link').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`social_msgbtn_${platform}`).setLabel('Set Message').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`social_disable_${platform}`).setLabel('Disable').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('social_back').setLabel('Back').setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [selectRow, btnRow] };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setupsocial')
    .setDescription('Configure social media notifications.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  
  getMainDashboard,
  getSubDashboard,

  async execute(interaction) {
    await interaction.reply({ ...getMainDashboard(), ephemeral: true });
  },
};
