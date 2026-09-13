export const BOT_COMMANDS = [
  {
    "name": "about",
    "category": "general",
    "categoryLabel": "General & Info",
    "emoji": "🌐",
    "color": "#64748b",
    "description": "Display information and statistics about the bot.",
    "options": [],
    "permission": "Everyone",
    "dashboardTab": null
  },
  {
    "name": "afk",
    "category": "general",
    "categoryLabel": "General & Info",
    "emoji": "🌐",
    "color": "#64748b",
    "description": "Set your AFK status so others know you are away when mentioned",
    "options": [
      {
        "name": "reason",
        "description": "Why are you going AFK?",
        "required": false,
        "type": 3
      }
    ],
    "permission": "Everyone",
    "dashboardTab": null
  },
  {
    "name": "ask",
    "category": "ai",
    "categoryLabel": "AI Intelligence",
    "emoji": "🧠",
    "color": "#8b5cf6",
    "description": "Ask Jarvis AI anything with intelligent real-time answers and server tools",
    "options": [
      {
        "name": "prompt",
        "description": "Your question, idea, or server request for Jarvis (supports English & Banglish)",
        "required": true,
        "type": 3
      }
    ],
    "permission": "Everyone",
    "dashboardTab": "ai"
  },
  {
    "name": "autopurge",
    "category": "moderation",
    "categoryLabel": "Moderation & Security",
    "emoji": "🛡️",
    "color": "#ef4444",
    "description": "Auto-delete all new messages in a channel after a delay.",
    "options": [
      {
        "name": "set",
        "description": "Set autopurge for a channel.",
        "required": false,
        "type": 1
      },
      {
        "name": "remove",
        "description": "Remove autopurge from a channel.",
        "required": false,
        "type": 1
      },
      {
        "name": "list",
        "description": "List all autopurge channels in this server.",
        "required": false,
        "type": 1
      }
    ],
    "permission": "Manage Messages",
    "dashboardTab": null
  },
  {
    "name": "balance",
    "category": "economy",
    "categoryLabel": "Economy & Mini-Games",
    "emoji": "🪙",
    "color": "#10b981",
    "description": "Check your current Jarvis Coin wallet balance",
    "options": [
      {
        "name": "user",
        "description": "The user whose balance to view",
        "required": false,
        "type": 6
      }
    ],
    "permission": "Everyone",
    "dashboardTab": null
  },
  {
    "name": "ban",
    "category": "moderation",
    "categoryLabel": "Moderation & Security",
    "emoji": "🛡️",
    "color": "#ef4444",
    "description": "Ban a member from the server.",
    "options": [
      {
        "name": "user",
        "description": "The member to ban.",
        "required": true,
        "type": 6
      },
      {
        "name": "reason",
        "description": "Reason for the ban.",
        "required": false,
        "type": 3
      },
      {
        "name": "delete_days",
        "description": "Number of days of messages to delete (0-7).",
        "required": false,
        "type": 4
      }
    ],
    "permission": "Ban Members",
    "dashboardTab": null
  },
  {
    "name": "birthday",
    "category": "birthdays",
    "categoryLabel": "Birthdays",
    "emoji": "🎂",
    "color": "#f43f5e",
    "description": "Register or view birthdays on the server",
    "options": [
      {
        "name": "set",
        "description": "Register your birthday",
        "required": false,
        "type": 1
      },
      {
        "name": "list",
        "description": "View upcoming registered birthdays",
        "required": false,
        "type": 1
      }
    ],
    "permission": "Everyone",
    "dashboardTab": "birthdays"
  },
  {
    "name": "botcontrol",
    "category": "utility",
    "categoryLabel": "Utility & Tools",
    "emoji": "⚙️",
    "color": "#3b82f6",
    "description": "Manage bot exclusivity, access modes, and permissions for this server.",
    "options": [
      {
        "name": "mode",
        "description": "Set who is allowed to use this bot in this server.",
        "required": false,
        "type": 1
      },
      {
        "name": "allow",
        "description": "Authorize a role or user to use the bot.",
        "required": false,
        "type": 1
      },
      {
        "name": "deny",
        "description": "Revoke bot usage authorization from a role or user.",
        "required": false,
        "type": 1
      },
      {
        "name": "status",
        "description": "View current bot access mode, bot adder, and authorized permissions.",
        "required": false,
        "type": 1
      },
      {
        "name": "setadder",
        "description": "Change or designate the Bot Adder (Bot Manager) for this server.",
        "required": false,
        "type": 1
      }
    ],
    "permission": "Manage Server",
    "dashboardTab": null
  },
  {
    "name": "captcha-setup",
    "category": "moderation",
    "categoryLabel": "Moderation & Security",
    "emoji": "🛡️",
    "color": "#ef4444",
    "description": "Deploy a member verification panel to protect against spam bots",
    "options": [
      {
        "name": "verified_role",
        "description": "The role given upon successful verification",
        "required": true,
        "type": 8
      }
    ],
    "permission": "Everyone",
    "dashboardTab": "captcha"
  },
  {
    "name": "cases",
    "category": "moderation",
    "categoryLabel": "Moderation & Security",
    "emoji": "🛡️",
    "color": "#ef4444",
    "description": "View all moderation cases for a user.",
    "options": [
      {
        "name": "user",
        "description": "The user to look up.",
        "required": true,
        "type": 6
      }
    ],
    "permission": "Moderate Members",
    "dashboardTab": null
  },
  {
    "name": "category",
    "category": "utility",
    "categoryLabel": "Utility & Tools",
    "emoji": "⚙️",
    "color": "#3b82f6",
    "description": "Manage a category — hide, unhide, delete, or nuke it.",
    "options": [
      {
        "name": "hide",
        "description": "Hide a category and all its channels from @everyone.",
        "required": false,
        "type": 1
      },
      {
        "name": "unhide",
        "description": "Unhide a category and all its channels.",
        "required": false,
        "type": 1
      },
      {
        "name": "delete",
        "description": "Delete a category and all channels under it.",
        "required": false,
        "type": 1
      },
      {
        "name": "nuke",
        "description": "Nuke a category — clone all channels and delete originals (clears all messages).",
        "required": false,
        "type": 1
      }
    ],
    "permission": "Manage Channels",
    "dashboardTab": null
  },
  {
    "name": "coinflip",
    "category": "economy",
    "categoryLabel": "Economy & Mini-Games",
    "emoji": "🪙",
    "color": "#10b981",
    "description": "Double or nothing — gamble your Jarvis coins on a coin flip",
    "options": [
      {
        "name": "amount",
        "description": "Amount of coins to gamble",
        "required": true,
        "type": 4
      },
      {
        "name": "choice",
        "description": "Heads or Tails?",
        "required": true,
        "type": 3
      }
    ],
    "permission": "Everyone",
    "dashboardTab": null
  },
  {
    "name": "contributors",
    "category": "general",
    "categoryLabel": "General & Info",
    "emoji": "🌐",
    "color": "#64748b",
    "description": "See the amazing people who contributed to Quotient.",
    "options": [],
    "permission": "Everyone",
    "dashboardTab": null
  },
  {
    "name": "daily",
    "category": "economy",
    "categoryLabel": "Economy & Mini-Games",
    "emoji": "🪙",
    "color": "#10b981",
    "description": "Claim your daily Jarvis coin bonus",
    "options": [],
    "permission": "Everyone",
    "dashboardTab": null
  },
  {
    "name": "easytag",
    "category": "esports",
    "categoryLabel": "Esports & Scrims",
    "emoji": "🏆",
    "color": "#f59e0b",
    "description": "Auto-convert user IDs to Discord mentions in a channel.",
    "options": [
      {
        "name": "set",
        "description": "Set a channel for easytag.",
        "required": false,
        "type": 1
      },
      {
        "name": "remove",
        "description": "Remove easytag from a channel.",
        "required": false,
        "type": 1
      },
      {
        "name": "config",
        "description": "View all easytag channels.",
        "required": false,
        "type": 1
      }
    ],
    "permission": "Manage Server",
    "dashboardTab": null
  },
  {
    "name": "embed",
    "category": "utility",
    "categoryLabel": "Utility & Tools",
    "emoji": "⚙️",
    "color": "#3b82f6",
    "description": "Create a custom embed interactively.",
    "options": [
      {
        "name": "channel",
        "description": "Channel to send the embed to",
        "required": true,
        "type": 7
      }
    ],
    "permission": "Manage Messages",
    "dashboardTab": null
  },
  {
    "name": "giveaway",
    "category": "giveaways",
    "categoryLabel": "Giveaways",
    "emoji": "🎁",
    "color": "#a855f7",
    "description": "Host and manage giveaways on the server",
    "options": [
      {
        "name": "start",
        "description": "Start a new timed giveaway",
        "required": false,
        "type": 1
      },
      {
        "name": "end",
        "description": "Instantly conclude an ongoing giveaway",
        "required": false,
        "type": 1
      }
    ],
    "permission": "Everyone",
    "dashboardTab": null
  },
  {
    "name": "groupm",
    "category": "esports",
    "categoryLabel": "Esports & Scrims",
    "emoji": "🏆",
    "color": "#f59e0b",
    "description": "Automatically distribute registered teams into groups (Group A, B, C...)",
    "options": [
      {
        "name": "teams",
        "description": "List of team names separated by commas (e.g. Soul, GodL, Entity, Blind, 8bit)",
        "required": true,
        "type": 3
      },
      {
        "name": "teams_per_group",
        "description": "Number of teams in each group (e.g. 10 or 12)",
        "required": true,
        "type": 4
      },
      {
        "name": "tournament_name",
        "description": "Tournament Name for the embed title",
        "required": false,
        "type": 3
      }
    ],
    "permission": "Everyone",
    "dashboardTab": null
  },
  {
    "name": "help",
    "category": "general",
    "categoryLabel": "General & Info",
    "emoji": "🌐",
    "color": "#64748b",
    "description": "Displays a categorized list of all available commands",
    "options": [],
    "permission": "Everyone",
    "dashboardTab": null
  },
  {
    "name": "idp",
    "category": "esports",
    "categoryLabel": "Esports & Scrims",
    "emoji": "🏆",
    "color": "#f59e0b",
    "description": "Share Room ID/Password as an embed. Auto-deletes after 30 minutes.",
    "options": [
      {
        "name": "room_id",
        "description": "Room ID",
        "required": true,
        "type": 3
      },
      {
        "name": "password",
        "description": "Room Password",
        "required": true,
        "type": 3
      },
      {
        "name": "map",
        "description": "Map name (e.g. Erangel, Miramar)",
        "required": true,
        "type": 3
      },
      {
        "name": "ping_role",
        "description": "Role to ping with this IDP (optional)",
        "required": false,
        "type": 8
      }
    ],
    "permission": "Everyone",
    "dashboardTab": null
  },
  {
    "name": "imagine",
    "category": "ai",
    "categoryLabel": "AI Intelligence",
    "emoji": "🧠",
    "color": "#8b5cf6",
    "description": "Generate stunning high-definition AI images from text prompts",
    "options": [
      {
        "name": "prompt",
        "description": "Describe what image you want Jarvis AI to create",
        "required": true,
        "type": 3
      },
      {
        "name": "aspect_ratio",
        "description": "Image dimensions & aspect ratio",
        "required": false,
        "type": 3
      }
    ],
    "permission": "Everyone",
    "dashboardTab": "ai"
  },
  {
    "name": "invite",
    "category": "general",
    "categoryLabel": "General & Info",
    "emoji": "🌐",
    "color": "#64748b",
    "description": "Get invite links for the bot and the support server.",
    "options": [],
    "permission": "Everyone",
    "dashboardTab": null
  },
  {
    "name": "kick",
    "category": "moderation",
    "categoryLabel": "Moderation & Security",
    "emoji": "🛡️",
    "color": "#ef4444",
    "description": "Kick a member from the server.",
    "options": [
      {
        "name": "user",
        "description": "The member to kick.",
        "required": true,
        "type": 6
      },
      {
        "name": "reason",
        "description": "Reason for the kick.",
        "required": false,
        "type": 3
      }
    ],
    "permission": "Kick Members",
    "dashboardTab": null
  },
  {
    "name": "leaderboard",
    "category": "leveling",
    "categoryLabel": "Leveling & XP",
    "emoji": "⭐",
    "color": "#eab308",
    "description": "View the top 10 most active members on the server",
    "options": [],
    "permission": "Everyone",
    "dashboardTab": "leveling"
  },
  {
    "name": "lock",
    "category": "moderation",
    "categoryLabel": "Moderation & Security",
    "emoji": "🛡️",
    "color": "#ef4444",
    "description": "Lock a channel, category, or the entire server.",
    "options": [
      {
        "name": "type",
        "description": "What to lock",
        "required": true,
        "type": 3
      },
      {
        "name": "target_channel",
        "description": "Target channel or category (defaults to current channel/category)",
        "required": false,
        "type": 7
      },
      {
        "name": "duration",
        "description": "Lock duration (e.g. 10m, 2h, 1d). Leave blank for permanent.",
        "required": false,
        "type": 3
      },
      {
        "name": "reason",
        "description": "Reason for locking",
        "required": false,
        "type": 3
      }
    ],
    "permission": "Manage Channels",
    "dashboardTab": null
  },
  {
    "name": "maintenance",
    "category": "moderation",
    "categoryLabel": "Moderation & Security",
    "emoji": "🛡️",
    "color": "#ef4444",
    "description": "Manage server maintenance mode.",
    "options": [
      {
        "name": "on",
        "description": "Turn ON maintenance mode for a role (hides channels).",
        "required": false,
        "type": 1
      },
      {
        "name": "off",
        "description": "Turn OFF maintenance mode for a role (restores channel access).",
        "required": false,
        "type": 1
      }
    ],
    "permission": "Administrator",
    "dashboardTab": null
  },
  {
    "name": "mass-create",
    "category": "moderation",
    "categoryLabel": "Moderation & Security",
    "emoji": "🛡️",
    "color": "#ef4444",
    "description": "Creates multiple private channels and roles under a category.",
    "options": [
      {
        "name": "name",
        "description": "Base name for the category and channels (e.g., Team)",
        "required": true,
        "type": 3
      },
      {
        "name": "count",
        "description": "Number of channels/roles to create (Max 50)",
        "required": true,
        "type": 4
      }
    ],
    "permission": "Administrator",
    "dashboardTab": null
  },
  {
    "name": "mass-delete",
    "category": "moderation",
    "categoryLabel": "Moderation & Security",
    "emoji": "🛡️",
    "color": "#ef4444",
    "description": "Deletes all channels in a category, their corresponding roles, and the category itself.",
    "options": [
      {
        "name": "category",
        "description": "The category to delete (along with its channels and roles)",
        "required": true,
        "type": 7
      }
    ],
    "permission": "Administrator",
    "dashboardTab": null
  },
  {
    "name": "mass-message",
    "category": "moderation",
    "categoryLabel": "Moderation & Security",
    "emoji": "🛡️",
    "color": "#ef4444",
    "description": "Send a message/embed to all channels within a category.",
    "options": [
      {
        "name": "category",
        "description": "The category containing the channels",
        "required": true,
        "type": 7
      },
      {
        "name": "message",
        "description": "The message content to send",
        "required": true,
        "type": 3
      },
      {
        "name": "timer",
        "description": "Delay in minutes before sending (Optional)",
        "required": false,
        "type": 4
      }
    ],
    "permission": "Administrator",
    "dashboardTab": null
  },
  {
    "name": "mass-role",
    "category": "moderation",
    "categoryLabel": "Moderation & Security",
    "emoji": "🛡️",
    "color": "#ef4444",
    "description": "Easily assign or remove a role from multiple users at once.",
    "options": [
      {
        "name": "add",
        "description": "Add a role to multiple users.",
        "required": false,
        "type": 1
      },
      {
        "name": "remove",
        "description": "Remove a role from multiple users.",
        "required": false,
        "type": 1
      }
    ],
    "permission": "Manage Roles",
    "dashboardTab": "roles"
  },
  {
    "name": "money",
    "category": "economy",
    "categoryLabel": "Economy & Mini-Games",
    "emoji": "🪙",
    "color": "#10b981",
    "description": "Check your current balance of Quo Coins.",
    "options": [],
    "permission": "Everyone",
    "dashboardTab": null
  },
  {
    "name": "mute",
    "category": "moderation",
    "categoryLabel": "Moderation & Security",
    "emoji": "🛡️",
    "color": "#ef4444",
    "description": "Timeout (mute) a member using Discord's native timeout.",
    "options": [
      {
        "name": "user",
        "description": "The member to mute.",
        "required": true,
        "type": 6
      },
      {
        "name": "duration",
        "description": "Mute duration.",
        "required": true,
        "type": 3
      },
      {
        "name": "reason",
        "description": "Reason for the mute.",
        "required": false,
        "type": 3
      }
    ],
    "permission": "Moderate Members",
    "dashboardTab": null
  },
  {
    "name": "nowplaying",
    "category": "music",
    "categoryLabel": "Music Engine",
    "emoji": "🎵",
    "color": "#ec4899",
    "description": "Displays information about the currently playing song.",
    "options": [],
    "permission": "Everyone",
    "dashboardTab": "music"
  },
  {
    "name": "pause",
    "category": "music",
    "categoryLabel": "Music Engine",
    "emoji": "🎵",
    "color": "#ec4899",
    "description": "Pauses the currently playing music.",
    "options": [],
    "permission": "Everyone",
    "dashboardTab": "music"
  },
  {
    "name": "ping",
    "category": "general",
    "categoryLabel": "General & Info",
    "emoji": "🌐",
    "color": "#64748b",
    "description": "Check the bot's and database's response latency.",
    "options": [],
    "permission": "Everyone",
    "dashboardTab": null
  },
  {
    "name": "play",
    "category": "music",
    "categoryLabel": "Music Engine",
    "emoji": "🎵",
    "color": "#ec4899",
    "description": "Plays a song from YouTube, Spotify, or SoundCloud.",
    "options": [
      {
        "name": "query",
        "description": "The name or URL of the song/playlist.",
        "required": true,
        "type": 3
      }
    ],
    "permission": "Everyone",
    "dashboardTab": "music"
  },
  {
    "name": "pointstable",
    "category": "esports",
    "categoryLabel": "Esports & Scrims",
    "emoji": "🏆",
    "color": "#f59e0b",
    "description": "Calculate and generate formatted esports match points table",
    "options": [
      {
        "name": "title",
        "description": "Tournament or Match Title (e.g. Scrims Match 1 - Miramar)",
        "required": true,
        "type": 3
      },
      {
        "name": "data",
        "description": "Format: TeamName,PlacePts,Kills | TeamName2,PlacePts,Kills",
        "required": true,
        "type": 3
      },
      {
        "name": "footer",
        "description": "Optional footer text",
        "required": false,
        "type": 3
      }
    ],
    "permission": "Everyone",
    "dashboardTab": null
  },
  {
    "name": "purge",
    "category": "moderation",
    "categoryLabel": "Moderation & Security",
    "emoji": "🛡️",
    "color": "#ef4444",
    "description": "Bulk delete messages or manage message elements.",
    "options": [
      {
        "name": "amount",
        "description": "Delete a specific number of messages.",
        "required": false,
        "type": 1
      },
      {
        "name": "user",
        "description": "Delete messages from a specific user.",
        "required": false,
        "type": 1
      },
      {
        "name": "bots",
        "description": "Delete bot messages only.",
        "required": false,
        "type": 1
      },
      {
        "name": "contains",
        "description": "Delete messages containing specific text.",
        "required": false,
        "type": 1
      },
      {
        "name": "embeds",
        "description": "Delete messages containing embeds.",
        "required": false,
        "type": 1
      },
      {
        "name": "files",
        "description": "Delete messages containing attachments/files.",
        "required": false,
        "type": 1
      },
      {
        "name": "images",
        "description": "Delete messages containing embeds or attachments.",
        "required": false,
        "type": 1
      },
      {
        "name": "reactions",
        "description": "Remove all reactions from recent messages.",
        "required": false,
        "type": 1
      },
      {
        "name": "selfclean",
        "description": "Delete the bot's own messages in this channel.",
        "required": false,
        "type": 1
      }
    ],
    "permission": "Manage Messages",
    "dashboardTab": null
  },
  {
    "name": "queue",
    "category": "music",
    "categoryLabel": "Music Engine",
    "emoji": "🎵",
    "color": "#ec4899",
    "description": "Displays the current music queue.",
    "options": [],
    "permission": "Everyone",
    "dashboardTab": "music"
  },
  {
    "name": "rank",
    "category": "leveling",
    "categoryLabel": "Leveling & XP",
    "emoji": "⭐",
    "color": "#eab308",
    "description": "View your server level, XP progress, and rank",
    "options": [
      {
        "name": "user",
        "description": "The user whose rank you want to check",
        "required": false,
        "type": 6
      }
    ],
    "permission": "Everyone",
    "dashboardTab": "leveling"
  },
  {
    "name": "reminder",
    "category": "utility",
    "categoryLabel": "Utility & Tools",
    "emoji": "⚙️",
    "color": "#3b82f6",
    "description": "Set a reminder.",
    "options": [
      {
        "name": "set",
        "description": "Set a new reminder.",
        "required": false,
        "type": 1
      },
      {
        "name": "list",
        "description": "View your active reminders.",
        "required": false,
        "type": 1
      },
      {
        "name": "cancel",
        "description": "Cancel a reminder by ID.",
        "required": false,
        "type": 1
      }
    ],
    "permission": "Everyone",
    "dashboardTab": null
  },
  {
    "name": "resume",
    "category": "music",
    "categoryLabel": "Music Engine",
    "emoji": "🎵",
    "color": "#ec4899",
    "description": "Resumes the paused music.",
    "options": [],
    "permission": "Everyone",
    "dashboardTab": "music"
  },
  {
    "name": "roleall",
    "category": "moderation",
    "categoryLabel": "Moderation & Security",
    "emoji": "🛡️",
    "color": "#ef4444",
    "description": "Add a role to multiple members at once.",
    "options": [
      {
        "name": "all",
        "description": "Add a role to ALL members (humans + bots).",
        "required": false,
        "type": 1
      },
      {
        "name": "humans",
        "description": "Add a role to all human members only.",
        "required": false,
        "type": 1
      },
      {
        "name": "bots",
        "description": "Add a role to all bot members only.",
        "required": false,
        "type": 1
      }
    ],
    "permission": "Manage Roles",
    "dashboardTab": "roles"
  },
  {
    "name": "rrole",
    "category": "moderation",
    "categoryLabel": "Moderation & Security",
    "emoji": "🛡️",
    "color": "#ef4444",
    "description": "Remove a role from one or multiple members.",
    "options": [
      {
        "name": "role",
        "description": "Role to remove",
        "required": true,
        "type": 8
      },
      {
        "name": "user1",
        "description": "Member to remove role from",
        "required": false,
        "type": 6
      },
      {
        "name": "user2",
        "description": "Member to remove role from",
        "required": false,
        "type": 6
      },
      {
        "name": "user3",
        "description": "Member to remove role from",
        "required": false,
        "type": 6
      },
      {
        "name": "user4",
        "description": "Member to remove role from",
        "required": false,
        "type": 6
      },
      {
        "name": "user5",
        "description": "Member to remove role from",
        "required": false,
        "type": 6
      }
    ],
    "permission": "Manage Roles",
    "dashboardTab": "roles"
  },
  {
    "name": "seek",
    "category": "music",
    "categoryLabel": "Music Engine",
    "emoji": "🎵",
    "color": "#ec4899",
    "description": "Jump to a specific time in the current song.",
    "options": [
      {
        "name": "seconds",
        "description": "The time in seconds to jump to.",
        "required": true,
        "type": 4
      }
    ],
    "permission": "Everyone",
    "dashboardTab": null
  },
  {
    "name": "setup",
    "category": "utility",
    "categoryLabel": "Utility & Tools",
    "emoji": "⚙️",
    "color": "#3b82f6",
    "description": "Configure bot settings for this server.",
    "options": [
      {
        "name": "mod-logs",
        "description": "Set the channel for moderation action logs.",
        "required": false,
        "type": 1
      },
      {
        "name": "server-logs",
        "description": "Set the channel for server event logs (edits, deletes, joins).",
        "required": false,
        "type": 1
      },
      {
        "name": "member-role",
        "description": "Set the role automatically assigned to new members on join.",
        "required": false,
        "type": 1
      },
      {
        "name": "view",
        "description": "View the current bot configuration for this server.",
        "required": false,
        "type": 1
      }
    ],
    "permission": "Administrator",
    "dashboardTab": null
  },
  {
    "name": "setup-roles",
    "category": "utility",
    "categoryLabel": "Utility & Tools",
    "emoji": "⚙️",
    "color": "#3b82f6",
    "description": "Post a role-selection embed with buttons in the current channel.",
    "options": [
      {
        "name": "roles",
        "description": "Comma-separated list of \"roleId:Label\" pairs. E.g. 123:🎮 Gamer,456:🎵 Music",
        "required": true,
        "type": 3
      },
      {
        "name": "title",
        "description": "Embed title (default: \"Choose Your Roles\")",
        "required": false,
        "type": 3
      },
      {
        "name": "description",
        "description": "Embed description text.",
        "required": false,
        "type": 3
      }
    ],
    "permission": "Manage Roles",
    "dashboardTab": "roles"
  },
  {
    "name": "setupgoodbye",
    "category": "welcome",
    "categoryLabel": "Welcome & Goodbye",
    "emoji": "👋",
    "color": "#14b8a6",
    "description": "Configure the goodbye system dashboard.",
    "options": [],
    "permission": "Manage Server",
    "dashboardTab": "welcome"
  },
  {
    "name": "setupsocial",
    "category": "utility",
    "categoryLabel": "Utility & Tools",
    "emoji": "⚙️",
    "color": "#3b82f6",
    "description": "Configure social media notifications.",
    "options": [],
    "permission": "Manage Server",
    "dashboardTab": "social"
  },
  {
    "name": "setupwelcome",
    "category": "welcome",
    "categoryLabel": "Welcome & Goodbye",
    "emoji": "👋",
    "color": "#14b8a6",
    "description": "Configure the welcome system dashboard.",
    "options": [],
    "permission": "Manage Server",
    "dashboardTab": "welcome"
  },
  {
    "name": "simulate",
    "category": "welcome",
    "categoryLabel": "Welcome & Goodbye",
    "emoji": "👋",
    "color": "#14b8a6",
    "description": "Simulate a user joining or leaving the server to test your systems.",
    "options": [
      {
        "name": "event",
        "description": "Which event do you want to simulate?",
        "required": true,
        "type": 3
      }
    ],
    "permission": "Manage Server",
    "dashboardTab": null
  },
  {
    "name": "skip",
    "category": "music",
    "categoryLabel": "Music Engine",
    "emoji": "🎵",
    "color": "#ec4899",
    "description": "Skips the currently playing song.",
    "options": [],
    "permission": "Everyone",
    "dashboardTab": null
  },
  {
    "name": "slotmanager",
    "category": "esports",
    "categoryLabel": "Esports & Scrims",
    "emoji": "🏆",
    "color": "#f59e0b",
    "description": "Manage your esports tournament or scrim slots.",
    "options": [
      {
        "name": "cancel",
        "description": "Cancel your registration for an active scrim or tournament.",
        "required": false,
        "type": 1
      },
      {
        "name": "view",
        "description": "View your current registered slots.",
        "required": false,
        "type": 1
      }
    ],
    "permission": "Everyone",
    "dashboardTab": null
  },
  {
    "name": "smanager",
    "category": "esports",
    "categoryLabel": "Esports & Scrims",
    "emoji": "🏆",
    "color": "#f59e0b",
    "description": "Launch the interactive Scrims Manager.",
    "options": [],
    "permission": "Manage Server",
    "dashboardTab": null
  },
  {
    "name": "snipe",
    "category": "moderation",
    "categoryLabel": "Moderation & Security",
    "emoji": "🛡️",
    "color": "#ef4444",
    "description": "Show the last deleted message in this channel.",
    "options": [
      {
        "name": "channel",
        "description": "Channel to snipe (defaults to current)",
        "required": false,
        "type": 7
      }
    ],
    "permission": "Everyone",
    "dashboardTab": null
  },
  {
    "name": "source",
    "category": "general",
    "categoryLabel": "General & Info",
    "emoji": "🌐",
    "color": "#64748b",
    "description": "Get links to the bot's source code on GitHub.",
    "options": [
      {
        "name": "command",
        "description": "Optional command to get the source code of",
        "required": false,
        "type": 3
      }
    ],
    "permission": "Everyone",
    "dashboardTab": null
  },
  {
    "name": "ssverify",
    "category": "esports",
    "categoryLabel": "Esports & Scrims",
    "emoji": "🏆",
    "color": "#f59e0b",
    "description": "Screenshot verification system.",
    "options": [
      {
        "name": "submit",
        "description": "Submit a screenshot for verification.",
        "required": false,
        "type": 1
      },
      {
        "name": "setup",
        "description": "Set the SS verification log channel and role to assign.",
        "required": false,
        "type": 1
      }
    ],
    "permission": "Everyone",
    "dashboardTab": "esports"
  },
  {
    "name": "stats-setup",
    "category": "voice",
    "categoryLabel": "Voice Channels",
    "emoji": "🔊",
    "color": "#06b6d4",
    "description": "Automatically create live server stats voice counters",
    "options": [],
    "permission": "Everyone",
    "dashboardTab": "tempvoice"
  },
  {
    "name": "stop",
    "category": "music",
    "categoryLabel": "Music Engine",
    "emoji": "🎵",
    "color": "#ec4899",
    "description": "Stops the music and clears the queue.",
    "options": [],
    "permission": "Everyone",
    "dashboardTab": "music"
  },
  {
    "name": "summarize",
    "category": "ai",
    "categoryLabel": "AI Intelligence",
    "emoji": "🧠",
    "color": "#8b5cf6",
    "description": "AI summarizes recent chat history for this channel",
    "options": [
      {
        "name": "count",
        "description": "Number of recent messages to analyze (10 - 50)",
        "required": false,
        "type": 4
      }
    ],
    "permission": "Everyone",
    "dashboardTab": "ai"
  },
  {
    "name": "tag",
    "category": "utility",
    "categoryLabel": "Utility & Tools",
    "emoji": "⚙️",
    "color": "#3b82f6",
    "description": "Server tag system — create and use custom tags.",
    "options": [
      {
        "name": "get",
        "description": "Retrieve a tag by name.",
        "required": false,
        "type": 1
      },
      {
        "name": "create",
        "description": "Create a new tag.",
        "required": false,
        "type": 1
      },
      {
        "name": "delete",
        "description": "Delete a tag you own.",
        "required": false,
        "type": 1
      },
      {
        "name": "edit",
        "description": "Edit a tag you own.",
        "required": false,
        "type": 1
      },
      {
        "name": "list",
        "description": "List all tags in this server.",
        "required": false,
        "type": 1
      },
      {
        "name": "search",
        "description": "Search for tags by name.",
        "required": false,
        "type": 1
      },
      {
        "name": "info",
        "description": "Get info about a tag.",
        "required": false,
        "type": 1
      },
      {
        "name": "claim",
        "description": "Claim ownership of a tag if the owner left the server.",
        "required": false,
        "type": 1
      },
      {
        "name": "transfer",
        "description": "Transfer ownership of a tag.",
        "required": false,
        "type": 1
      },
      {
        "name": "purge",
        "description": "Purge all tags of a member (Requires Manage Server).",
        "required": false,
        "type": 1
      }
    ],
    "permission": "Everyone",
    "dashboardTab": null
  },
  {
    "name": "tagcheck",
    "category": "esports",
    "categoryLabel": "Esports & Scrims",
    "emoji": "🏆",
    "color": "#f59e0b",
    "description": "Set up channels where users must tag the required number of teammates.",
    "options": [
      {
        "name": "set",
        "description": "Set a channel as a tagcheck channel.",
        "required": false,
        "type": 1
      },
      {
        "name": "remove",
        "description": "Remove tagcheck from a channel.",
        "required": false,
        "type": 1
      },
      {
        "name": "config",
        "description": "View all tagcheck channels.",
        "required": false,
        "type": 1
      },
      {
        "name": "autodelete",
        "description": "Toggle autodelete of wrong-format messages in a tagcheck channel.",
        "required": false,
        "type": 1
      }
    ],
    "permission": "Manage Server",
    "dashboardTab": null
  },
  {
    "name": "ticket",
    "category": "tickets",
    "categoryLabel": "Support Tickets",
    "emoji": "🎟️",
    "color": "#6366f1",
    "description": "Manage the interactive ticket support system",
    "options": [
      {
        "name": "setup",
        "description": "Deploy the ticket panel embed in this channel",
        "required": false,
        "type": 1
      },
      {
        "name": "config",
        "description": "Configure the ticket system settings",
        "required": false,
        "type": 1
      },
      {
        "name": "stats",
        "description": "Show ticket statistics for this server",
        "required": false,
        "type": 1
      }
    ],
    "permission": "Everyone",
    "dashboardTab": "tickets"
  },
  {
    "name": "tourney",
    "category": "esports",
    "categoryLabel": "Esports & Scrims",
    "emoji": "🏆",
    "color": "#f59e0b",
    "description": "Launch the interactive Tournament Manager.",
    "options": [],
    "permission": "Manage Server",
    "dashboardTab": null
  },
  {
    "name": "trivia",
    "category": "economy",
    "categoryLabel": "Economy & Mini-Games",
    "emoji": "🪙",
    "color": "#10b981",
    "description": "Play an interactive trivia quiz and win Jarvis Coins!",
    "options": [],
    "permission": "Everyone",
    "dashboardTab": null
  },
  {
    "name": "truthordare",
    "category": "economy",
    "categoryLabel": "Economy & Mini-Games",
    "emoji": "🪙",
    "color": "#10b981",
    "description": "Get a random Truth or Dare prompt for server party and voice chat",
    "options": [
      {
        "name": "type",
        "description": "Truth or Dare?",
        "required": true,
        "type": 3
      }
    ],
    "permission": "Everyone",
    "dashboardTab": null
  },
  {
    "name": "unban",
    "category": "moderation",
    "categoryLabel": "Moderation & Security",
    "emoji": "🛡️",
    "color": "#ef4444",
    "description": "Unban a member from the server.",
    "options": [
      {
        "name": "user_id",
        "description": "The Discord User ID of the banned member",
        "required": true,
        "type": 3
      },
      {
        "name": "reason",
        "description": "Reason for unbanning",
        "required": false,
        "type": 3
      }
    ],
    "permission": "Ban Members",
    "dashboardTab": null
  },
  {
    "name": "unlock",
    "category": "moderation",
    "categoryLabel": "Moderation & Security",
    "emoji": "🛡️",
    "color": "#ef4444",
    "description": "Unlock a channel, category, or the entire server.",
    "options": [
      {
        "name": "type",
        "description": "What to unlock",
        "required": true,
        "type": 3
      },
      {
        "name": "target_channel",
        "description": "Target channel or category (defaults to current channel/category)",
        "required": false,
        "type": 7
      },
      {
        "name": "reason",
        "description": "Reason for unlocking",
        "required": false,
        "type": 3
      }
    ],
    "permission": "Manage Channels",
    "dashboardTab": null
  },
  {
    "name": "unmute",
    "category": "moderation",
    "categoryLabel": "Moderation & Security",
    "emoji": "🛡️",
    "color": "#ef4444",
    "description": "Remove the timeout (unmute) from a member.",
    "options": [
      {
        "name": "user",
        "description": "The member to unmute.",
        "required": true,
        "type": 6
      },
      {
        "name": "reason",
        "description": "Reason.",
        "required": false,
        "type": 3
      }
    ],
    "permission": "Moderate Members",
    "dashboardTab": null
  },
  {
    "name": "volume",
    "category": "music",
    "categoryLabel": "Music Engine",
    "emoji": "🎵",
    "color": "#ec4899",
    "description": "Changes the music playback volume.",
    "options": [
      {
        "name": "amount",
        "description": "The volume level (1-100)",
        "required": true,
        "type": 4
      }
    ],
    "permission": "Everyone",
    "dashboardTab": "music"
  },
  {
    "name": "vote",
    "category": "general",
    "categoryLabel": "General & Info",
    "emoji": "🌐",
    "color": "#64748b",
    "description": "Vote for the bot to get rewards.",
    "options": [],
    "permission": "Everyone",
    "dashboardTab": null
  },
  {
    "name": "voteremind",
    "category": "general",
    "categoryLabel": "General & Info",
    "emoji": "🌐",
    "color": "#64748b",
    "description": "Toggle reminders when your vote eligibility expires.",
    "options": [],
    "permission": "Everyone",
    "dashboardTab": null
  },
  {
    "name": "warn",
    "category": "moderation",
    "categoryLabel": "Moderation & Security",
    "emoji": "🛡️",
    "color": "#ef4444",
    "description": "Issue a formal warning to a member.",
    "options": [
      {
        "name": "user",
        "description": "The member to warn.",
        "required": true,
        "type": 6
      },
      {
        "name": "reason",
        "description": "Reason for the warning.",
        "required": true,
        "type": 3
      }
    ],
    "permission": "Moderate Members",
    "dashboardTab": null
  }
];
