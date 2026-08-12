// src/commands/esports/ssverify.js
'use strict';

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  category: 'esports',
  data: new SlashCommandBuilder()
    .setName('ssverify')
    .setDescription('Screenshot verification system for tournaments.')
    .addSubcommand(sub =>
      sub.setName('submit')
        .setDescription('Submit a screenshot for verification.')
        .addAttachmentOption(o => o.setName('image').setDescription('The screenshot').setRequired(true))
        .addStringOption(o => o.setName('team_name').setDescription('Your team name').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('setup')
        .setDescription('Set the SS verification log channel.')
        .addChannelOption(o => o.setName('channel').setDescription('The channel where admins will verify SS').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'setup') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({ content: '❌ You need Manage Server permission to setup SS verification.', ephemeral: true });
      }

      const channel = interaction.options.getChannel('channel');

      const { setSetting } = require('../../modules/settings');
      await setSetting(guildId, 'SS_VERIFY_CHANNEL', channel.id);

      await interaction.reply({ content: `✅ SS Verification logs will now be sent to ${channel}.`, ephemeral: true });
      return;
    }

    if (sub === 'submit') {
      await interaction.deferReply({ ephemeral: true });

      const image = interaction.options.getAttachment('image');
      const teamName = interaction.options.getString('team_name');

      if (!image.contentType || !image.contentType.startsWith('image/')) {
        return interaction.editReply({ content: '❌ Please upload a valid image file.' });
      }

      const { getSetting } = require('../../modules/settings');
      const channelId = await getSetting(guildId, 'SS_VERIFY_CHANNEL');

      if (!channelId) {
        return interaction.editReply({ content: '❌ SS Verification is not set up in this server. Please contact an admin.' });
      }

      const logChannel = interaction.guild.channels.cache.get(channelId);
      if (!logChannel) {
        return interaction.editReply({ content: '❌ SS Verification channel not found. Please contact an admin.' });
      }

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('📸 New SS Verification')
        .addFields(
          { name: 'Team', value: teamName, inline: true },
          { name: 'Submitted by', value: `${interaction.user} (\`${interaction.user.id}\`)`, inline: true }
        )
        .setImage(image.url)
        .setTimestamp();

      await logChannel.send({ embeds: [embed] });

      await interaction.editReply({ content: '✅ Your screenshot has been submitted for verification.' });
    }
  },
};
