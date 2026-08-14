// src/commands/utility/voteremind.js
'use strict';

const { SlashCommandBuilder } = require('discord.js');
const supabase = require('../../config/supabase');

module.exports = {
  category: 'utility',
  data: new SlashCommandBuilder()
    .setName('voteremind')
    .setDescription('Toggle reminders when your vote eligibility expires.'),

  async execute(interaction) {
    const userId = interaction.user.id;

    // Check if user exists in votes table
    const { data: record, error } = await supabase
      .from('votes')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[voteremind]', error);
      return interaction.reply({ content: '❌ An error occurred checking your preferences.', ephemeral: true });
    }

    const currentReminder = record?.reminder || false;
    const newReminder = !currentReminder;

    const { error: upsertError } = await supabase
      .from('votes')
      .upsert({
        user_id: userId,
        reminder: newReminder,
        updated_at: new Date().toISOString()
      });

    if (upsertError) {
      console.error('[voteremind upsert]', upsertError);
      return interaction.reply({ content: '❌ Failed to update your preferences.', ephemeral: true });
    }

    await interaction.reply({
      content: `✅ Vote reminder has been turned **${newReminder ? 'ON' : 'OFF'}**!`,
      ephemeral: true
    });
  },
};
