// src/modules/time.js
'use strict';

/**
 * Parses human-readable time offset strings into milliseconds.
 * Supports: 30s, 5m, 2h, 1d, 1w, "2h 30m", etc.
 * 
 * @param {string} input 
 * @returns {number} Milliseconds
 */
function parseTime(input) {
  if (!input) return 0;
  const units = {
    s: 1000,
    m: 60000,
    h: 3600000,
    d: 86400000,
    w: 604800000
  };
  const regex = /(\d+)\s*([smhdw])/gi;
  let ms = 0;
  let match;
  while ((match = regex.exec(input)) !== null) {
    ms += parseInt(match[1]) * (units[match[2].toLowerCase()] || 0);
  }
  return ms;
}

/**
 * Returns a Discord timestamp string (e.g. relative or full).
 * 
 * @param {Date|string|number} date 
 * @param {'t'|'T'|'d'|'D'|'t'|'R'|'f'|'F'} style 
 * @returns {string} Discord formatted timestamp
 */
function discordTimestamp(date, style = 'R') {
  const d = new Date(date);
  const unix = Math.floor(d.getTime() / 1000);
  if (isNaN(unix)) return 'Invalid Date';
  return `<t:${unix}:${style}>`;
}

module.exports = {
  parseTime,
  discordTimestamp,
};
