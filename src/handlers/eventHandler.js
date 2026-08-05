// src/handlers/eventHandler.js
// ─────────────────────────────────────────────────────────────────────────────
// Reads every file in src/events/ and registers it as a Discord.js event
// listener. Files must export { name, once?, execute }.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const fs   = require('fs');
const path = require('path');

/**
 * @param {import('discord.js').Client} client
 */
module.exports = function loadEvents(client) {
  const eventsPath = path.join(__dirname, '..', 'events');
  const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));

  let loaded = 0;
  for (const file of eventFiles) {
    try {
      const event = require(path.join(eventsPath, file));
      if (!event.name || !event.execute) {
        console.warn(`[EventHandler] Skipping ${file} — missing name or execute.`);
        continue;
      }
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }
      loaded++;
    } catch (err) {
      console.error(`[EventHandler] Error loading ${file}:`, err);
    }
  }
  console.log(`[EventHandler] Loaded ${loaded} events.`);
};
