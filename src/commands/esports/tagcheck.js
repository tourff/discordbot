// src/commands/esports/tagcheck.js
// Verifies that users mention the required number of teammates in a channel
'use strict';

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const supabase = require('../../config/supabase');

module.exports = {
  category: 'esports',
  data: new SlashCommandBuilder()
    .setName('tagcheck')
    .setDescription('Set up channels where users must tag the required number of teammates.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub.setName('set')
        .setDescription('Set a channel as a tagcheck channel.')
        .addChannelOption(o => o.setName('channel').setDescription('Channel to set as tagcheck').setRequired(true))
        .addIntegerOption(o => o.setName('mentions').setDescription('Required mentions (default: 4)').setMinValue(1).setMaxValue(10))
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Remove tagcheck from a channel.')
        .addChannelOption(o => o.setName('channel').setDescription('Channel to remove tagcheck from').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('config')
        .setDescription('View all tagcheck channels.')
    )
    .addSubcommand(sub =>
      sub.setName('autodelete')
        .setDescription('Toggle autodelete of wrong-format messages in a tagcheck channel.')
        .addChannelOption(o => o.setName('channel').setDescription('Channel to toggle autodelete for').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'set') {
      const channel = interaction.options.getChannel('channel');
      const mentions = interaction.options.getInteger('mentions') ?? 4;

      if (!channel.permissionsFor(interaction.guild.members.me).has(['SendMessages', 'ManageMessages'])) {
        return interaction.reply({ content: `❌ I need **Send Messages** and **Manage Messages** in ${channel}.`, ephemeral: true });
      }

      const { error } = await supabase.from('tagcheck_config').upsert({
        guild_id: guildId,
        channel_id: channel.id,
        required_mentions: mentions,
        delete_after: false,
      }, { onConflict: 'channel_id' });

      if (error) {
        console.error('[tagcheck set]', error);
        return interaction.reply({ content: '❌ Failed to save tagcheck config.', ephemeral: true });
      }

      await interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0x00e5ff)
          .setTitle('✅ TagCheck Set')
          .setDescription(`${channel} is now a tagcheck channel.\nRequired mentions: **${mentions}**\n\nUsers must tag **${mentions}** teammate(s) in every message.`)
          .setTimestamp()
        ],
      });

    } else if (sub === 'remove') {
      const channel = interaction.options.getChannel('channel');
      const { data, error } = await supabase.from('tagcheck_config').delete().eq('channel_id', channel.id).select();

      if (error || !data?.length) {
        return interaction.reply({ content: `❌ ${channel} is not a tagcheck channel.`, ephemeral: true });
      }

      await interaction.reply({ content: `✅ Removed tagcheck from ${channel}.` });

    } else if (sub === 'config') {
      const { data: records } = await supabase.from('tagcheck_config').select('*').eq('guild_id', guildId);

      if (!records?.length) return interaction.reply({ content: '📭 No tagcheck channels configured.', ephemeral: true });

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('✅ TagCheck Config')
        .setDescription(records.map((r, i) =>
          `\`${i + 1}.\` <#${r.channel_id}> — **${r.required_mentions}** mentions | AutoDelete: ${r.delete_after ? '✅' : '❌'}`
        ).join('\n'))
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });

    } else if (sub === 'autodelete') {
      const channel = interaction.options.getChannel('channel');
      const { data: record } = await supabase.from('tagcheck_config').select('*').eq('channel_id', channel.id).single();

      if (!record) return interaction.reply({ content: `❌ ${channel} is not a tagcheck channel.`, ephemeral: true });

      const newVal = !record.delete_after;
      await supabase.from('tagcheck_config').update({ delete_after: newVal }).eq('channel_id', channel.id);

      await interaction.reply({ content: `✅ AutoDelete for ${channel} turned **${newVal ? 'ON' : 'OFF'}**.` });
    }
  },
};
