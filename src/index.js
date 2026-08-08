// src/index.js
// ─────────────────────────────────────────────────────────────────────────────
// Entry point: boots Express (for Render), creates the Discord client,
// loads all command & event handlers, and starts the social-media cron jobs.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

require('dotenv').config();

const express  = require('express');
const path     = require('path');
const ffmpegPath = require('ffmpeg-static');
process.env.FFMPEG_PATH = ffmpegPath;

const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const { DisTube } = require('distube');
const { SpotifyPlugin } = require('@distube/spotify');
const { SoundCloudPlugin } = require('@distube/soundcloud');
const { YtDlpPlugin } = require('@distube/yt-dlp');

const loadCommands    = require('./handlers/commandHandler');
const loadEvents      = require('./handlers/eventHandler');
const loadDisTube     = require('./handlers/distubeHandler');
const startSocialCron = require('./jobs/socialNotifier');

// ── 1. Express web server ─────────────────────────────────────────────────────
// Render's free tier requires a service to bind to a port within 60 seconds.
const app  = express();
const PORT = process.env.PORT || 3000;

app.get('/', (_req, res) => res.send('✅ Discord bot is online.'));

app.listen(PORT, () => {
  console.log(`[Express] Listening on port ${PORT}`);
});

// ── 2. Discord client ─────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.GuildMember,
  ],
});

// Attach an empty command collection to the client for use in the handler
client.commands = new Collection();

// ── 3. Load handlers ──────────────────────────────────────────────────────────
loadCommands(client);
loadEvents(client);

// ── 3.5 Setup DisTube ────────────────────────────────────────────────────────
client.distube = new DisTube(client, {
  ffmpeg: { path: ffmpegPath },
  plugins: [
    new SpotifyPlugin(),
    new SoundCloudPlugin(),
    new YtDlpPlugin(),
  ],
});

loadDisTube(client);

// ── 4. Start background cron jobs ─────────────────────────────────────────────
// Delay startup slightly so the client is ready before the first poll
client.once('ready', () => {
  console.log(`[Discord] Logged in as ${client.user.tag}`);
  startSocialCron(client);
});

// ── 5. Login ──────────────────────────────────────────────────────────────────
client.login(process.env.BOT_TOKEN).catch((err) => {
  console.error('[Discord] Failed to login:', err);
  process.exit(1);
});
