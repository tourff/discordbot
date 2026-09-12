const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');

async function getMainDashboard(guildId) {
  const { getSocialFeeds } = require('../../modules/settings');
  const feeds = guildId ? await getSocialFeeds(guildId) : [];

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('🌐 Social Media Notification Setup')
    .setDescription(
      'Configure automated notifications when you post content online!\n' +
      '💡 **Tip:** You can manage **unlimited multiple accounts & custom messages** directly from the [Web Dashboard](https://discordbot-ten-dusky.vercel.app/dashboard).\n\n' +
      `**Active Feeds Configured:** \`${feeds.length}\``
    );

  if (feeds.length > 0) {
    const list = feeds.slice(0, 10).map((f, i) => {
      const ping = f.ping && f.ping !== 'none' ? ` [${f.ping}]` : '';
      return `**${i + 1}. [${(f.platform || 'FEED').toUpperCase()}]** ${f.name || 'Account'} ➔ <#${f.channelId}>${ping}`;
    }).join('\n');
    embed.addFields({ name: 'Configured Social Feeds', value: list.slice(0, 1024) });
  }

  embed.addFields({
    name: '📝 Message Variables Supported',
    value: '`{author}` — Creator/Channel name\n`{title}` — Post title\n`{url}` — Link to content\n`{platform}` — Platform name',
    inline: false
  });

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

  const urlHints = {
    YOUTUBE:   '`https://www.youtube.com/feeds/videos.xml?channel_id=UCxxxxxx`',
    FACEBOOK:  '`https://www.facebook.com/feeds/page.php?id=PAGEID&format=rss20`',
    INSTAGRAM: '`https://rsshub.app/instagram/user/USERNAME`',
    TIKTOK:    '`https://rsshub.app/tiktok/user/@USERNAME`',
  };
  
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`⚙️ ${platform} Setup`)
    .setDescription(`Configure notifications for ${platform}.\nVariables: \`{author}\`, \`{title}\`, \`{url}\`, \`{platform}\``)
    .addFields(
      { name: 'Channel', value: config.channelId ? `<#${config.channelId}>` : 'Not set', inline: true },
      { name: 'RSS Link', value: config.url ? `\`${config.url}\`` : 'Not set', inline: true },
      { name: 'Message', value: config.message ? `\`\`\`text\n${config.message.substring(0, 1000)}\n\`\`\`` : 'Default notification message', inline: false },
      { name: '\u200b', value: `📌 **URL Format for ${platform}:**\n${urlHints[platform] ?? 'Any valid RSS/Atom feed URL'}`, inline: false }
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
    const mainDash = await getMainDashboard(interaction.guild.id);
    await interaction.reply({ ...mainDash, ephemeral: true });
  },
};

