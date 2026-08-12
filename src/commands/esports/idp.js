// src/commands/esports/idp.js
// Share Room ID/Password as a beautiful embed — auto-deletes after 30 minutes
'use strict';

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  category: 'esports',
  data: new SlashCommandBuilder()
    .setName('idp')
    .setDescription('Share Room ID/Password as an embed. Auto-deletes after 30 minutes.')
    .addStringOption(o => o.setName('room_id').setDescription('Room ID').setRequired(true).setMaxLength(100))
    .addStringOption(o => o.setName('password').setDescription('Room Password').setRequired(true).setMaxLength(100))
    .addStringOption(o => o.setName('map').setDescription('Map name (e.g. Erangel, Miramar)').setRequired(true).setMaxLength(100))
    .addRoleOption(o => o.setName('ping_role').setDescription('Role to ping with this IDP (optional)')),

  async execute(interaction) {
    const roomId   = interaction.options.getString('room_id');
    const password = interaction.options.getString('password');
    const map      = interaction.options.getString('map');
    const pingRole = interaction.options.getRole('ping_role');

    await interaction.deferReply({ ephemeral: true });

    const deleteAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    const embed = new EmbedBuilder()
      .setColor(0x00e5ff)
      .setTitle('🎮 Room Details')
      .setThumbnail(interaction.guild.iconURL() || interaction.client.user.displayAvatarURL())
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .addFields(
        { name: '🔑 Room ID', value: `\`${roomId}\``, inline: true },
        { name: '🔒 Password', value: `\`${password}\``, inline: true },
        { name: '🗺️ Map', value: `\`${map}\``, inline: true },
      )
      .setFooter({ text: `Auto-deletes at` })
      .setTimestamp(deleteAt);

    const content = pingRole ? pingRole.toString() : undefined;

    const msg = await interaction.channel.send({
      content,
      embeds: [embed],
      allowedMentions: { roles: pingRole ? [pingRole.id] : [] },
    });

    await interaction.editReply({ content: '✅ IDP sent! It will auto-delete in 30 minutes.' });

    // Auto-delete after 30 minutes
    setTimeout(async () => {
      await msg.delete().catch(() => null);
    }, 30 * 60 * 1000);
  },
};
