// src/commands/moderation/lock.js
'use strict';

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  category: 'moderation',
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Lock a channel so @everyone cannot send messages.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption(o =>
      o.setName('channel')
        .setDescription('Channel to lock (defaults to current channel)')
    )
    .addStringOption(o =>
      o.setName('reason')
        .setDescription('Reason for locking')
    ),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!channel.permissionsFor(interaction.guild.members.me).has('ManageChannels')) {
      return interaction.reply({ content: '❌ I need **Manage Channels** permission.', ephemeral: true });
    }

    await interaction.deferReply();

    try {
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        SendMessages: false,
        AddReactions: false,
      }, { reason: `Locked by ${interaction.user.tag}: ${reason}` });

      const embed = new EmbedBuilder()
        .setColor(0xff4444)
        .setTitle('🔒 Channel Locked')
        .setDescription(`${channel} has been locked.`)
        .addFields(
          { name: 'Reason', value: reason },
          { name: 'Locked by', value: `${interaction.user}` }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      // Send notice in the locked channel if it's a different channel
      if (channel.id !== interaction.channel.id) {
        await channel.send({ embeds: [embed] }).catch(() => null);
      }
    } catch (err) {
      console.error('[lock]', err);
      await interaction.editReply({ content: `❌ Failed to lock channel: ${err.message}` });
    }
  },
};
