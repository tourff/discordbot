// src/commands/esports/ssverify.js
'use strict';

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { setSetting, getSetting } = require('../../modules/settings');

module.exports = {
  category: 'esports',
  data: new SlashCommandBuilder()
    .setName('ssverify')
    .setDescription('Screenshot verification system.')
    .addSubcommand(sub =>
      sub.setName('submit')
        .setDescription('Submit a screenshot for verification.')
        .addAttachmentOption(o => o.setName('image').setDescription('The screenshot').setRequired(true))
        .addStringOption(o => o.setName('team_name').setDescription('Your team name').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('setup')
        .setDescription('Set the SS verification log channel and role to assign.')
        .addChannelOption(o => o.setName('channel').setDescription('The channel where admins will verify SS').setRequired(true))
        .addRoleOption(o => o.setName('role').setDescription('Role to assign upon approval').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    // ── SUB: SETUP ────────────────────────────────────────────────────────────
    if (sub === 'setup') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({ content: '❌ You need Manage Server permission to setup SS verification.', ephemeral: true });
      }

      const channel = interaction.options.getChannel('channel');
      const role = interaction.options.getRole('role');

      await setSetting(guildId, 'SS_VERIFY_CHANNEL', channel.id);
      await setSetting(guildId, 'SS_VERIFY_ROLE', role.id);

      await interaction.reply({ content: `✅ SS Verification configured successfully:\n• Logs channel: ${channel}\n• Role to assign: ${role}`, ephemeral: true });
      return;
    }

    // ── SUB: SUBMIT ───────────────────────────────────────────────────────────
    if (sub === 'submit') {
      await interaction.deferReply({ ephemeral: true });

      const image = interaction.options.getAttachment('image');
      const teamName = interaction.options.getString('team_name');

      if (!image.contentType || !image.contentType.startsWith('image/')) {
        return interaction.editReply({ content: '❌ Please upload a valid image file.' });
      }

      const channelId = await getSetting(guildId, 'SS_VERIFY_CHANNEL');
      const roleId = await getSetting(guildId, 'SS_VERIFY_ROLE');

      if (!channelId || !roleId) {
        return interaction.editReply({ content: '❌ SS Verification is not set up in this server. Please ask an admin to configure it using `/ssverify setup`.' });
      }

      const logChannel = interaction.guild.channels.cache.get(channelId);
      if (!logChannel) {
        return interaction.editReply({ content: '❌ SS Verification log channel not found. Please contact an admin.' });
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

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`ss_approve_${interaction.user.id}`)
          .setLabel('Approve ✅')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`ss_reject_${interaction.user.id}`)
          .setLabel('Reject ❌')
          .setStyle(ButtonStyle.Danger)
      );

      await logChannel.send({ embeds: [embed], components: [row] });

      await interaction.editReply({ content: '✅ Your screenshot has been submitted for verification. Staff will review it shortly.' });
    }
  },
};
