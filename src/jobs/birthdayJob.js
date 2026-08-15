// src/jobs/birthdayJob.js
'use strict';

const cron = require('node-cron');
const { checkTodaysBirthdays } = require('../modules/birthdayManager');

/**
 * Check birthdays every day at midnight (00:01)
 * @param {import('discord.js').Client} client
 */
function startBirthdayCron(client) {
  cron.schedule('1 0 * * *', async () => {
    await checkTodaysBirthdays(client).catch(console.error);
  });

  console.log('[Cron] Daily birthday celebration scheduler started (every midnight)');
}

module.exports = startBirthdayCron;
