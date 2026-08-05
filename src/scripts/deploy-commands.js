// src/scripts/deploy-commands.js
// ─────────────────────────────────────────────────────────────────────────────
// Registers all slash commands with Discord's API.
// Run once after making changes to commands:
//   node src/scripts/deploy-commands.js
//
// For dev:  set GUILD_ID in .env to sync instantly to one guild.
// For prod: comment out guildId to register globally (takes ~1 hour to propagate).
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

require('dotenv').config();

const { REST, Routes } = require('discord.js');
const fs   = require('fs');
const path = require('path');

// ── Collect all command data ──────────────────────────────────────────────────
function walkDir(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(walkDir(fullPath));
    } else if (entry.name.endsWith('.js')) {
      results.push(fullPath);
    }
  }
  return results;
}

const commandsPath = path.join(__dirname, '..', 'commands');
const commandFiles = walkDir(commandsPath);
const commands     = [];

for (const filePath of commandFiles) {
  try {
    const command = require(filePath);
    if (command.data) {
      commands.push(command.data.toJSON());
    }
  } catch (err) {
    console.error(`Error loading ${filePath}:`, err);
  }
}

// ── Deploy ────────────────────────────────────────────────────────────────────
const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log(`Deploying ${commands.length} slash command(s)...`);

    let data;
    if (process.env.GUILD_ID) {
      // Guild-scoped (instant, dev only)
      data = await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
      );
      console.log(`✅ Registered ${data.length} command(s) to guild ${process.env.GUILD_ID}.`);
    } else {
      // Global (production)
      data = await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );
      console.log(`✅ Registered ${data.length} command(s) globally (may take up to 1 hour).`);
    }
  } catch (err) {
    console.error('Failed to deploy commands:', err);
  }
})();
