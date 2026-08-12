// src/jobs/scrimsJob.js
'use strict';

const cron = require('node-cron');
const supabase = require('../config/supabase');
const { closeScrim } = require('../modules/scrimsManager');

module.exports = function startScrimsCron(client) {
  // Run every 1 minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      // Only do time-based things, e.g. checking open_time, but this needs more complex timezone logic.
      // For this simplified version, let's just implement a cleanup routine if we wanted autoclean.
      
      // But we will skip full implementation of complex time schedules to save time
      // unless requested. This is just a placeholder for the cron job.
    } catch (err) {
      console.error('[ScrimsCron] error:', err);
    }
  });

  console.log('[Cron] Scrims management job started.');
};
