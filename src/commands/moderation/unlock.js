// src/commands/moderation/unlock.js
'use strict';

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  category: 'moderation',
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlock a previously locked channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption(o =>
      o.setName('channel')
        .setDescription('Channel to unlock (defaults to current channel)')
    )
    .addStringOption(o =>
      o.setName('reason')
        .setDescription('Reason for unlocking')
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
        SendMessages: null,
        AddReactions: null,
      }, { reason: `Unlocked by ${interaction.user.tag}: ${reason}` });

      const embed = new EmbedBuilder()
        .setColor(0x00ff88)
        .setTitle('🔓 Channel Unlocked')
        .setDescription(`${channel} has been unlocked.`)
        .addFields(
          { name: 'Reason', value: reason },
          { name: 'Unlocked by', value: `${interaction.user}` }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      if (channel.id !== interaction.channel.id) {
        await channel.send({ embeds: [embed] }).catch(() => null);
      }
    } catch (err) {
      console.error('[unlock]', err);
      await interaction.editReply({ content: `❌ Failed to unlock channel: ${err.message}` });
    }
  },
};
