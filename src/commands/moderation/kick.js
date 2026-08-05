// src/commands/moderation/kick.js

'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createModCase, logModAction }              = require('../../modules/modHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(opt =>
      opt.setName('user').setDescription('The member to kick.').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('reason').setDescription('Reason for the kick.').setRequired(false)
    ),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const targetUser   = interaction.options.getUser('user');
    const reason       = interaction.options.getString('reason') ?? 'No reason provided.';
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!targetMember) {
      return interaction.editReply({ content: '❌ That user is not in this server.' });
    }
    if (!targetMember.kickable) {
      return interaction.editReply({ content: '❌ I cannot kick that member (role hierarchy or missing permissions).' });
    }

    // DM user before kick so the DM can still be sent
    const dmEmbed = {
      color: 0xffa500,
      title: `You were kicked from ${interaction.guild.name}`,
      description: `**Reason:** ${reason}`,
      timestamp: new Date().toISOString(),
    };
    await targetUser.send({ embeds: [dmEmbed] }).catch(() => null);

    await targetMember.kick(reason);

    const modCase = await createModCase({
      guildId:     interaction.guildId,
      userId:      targetUser.id,
      moderatorId: interaction.user.id,
      action:      'kick',
      reason,
    });

    if (modCase) {
      await logModAction(interaction.guild, modCase, targetUser, interaction.user);
    }

    await interaction.editReply({
      content: `✅ **${targetUser.tag}** has been kicked. Case #${modCase?.id ?? '?'} created.`,
    });
  },
};
