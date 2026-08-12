// src/jobs/autopurgeJob.js
'use strict';

const cron = require('node-cron');
const supabase = require('../config/supabase');

module.exports = function startAutopurgeCron(client) {
  // Run every 1 minute
  cron.schedule('* * * * *', async () => {
    try {
      const { data: configs, error } = await supabase.from('autopurge').select('*');
      if (error || !configs || configs.length === 0) return;

      const now = Date.now();

      for (const config of configs) {
        const { channel_id, delete_after_seconds } = config;

        try {
          const channel = await client.channels.fetch(channel_id).catch(() => null);
          if (!channel) continue;

          // Fetch recent messages
          const messages = await channel.messages.fetch({ limit: 50 });
          
          const toDelete = messages.filter(msg => {
            if (msg.pinned) return false;
            
            const ageMs = now - msg.createdTimestamp;
            const targetMs = delete_after_seconds * 1000;
            
            // Only bulk delete messages < 14 days old
            const twoWeeks = 14 * 24 * 60 * 60 * 1000;
            return ageMs >= targetMs && ageMs < twoWeeks;
          });

          if (toDelete.size > 0) {
            await channel.bulkDelete(toDelete, true).catch(err => {
              console.error(`[AutopurgeCron] Bulk delete failed for ${channel_id}:`, err.message);
            });
          }
        } catch (e) {
          console.error(`[AutopurgeCron] Error in channel ${channel_id}:`, e.message);
        }
      }
    } catch (err) {
      console.error('[AutopurgeCron] General error:', err);
    }
  });

  console.log('[Cron] Autopurge job started (checks every 1m).');
};
