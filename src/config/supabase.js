// src/config/supabase.js
// ─────────────────────────────────────────────────────────────────────────────
// Singleton Supabase client — import this wherever you need DB access.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = supabase;
module.exports.supabase = supabase;

