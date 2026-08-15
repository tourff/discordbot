// src/jobs/statsJob.js
'use strict';

const cron = require('node-cron');
const { updateServerStats } = require('../modules/statsCounters');

/**
 * Periodically refresh server stats channels (every 10 minutes to respect Discord rate limits)
 * @param {import('discord.js').Client} client
 */
function startStatsCron(client) {
  cron.schedule('*/10 * * * *', async () => {
    for (const guild of client.guilds.cache.values()) {
      await updateServerStats(guild).catch(console.error);
    }
  });

  console.log('[Cron] Live server stats scheduler started (every 10m)');
}

module.exports = startStatsCron;
