// src/commands/utility/category.js
// Category management — hide, unhide, delete, nuke a category
'use strict';

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
  category: 'utility',
  data: new SlashCommandBuilder()
    .setName('category')
    .setDescription('Manage a category — hide, unhide, delete, or nuke it.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand(sub =>
      sub.setName('hide')
        .setDescription('Hide a category and all its channels from @everyone.')
        .addStringOption(o => o.setName('name').setDescription('Category name').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('unhide')
        .setDescription('Unhide a category and all its channels.')
        .addStringOption(o => o.setName('name').setDescription('Category name').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('delete')
        .setDescription('Delete a category and all channels under it.')
        .addStringOption(o => o.setName('name').setDescription('Category name').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('nuke')
        .setDescription('Nuke a category — clone all channels and delete originals (clears all messages).')
        .addStringOption(o => o.setName('name').setDescription('Category name').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const catName = interaction.options.getString('name').toLowerCase();

    // Find the category
    const category = interaction.guild.channels.cache.find(
      c => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === catName
    );

    if (!category) {
      return interaction.reply({ content: `❌ No category named \`${catName}\` found.`, ephemeral: true });
    }

    const channels = category.children.cache;

    if (channels.size === 0 && sub !== 'delete') {
      return interaction.reply({ content: `❌ **${category.name}** has no channels.`, ephemeral: true });
    }

    await interaction.deferReply();

    if (sub === 'hide') {
      let success = 0, failed = 0;
      for (const [, ch] of channels) {
        try {
          await ch.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: false });
          success++;
        } catch { failed++; }
      }
      await interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor(0xff4444)
          .setTitle('🙈 Category Hidden')
          .setDescription(`**${category.name}** — ${success} channel(s) hidden, ${failed} failed.`)
          .setTimestamp()
        ],
      });

    } else if (sub === 'unhide') {
      let success = 0, failed = 0;
      for (const [, ch] of channels) {
        try {
          await ch.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: null });
          success++;
        } catch { failed++; }
      }
      await interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor(0x00ff88)
          .setTitle('👁️ Category Unhidden')
          .setDescription(`**${category.name}** — ${success} channel(s) unhidden, ${failed} failed.`)
          .setTimestamp()
        ],
      });

    } else if (sub === 'delete') {
      let success = 0, failed = 0;
      for (const [, ch] of channels) {
        try { await ch.delete(`Deleted by ${interaction.user.tag}`); success++; } catch { failed++; }
      }
      try { await category.delete(`Deleted by ${interaction.user.tag}`); } catch { failed++; }

      await interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle('💥 Category Deleted')
          .setDescription(`**${category.name}** deleted. (${success} channels removed, ${failed} failed)`)
          .setTimestamp()
        ],
      });

    } else if (sub === 'nuke') {
      let success = 0, failed = 0;
      for (const [, ch] of channels) {
        try {
          const position = ch.position;
          const clone = await ch.clone({ reason: `Nuked by ${interaction.user.tag}` });
          await ch.delete();
          await clone.setPosition(position).catch(() => null);
          success++;
        } catch { failed++; }
      }
      await interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor(0xff8800)
          .setTitle('💣 Category Nuked')
          .setDescription(`**${category.name}** nuked! All channels cloned & re-created. (${success} success, ${failed} failed)\n\n*All previous messages are gone.*`)
          .setTimestamp()
        ],
      });
    }
  },
};
