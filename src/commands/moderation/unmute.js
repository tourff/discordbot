// src/commands/moderation/unmute.js

'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createModCase, logModAction }              = require('../../modules/modHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Remove the timeout (unmute) from a member.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(opt =>
      opt.setName('user').setDescription('The member to unmute.').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('reason').setDescription('Reason.').setRequired(false)
    ),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const targetUser  = interaction.options.getUser('user');
    const reason      = interaction.options.getString('reason') ?? 'No reason provided.';

    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!targetMember) {
      return interaction.editReply({ content: '❌ That user is not in this server.' });
    }

    if (!targetMember.isCommunicationDisabled()) {
      return interaction.editReply({ content: '❌ That member is not currently muted.' });
    }

    // Pass null to remove the timeout
    await targetMember.timeout(null, reason);

    const modCase = await createModCase({
      guildId:     interaction.guildId,
      userId:      targetUser.id,
      moderatorId: interaction.user.id,
      action:      'unmute',
      reason,
    });

    if (modCase) {
      await logModAction(interaction.guild, modCase, targetUser, interaction.user);
    }

    await interaction.editReply({
      content: `✅ **${targetUser.tag}** has been unmuted. Case #${modCase?.id ?? '?'} created.`,
    });
  },
};
