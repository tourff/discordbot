// src/commands/esports/slotmanager.js
'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const supabase = require('../../config/supabase');

module.exports = {
  category: 'esports',
  data: new SlashCommandBuilder()
    .setName('slotmanager')
    .setDescription('Manage your esports tournament or scrim slots.')
    .addSubcommand(sub =>
      sub.setName('cancel')
        .setDescription('Cancel your registration for an active scrim or tournament.')
    )
    .addSubcommand(sub =>
      sub.setName('view')
        .setDescription('View your current registered slots.')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: true });

    if (sub === 'view') {
      const { data: scrimSlots } = await supabase.from('scrim_slots').select('*, scrims(name)').eq('user_id', interaction.user.id);
      const { data: tourneySlots } = await supabase.from('tourney_slots').select('*, tourneys(name)').eq('user_id', interaction.user.id);

      const embed = new EmbedBuilder().setColor(0x00FFB3).setTitle('🎮 Your Active Registrations');
      
      let desc = '';
      if (scrimSlots && scrimSlots.length > 0) {
        desc += '**Scrims:**\n' + scrimSlots.map(s => `- **${s.scrims.name}**: Slot #${s.slot_num} (${s.team_name})`).join('\n') + '\n\n';
      }
      if (tourneySlots && tourneySlots.length > 0) {
        desc += '**Tournaments:**\n' + tourneySlots.map(t => `- **${t.tourneys.name}**: Slot #${t.slot_num || 'Pending'} (${t.team_name})`).join('\n');
      }

      if (!desc) desc = 'You have no active registrations.';
      embed.setDescription(desc);
      await interaction.editReply({ embeds: [embed] });

    } else if (sub === 'cancel') {
      // Find active scrim registration for this user
      const { data: scrimSlots } = await supabase.from('scrim_slots').select('*, scrims(*)').eq('user_id', interaction.user.id);
      
      let cancelled = 0;

      if (scrimSlots && scrimSlots.length > 0) {
        for (const slot of scrimSlots) {
          if (slot.scrims.is_open) {
            await supabase.from('scrim_slots').delete().eq('id', slot.id);
            cancelled++;
          }
        }
      }

      const { data: tourneySlots } = await supabase.from('tourney_slots').select('*, tourneys(*)').eq('user_id', interaction.user.id);
      if (tourneySlots && tourneySlots.length > 0) {
        for (const slot of tourneySlots) {
          if (slot.tourneys.is_open) {
            await supabase.from('tourney_slots').delete().eq('id', slot.id);
            cancelled++;
          }
        }
      }

      if (cancelled > 0) {
        await interaction.editReply({ content: `✅ Cancelled **${cancelled}** active registration(s).` });
      } else {
        await interaction.editReply({ content: '❌ You have no active registrations that can be cancelled right now (some may be closed already).' });
      }
    }
  },
};
