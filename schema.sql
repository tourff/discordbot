-- ═══════════════════════════════════════════════════════════════════════════════
-- Supabase SQL Schema
-- Run each block in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. mod_cases
--    Stores every moderation action taken by moderators.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mod_cases (
  id           BIGSERIAL    PRIMARY KEY,
  guild_id     TEXT         NOT NULL,
  user_id      TEXT         NOT NULL,
  moderator_id TEXT         NOT NULL,
  action       TEXT         NOT NULL CHECK (action IN ('kick', 'ban', 'mute', 'unmute', 'warn')),
  reason       TEXT,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Index for fast lookups by guild + user (used by /cases command)
CREATE INDEX IF NOT EXISTS idx_mod_cases_guild_user
  ON public.mod_cases (guild_id, user_id);

-- Enable Row Level Security (recommended for all tables)
ALTER TABLE public.mod_cases ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access (the bot uses anon key, adjust if using service key)
CREATE POLICY "Bot full access" ON public.mod_cases
  FOR ALL
  USING (true)
  WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. social_config
--    Tracks the last-seen post ID per social platform to prevent duplicate
--    Discord notifications.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.social_config (
  platform     TEXT  PRIMARY KEY,           -- 'youtube' | 'facebook' | 'instagram' | 'tiktok'
  last_post_id TEXT,                         -- The guid/link of the last notified post
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.social_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bot full access" ON public.social_config
  FOR ALL
  USING (true)
  WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. bot_settings
--    General-purpose key-value store for per-guild bot configuration.
--    Can be used to store channel IDs, role IDs, feature toggles, etc.
--    (Currently used as a future-expansion table; the bot reads these from .env.)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bot_settings (
  id         BIGSERIAL    PRIMARY KEY,
  guild_id   TEXT         NOT NULL,
  key        TEXT         NOT NULL,
  value      TEXT,
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (guild_id, key)
);

CREATE INDEX IF NOT EXISTS idx_bot_settings_guild
  ON public.bot_settings (guild_id);

ALTER TABLE public.bot_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bot full access" ON public.bot_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────────────────────
-- Helper function: auto-update updated_at on bot_settings
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bot_settings_updated_at
  BEFORE UPDATE ON public.bot_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_config_updated_at
  BEFORE UPDATE ON public.social_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. bot_permissions
--    Stores access permissions for using the bot.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bot_permissions (
  id         BIGSERIAL    PRIMARY KEY,
  guild_id   TEXT         NOT NULL,
  type       TEXT         NOT NULL CHECK (type IN ('role', 'user')),
  target_id  TEXT         NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (guild_id, type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_bot_permissions_guild
  ON public.bot_permissions (guild_id);

ALTER TABLE public.bot_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bot full access" ON public.bot_permissions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- NEW TABLES: Tags, Autopurge, Tagcheck, Scrims, Tourneys
-- ─────────────────────────────────────────────────────────────────────────────

-- Tags
CREATE TABLE IF NOT EXISTS public.tags (
  id BIGSERIAL PRIMARY KEY,
  guild_id TEXT,
  name TEXT,
  content TEXT,
  owner_id TEXT,
  usage INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Autopurge
CREATE TABLE IF NOT EXISTS public.autopurge (
  guild_id TEXT,
  channel_id TEXT PRIMARY KEY,
  delete_after_seconds INT
);

-- Tagcheck
CREATE TABLE IF NOT EXISTS public.tagcheck_config (
  guild_id TEXT,
  channel_id TEXT PRIMARY KEY,
  required_mentions INT DEFAULT 4,
  delete_after BOOLEAN DEFAULT FALSE
);

-- EasyTag
CREATE TABLE IF NOT EXISTS public.easytag_config (
  guild_id TEXT,
  channel_id TEXT PRIMARY KEY
);

-- Reminders
CREATE TABLE IF NOT EXISTS public.reminders (
  id BIGSERIAL PRIMARY KEY,
  guild_id TEXT,
  user_id TEXT,
  channel_id TEXT,
  note TEXT,
  remind_at TIMESTAMPTZ
);

-- Scrims
CREATE TABLE IF NOT EXISTS public.scrims (
  id BIGSERIAL PRIMARY KEY,
  guild_id TEXT,
  name TEXT,
  registration_channel_id TEXT,
  slotlist_channel_id TEXT,
  role_id TEXT,
  ping_role_id TEXT,
  total_slots INT DEFAULT 12,
  required_mentions INT DEFAULT 4,
  autodelete_rejects BOOLEAN DEFAULT FALSE,
  no_duplicate_name BOOLEAN DEFAULT TRUE,
  multiregister BOOLEAN DEFAULT FALSE,
  open_time TIME,
  open_days TEXT[],
  enabled BOOLEAN DEFAULT TRUE,
  is_open BOOLEAN DEFAULT FALSE,
  current_slot INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.scrim_slots (
  id BIGSERIAL PRIMARY KEY,
  scrim_id BIGINT REFERENCES public.scrims(id) ON DELETE CASCADE,
  slot_num INT,
  user_id TEXT,
  team_name TEXT,
  members TEXT[],
  jump_url TEXT
);

CREATE TABLE IF NOT EXISTS public.scrim_reserved_slots (
  id BIGSERIAL PRIMARY KEY,
  scrim_id BIGINT REFERENCES public.scrims(id) ON DELETE CASCADE,
  slot_num INT,
  user_id TEXT,
  team_name TEXT
);

CREATE TABLE IF NOT EXISTS public.scrim_banned_teams (
  id BIGSERIAL PRIMARY KEY,
  scrim_id BIGINT REFERENCES public.scrims(id) ON DELETE CASCADE,
  user_id TEXT,
  reason TEXT,
  banned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tourneys (similar structure)
CREATE TABLE IF NOT EXISTS public.tourneys (
  id BIGSERIAL PRIMARY KEY,
  guild_id TEXT,
  name TEXT,
  registration_channel_id TEXT,
  confirm_channel_id TEXT,
  role_id TEXT,
  total_slots INT,
  required_mentions INT DEFAULT 4,
  autodelete_rejects BOOLEAN DEFAULT FALSE,
  no_duplicate_name BOOLEAN DEFAULT TRUE,
  multiregister BOOLEAN DEFAULT FALSE,
  enabled BOOLEAN DEFAULT TRUE,
  is_open BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.tourney_slots (
  id BIGSERIAL PRIMARY KEY,
  tourney_id BIGINT REFERENCES public.tourneys(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- pending, confirmed, denied
  slot_num INT,
  user_id TEXT,
  team_name TEXT,
  members TEXT[],
  jump_url TEXT
);

-- ─────────────────────────────────────────────────────────────────────────────
5. lockdowns
--    Stores active lockdowns (channels, categories, servers) with optional
--    expiration timers.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lockdowns (
  id           BIGSERIAL    PRIMARY KEY,
  guild_id     TEXT         NOT NULL,
  type         TEXT         NOT NULL CHECK (type IN ('channel', 'guild', 'maintenance')),
  channel_id   TEXT         NOT NULL,
  author_id    TEXT         NOT NULL,
  role_id      TEXT,
  channel_ids  TEXT[],
  expire_time  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lockdowns_guild
  ON public.lockdowns (guild_id);

ALTER TABLE public.lockdowns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bot full access" ON public.lockdowns
  FOR ALL
  USING (true)
  WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. votes
--    Tracks voting statistics and user preferences for vote reminders.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.votes (
  user_id      TEXT         PRIMARY KEY,
  total_votes  INT          DEFAULT 0,
  reminder     BOOLEAN      DEFAULT FALSE,
  expire_time  TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bot full access" ON public.votes
  FOR ALL
  USING (true)
  WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. user_profiles
--    Tracks user currency (Quo Coins) and special statuses (e.g. developer).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id      TEXT         PRIMARY KEY,
  money        INT          DEFAULT 0,
  is_dev       BOOLEAN      DEFAULT FALSE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bot full access" ON public.user_profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────────────────────
-- Alterations (Updates to existing tables)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.tags ADD COLUMN IF NOT EXISTS is_nsfw BOOLEAN DEFAULT FALSE;
ALTER TABLE public.tags ADD COLUMN IF NOT EXISTS is_embed BOOLEAN DEFAULT FALSE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. user_levels (XP & Leveling Progression)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_levels (
  id            BIGSERIAL    PRIMARY KEY,
  guild_id      TEXT         NOT NULL,
  user_id       TEXT         NOT NULL,
  xp            BIGINT       DEFAULT 0,
  level         INT          DEFAULT 1,
  message_count INT          DEFAULT 0,
  last_xp_at    TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE (guild_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_levels_guild_xp ON public.user_levels (guild_id, xp DESC);
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bot full access" ON public.user_levels FOR ALL USING (true) WITH CHECK (true);

-- Level Role Rewards
CREATE TABLE IF NOT EXISTS public.level_rewards (
  id         BIGSERIAL PRIMARY KEY,
  guild_id   TEXT NOT NULL,
  level      INT NOT NULL,
  role_id    TEXT NOT NULL,
  UNIQUE (guild_id, level)
);
ALTER TABLE public.level_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bot full access" ON public.level_rewards FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. tickets (Interactive Support Ticket System)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tickets (
  id              BIGSERIAL    PRIMARY KEY,
  guild_id        TEXT         NOT NULL,
  channel_id      TEXT         NOT NULL UNIQUE,
  user_id         TEXT         NOT NULL,
  status          TEXT         NOT NULL DEFAULT 'open', -- 'open' | 'closed'
  claimed_by      TEXT,
  transcript_text TEXT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  closed_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tickets_guild ON public.tickets (guild_id);
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bot full access" ON public.tickets FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. giveaways (Giveaway Engine)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.giveaways (
  id            BIGSERIAL    PRIMARY KEY,
  guild_id      TEXT         NOT NULL,
  channel_id    TEXT         NOT NULL,
  message_id    TEXT         NOT NULL UNIQUE,
  prize         TEXT         NOT NULL,
  winner_count  INT          NOT NULL DEFAULT 1,
  end_time      TIMESTAMPTZ  NOT NULL,
  is_ended      BOOLEAN      NOT NULL DEFAULT FALSE,
  winners       TEXT[],
  entries       TEXT[]       DEFAULT '{}',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_giveaways_active ON public.giveaways (is_ended, end_time);
ALTER TABLE public.giveaways ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bot full access" ON public.giveaways FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. economy_shop (Server Currency & Role Shop)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.economy_shop (
  id          BIGSERIAL    PRIMARY KEY,
  guild_id    TEXT         NOT NULL,
  item_name   TEXT         NOT NULL,
  role_id     TEXT,
  price       BIGINT       NOT NULL DEFAULT 100,
  description TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE public.economy_shop ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bot full access" ON public.economy_shop FOR ALL USING (true) WITH CHECK (true);



