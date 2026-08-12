// src/commands/utility/autopurge.js
// Auto-delete all new messages in a channel after N seconds
'use strict';

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const supabase = require('../../config/supabase');

// ── Time parser (30s, 5m, 2h, etc.) ──────────────────────────────────────────
function parseSeconds(input) {
  const units = { s: 1, m: 60, h: 3600, d: 86400 };
  const regex = /(\d+)\s*([smhd])/gi;
  let total = 0;
  let match;
  while ((match = regex.exec(input)) !== null) {
    total += parseInt(match[1]) * (units[match[2].toLowerCase()] || 0);
  }
  return total;
}

function formatSeconds(s) {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

module.exports = {
  category: 'utility',
  data: new SlashCommandBuilder()
    .setName('autopurge')
    .setDescription('Auto-delete all new messages in a channel after a delay.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand(sub =>
      sub.setName('set')
        .setDescription('Set autopurge for a channel.')
        .addChannelOption(o => o.setName('channel').setDescription('Channel to autopurge').setRequired(true))
        .addStringOption(o => o.setName('delay').setDescription('Delete after (e.g. 30s, 5m, 2h)').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Remove autopurge from a channel.')
        .addChannelOption(o => o.setName('channel').setDescription('Channel to remove autopurge from').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('List all autopurge channels in this server.')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'set') {
      const channel = interaction.options.getChannel('channel');
      const delayStr = interaction.options.getString('delay');
      const seconds = parseSeconds(delayStr);

      if (seconds < 5) return interaction.reply({ content: '❌ Minimum delay is **5 seconds**.', ephemeral: true });
      if (seconds > 7 * 24 * 3600) return interaction.reply({ content: '❌ Maximum delay is **7 days**.', ephemeral: true });

      if (!channel.permissionsFor(interaction.guild.members.me).has('ManageMessages')) {
        return interaction.reply({ content: `❌ I need **Manage Messages** in ${channel}.`, ephemeral: true });
      }

      const { error } = await supabase.from('autopurge').upsert({
        guild_id: interaction.guild.id,
        channel_id: channel.id,
        delete_after_seconds: seconds,
      }, { onConflict: 'channel_id' });

      if (error) {
        console.error('[autopurge set]', error);
        return interaction.reply({ content: '❌ Failed to save autopurge config.', ephemeral: true });
      }

      await interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0x00ff88)
          .setTitle('✅ Autopurge Set')
          .setDescription(`All new messages in ${channel} will be deleted after **${formatSeconds(seconds)}**.`)
          .setTimestamp()
        ],
      });

    } else if (sub === 'remove') {
      const channel = interaction.options.getChannel('channel');

      const { data, error } = await supabase.from('autopurge').delete().eq('channel_id', channel.id).select();

      if (error || !data?.length) {
        return interaction.reply({ content: `❌ ${channel} is not an autopurge channel.`, ephemeral: true });
      }

      await interaction.reply({ content: `✅ Autopurge removed from ${channel}.` });

    } else if (sub === 'list') {
      const { data: records } = await supabase.from('autopurge').select('*').eq('guild_id', interaction.guild.id);

      if (!records?.length) return interaction.reply({ content: '📭 No autopurge channels set.', ephemeral: true });

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('🗑️ Autopurge Channels')
        .setDescription(records.map((r, i) =>
          `\`${i + 1}.\` <#${r.channel_id}> — delete after **${formatSeconds(r.delete_after_seconds)}**`
        ).join('\n'))
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
