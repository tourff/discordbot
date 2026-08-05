// src/commands/moderation/mute.js
// Uses Discord's built-in Timeout feature (communication_disabled_until).

'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createModCase, logModAction }              = require('../../modules/modHelper');

// Duration presets in milliseconds
const DURATIONS = {
  '60s':  60 * 1000,
  '5m':   5 * 60 * 1000,
  '10m':  10 * 60 * 1000,
  '30m':  30 * 60 * 1000,
  '1h':   60 * 60 * 1000,
  '6h':   6 * 60 * 60 * 1000,
  '12h':  12 * 60 * 60 * 1000,
  '1d':   24 * 60 * 60 * 1000,
  '1w':   7 * 24 * 60 * 60 * 1000,
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Timeout (mute) a member using Discord\'s native timeout.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(opt =>
      opt.setName('user').setDescription('The member to mute.').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('duration')
        .setDescription('Mute duration.')
        .setRequired(true)
        .addChoices(
          { name: '60 seconds', value: '60s' },
          { name: '5 minutes',  value: '5m'  },
          { name: '10 minutes', value: '10m' },
          { name: '30 minutes', value: '30m' },
          { name: '1 hour',     value: '1h'  },
          { name: '6 hours',    value: '6h'  },
          { name: '12 hours',   value: '12h' },
          { name: '1 day',      value: '1d'  },
          { name: '1 week',     value: '1w'  }
        )
    )
    .addStringOption(opt =>
      opt.setName('reason').setDescription('Reason for the mute.').setRequired(false)
    ),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const targetUser      = interaction.options.getUser('user');
    const durationKey     = interaction.options.getString('duration');
    const reason          = interaction.options.getString('reason') ?? 'No reason provided.';
    const durationMs      = DURATIONS[durationKey];

    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!targetMember) {
      return interaction.editReply({ content: '❌ That user is not in this server.' });
    }
    if (!targetMember.moderatable) {
      return interaction.editReply({ content: '❌ I cannot timeout that member.' });
    }

    await targetMember.timeout(durationMs, reason);

    const modCase = await createModCase({
      guildId:     interaction.guildId,
      userId:      targetUser.id,
      moderatorId: interaction.user.id,
      action:      'mute',
      reason:      `${reason} [Duration: ${durationKey}]`,
    });

    if (modCase) {
      await logModAction(interaction.guild, modCase, targetUser, interaction.user);
    }

    await interaction.editReply({
      content: `✅ **${targetUser.tag}** has been muted for **${durationKey}**. Case #${modCase?.id ?? '?'} created.`,
    });
  },
};
