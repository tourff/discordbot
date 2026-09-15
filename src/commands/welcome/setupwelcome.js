const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { getWelcomeChannelId, getWelcomeMessage, getWelcomeImageUrl, setSetting } = require('../../modules/settings');
const { resolveEmojis } = require('../../modules/emojiResolver');
const { cleanMediaUrl } = require('../../modules/mediaHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setupwelcome')
    .setDescription('Configure the welcome system or set settings directly.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Directly set the welcome announcement channel')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Directly set the custom welcome message (supports {user}, {server}, {count})')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('banner')
        .setDescription('Directly set the media banner (Image, GIF, or Video URL)')
        .setRequired(false)
    ),
  
  async execute(interaction) {
    const directChannel = interaction.options.getChannel('channel');
    const directMessage = interaction.options.getString('message');
    const directBanner  = interaction.options.getString('banner');

    // ── Direct setting execution if any option is provided ──
    if (directChannel || directMessage !== null || directBanner !== null) {
      await interaction.deferReply({ ephemeral: true });
      const updates = [];

      if (directChannel) {
        await setSetting(interaction.guild.id, 'WELCOME_CHANNEL_ID', directChannel.id);
        updates.push(`📢 **Channel:** <#${directChannel.id}>`);
      }

      if (directMessage !== null) {
        await setSetting(interaction.guild.id, 'WELCOME_MESSAGE', directMessage);
        const preview = resolveEmojis(directMessage, interaction.guild, interaction.client)
          .replace(/{user}/g, `${interaction.member}`)
          .replace(/{server}/g, interaction.guild.name);
        updates.push(`📝 **Welcome Message:** Updated successfully!\n> ${preview.substring(0, 300)}`);
      }

      if (directBanner !== null) {
        const cleaned = cleanMediaUrl(directBanner);
        if (cleaned) {
          await setSetting(interaction.guild.id, 'WELCOME_IMAGE_URL', cleaned);
          updates.push(`🖼️ **Media Banner:** [View Media](${cleaned})`);
        } else {
          const { deleteSetting } = require('../../modules/settings');
          await deleteSetting(interaction.guild.id, 'WELCOME_IMAGE_URL');
          updates.push(`🖼️ **Media Banner:** Removed.`);
        }
      }

      const confirmEmbed = new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle('✅ Welcome Configuration Saved')
        .setDescription(updates.join('\n\n'))
        .setFooter({ text: 'Saved to database • Takes effect immediately' })
        .setTimestamp();

      return interaction.editReply({ embeds: [confirmEmbed] });
    }

    // ── Interactive Dashboard mode if no options passed ──
    const channelId = await getWelcomeChannelId(interaction.guild.id);
    const message = await getWelcomeMessage(interaction.guild.id) || "Default Welcome Message";
    const imageUrl = await getWelcomeImageUrl(interaction.guild.id);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('👋 Welcome System Configuration')
      .setDescription('Use the menu and buttons below or run `/setupwelcome` with options to customize directly.')
      .addFields(
        { name: 'Current Channel', value: channelId ? `<#${channelId}>` : 'Not set', inline: true },
        { name: 'Media / Banner URL', value: imageUrl ? `[Click to view media](${imageUrl})\n\`${imageUrl.substring(0, 60)}${imageUrl.length > 60 ? '...' : ''}\`` : 'Server Banner / None', inline: true },
        { name: 'Current Message', value: `\`\`\`text\n${message.substring(0, 1000)}\n\`\`\``, inline: false }
      );

    if (imageUrl && (imageUrl.endsWith('.png') || imageUrl.endsWith('.jpg') || imageUrl.endsWith('.gif') || imageUrl.endsWith('.webp') || imageUrl.includes('giphy.com/media'))) {
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
