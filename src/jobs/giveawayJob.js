// src/jobs/giveawayJob.js
'use strict';

const cron = require('node-cron');
const { supabase } = require('../config/supabase');
const { endGiveaway } = require('../modules/giveawayManager');

/**
 * Periodically check for expired active giveaways
 * @param {import('discord.js').Client} client
 */
function startGiveawayCron(client) {
  // Check every 30 seconds
  cron.schedule('*/30 * * * * *', async () => {
    try {
      const now = new Date().toISOString();
      const { data: expired } = await supabase
        .from('giveaways')
        .select('*')
        .eq('is_ended', false)
        .lte('end_time', now);

      if (expired && expired.length > 0) {
        for (const g of expired) {
          await endGiveaway(client, g);
        }
      }
    } catch (err) {
      console.error('[Giveaway Cron] Error:', err);
    }
  });

  console.log('[Cron] Giveaway engine scheduler started (every 30s)');
}

module.exports = startGiveawayCron;
