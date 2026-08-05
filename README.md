# Discord Bot — Production-Ready Discord.js v14

A fully-featured Discord bot with moderation, social media notifications, reaction roles, auto-mod, and server logging — built for 24/7 hosting on **Render's free tier**.

## Tech Stack

| Layer       | Technology                     |
|-------------|--------------------------------|
| Runtime     | Node.js ≥ 18                   |
| Bot Library | discord.js v14                 |
| Database    | Supabase (PostgreSQL)          |
| Web Server  | Express (Render port binding)  |
| Scheduling  | node-cron                      |
| RSS Parsing | rss-parser                     |

---

## Project Structure

```
discord-bot/
├── .env.example              ← Copy to .env and fill in
├── .gitignore
├── package.json
├── schema.sql                ← Run this in Supabase SQL Editor
└── src/
    ├── index.js              ← Entry point (Express + Discord client)
    ├── config/
    │   └── supabase.js       ← Singleton Supabase client
    ├── handlers/
    │   ├── commandHandler.js ← Auto-loads all commands
    │   └── eventHandler.js   ← Auto-loads all events
    ├── commands/
    │   ├── moderation/
    │   │   ├── kick.js
    │   │   ├── ban.js
    │   │   ├── mute.js
    │   │   ├── unmute.js
    │   │   ├── warn.js
    │   │   └── cases.js
    │   └── utility/
    │       └── setup-roles.js
    ├── events/
    │   ├── interactionCreate.js
    │   ├── guildMemberAdd.js
    │   ├── guildMemberRemove.js
    │   ├── messageCreate.js
    │   ├── messageDelete.js
    │   └── messageUpdate.js
    ├── modules/
    │   ├── autoMod.js        ← Bad words, invite/URL filter, anti-spam
    │   ├── buttonRoles.js    ← Handles button-role toggle logic
    │   └── modHelper.js      ← createModCase + logModAction shared helpers
    ├── jobs/
    │   └── socialNotifier.js ← RSS cron job (YouTube, FB, IG, TikTok)
    └── scripts/
        └── deploy-commands.js ← One-time slash command registration
```

---

## Quick Start

### 1. Clone & Install

```bash
git clone <your-repo>
cd discord-bot
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your values (see table below)
```

### 3. Run Supabase Schema

1. Open your Supabase project → **SQL Editor** → **New Query**
2. Paste the entire contents of `schema.sql`
3. Click **Run**

### 4. Deploy Slash Commands

```bash
# Dev (instant — syncs to GUILD_ID only)
node src/scripts/deploy-commands.js

# Prod (global — set GUILD_ID= empty in .env)
node src/scripts/deploy-commands.js
```

### 5. Start the Bot

```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

---

## Environment Variables

| Variable                  | Required | Description                                              |
|---------------------------|----------|----------------------------------------------------------|
| `BOT_TOKEN`               | ✅        | Discord bot token (Discord Developer Portal)             |
| `CLIENT_ID`               | ✅        | Discord Application ID                                   |
| `GUILD_ID`                | Dev only | Guild ID for instant slash-command sync during dev       |
| `SUPABASE_URL`            | ✅        | From Supabase → Settings → API                           |
| `SUPABASE_ANON_KEY`       | ✅        | From Supabase → Settings → API                           |
| `PORT`                    | ✅        | Port for Express server (Render sets this automatically) |
| `WELCOME_CHANNEL_ID`      | ✅        | Channel ID for welcome messages                          |
| `MOD_LOGS_CHANNEL_ID`     | ✅        | Channel ID for mod-action logs                           |
| `SERVER_LOGS_CHANNEL_ID`  | ✅        | Channel ID for message/member logs                       |
| `ROLES_CHANNEL_ID`        | Optional | Channel for the role picker (reference only)             |
| `SOCIAL_NOTIF_CHANNEL_ID` | Optional | Channel for social media notifications                   |
| `DEFAULT_MEMBER_ROLE_ID`  | Optional | Role auto-assigned on member join                        |
| `YOUTUBE_RSS_URL`         | Optional | `https://youtube.com/feeds/videos.xml?channel_id=XXXX`  |
| `FACEBOOK_RSS_URL`        | Optional | Public page RSS feed URL                                 |
| `INSTAGRAM_RSS_URL`       | Optional | Via RSSHub: `https://rsshub.app/instagram/user/HANDLE`   |
| `TIKTOK_RSS_URL`          | Optional | Via RSSHub: `https://rsshub.app/tiktok/user/HANDLE`      |
| `SOCIAL_PING_EVERYONE`    | Optional | `true` to ping @everyone on social posts                 |

---

## Hosting on Render (Free Tier)

1. Push your code to a GitHub repository
2. On Render → **New** → **Web Service** → connect your repo
3. **Build Command:** `npm install`
4. **Start Command:** `npm start`
5. Add all environment variables in the **Environment** tab
6. Click **Deploy**

> **Why Express?** Render's free tier requires a web service to bind to a port within 60 seconds. The Express server at `src/index.js` satisfies this requirement.

> **Preventing Sleep:** Render's free tier sleeps after 15 minutes of inactivity. Use [UptimeRobot](https://uptimerobot.com) to ping your service URL every 5 minutes to keep it awake.

---

## Feature Documentation

### Slash Commands

| Command        | Permission       | Description                                        |
|----------------|------------------|----------------------------------------------------|
| `/kick`        | KickMembers      | Kick a member; creates mod case + logs action      |
| `/ban`         | BanMembers       | Ban a member with optional message purge           |
| `/mute`        | ModerateMembers  | Timeout a member (9 duration presets)              |
| `/unmute`      | ModerateMembers  | Remove timeout from a member                       |
| `/warn`        | ModerateMembers  | Issue a formal warning (DMs user + logs case)      |
| `/cases`       | ModerateMembers  | View all mod cases for a specific user             |
| `/setup-roles` | ManageRoles      | Post a button role-picker embed in a channel       |

### `/setup-roles` Usage

```
/setup-roles roles:123456789:🎮 Gamer,987654321:🎵 Music Fan title:Pick Your Roles
```

Format: `roleId:Label` pairs separated by commas. Max 25 buttons (5 rows × 5).

### Auto-Moderation Rules

Edit `src/modules/autoMod.js` to customize:

- **`BAD_WORDS`** array — add/remove blacklisted words
- **`INVITE_REGEX`** — Discord invite detection (always active)
- **URL filter** — uncomment the URL block to delete all URLs
- **Spam threshold** — change `SPAM_LIMIT` (default: 5) and `SPAM_WINDOW` (default: 3000ms)

### Social Media RSS

| Platform  | RSS Source                                                      |
|-----------|-----------------------------------------------------------------|
| YouTube   | Native: `https://youtube.com/feeds/videos.xml?channel_id=XXXX` |
| Facebook  | Public page RSS (limited by Facebook)                           |
| Instagram | [RSSHub](https://rsshub.app): `/instagram/user/HANDLE`          |
| TikTok    | [RSSHub](https://rsshub.app): `/tiktok/user/HANDLE`             |

---

## Adding New Commands

1. Create a new `.js` file in `src/commands/<category>/`
2. Export `{ data: SlashCommandBuilder, execute: async fn }`
3. Re-run `node src/scripts/deploy-commands.js`

The command handler auto-discovers all files — no registration needed.

## Adding New Events

1. Create a new `.js` file in `src/events/`
2. Export `{ name: 'eventName', once?: boolean, execute: async fn }`

The event handler auto-discovers all files on startup.

---

## License

MIT
