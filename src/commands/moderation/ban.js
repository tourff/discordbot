// src/commands/moderation/ban.js

'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createModCase, logModAction }              = require('../../modules/modHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(opt =>
      opt.setName('user').setDescription('The member to ban.').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('reason').setDescription('Reason for the ban.').setRequired(false)
    )
    .addIntegerOption(opt =>
      opt.setName('delete_days')
        .setDescription('Number of days of messages to delete (0-7).')
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false)
    ),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const targetUser  = interaction.options.getUser('user');
    const reason      = interaction.options.getString('reason') ?? 'No reason provided.';
    const deleteDays  = interaction.options.getInteger('delete_days') ?? 0;

    // DM user before ban
    const dmEmbed = {
      color: 0xed4245,
      title: `You were banned from ${interaction.guild.name}`,
      description: `**Reason:** ${reason}`,
      timestamp: new Date().toISOString(),
    };
    await targetUser.send({ embeds: [dmEmbed] }).catch(() => null);

    await interaction.guild.members.ban(targetUser.id, {
      reason,
      deleteMessageSeconds: deleteDays * 86400,
    });

    const modCase = await createModCase({
      guildId:     interaction.guildId,
      userId:      targetUser.id,
      moderatorId: interaction.user.id,
      action:      'ban',
      reason,
    });

    if (modCase) {
      await logModAction(interaction.guild, modCase, targetUser, interaction.user);
    }

    await interaction.editReply({
      content: `✅ **${targetUser.tag}** has been banned. Case #${modCase?.id ?? '?'} created.`,
    });
  },
};
