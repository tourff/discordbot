// src/commands/utility/snipe.js
'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const snipeCache = require('../../modules/snipeCache');

module.exports = {
  category: 'utility',
  data: new SlashCommandBuilder()
    .setName('snipe')
    .setDescription('Show the last deleted message in this channel.')
    .addChannelOption(o => o.setName('channel').setDescription('Channel to snipe (defaults to current)')),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const snipe = snipeCache.get(channel.id);

    if (!snipe) {
      return interaction.reply({
        content: `❌ Nothing to snipe in ${channel}! (Cache resets on bot restart)`,
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setAuthor({ name: snipe.authorTag, iconURL: snipe.authorAvatar })
      .setDescription(snipe.content || '*No text content*')
      .addFields({ name: 'Channel', value: `${channel}`, inline: true })
      .setFooter({ text: `Deleted at` })
      .setTimestamp(snipe.deletedAt);

    if (snipe.attachmentUrl) embed.setImage(snipe.attachmentUrl);

    await interaction.reply({ embeds: [embed] });
  },
};
