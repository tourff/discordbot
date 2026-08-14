// src/commands/moderation/purge.js
'use strict';

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  category: 'moderation',
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Bulk delete messages or manage message elements.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand(sub =>
      sub.setName('amount')
        .setDescription('Delete a specific number of messages.')
        .addIntegerOption(o => o.setName('count').setDescription('Number of messages to delete (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
    )
    .addSubcommand(sub =>
      sub.setName('user')
        .setDescription('Delete messages from a specific user.')
        .addUserOption(o => o.setName('target').setDescription('The user whose messages to delete').setRequired(true))
        .addIntegerOption(o => o.setName('count').setDescription('How many messages to search through (max 100)').setMinValue(1).setMaxValue(100))
    )
    .addSubcommand(sub =>
      sub.setName('bots')
        .setDescription('Delete bot messages only.')
        .addIntegerOption(o => o.setName('count').setDescription('How many messages to search through (max 100)').setMinValue(1).setMaxValue(100))
    )
    .addSubcommand(sub =>
      sub.setName('contains')
        .setDescription('Delete messages containing specific text.')
        .addStringOption(o => o.setName('text').setDescription('Text to search for').setRequired(true))
        .addIntegerOption(o => o.setName('count').setDescription('How many messages to search through (max 100)').setMinValue(1).setMaxValue(100))
    )
    .addSubcommand(sub =>
      sub.setName('embeds')
        .setDescription('Delete messages containing embeds.')
        .addIntegerOption(o => o.setName('count').setDescription('How many messages to search through (max 100)').setMinValue(1).setMaxValue(100))
    )
    .addSubcommand(sub =>
      sub.setName('files')
        .setDescription('Delete messages containing attachments/files.')
        .addIntegerOption(o => o.setName('count').setDescription('How many messages to search through (max 100)').setMinValue(1).setMaxValue(100))
    )
    .addSubcommand(sub =>
      sub.setName('images')
        .setDescription('Delete messages containing embeds or attachments.')
        .addIntegerOption(o => o.setName('count').setDescription('How many messages to search through (max 100)').setMinValue(1).setMaxValue(100))
    )
    .addSubcommand(sub =>
      sub.setName('reactions')
        .setDescription('Remove all reactions from recent messages.')
        .addIntegerOption(o => o.setName('count').setDescription('How many messages to clear reactions from (max 100)').setMinValue(1).setMaxValue(100))
    )
    .addSubcommand(sub =>
      sub.setName('selfclean')
        .setDescription("Delete the bot's own messages in this channel.")
        .addIntegerOption(o => o.setName('count').setDescription('How many messages to search through (max 100)').setMinValue(1).setMaxValue(100))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (!interaction.channel.permissionsFor(interaction.guild.members.me).has('ManageMessages') && sub !== 'reactions') {
      return interaction.reply({ content: '❌ I need **Manage Messages** permission in this channel.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    let filter;
    const count = interaction.options.getInteger('count') || 100;

    switch (sub) {
      case 'amount':
        filter = () => true;
        break;
      case 'user': {
        const target = interaction.options.getUser('target');
        filter = m => m.author.id === target.id;
        break;
      }
      case 'bots':
        filter = m => m.author.bot;
        break;
      case 'contains': {
        const text = interaction.options.getString('text').toLowerCase();
        filter = m => m.content.toLowerCase().includes(text);
        break;
      }
      case 'embeds':
        filter = m => m.embeds.length > 0;
        break;
      case 'files':
        filter = m => m.attachments.size > 0;
        break;
      case 'images':
        filter = m => m.embeds.length > 0 || m.attachments.size > 0;
        break;
      case 'selfclean':
        filter = m => m.author.id === interaction.client.user.id;
        break;
    }

    try {
      // Fetch messages
      const messages = await interaction.channel.messages.fetch({ limit: count });

      // ── SUB: REACTIONS ──────────────────────────────────────────────────────
      if (sub === 'reactions') {
        let clearedCount = 0;
        for (const [, msg] of messages) {
          if (msg.reactions.cache.size > 0) {
            await msg.reactions.removeAll().catch(() => null);
            clearedCount++;
          }
        }

        const embed = new EmbedBuilder()
          .setColor(0x00ff88)
          .setTitle('🗑️ Reactions Cleared')
          .setDescription(`Successfully removed reactions from **${clearedCount}** message(s).`)
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      }

      // ── DELETION SUBCOMMANDS ─────────────────────────────────────────────────
      const toDelete = sub === 'amount'
        ? [...messages.values()].slice(0, count)
        : [...messages.values()].filter(filter).slice(0, count);

      // Discord only allows bulk-delete of messages < 14 days old
      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      const deletable = toDelete.filter(m => m.createdTimestamp > twoWeeksAgo);

      if (deletable.length === 0) {
        return interaction.editReply({ content: '❌ No messages found to delete (messages older than 14 days cannot be bulk-deleted).' });
      }

      const deleted = await interaction.channel.bulkDelete(deletable, true);

      const embed = new EmbedBuilder()
        .setColor(0xff4444)
        .setTitle('🗑️ Purge Complete')
        .addFields(
          { name: 'Deleted', value: `${deleted.size} message(s)`, inline: true },
          { name: 'Channel', value: `${interaction.channel}`, inline: true },
          { name: 'By', value: `${interaction.user}`, inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('[purge]', err);
      await interaction.editReply({ content: `❌ Failed to delete messages: ${err.message}` });
    }
  },
};
