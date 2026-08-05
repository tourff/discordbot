// src/commands/moderation/warn.js

'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createModCase, logModAction }              = require('../../modules/modHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Issue a formal warning to a member.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(opt =>
      opt.setName('user').setDescription('The member to warn.').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('reason').setDescription('Reason for the warning.').setRequired(true)
    ),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const targetUser = interaction.options.getUser('user');
    const reason     = interaction.options.getString('reason');

    const modCase = await createModCase({
      guildId:     interaction.guildId,
      userId:      targetUser.id,
      moderatorId: interaction.user.id,
      action:      'warn',
      reason,
    });

    // DM the warned user
    const dmEmbed = {
      color: 0xeb459e,
      title: `⚠️ You received a warning in ${interaction.guild.name}`,
      description: `**Reason:** ${reason}`,
      timestamp: new Date().toISOString(),
    };
    await targetUser.send({ embeds: [dmEmbed] }).catch(() => null);

    if (modCase) {
      await logModAction(interaction.guild, modCase, targetUser, interaction.user);
    }

    await interaction.editReply({
      content: `✅ **${targetUser.tag}** has been warned. Case #${modCase?.id ?? '?'} created.`,
    });
  },
};
