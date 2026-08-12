// src/commands/esports/easytag.js
// Auto-convert user IDs to Discord mentions in a channel
'use strict';

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const supabase = require('../../config/supabase');

module.exports = {
  category: 'esports',
  data: new SlashCommandBuilder()
    .setName('easytag')
    .setDescription('Auto-convert user IDs to Discord mentions in a channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub.setName('set')
        .setDescription('Set a channel for easytag.')
        .addChannelOption(o => o.setName('channel').setDescription('Channel to set').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Remove easytag from a channel.')
        .addChannelOption(o => o.setName('channel').setDescription('Channel to remove').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('config')
        .setDescription('View all easytag channels.')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'set') {
      const channel = interaction.options.getChannel('channel');

      if (!channel.permissionsFor(interaction.guild.members.me).has(['SendMessages', 'ManageMessages'])) {
        return interaction.reply({ content: `❌ I need **Send Messages** and **Manage Messages** in ${channel}.`, ephemeral: true });
      }

      const { error } = await supabase.from('easytag_config').upsert({
        guild_id: guildId,
        channel_id: channel.id,
      }, { onConflict: 'channel_id' });

      if (error) {
        console.error('[easytag set]', error);
        return interaction.reply({ content: '❌ Failed to save easytag config. Table might not exist.', ephemeral: true });
      }

      await interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0x00e5ff)
          .setTitle('✅ EasyTag Set')
          .setDescription(`${channel} is now an easytag channel.\n\nAny user IDs posted in this channel will be automatically converted to mentions.`)
          .setTimestamp()
        ],
      });

    } else if (sub === 'remove') {
      const channel = interaction.options.getChannel('channel');
      const { data, error } = await supabase.from('easytag_config').delete().eq('channel_id', channel.id).select();

      if (error || !data?.length) {
        return interaction.reply({ content: `❌ ${channel} is not an easytag channel.`, ephemeral: true });
      }

      await interaction.reply({ content: `✅ Removed easytag from ${channel}.` });

    } else if (sub === 'config') {
      const { data: records } = await supabase.from('easytag_config').select('*').eq('guild_id', guildId);

      if (!records?.length) return interaction.reply({ content: '📭 No easytag channels configured.', ephemeral: true });

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('✅ EasyTag Config')
        .setDescription(records.map((r, i) => `\`${i + 1}.\` <#${r.channel_id}>`).join('\n'))
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
