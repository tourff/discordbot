// src/plugins/ytDlpPlugin.js
// ─────────────────────────────────────────────────────────────────────────────
// Custom, robust DisTube extractor plugin leveraging yt-dlp.
// Fixes deprecated flag issues (--no-call-home), parses JSON cleanly from stdout,
// and supports direct URLs, plain-text queries, playlists, and fast autocomplete search.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { PlayableExtractorPlugin, Song, Playlist, DisTubeError } = require('distube');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const dargs = require('dargs');

/**
 * Locate the yt-dlp binary across environments (local dev, Render, Docker, etc.)
 * @returns {string} Path or command name for yt-dlp
 */
function getYtDlpPath() {
  const customPath = process.env.YTDLP_PATH;
  if (customPath && fs.existsSync(customPath)) return customPath;

  const isWindows = process.platform === 'win32';
  const binaryName = isWindows ? 'yt-dlp.exe' : 'yt-dlp';

  const candidates = [
    path.join(__dirname, '..', '..', 'node_modules', '@distube', 'yt-dlp', 'bin', binaryName),
    path.join(process.cwd(), 'node_modules', '@distube', 'yt-dlp', 'bin', binaryName),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  // Fallback to system PATH
  return 'yt-dlp';
}

const YTDLP_BIN = getYtDlpPath();

/**
 * Execute yt-dlp and safely parse JSON output from stdout (ignoring stderr warnings)
 * @param {string} target URL or search query
 * @param {object} flags Command line flags
 * @param {object} options ChildProcess options
 * @returns {Promise<any>}
 */
function runYtDlpJson(target, flags = {}, options = {}) {
  const defaultFlags = {
    dumpSingleJson: true,
    noWarnings: true,
    preferFreeFormats: true,
    skipDownload: true,
    simulate: true,
  };

  // Merge: caller flags override defaults. Then filter out falsy values so
  // e.g. { simulate: false } won't add --simulate to the CLI args.
  const merged = { ...defaultFlags, ...flags };
  const activeFlags = Object.fromEntries(
    Object.entries(merged).filter(([, v]) => v !== false && v !== null && v !== undefined)
  );

  const args = [target].concat(dargs(activeFlags, { useEquals: false })).filter(Boolean);

  return new Promise((resolve, reject) => {
    const proc = spawn(YTDLP_BIN, args, options);
    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (chunk) => {
      stdout += chunk;
    });

    proc.stderr?.on('data', (chunk) => {
      stderr += chunk;
    });

    proc.on('close', (code) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(stdout));
        } catch (err) {
          reject(new Error(`Failed to parse yt-dlp response: ${err.message}`));
        }
      } else {
        reject(new Error(stderr.trim() || `yt-dlp process exited with code ${code}`));
      }
    });

    proc.on('error', reject);
  });
}

/**
 * Fast YouTube search helper for autocomplete & queries
 * @param {string} query Search term
 * @param {object} [opts] Options
 * @param {number} [opts.limit=5] Max results
 * @returns {Promise<Array<{name: string, url: string, duration: number, formattedDuration: string}>>}
 */
async function searchYt(query, opts = {}) {
  if (!query || typeof query !== 'string' || !query.trim()) return [];
  const limit = Math.min(Math.max(1, opts.limit || 5), 25);

  try {
    // Use only the flags needed for fast metadata-only search.
    // --flat-playlist avoids fetching full info per entry (much faster).
    // Skip --simulate / --prefer-free-formats as they're not needed here.
    const data = await runYtDlpJson(`ytsearch${limit}:${query.trim()}`, {
      flatPlaylist: true,
      noWarnings: true,
      skipDownload: true,
      dumpSingleJson: true,       // override default to keep it set
      preferFreeFormats: false,   // not needed for search
      simulate: false,            // redundant alongside skipDownload, remove
    });

    const entries = Array.isArray(data.entries) ? data.entries.filter(Boolean) : [];

    return entries.map((entry) => {
      const sec = Math.max(0, Math.round(entry.duration || 0));
      const m = Math.floor(sec / 60);
      const s = String(sec % 60).padStart(2, '0');
      const h = Math.floor(m / 60);
      const formattedDuration = h > 0 
        ? `${h}:${String(m % 60).padStart(2, '0')}:${s}` 
        : `${m}:${s}`;

      const url = entry.url || (entry.id ? `https://www.youtube.com/watch?v=${entry.id}` : '');

      return {
        name: entry.title || 'Unknown Title',
        url,
        duration: sec,
        formattedDuration,
      };
    });
  } catch (err) {
    console.error('[YtDlpPlugin] Search error:', err.message);
    return [];
  }
}

class YtDlpPlugin extends PlayableExtractorPlugin {
  validate() {
    return true; // Catch-all fallback plugin (handles YouTube URLs and text searches)
  }

  async resolve(url, options) {
    let target = url;
    if (typeof target === 'string' && !target.startsWith('http://') && !target.startsWith('https://')) {
      target = `ytsearch1:${target}`;
    }

    const info = await runYtDlpJson(target).catch((err) => {
      throw new DisTubeError('YTDLP_ERROR', err.message);
    });

    if (info._type === 'playlist' || Array.isArray(info.entries)) {
      const entries = (info.entries || []).filter(Boolean);
      if (entries.length === 0) {
        throw new DisTubeError('YTDLP_ERROR', 'The playlist or search returned no results.');
      }

      // Single item result from text search
      if (typeof target === 'string' && target.startsWith('ytsearch1:')) {
        return new Song(this._formatSong(entries[0]), options);
      }

      return new Playlist(
        {
          source: info.extractor || 'youtube',
          songs: entries.map((e) => new Song(this._formatSong(e), options)),
          id: String(info.id || Date.now()),
          name: info.title || 'Playlist',
          url: info.webpage_url || info.original_url || url,
          thumbnail: info.thumbnails?.[0]?.url,
        },
        options
      );
    }

    return new Song(this._formatSong(info), options);
  }

  _formatSong(info) {
    return {
      plugin: this,
      source: info.extractor || 'youtube',
      playFromSource: true,
      id: String(info.id || ''),
      name: info.title || info.fulltitle || 'Unknown track',
      url: info.webpage_url || info.original_url || info.url,
      isLive: Boolean(info.is_live),
      thumbnail: info.thumbnail || info.thumbnails?.[0]?.url,
      duration: info.is_live ? 0 : (info.duration || 0),
      uploader: {
        name: info.uploader || info.channel || 'Unknown',
        url: info.uploader_url || info.channel_url || '',
      },
      views: info.view_count || 0,
      likes: info.like_count || 0,
      dislikes: 0,
      reposts: 0,
      ageRestricted: Boolean(info.age_limit && info.age_limit >= 18),
    };
  }

  async getStreamURL(song) {
    if (!song.url) {
      throw new DisTubeError('YTDLP_PLUGIN_INVALID_SONG', 'Cannot get stream url from invalid song.');
    }

    // ARCHITECTURE NOTE:
    // On datacenter hosting (Render, Railway, Fly.io), YouTube's CDN blocks all
    // non-residential IP addresses with 403 errors (seen as FFmpeg exit code 251).
    // No matter which player_client we try, the extracted CDN URL will be rejected
    // when FFmpeg tries to fetch it directly.
    //
    // Solution: NEVER give FFmpeg a raw YouTube CDN URL.
    // Instead, return a localhost URL that proxies through our Express server.
    // The Express /stream endpoint runs yt-dlp and pipes the audio bytes directly —
    // so FFmpeg always reads from 127.0.0.1 (always succeeds) and yt-dlp handles
    // the YouTube CDN fetching with the ios player client.
    //
    //  Flow:  FFmpeg ──HTTP──▶ localhost:PORT/stream ──pipe──▶ yt-dlp ──CDN──▶ YouTube
    //
    const { getPort } = require('../config/streamPort');
    const port = getPort();
    const proxyUrl = `http://127.0.0.1:${port}/stream?url=${encodeURIComponent(song.url)}`;
    console.log(`[YtDlpPlugin] Streaming via proxy: ${proxyUrl}`);
    return proxyUrl;
  }

  getRelatedSongs() {
    return [];
  }
}

module.exports = {
  YtDlpPlugin,
  searchYt,
  runYtDlpJson,
  getYtDlpPath,
};
