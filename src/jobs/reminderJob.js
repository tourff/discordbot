// src/jobs/reminderJob.js
'use strict';

const cron = require('node-cron');
const supabase = require('../config/supabase');
const { EmbedBuilder } = require('discord.js');

module.exports = function startReminderCron(client) {
  // Run every 10 seconds
  cron.schedule('*/10 * * * * *', async () => {
    try {
      const now = new Date().toISOString();

      // Fetch due reminders
      const { data: reminders, error } = await supabase
        .from('reminders')
        .select('*')
        .lte('remind_at', now);

      if (error) {
        console.error('[ReminderCron] Supabase fetch error:', error);
        return;
      }

      if (!reminders || reminders.length === 0) return;

      for (const reminder of reminders) {
        try {
          const user = await client.users.fetch(reminder.user_id).catch(() => null);
          if (!user) continue;

          const embed = new EmbedBuilder()
            .setColor(0x00e5ff)
            .setTitle('⏰ Reminder')
            .setDescription(`**Note:**\n${reminder.note}`)
            .addFields({ name: 'Channel', value: `<#${reminder.channel_id}>` })
            .setTimestamp();

          // Try to DM first, fallback to channel
          let sent = false;
          try {
            await user.send({ embeds: [embed] });
            sent = true;
          } catch (e) {
            // User has DMs closed
          }

          if (!sent) {
            try {
              const channel = await client.channels.fetch(reminder.channel_id).catch(() => null);
              if (channel) {
                await channel.send({ content: `${user}`, embeds: [embed] });
              }
            } catch (e) {
              console.error(`[ReminderCron] Failed to send fallback to channel ${reminder.channel_id}`);
            }
          }

          // Delete from DB after firing
          await supabase.from('reminders').delete().eq('id', reminder.id);
        } catch (err) {
          console.error(`[ReminderCron] Error processing reminder ${reminder.id}:`, err);
        }
      }
    } catch (err) {
      console.error('[ReminderCron] General error:', err);
    }
  });

  console.log('[Cron] Reminder job started (checks every 10s).');
};
