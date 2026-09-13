// src/index.js
// ─────────────────────────────────────────────────────────────────────────────
// Entry point: boots Express (for Render), creates the Discord client,
// loads all command & event handlers, and starts the social-media cron jobs.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

require('dotenv').config();

const express  = require('express');
const path     = require('path');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
process.env.FFMPEG_PATH = ffmpegPath;

const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const { DisTube } = require('distube');
const { SpotifyPlugin } = require('@distube/spotify');
const { SoundCloudPlugin } = require('@distube/soundcloud');
const { YtDlpPlugin, searchYt, getYtDlpPath } = require('./plugins/ytDlpPlugin');

const loadCommands    = require('./handlers/commandHandler');
const loadEvents      = require('./handlers/eventHandler');
const loadDisTube     = require('./handlers/distubeHandler');
const startSocialCron = require('./jobs/socialNotifier');
const { setPort }     = require('./config/streamPort');


// ── 1. Express web server ─────────────────────────────────────────────────────
// Render's free tier requires a service to bind to a port within 60 seconds.
const app  = express();
const PORT = process.env.PORT || 3000;

app.get('/', (_req, res) => res.send('✅ Discord bot is online.'));

// Internal audio streaming proxy — yt-dlp pipes the audio directly to FFmpeg via
// localhost HTTP, so FFmpeg NEVER touches YouTube CDN URLs directly. This is the
// only reliable way to play YouTube audio from datacenter IPs (Render, Railway, etc.)
// where YouTube's CDN aggressively blocks non-residential IP requests (code 251 / 403).
app.get('/stream', (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('Missing url parameter');

  // Respond immediately so FFmpeg doesn't timeout waiting for headers
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('Cache-Control', 'no-cache');

  const proc = spawn(getYtDlpPath(), [
    targetUrl,
    '-f', 'ba/ba*',
    '-o', '-',
    '--no-warnings',
    '--quiet',
    '--no-playlist',
    // ios client uses a different CDN path not blocked on datacenter IPs
    '--extractor-args', 'youtube:player_client=ios',
  ], { stdio: ['ignore', 'pipe', 'pipe'] });

  proc.stdout.pipe(res);

  proc.stderr.on('data', (chunk) => {
    const msg = chunk.toString().trim();
    if (msg) console.warn('[Stream Proxy]', msg);
  });

  proc.on('error', (err) => {
    console.error('[Stream Proxy Error]', err.message);
    if (!res.headersSent) res.status(500).send('Streaming error');
  });

  req.on('close', () => {
    if (!proc.killed) proc.kill('SIGTERM');
  });
});


const server = app.listen(PORT, () => {
  setPort(PORT);
  console.log(`[Express] Listening on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const fallbackPort = Number(PORT) + 1;
    console.warn(`[Express] Port ${PORT} is in use (e.g. by Next.js Dashboard). Listening on port ${fallbackPort}...`);
    app.listen(fallbackPort, () => {
      setPort(fallbackPort);
      console.log(`[Express] Listening on port ${fallbackPort}`);
    });
  } else {
    console.error('[Express Error]', err);
  }
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
  ffmpeg: {
    path: ffmpegPath,
    args: {
      global: {
        loglevel: 'warning',
      },
      input: {
        reconnect: 1,
        reconnect_streamed: 1,
        reconnect_delay_max: 5,
        // Don't reuse the HTTP connection — each song gets a fresh localhost proxy request
        http_persistent: 0,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
      },
    },
  },
  plugins: [
    new SpotifyPlugin(),
    new SoundCloudPlugin(),
    new YtDlpPlugin(),
  ],
});
client.distube.search = searchYt;

loadDisTube(client);

// ── 4. Start background cron jobs ─────────────────────────────────────────────
const startReminderCron = require('./jobs/reminderJob');
const startAutopurgeCron = require('./jobs/autopurgeJob');
const startLockdownCron = require('./jobs/lockdownJob');
const startGiveawayCron = require('./jobs/giveawayJob');
const startStatsCron = require('./jobs/statsJob');
const startBirthdayCron = require('./jobs/birthdayJob');

// Delay startup slightly so the client is ready before the first poll
client.once('ready', () => {
  console.log(`[Discord] Logged in as ${client.user.tag}`);
  startSocialCron(client);
  startReminderCron(client);
  startAutopurgeCron(client);
  startLockdownCron(client);
  startGiveawayCron(client);
  startStatsCron(client);
  startBirthdayCron(client);
});

// ── 5. Login ──────────────────────────────────────────────────────────────────
client.login(process.env.BOT_TOKEN).catch((err) => {
  console.error('[Discord] Failed to login:', err);
  process.exit(1);
});

// ── 6. Anti-Crash / Error Handling ────────────────────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Anti-Crash] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Anti-Crash] Uncaught Exception:', err);
});

process.on('uncaughtExceptionMonitor', (err, origin) => {
  console.error('[Anti-Crash] Uncaught Exception Monitor:', err, origin);
});
