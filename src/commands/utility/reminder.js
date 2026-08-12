// src/commands/utility/reminder.js
'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const supabase = require('../../config/supabase');

// ── Time parser helper ────────────────────────────────────────────────────────
// Supports: 30s, 5m, 2h, 1d, "2h 30m", etc.
function parseTime(input) {
  const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  const regex = /(\d+)\s*([smhd])/gi;
  let ms = 0;
  let match;
  while ((match = regex.exec(input)) !== null) {
    ms += parseInt(match[1]) * (units[match[2].toLowerCase()] || 0);
  }
  return ms;
}

module.exports = {
  category: 'utility',
  data: new SlashCommandBuilder()
    .setName('reminder')
    .setDescription('Set a reminder.')
    .addSubcommand(sub =>
      sub.setName('set')
        .setDescription('Set a new reminder.')
        .addStringOption(o => o.setName('time').setDescription('When to remind (e.g. 30m, 2h, 1d)').setRequired(true))
        .addStringOption(o => o.setName('note').setDescription('What to remind you about').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('View your active reminders.')
    )
    .addSubcommand(sub =>
      sub.setName('cancel')
        .setDescription('Cancel a reminder by ID.')
        .addIntegerOption(o => o.setName('id').setDescription('Reminder ID to cancel').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'set') {
      const timeStr = interaction.options.getString('time');
      const note = interaction.options.getString('note');
      const ms = parseTime(timeStr);

      if (!ms || ms < 5000) {
        return interaction.reply({ content: '❌ Invalid time. Use formats like `30s`, `5m`, `2h`, `1d`.', ephemeral: true });
      }
      if (ms > 30 * 24 * 60 * 60 * 1000) {
        return interaction.reply({ content: '❌ Maximum reminder time is **30 days**.', ephemeral: true });
      }

      const remindAt = new Date(Date.now() + ms);

      const { data, error } = await supabase.from('reminders').insert({
        guild_id: interaction.guild.id,
        user_id: interaction.user.id,
        channel_id: interaction.channel.id,
        note,
        remind_at: remindAt.toISOString(),
      }).select().single();

      if (error) {
        console.error('[reminder set]', error);
        return interaction.reply({ content: '❌ Failed to save reminder.', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor(0x00ff88)
        .setTitle('⏰ Reminder Set!')
        .addFields(
          { name: 'Note', value: note },
          { name: 'Fires at', value: `<t:${Math.floor(remindAt.getTime() / 1000)}:F> (<t:${Math.floor(remindAt.getTime() / 1000)}:R>)` },
          { name: 'ID', value: `\`${data.id}\`` }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });

    } else if (sub === 'list') {
      const { data: reminders, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', interaction.user.id)
        .order('remind_at', { ascending: true })
        .limit(10);

      if (error || !reminders?.length) {
        return interaction.reply({ content: '📭 You have no active reminders.', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('⏰ Your Reminders')
        .setDescription(reminders.map((r, i) =>
          `\`${r.id}\` — **${r.note.slice(0, 50)}** (<t:${Math.floor(new Date(r.remind_at).getTime() / 1000)}:R>)`
        ).join('\n'))
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });

    } else if (sub === 'cancel') {
      const id = interaction.options.getInteger('id');

      const { data, error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id)
        .eq('user_id', interaction.user.id)
        .select();

      if (error || !data?.length) {
        return interaction.reply({ content: `❌ Reminder \`${id}\` not found or doesn't belong to you.`, ephemeral: true });
      }

      await interaction.reply({ content: `✅ Reminder \`${id}\` cancelled.`, ephemeral: true });
    }
  },
};
