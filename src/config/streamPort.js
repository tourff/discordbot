// src/config/streamPort.js
// Shared module that tracks the actual port the Express audio-proxy server is
// listening on. This is needed because the server may fall back to PORT+1 if
// PORT is already in use (e.g. the Next.js dashboard is running locally).
//
// Usage:
//   setPort(p) — call once in index.js after the server binds successfully
//   getPort()  — call in ytDlpPlugin.js to build the proxy URL

'use strict';

let _port = parseInt(process.env.PORT, 10) || 3000;

module.exports = {
  /** Returns the actual bound port of the audio-proxy Express server. */
  getPort: () => _port,
  /** Update the tracked port (called after the server successfully binds). */
  setPort: (p) => { _port = parseInt(p, 10); },
};
