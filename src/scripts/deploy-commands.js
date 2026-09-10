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
    const args = process.argv.slice(2);
    const isGuildSpecific = args.includes('--guild') || (args[0] === 'guild');
    const targetGuildId = process.env.GUILD_ID;

    if (isGuildSpecific && targetGuildId) {
      console.log(`Deploying ${commands.length} slash command(s) specifically to guild: ${targetGuildId}...`);
      const data = await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, targetGuildId),
        { body: commands }
      );
      console.log(`✅ Registered ${data.length} command(s) to guild ${targetGuildId}.`);
    } else {
      console.log(`Deploying ${commands.length} slash command(s) GLOBALLY across all Discord servers...`);
      const data = await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );
      console.log(`✅ Registered ${data.length} command(s) globally (available in every server the bot joins).`);

      // If a development guild ID exists, clean up guild-level commands to prevent duplicates
      if (targetGuildId) {
        try {
          await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, targetGuildId),
            { body: [] }
          );
          console.log(`🧹 Cleaned up guild-specific commands in dev guild (${targetGuildId}) to prevent duplicates.`);
        } catch (cleanupErr) {
          // Non-fatal, guild commands might already be empty
        }
      }
    }
  } catch (err) {
    console.error('Failed to deploy commands:', err);
  }
})();
