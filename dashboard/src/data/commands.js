// dashboard/src/data/commands.js
// ─────────────────────────────────────────────────────────────────────────────
// Complete Directory of all 73 Jarvis Bot Slash Commands with category breakdown,
// parameter details, Bengali/English purpose explanations, and dashboard links.
// ─────────────────────────────────────────────────────────────────────────────

export const COMMAND_CATEGORIES = [
  {
    "key": "ai",
    "label": "AI Intelligence",
    "labelBn": "কৃত্রিম বুদ্ধিমত্তা ও চ্যাট অ্যাসিস্ট্যান্ট",
    "icon": "🧠",
    "color": "#8b5cf6",
    "desc": "Ask Jarvis AI questions, generate AI images, analyze chats, and automate tasks.",
    "descBn": "জার্ভিস AI-কে যেকোনো প্রশ্ন করুন, AI ছবি তৈরি করুন এবং চ্যাট সামারাইজ করুন।",
    "dashboardTab": "ai"
  },
  {
    "key": "moderation",
    "label": "Moderation & Security",
    "labelBn": "সার্ভার মডারেশন ও নিরাপত্তা টুলস",
    "icon": "🛡️",
    "color": "#ef4444",
    "desc": "Keep your community safe with ban, kick, timeout/mute, channel locks, auto-purge, and cases.",
    "descBn": "সার্ভারের শৃঙ্খলা রক্ষা, নিয়ম ভঙ্গকারীদের ব্যান/মিউট এবং চ্যানেল লক বা আনলক করার টুলস।",
    "dashboardTab": "antinuke"
  },
  {
    "key": "esports",
    "label": "Esports & Scrims",
    "labelBn": "কাস্টম স্ক্রিমস ও টুর্নামেন্ট ম্যানেজমেন্ট",
    "icon": "🏆",
    "color": "#f59e0b",
    "desc": "Manage scrims registration, slot bookings, team tag checks, screenshot verify, and points tables.",
    "descBn": "কাস্টম স্ক্রিমস, স্লট বুকিং, টিম ট্যাগ ভেরিফিকেশন এবং টুর্নামেন্ট পয়েন্ট টেবিল পরিচালনা।",
    "dashboardTab": null
  },
  {
    "key": "tickets",
    "label": "Support Tickets",
    "labelBn": "সাপোর্ট টিকিট ও হেল্প ডেস্ক",
    "icon": "🎟️",
    "color": "#6366f1",
    "desc": "Deploy interactive ticket panels for private member support, staff claims, and transcripts.",
    "descBn": "সার্ভার মেম্বারদের জন্য প্রাইভেট টিকিট প্যানেল, স্টাফ ক্লেইম এবং সাপোর্ট হিস্ট্রি।",
    "dashboardTab": "tickets"
  },
  {
    "key": "music",
    "label": "Music & Audio Engine",
    "labelBn": "হাই-কোয়ালিটি ভয়েস মিউজিক প্লেয়ার",
    "icon": "🎵",
    "color": "#ec4899",
    "desc": "High-fidelity audio player with YouTube, Spotify, and SoundCloud support in voice channels.",
    "descBn": "ভয়েস চ্যানেলে হাই-কোয়ালিটি গান প্লে, কিউ দেখা, স্কিপ, পজ এবং ভলিউম কন্ট্রোল।",
    "dashboardTab": "music"
  },
  {
    "key": "utility",
    "label": "Utility & Tools",
    "labelBn": "সোশ্যাল নোটিফিকেশন, এমবেড ও ইউটিলিটি",
    "icon": "⚙️",
    "color": "#3b82f6",
    "desc": "Interactive embed builder, social feeds (YouTube, Facebook, TikTok), tags, and server tools.",
    "descBn": "কাস্টম এমবেড ডিজাইন, ইউটিউব/ফেসবুক অটো নোটিফিকেশন এবং সার্ভার অটোমেশন।",
    "dashboardTab": "social"
  },
  {
    "key": "economy",
    "label": "Economy & Mini-Games",
    "labelBn": "সার্ভার কয়েন ও বিনোদনমূলক গেমস",
    "icon": "🪙",
    "color": "#10b981",
    "desc": "Earn Jarvis Coins through daily rewards, coinflip, trivia quizzes, and truth-or-dare party games.",
    "descBn": "ডেইলি রিওয়ার্ড, কয়েনফ্লিপ, ট্রিভিয়া কুইজ এবং ট্রুথ অর ডেয়ার খেলে কয়েন অর্জন।",
    "dashboardTab": null
  },
  {
    "key": "leveling",
    "label": "Leveling & XP",
    "labelBn": "অ্যাক্টিভিটি লেভেল ও লিডারবোর্ড",
    "icon": "⭐",
    "color": "#eab308",
    "desc": "Reward active chatters with XP levels, beautiful rank cards, and competitive server leaderboards.",
    "descBn": "মেম্বারদের চ্যাট অনুযায়ী XP দেওয়া, র‍্যাংক কার্ড দেখা এবং সার্ভার লিডারবোর্ড।",
    "dashboardTab": "leveling"
  },
  {
    "key": "welcome",
    "label": "Welcome & Goodbye",
    "labelBn": "স্বাগতম ও বিদায় বার্তা সিস্টেম",
    "icon": "👋",
    "color": "#14b8a6",
    "desc": "Configure rich welcome embeds with animated emojis and farewell departure announcements.",
    "descBn": "নতুন মেম্বারদের অ্যানিমেটেড ইমোজিসহ ওয়েলকাম এবং বিদায় বার্তা সেটআপ করা।",
    "dashboardTab": null
  },
  {
    "key": "voice",
    "label": "Dynamic Temp Voice",
    "labelBn": "প্রাইভেট টেম্প ভয়েস রুমস",
    "icon": "🔊",
    "color": "#06b6d4",
    "desc": "Join-to-Create dynamic voice rooms that auto-create and auto-delete when empty.",
    "descBn": "জয়েন করলেই অটোমেটিক পার্সোনাল ভয়েস রুম তৈরি এবং খালি হলে অটো ডিলিট।",
    "dashboardTab": "tempvoice"
  },
  {
    "key": "giveaways",
    "label": "Giveaways & Drops",
    "labelBn": "গিভঅ্যাওয়ে ও উইনার ড্র",
    "icon": "🎁",
    "color": "#a855f7",
    "desc": "Host automated giveaways with countdown timers, reaction entries, and random winner rolls.",
    "descBn": "সার্ভারে টাইমারসহ স্বয়ংক্রিয় গিভঅ্যাওয়ে শুরু করা এবং উইনার নির্বাচন করা।",
    "dashboardTab": null
  },
  {
    "key": "birthdays",
    "label": "Birthday Celebrations",
    "labelBn": "জন্মদিন শুভেচ্ছা ও স্পেশাল রোল",
    "icon": "🎂",
    "color": "#f43f5e",
    "desc": "Celebrate member birthdays automatically with special announcement cards and temporary roles.",
    "descBn": "মেম্বারদের জন্মদিনে স্বয়ংক্রিয় উইশ বার্তা পাঠানো এবং স্পেশাল সেলিব্রেশন রোল দেওয়া।",
    "dashboardTab": "birthdays"
  },
  {
    "key": "general",
    "label": "General & Server Info",
    "labelBn": "সাধারণ তথ্য, অবতার ও বট হেল্প",
    "icon": "🌐",
    "color": "#64748b",
    "desc": "Essential community commands: user avatars, server info, AFK status, bot latency, and voting.",
    "descBn": "বটের পিং, সার্ভার ইনফো, ইউজারের অবতার, AFK সেট এবং সাধারণ হেল্প।",
    "dashboardTab": null
  }
];

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
    "dashboardTab": null,
    "purposeBn": "বটের সার্বিক তথ্য, সক্রিয় ফিচার ও সিস্টেম স্ট্যাটাস দেখতে।",
    "usage": "/about"
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
    "dashboardTab": null,
    "purposeBn": "অন্যদের জানাতে যে আপনি সাময়িকভাবে ব্যস্ত বা কীবোর্ড থেকে দূরে আছেন।",
    "usage": "/afk reason:Dinner time"
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
    "dashboardTab": "ai",
    "purposeBn": "জার্ভিস AI-কে যেকোনো প্রশ্ন করতে বা সার্ভারের কাজ পরিচালনা করতে।",
    "usage": "/ask prompt:How to setup a Discord role hierarchy?"
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
    "dashboardTab": null,
    "purposeBn": "একটি চ্যানেলের সব নতুন মেসেজ নির্দিষ্ট সময় পর স্বয়ংক্রিয়ভাবে মুছে ফেলতে।",
    "usage": "/autopurge set channel:#spam-box delay:1m"
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
    "dashboardTab": null,
    "purposeBn": "নিজের বা অন্য কোনো মেম্বারের বর্তমান জার্ভিস কয়েন ব্যালেন্স জানতে।",
    "usage": "/balance [user:@member]"
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
    "dashboardTab": null,
    "purposeBn": "সার্ভার থেকে কোনো মেম্বারকে স্থায়ীভাবে বহিষ্কার (Ban) করতে।",
    "usage": "/ban user:@baduser reason:Violating server rules"
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
    "dashboardTab": "birthdays",
    "purposeBn": "নিজের জন্মদিন রেজিস্টার করতে বা সার্ভারের পরবর্তী জন্মদিন দেখতে।",
    "usage": "/birthday set month:5 day:20"
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
    "dashboardTab": null,
    "purposeBn": "বটের পারমিশন ডায়াগনস্টিক ও মডিউল স্ট্যাটাস পরীক্ষা করতে।",
    "usage": "/botcontrol"
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
    "dashboardTab": "captcha",
    "purposeBn": "নতুন মেম্বারদের জন্য ইন্টারেক্টিভ ক্যাপচা ভেরিফিকেশন প্যানেল তৈরি করতে।",
    "usage": "/captcha-setup channel:#verification role:@Member"
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
    "dashboardTab": null,
    "purposeBn": "কোনো মেম্বারের অতীত সতর্কতা ও মডারেশন রেকর্ড দেখতে।",
    "usage": "/cases user:@member"
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
    "dashboardTab": null,
    "purposeBn": "সার্ভারে দ্রুত নতুন চ্যানেল ক্যাটাগরি তৈরি বা মুছে ফেলতে।",
    "usage": "/category create name:Scrims Hub"
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
    "dashboardTab": null,
    "purposeBn": "জার্ভিস কয়েন বাজি ধরে হেডস নাকি টেইলস কয়েনফ্লিপ গেম খেলতে।",
    "usage": "/coinflip choice:heads bet:100"
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
    "dashboardTab": null,
    "purposeBn": "বটের ডেভেলপার ও কন্ট্রিবিউটরদের অফিসিয়াল তালিকা দেখতে।",
    "usage": "/contributors"
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
    "dashboardTab": null,
    "purposeBn": "প্রতি ২৪ ঘণ্টায় একবার ফ্রি ডেইলি জার্ভিস কয়েন বোনাস ক্লেইম করতে।",
    "usage": "/daily"
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
    "dashboardTab": null,
    "purposeBn": "টিমমেটদের একসাথে দ্রুত মেনশন ও ট্যাগ করার শর্টকাট টুল।",
    "usage": "/easytag"
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
    "dashboardTab": null,
    "purposeBn": "কালারফুল রিচ এমবেড ঘোষণা ও নোটিশ তৈরি করে পাঠাতে।",
    "usage": "/embed channel:#announcements"
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
    "dashboardTab": null,
    "purposeBn": "সার্ভারে স্বয়ংক্রিয় গিভঅ্যাওয়ে আয়োজন ও উইনার নির্বাচন করতে।",
    "usage": "/giveaway create duration:2h prize:Discord Nitro"
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
    "dashboardTab": null,
    "purposeBn": "নির্দিষ্ট মেম্বারদের গ্রুপ মেসেজ বা স্পেশাল নোটিফিকেশন পাঠাতে।",
    "usage": "/groupm"
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
    "dashboardTab": null,
    "purposeBn": "বটের সম্পূর্ণ হেল্প মেনু ও প্রয়োজনীয় কমান্ড নির্দেশিকা দেখতে।",
    "usage": "/help"
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
    "dashboardTab": null,
    "purposeBn": "স্ক্রিমস বা কাস্টম ম্যাচের রুম আইডি ও পাসওয়ার্ড টিমদের পাঠাতে।",
    "usage": "/idp room_id:123456 pass:7890"
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
    "dashboardTab": "ai",
    "purposeBn": "AI দিয়ে যেকোনো টেক্সট প্রম্পটের ভিত্তিতে বাস্তবসম্মত ছবি তৈরি করতে।",
    "usage": "/imagine prompt:A hyper-detailed cybernetic tiger in neon Tokyo"
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
    "dashboardTab": null,
    "purposeBn": "আপনার নিজের সার্ভারে এই বটটিকে যুক্ত করার অফিসিয়াল ইনভাইট লিংক পেতে।",
    "usage": "/invite"
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
    "dashboardTab": null,
    "purposeBn": "সার্ভার থেকে সাময়িকভাবে কোনো বিশৃঙ্খলাকারী মেম্বারকে বের (Kick) করে দিতে।",
    "usage": "/kick user:@member reason:Spamming repeatedly"
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
    "dashboardTab": "leveling",
    "purposeBn": "সার্ভারের সর্বোচ্চ লেভেল ও XP অর্জনকারী মেম্বারদের লিডারবোর্ড দেখতে।",
    "usage": "/leaderboard"
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
    "dashboardTab": null,
    "purposeBn": "জরুরি প্রয়োজনে যেকোনো টেক্সট চ্যানেলে সাধারণ মেম্বারদের মেসেজ পাঠানো বন্ধ করতে।",
    "usage": "/lock type:Current Channel reason:Raid control"
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
    "dashboardTab": null,
    "purposeBn": "সার্ভারে মেইনটেন্যান্স মোড চালু করে কাজ চলাকালীন মেসেজ দিতে।",
    "usage": "/maintenance toggle:on reason:Bot upgrading"
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
    "dashboardTab": null,
    "purposeBn": "একসাথে স্বয়ংক্রিয়ভাবে একাধিক চ্যানেল বা রোল তৈরি করতে।",
    "usage": "/mass-create type:channels count:5 name:room"
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
    "dashboardTab": null,
    "purposeBn": "একসাথে অপ্রয়োজনীয় একাধিক চ্যানেল বা রোল দ্রুত মুছে ফেলতে।",
    "usage": "/mass-delete"
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
    "dashboardTab": null,
    "purposeBn": "সার্ভারের নির্ধারিত রোলের সকল মেম্বারকে একসাথে ডিরেক্ট মেসেজ পাঠাতে।",
    "usage": "/mass-message role:@Member message:Important announcement"
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
    "dashboardTab": "roles",
    "purposeBn": "সার্ভারের সব মেম্বারকে একসাথে কোনো রোল দিতে বা রিমুভ করতে।",
    "usage": "/mass-role action:add role:@Verified"
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
    "dashboardTab": null,
    "purposeBn": "ইকোনমি সিস্টেমে কয়েন যুক্ত করতে, কাটতে বা ট্র্যাকিং করতে।",
    "usage": "/money add user:@member amount:1000"
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
    "dashboardTab": null,
    "purposeBn": "কোনো মেম্বারকে নির্ধারিত সময়ের জন্য কথা বলা ও চ্যাট থেকে টাইমআউট (মিউট) করতে।",
    "usage": "/mute user:@member duration:15m reason:Disrespectful behaviour"
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
    "dashboardTab": "music",
    "purposeBn": "ভয়েস চ্যানেলে বর্তমানে প্লে হওয়া গানের টাইটেল, সময় ও প্রোগ্রেস দেখতে।",
    "usage": "/nowplaying"
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
    "dashboardTab": "music",
    "purposeBn": "চলমান মিউজিক প্লেব্যাক সাময়িকভাবে থামিয়ে রাখতে (Pause)।",
    "usage": "/pause"
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
    "dashboardTab": null,
    "purposeBn": "বটের রেসপন্স স্পিড ও ডিসকর্ড API লেটেন্সি মিলি-সেকেন্ডে মাপতে।",
    "usage": "/ping"
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
    "dashboardTab": "music",
    "purposeBn": "ভয়েস চ্যানেলে যেকোনো ইউটিউব, স্পটিফাই বা সার্চ কিউ গান বাজাতে।",
    "usage": "/play query:Alan Walker Faded"
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
    "dashboardTab": null,
    "purposeBn": "স্ক্রিমস ও টুর্নামেন্টের কিল ও প্লেসমেন্ট পয়েন্ট টেবিল তৈরি করতে।",
    "usage": "/pointstable"
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
    "dashboardTab": null,
    "purposeBn": "চ্যানেল থেকে নির্ধারিত সংখ্যক পুরনো মেসেজ একসাথে ক্লিয়ার করতে।",
    "usage": "/purge amount:25"
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
    "dashboardTab": "music",
    "purposeBn": "মিউজিক প্লেয়ারে পরবর্তীতে বাজানোর অপেক্ষায় থাকা গানের কিউ দেখতে।",
    "usage": "/queue"
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
    "dashboardTab": "leveling",
    "purposeBn": "নিজের বা অন্য কোনো মেম্বারের বর্তমান লেভেল, XP ও র‍্যাংক কার্ড দেখতে।",
    "usage": "/rank [user:@member]"
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
    "dashboardTab": null,
    "purposeBn": "নির্দিষ্ট সময় পর কোনো কাজের কথা মনে করিয়ে দেওয়ার রিমাইন্ডার সেট করতে।",
    "usage": "/reminder time:30m message:Tournament match starting"
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
    "dashboardTab": "music",
    "purposeBn": "পজ করা গান যেখান থেকে বন্ধ হয়েছিল সেখান থেকে পুনরায় বাজাতে।",
    "usage": "/resume"
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
    "dashboardTab": "roles",
    "purposeBn": "সার্ভারের সব সাধারণ মেম্বার বা সকল বটকে একটি রোল একসাথে দিতে।",
    "usage": "/roleall role:@Member"
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
    "dashboardTab": "roles",
    "purposeBn": "মেম্বারদের নিজে ক্লিক করে রোল নেওয়ার জন্য রিঅ্যাকশন বাটন রোল মেনু সেট করতে।",
    "usage": "/rrole"
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
    "dashboardTab": null,
    "purposeBn": "চলমান গানের নির্দিষ্ট মিনিট বা সেকেন্ডে ফাস্ট-ফরোয়ার্ড করে যেতে।",
    "usage": "/seek timestamp:2:15"
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
    "dashboardTab": null,
    "purposeBn": "বটের মূল কনফিগারেশন উইজার্ড ও ফিচার সেটআপ লঞ্চ করতে।",
    "usage": "/setup"
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
    "dashboardTab": "roles",
    "purposeBn": "সার্ভারের অ্যাডমিন, মডারেটর ও মেম্বার রোলের অটো অ্যাসাইন কনফিগার করতে।",
    "usage": "/setup-roles"
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
    "dashboardTab": "welcome",
    "purposeBn": "মেম্বার সার্ভার ত্যাগ করলে স্বয়ংক্রিয় বিদায় বার্তা ও চ্যানেল সেট করতে।",
    "usage": "/setupgoodbye"
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
    "dashboardTab": "social",
    "purposeBn": "ইউটিউব, ফেসবুক বা টিকটক চ্যানেলের নতুন পোস্টের অটো নোটিফিকেশন সেট করতে।",
    "usage": "/setupsocial"
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
    "dashboardTab": "welcome",
    "purposeBn": "নতুন মেম্বার জয়েন করলে ওয়েলকাম মেসেজ, অ্যানিমেটেড ইমোজি ও চ্যানেল কনফিগার করতে।",
    "usage": "/setupwelcome"
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
    "dashboardTab": null,
    "purposeBn": "ওয়েলকাম বা গুডবাই মেসেজ কীভাবে দেখাবে তা নিজে পরীক্ষা করার জন্য সিমুলেট করতে।",
    "usage": "/simulate event:join"
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
    "dashboardTab": null,
    "purposeBn": "বর্তমান গানটি বাদ দিয়ে কিউতে থাকা পরবর্তী গানে চলে যেতে।",
    "usage": "/skip"
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
    "dashboardTab": null,
    "purposeBn": "স্ক্রিমস রেজিস্ট্রেশন ও টিম স্লট বুকিং সিস্টেমের সম্পূর্ণ কনফিগারেশন।",
    "usage": "/slotmanager"
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
    "dashboardTab": null,
    "purposeBn": "স্ক্রিমস ও টুর্নামেন্ট আয়োজনের অল-ইন-ওয়ান কন্ট্রোল প্যানেল খুলতে।",
    "usage": "/smanager"
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
    "dashboardTab": null,
    "purposeBn": "চ্যানেল থেকে সম্প্রতি মুছে ফেলা সর্বশেষ মেসেজটি দেখতে।",
    "usage": "/snipe"
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
    "dashboardTab": null,
    "purposeBn": "বটের ওপেন সোর্স কোড রিপোজিটরি ও ডেভেলপার তথ্য দেখতে।",
    "usage": "/source"
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
    "dashboardTab": "esports",
    "purposeBn": "স্ক্রিনশট ভেরিফিকেশন সিস্টেম (ইউটিউব সাবস্ক্রাইব প্রুফ ইত্যাদি চেক করতে)।",
    "usage": "/ssverify"
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
    "dashboardTab": "tempvoice",
    "purposeBn": "সার্ভারের মোট মেম্বার ও অ্যাক্টিভ ভয়েস মেম্বার কাউন্ট স্ট্যাটাস চ্যানেল বানাতে।",
    "usage": "/stats-setup"
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
    "dashboardTab": "music",
    "purposeBn": "মিউজিক পুরোপুরি বন্ধ করে ভয়েস চ্যানেল থেকে বটকে ডিসকানেক্ট করতে।",
    "usage": "/stop"
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
    "dashboardTab": "ai",
    "purposeBn": "চ্যানেলে মেম্বারদের বিগত আলোচনা বা কথপোকথন AI দিয়ে সারসংক্ষেপ করতে।",
    "usage": "/summarize count:30"
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
    "dashboardTab": null,
    "purposeBn": "সার্ভারে বারবার ব্যবহৃত প্রয়োজনীয় টেক্সট শর্টকাট ট্যাগ তৈরি বা কল করতে।",
    "usage": "/tag get name:rules"
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
    "dashboardTab": null,
    "purposeBn": "স্ক্রিমস রেজিস্ট্রেশন চ্যানেলে সব টিমমেট ট্যাগ করা হয়েছে কিনা চেক করতে।",
    "usage": "/tagcheck set channel:#registration"
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
    "dashboardTab": "tickets",
    "purposeBn": "মেম্বারদের সহায়তায় প্রাইভেট টিকিট প্যানেল ও সাপোর্ট হেল্প ডেস্ক তৈরি করতে।",
    "usage": "/ticket setup"
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
    "dashboardTab": null,
    "purposeBn": "বড় টুর্নামেন্ট রেজিস্ট্রেশন, ব্র্যাকেট ও টিম ট্র্যাকিং ম্যানেজার চালু করতে।",
    "usage": "/tourney"
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
    "dashboardTab": null,
    "purposeBn": "সাধারণ জ্ঞানের কুইজ খেলে সার্ভারের বন্ধুদের সাথে কয়েন জেতার প্রতিযোগিতা করতে।",
    "usage": "/trivia"
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
    "dashboardTab": null,
    "purposeBn": "সার্ভার মেম্বারদের আড্ডা ও ভয়েস চ্যাটের জন্য ট্রুথ অর ডেয়ার প্রম্পট পেতে।",
    "usage": "/truthordare type:Truth"
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
    "dashboardTab": null,
    "purposeBn": "পূর্বে ব্যান করা কোনো মেম্বারকে পুনরায় সার্ভারে প্রবেশাধিকার দিতে (আনব্যান)।",
    "usage": "/unban user_id:1234567890 reason:Appeal approved"
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
    "dashboardTab": null,
    "purposeBn": "লক করা চ্যানেলে পুনরায় সবার মেসেজ পাঠানোর অনুমতি চালু করতে।",
    "usage": "/unlock type:Current Channel"
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
    "dashboardTab": null,
    "purposeBn": "টাইমআউট দেওয়া মেম্বারকে নির্ধারিত সময়ের আগেই আনমিউট করতে।",
    "usage": "/unmute user:@member reason:Apologized"
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
    "dashboardTab": "music",
    "purposeBn": "মিউজিক প্লেয়ারের ভলিউম (১% থেকে ১০০%) নিয়ন্ত্রণ করতে।",
    "usage": "/volume amount:80"
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
    "dashboardTab": null,
    "purposeBn": "টপ.জিজি বা বটে ভোট দিয়ে বোনাস জার্ভিস কয়েন ও ব্যাজ পেতে।",
    "usage": "/vote"
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
    "dashboardTab": null,
    "purposeBn": "পুনরায় ভোট করার সময় হলে নোটিফিকেশন রিমাইন্ডার পেতে।",
    "usage": "/voteremind"
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
    "dashboardTab": null,
    "purposeBn": "সার্ভারের নিয়ম ভঙ্গকারী কোনো মেম্বারকে আনুষ্ঠানিক ওয়ার্নিং দিতে।",
    "usage": "/warn user:@member reason:Inappropriate message"
  }
];
