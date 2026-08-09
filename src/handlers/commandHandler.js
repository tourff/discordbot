// src/handlers/commandHandler.js
// ─────────────────────────────────────────────────────────────────────────────
// Recursively loads every command file from src/commands/**/*.js and registers
// it on client.commands (a discord.js Collection).
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const fs   = require('fs');
const path = require('path');

/**
 * Walks a directory recursively and returns all .js file paths.
 * @param {string} dir
 * @returns {string[]}
 */
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

/**
 * @param {import('discord.js').Client} client
 */
module.exports = function loadCommands(client) {
  const commandsPath = path.join(__dirname, '..', 'commands');
  const commandFiles = walkDir(commandsPath);

  let loaded = 0;
  for (const filePath of commandFiles) {
    try {
      const command = require(filePath);
      if (!command.data || !command.execute) {
        console.warn(`[CommandHandler] Skipping ${filePath} — missing data or execute.`);
        continue;
      }
      
      // Determine category from folder name
      const relativePath = path.relative(commandsPath, filePath);
      const category = path.dirname(relativePath).split(path.sep)[0] || 'Uncategorized';
      command.category = category;

      client.commands.set(command.data.name, command);
      loaded++;
    } catch (err) {
      console.error(`[CommandHandler] Error loading ${filePath}:`, err);
    }
  }
  console.log(`[CommandHandler] Loaded ${loaded} commands.`);
};
