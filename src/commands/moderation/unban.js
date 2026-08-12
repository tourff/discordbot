// src/commands/moderation/unban.js
'use strict';

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  category: 'moderation',
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a member from the server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption(o =>
      o.setName('user_id')
        .setDescription('The Discord User ID of the banned member')
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName('reason')
        .setDescription('Reason for unbanning')
    ),

  async execute(interaction) {
    const userId = interaction.options.getString('user_id').trim();
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!/^\d{17,20}$/.test(userId)) {
      return interaction.reply({ content: '❌ Invalid User ID. Please provide a valid Discord User ID (17-20 digits).', ephemeral: true });
    }

    await interaction.deferReply();

    try {
      const ban = await interaction.guild.bans.fetch(userId).catch(() => null);

      if (!ban) {
        return interaction.editReply({ content: `❌ No ban found for user ID \`${userId}\`.` });
      }

      await interaction.guild.members.unban(userId, `Unbanned by ${interaction.user.tag}: ${reason}`);

      const embed = new EmbedBuilder()
        .setColor(0x00ff88)
        .setTitle('✅ Member Unbanned')
        .addFields(
          { name: 'User', value: `${ban.user.tag} (\`${ban.user.id}\`)`, inline: true },
          { name: 'Unbanned by', value: `${interaction.user}`, inline: true },
          { name: 'Reason', value: reason }
        )
        .setThumbnail(ban.user.displayAvatarURL())
        .setTimestamp();

      if (ban.reason) {
        embed.addFields({ name: 'Original Ban Reason', value: ban.reason });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('[unban]', err);
      await interaction.editReply({ content: `❌ Failed to unban: ${err.message}` });
    }
  },
};
