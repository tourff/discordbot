// src/modules/aiAssistant.js
// ─────────────────────────────────────────────────────────────────────────────
// Jarvis AI Intelligence Suite (Google Gemini / OpenAI / Custom AI)
// Supports:
//   • Natural language server maintenance (creating channels, tourneys, welcome setup, etc.)
//   • @Mentioning the bot anywhere in the server
//   • Replying to the bot's messages
//   • Auto-chat in designated AI chat channel
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const {
  EmbedBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ChannelType,
} = require('discord.js');
const { getSetting } = require('./settings');
const { canManageBot } = require('./permissions');
const { executeServerAction, formatActionPreview, findChannel, findCategory, findRole, resolvePermissions } = require('./aiActions');

// Pending AI server action proposals awaiting interactive confirmation button click
const pendingProposals = new Map();

const ACTION_SYSTEM_INSTRUCTIONS = `
You are Jarvis, an expert Discord server architect and assistant with deep knowledge of Discord permissions, roles, channels, and categories.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤝 CONVERSATIONAL PROTOCOL (CRITICAL — READ FIRST)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ALWAYS DISCUSS & PROPOSE FIRST — NEVER IMMEDIATELY EXECUTE:
   - Talk to the user in warm, friendly Bengali. Understand what they want first.
   - When a plan is ready, show a clear, emoji-rich markdown preview of what will happen.
   - Say clearly: "আমি একটি প্ল্যান তৈরি করেছি। নিচে দেখুন। সব ঠিক মনে হলে 'Confirm & Apply' বাটনে ক্লিক করুন, তাহলেই কার্যকর হবে।"
   - NEVER say "আমি এখনই করে দিয়েছি", "তৈরি করে ফেললাম", or "delete করে দিলাম" — everything needs button confirmation.

2. ITERATIVE REFINEMENT:
   - If the user asks to change the draft (e.g., "naam change koro", "oi channel bad dao", "arekta channel add koro"), update and re-show the plan before outputting a new JSON block.

3. SAFETY FOR DESTRUCTIVE ACTIONS:
   - NEVER mass delete without explicit user request.
   - When deleting, list exactly what will be deleted in your message first.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 PERMISSION NAMES — BANGLISH RECOGNITION GUIDE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When the user describes permissions in Banglish or English, map them to these exact permission name strings in the JSON:

• "shob permission" / "sob permission" / "full permission" / "admin" → "administrator"
• "server manage" / "server manage korte parbe" → "manage server"
• "ban korte parbe" / "ban" → "ban members"
• "kick korte parbe" / "kick" → "kick members"
• "channel banate parbe" / "channel manage" → "manage channels"
• "role dite parbe" / "role manage" → "manage roles"
• "message delete korte parbe" / "message manage" → "manage messages"
• "mute korte parbe" / "timeout" → "timeout members"
• "member move" → "move members"
• "voice mute" → "mute members"
• "message pathate parbe" → "send messages"
• "channel dekhte parbe" / "channel access" → "view channels"
• "slash commands use korte parbe" → "use slash commands"
• "embed pathate parbe" → "embed links"
• "file attach korte parbe" → "attach files"
• "reaction dite parbe" → "add reactions"
• "everyone mention korte parbe" → "mention everyone"
• "audit log dekhte parbe" → "view audit log"
• "nickname change korte parbe" → "manage nicknames"
• "invite banate parbe" → "create instant invite"
• "connect korte parbe" (voice) → "connect"
• "bolte parbe" (voice) → "speak"

IMPORTANT: Use these exact string values in the permissions array. The system will resolve them automatically.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 SUPPORTED ACTIONS & JSON SCHEMAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Output the JSON block at the VERY END of your message ONLY when you have a concrete plan ready for confirmation:
\`\`\`json
{
  "action": "<action_name>",
  "parameters": { ... }
}
\`\`\`


────────────────────────────────────────
1. revamp_server — Full server layout with categories and channels:
{
  "action": "revamp_server",
  "parameters": {
    "categories": [
      {
        "name": "📜 ┊ INFORMATION",
        "channels": [
          { "name": "📌・rules", "type": "text" },
          { "name": "📢・announcements", "type": "text" }
        ]
      },
      {
        "name": "🔊 ┊ VOICE LOUNGES",
        "channels": [
          { "name": "🔊・General Voice", "type": "voice" },
          { "name": "🎮・Gaming Lounge", "type": "voice" }
        ]
      }
    ]
  }
}

────────────────────────────────────────
2. create_category_with_channels — Create one category with channels inside:
{
  "action": "create_category_with_channels",
  "parameters": {
    "name": "🎮 ┊ GAMING ZONE",
    "private": false,
    "channels": [
      { "name": "💬・game-chat", "type": "text" },
      { "name": "🔊・Gaming Voice", "type": "voice" }
    ]
  }
}
// Set "private": true to hide category from @everyone (admin-only visibility).

────────────────────────────────────────
3. create_channel — Create a single channel (optionally inside a category):
{
  "action": "create_channel",
  "parameters": {
    "name": "general-chat",
    "type": "text",
    "category": "Community Hub"
  }
}
// type: "text" | "voice" | "announcement" | "category"
// category: name of an existing category (optional — leave out if no category needed)

────────────────────────────────────────
4. move_channel_to_category — Move an existing channel into a category:
{
  "action": "move_channel_to_category",
  "parameters": {
    "channel": "general-chat",
    "category": "Community Hub"
  }
}
// Use exact channel name or #channel-name. Use exact category name.

────────────────────────────────────────
5. rename_channel — Rename an existing channel:
{
  "action": "rename_channel",
  "parameters": {
    "channel": "old-channel-name",
    "new_name": "new-channel-name"
  }
}

────────────────────────────────────────
6. rename_role — Rename an existing role:
{
  "action": "rename_role",
  "parameters": {
    "role": "Old Role Name",
    "new_name": "New Role Name"
  }
}

────────────────────────────────────────
7. create_role — Create a new role with full permission control:
{
  "action": "create_role",
  "parameters": {
    "name": "Moderator",
    "color": "#3498DB",
    "hoist": true,
    "mentionable": true,
    "permissions": ["kick members", "ban members", "manage messages", "timeout members"]
  }
}
// permissions: array of permission name strings (see permission guide above)
// hoist: true = role shown separately in members list
// mentionable: true = anyone can @mention this role
// For full admin: permissions: ["administrator"]

────────────────────────────────────────
8. set_role_permissions — Update an existing role's permissions/settings:
{
  "action": "set_role_permissions",
  "parameters": {
    "role": "Moderator",
    "permissions": ["kick members", "ban members", "manage messages"],
    "hoist": true,
    "mentionable": false,
    "color": "#E74C3C"
  }
}
// Works on existing roles. Use role's current name in the "role" field.

────────────────────────────────────────
9. delete_channel — Delete a single channel (ONLY on explicit user request):
{ "action": "delete_channel", "parameters": { "name": "channel-name" } }

10. delete_multiple_channels — Delete multiple channels at once:
{ "action": "delete_multiple_channels", "parameters": { "channels": ["ch1", "ch2"] } }

11. batch — Multiple actions in one go:
{
  "action": "batch",
  "parameters": {
    "actions": [
      { "action": "create_channel", "parameters": { "name": "rules", "type": "text", "category": "Information" } },
      { "action": "create_role", "parameters": { "name": "Member", "color": "#2ECC71" } }
    ]
  }
}

12. setup_welcome: { "channel": string, "message": string }
13. setup_goodbye: { "channel": string, "message": string }
14. lock_channel: { "channel"?: string }   // omit channel for current channel
15. unlock_channel: { "channel"?: string }
16. purge_messages: { "amount": number, "channel"?: string }
17. create_tournament: { "name": string, "slots"?: number }
18. set_bot_mode: { "mode": "public"|"restricted"|"admins_only" }

────────────────────────────────────────
19. move_channel_position — Move a channel or category up/down in the list:
{
  "action": "move_channel_position",
  "parameters": {
    "channel": "general-chat",
    "direction": "up",
    "amount": 1
  }
}
// direction: "up" (উপরে) | "down" (নিচে) | "top" (সবার উপরে) | "bottom" (সবার নিচে)
// amount: কত ধাপ উপরে/নিচে (default: 1)
// Works for both regular channels AND categories.

────────────────────────────────────────
20. set_channel_permissions — Add a role to a channel / set permissions for a role or user in a channel:
{
  "action": "set_channel_permissions",
  "parameters": {
    "channel": "general-chat",
    "role": "Member",
    "allow": ["send messages", "view channels"],
    "deny": ["manage messages"],
    "neutral": []
  }
}
// channel: channel name or #channel-name
// role: exact role name, @everyone, or user ID mention
// allow: permissions to ALLOW (green checkmark ✅)
// deny: permissions to DENY (red X ❌)
// neutral: permissions to RESET/inherit from category (empty ⬜)
// Use permission name strings from the PERMISSION NAMES guide.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 EXAMPLES OF BANGLISH → ACTION MAPPING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• "Admin role banao shob permission diye" → create_role with permissions: ["administrator"]
• "Mod role banao, ban ar kick korte parbe" → create_role with permissions: ["ban members", "kick members"]
• "Mod role er permission change koro" → set_role_permissions
• "general channel ta Community category te nao" → move_channel_to_category
• "voice channel banao Gaming category te" → create_channel with category: "Gaming"
• "Private category banao shudhu admin ra dekhte parbe" → create_category_with_channels with private: true
• "Channel er naam change koro" → rename_channel
• "Role er naam bodlao" → rename_role
• "general channel upore nao" / "channel ta aro upore dao" / "upore tolo" → move_channel_position direction: "up"
• "category ta niche nao" / "ektu niche soro" → move_channel_position direction: "down"
• "channel ta ekdom upore niye jao" / "first e rakho" / "shobar upore" → move_channel_position direction: "top"
• "channel ta ekdom niche dao" / "last e nao" / "shobar niche" → move_channel_position direction: "bottom"
• "Member role ke general channel e message pathate dao" → set_channel_permissions allow: ["send messages"]
• "@everyone er channel dekhte para bondho koro" → set_channel_permissions deny: ["view channels"] role: "@everyone"
• "Member role add koro general channel e" → set_channel_permissions allow: ["view channels", "send messages"]
• "channel er permission thik kore dao" / "role ke channel e access dao" → set_channel_permissions
• "general channel e Mod role ke message delete korte dao" → set_channel_permissions allow: ["manage messages"] role: "Mod"
• "channel e @everyone er message pathano bondho koro" → set_channel_permissions deny: ["send messages"] role: "@everyone"
• "general channel ke ai channel e add koro" / "bot shudhu general e respond korbe" → manage_ai_channels mode: "add"
• "bot-commands channel remove koro ai theke" → manage_ai_channels mode: "remove"
• "shudhu general ar bot-commands e respond korbe" → manage_ai_channels mode: "set" with both channels
• "ai channel whitelist clear koro" / "sob channel e respond korbe" → manage_ai_channels mode: "clear"
• "ai channel list dekhao" / "kono kono channel e respond kore" → (list current setting, no action needed)

────────────────────────────────────────
21. manage_ai_channels — Configure which channels Jarvis responds in (whitelist):
{
  "action": "manage_ai_channels",
  "parameters": {
    "mode": "add",
    "channels": ["general-chat", "bot-commands"]
  }
}
// mode: "add" (যোগ) | "remove" (সরানো) | "set" (পুরো list replace) | "clear" (whitelist বন্ধ)
// channels: channel name(s) or #channel-mention(s) — not needed for "clear" mode
// When whitelist is active: bot ONLY responds in those channels (no @mention needed there)
// @mention still works everywhere for admins

If the user is chatting, asking questions, or not ready for a concrete plan, DO NOT output any JSON. Just respond naturally in Bengali.
`;


/**
 * Extracts action payload from AI reply if present.
 * Supports both single action and batch actions.
 * @param {string} text
 * @returns {{ cleanText: string, actionData: object|null }}
 */
function extractActionPayload(text) {
  if (!text) return { cleanText: text, actionData: null };

  const jsonBlockRegex = /```(?:json)?\s*(\{[\s\S]*?(?:"action"|"actions")[\s\S]*?\})\s*```/i;
  const match = text.match(jsonBlockRegex);

  if (match) {
    try {
      let actionData = JSON.parse(match[1]);
      if (Array.isArray(actionData.actions) && !actionData.action) {
        actionData = { action: 'batch', parameters: { actions: actionData.actions } };
      }
      const cleanText = text.replace(match[0], '').trim();
      return { cleanText, actionData };
    } catch (e) {
      // JSON parse failed
    }
  }

  const rawJsonMatch = /(\{[\s\n\r]*"(?:action|actions)"[\s\S]*?\})$/i;
  const rawMatch = text.match(rawJsonMatch);
  if (rawMatch) {
    try {
      let actionData = JSON.parse(rawMatch[1]);
      if (Array.isArray(actionData.actions) && !actionData.action) {
        actionData = { action: 'batch', parameters: { actions: actionData.actions } };
      }
      const cleanText = text.replace(rawMatch[0], '').trim();
      return { cleanText, actionData };
    } catch (e) {
      // JSON parse failed
    }
  }

  return { cleanText: text, actionData: null };
}

// Active AI conversation sessions: Map<channelId:userId, { expiresAt: number, history: Array<{role: string, text: string}> }>
const activeSessions = new Map();
const SESSION_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Formats a clean, structured real-time overview of the Discord server layout
 * (categories, channels, types, positions, and roles) to inject directly into the AI system prompt.
 * @param {import('discord.js').Guild} [guild]
 * @returns {string}
 */
function formatGuildLayout(guild) {
  if (!guild || !guild.channels?.cache) return '';

  const channels = Array.from(guild.channels.cache.values());
  const categories = channels
    .filter(c => c.type === 4 || c.type === ChannelType.GuildCategory)
    .sort((a, b) => a.position - b.position);

  const textChannels = channels.filter(c => c.type === 0 || c.type === ChannelType.GuildText);
  const voiceChannels = channels.filter(c => c.type === 2 || c.type === ChannelType.GuildVoice);
  const announcementChannels = channels.filter(c => c.type === 5 || c.type === ChannelType.GuildAnnouncement);
  const forumChannels = channels.filter(c => c.type === 15 || c.type === ChannelType.GuildForum);

  const lines = [];
  lines.push(`Server Name: "${guild.name}" (ID: ${guild.id})`);
  lines.push(`Total Members: ${guild.memberCount || 'Unknown'}`);
  lines.push(`Summary: ${categories.length} Categories, ${channels.filter(c => c.type !== 4 && c.type !== ChannelType.GuildCategory).length} Channels (${textChannels.length} text, ${voiceChannels.length} voice, ${announcementChannels.length} announcement, ${forumChannels.length} forum), ${guild.roles?.cache?.size || 0} Roles`);
  lines.push('');
  lines.push('📁 ALL SERVER CHANNELS & CATEGORIES (100% COMPLETE LIST):');

  // Categories and their children
  for (const cat of categories) {
    const isCatPrivate = cat.permissionsFor && guild.roles?.everyone && !cat.permissionsFor(guild.roles.everyone).has(PermissionFlagsBits.ViewChannel);
    const catPrivTag = isCatPrivate ? ' [🔒 Private Category]' : '';
    const children = channels
      .filter(c => c.parentId === cat.id)
      .sort((a, b) => a.position - b.position);

    lines.push(`\n📂 [Category] "${cat.name}" (position: ${cat.position}, ID: ${cat.id})${catPrivTag}:`);
    if (children.length === 0) {
      lines.push('   *(empty category)*');
    } else {
      for (const ch of children) {
        let typeStr = 'text';
        if (ch.type === 2 || ch.type === ChannelType.GuildVoice) typeStr = 'voice';
        else if (ch.type === 5 || ch.type === ChannelType.GuildAnnouncement) typeStr = 'announcement';
        else if (ch.type === 15 || ch.type === ChannelType.GuildForum) typeStr = 'forum';
        else if (ch.type === 13 || ch.type === ChannelType.GuildStageVoice) typeStr = 'stage';

        const isChPrivate = ch.permissionsFor && guild.roles?.everyone && !ch.permissionsFor(guild.roles.everyone).has(PermissionFlagsBits.ViewChannel);
        const privTag = isChPrivate ? ' [🔒 Private]' : '';
        const prefix = typeStr === 'voice' ? '🔊' : typeStr === 'announcement' ? '📢' : typeStr === 'forum' ? '💬' : '#';
        lines.push(`   • ${prefix} ${ch.name} (type: ${typeStr}, position: ${ch.position}, ID: ${ch.id})${privTag}`);
      }
    }
  }

  // Uncategorized channels
  const uncategorized = channels
    .filter(c => c.type !== 4 && c.type !== ChannelType.GuildCategory && !c.parentId)
    .sort((a, b) => a.position - b.position);

  if (uncategorized.length > 0) {
    lines.push('\n📁 [No Category / Root Channels]:');
    for (const ch of uncategorized) {
      let typeStr = 'text';
      if (ch.type === 2 || ch.type === ChannelType.GuildVoice) typeStr = 'voice';
      else if (ch.type === 5 || ch.type === ChannelType.GuildAnnouncement) typeStr = 'announcement';
      else if (ch.type === 15 || ch.type === ChannelType.GuildForum) typeStr = 'forum';

      const isChPrivate = ch.permissionsFor && guild.roles?.everyone && !ch.permissionsFor(guild.roles.everyone).has(PermissionFlagsBits.ViewChannel);
      const privTag = isChPrivate ? ' [🔒 Private]' : '';
      const prefix = typeStr === 'voice' ? '🔊' : typeStr === 'announcement' ? '📢' : '#';
      lines.push(`   • ${prefix} ${ch.name} (type: ${typeStr}, position: ${ch.position}, ID: ${ch.id})${privTag}`);
    }
  }

  // ALL Roles (100% hierarchy, no limit)
  if (guild.roles?.cache && guild.roles.cache.size > 0) {
    const roles = Array.from(guild.roles.cache.values())
      .filter(r => r.name !== '@everyone')
      .sort((a, b) => b.position - a.position);

    lines.push(`\n👑 ALL SERVER ROLES (100% Complete Hierarchy, total ${guild.roles.cache.size}):`);
    for (const r of roles) {
      const perms = [];
      if (r.permissions?.has) {
        if (r.permissions.has(PermissionFlagsBits.Administrator) || r.permissions.has(8n)) perms.push('Admin');
        if (r.permissions.has(PermissionFlagsBits.ManageGuild)) perms.push('ManageServer');
        if (r.permissions.has(PermissionFlagsBits.ManageChannels)) perms.push('ManageChannels');
        if (r.permissions.has(PermissionFlagsBits.ManageRoles)) perms.push('ManageRoles');
        if (r.permissions.has(PermissionFlagsBits.BanMembers)) perms.push('Ban');
        if (r.permissions.has(PermissionFlagsBits.KickMembers)) perms.push('Kick');
        if (r.permissions.has(PermissionFlagsBits.ManageMessages)) perms.push('ManageMessages');
      }
      const permStr = perms.length > 0 ? ` [Perms: ${perms.join(', ')}]` : '';
      const memberCountStr = r.members ? ` (${r.members.size} members)` : '';
      lines.push(`   • @${r.name} (position: ${r.position}, ID: ${r.id}${memberCountStr}${permStr})`);
    }
    lines.push(`   • @everyone (ID: ${guild.id}, default server role)`);
  }

  return lines.join('\n');
}

/**
 * Constructs the master system prompt for Jarvis AI, incorporating bilingual & Banglish mastery,
 * server context, conversational memory, and architectural proposal guidelines.
 * @param {object} options
 * @param {import('discord.js').Guild} [options.guild]
 * @param {import('discord.js').GuildMember} [options.member]
 * @param {string} [options.customPrompt]
 * @param {boolean} [options.includeActions]
 * @returns {string}
 */
function buildAssistantSystemPrompt({ guild = null, member = null, customPrompt = null, includeActions = true } = {}) {
  const guildName = guild?.name || 'Discord Server';
  const userName = member?.displayName || member?.user?.username || 'User';
  const serverLayout = formatGuildLayout(guild);

  return `
You are Jarvis, a highly intelligent, proactive, and friendly Discord AI assistant and server architect created by trj7 (falcon_trj7).
Server: "${guildName}"
Current User: "${userName}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏰 LIVE SERVER REAL-TIME LAYOUT (READ-ONLY DIRECT DISCORD ACCESS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${serverLayout || 'No active guild layout data available.'}

🚨 CRITICAL SERVER AWARENESS & CAPABILITY DIRECTIVE (NEVER VIOLATE):
1. You ARE Jarvis, connected LIVE to this Discord server via Discord.js with full administrator/management privileges.
2. YOU HAVE 100% COMPLETE VISIBILITY into ALL channels, ALL categories, and ALL roles shown in the layout above!
3. STRICT PROHIBITIONS — NEVER SAY:
   ❌ "আমার কাছে সরাসরি সার্ভার রিড করার পারমিশন বা API টুল নেই"
   ❌ "আমার পক্ষে ডেটা ফেচ করা সম্ভব নয়"
   ❌ "চ্যানেল বা ক্যাটাগরিগুলো আমাকে চ্যাটে লিখে দিন"
   These statements are completely FALSE. You already have the live real-time server layout right above.
4. When the user asks anything like:
   - "Full server ta dekho to" / "server ta dekho"
   - "ki ki channel and category ache" / "ki ki channel ache"
   - "all channel dekhao" / "shob channel dekhao" / "channel list"
   - "all category dekhao" / "shob category dekhao" / "category list"
   - "all roles dekhao" / "all role dekhao" / "shob role dekhao" / "ki ki role ache"
   - "server layout kemon" / "server e ki ki ache"
   IMMEDIATELY review the "LIVE SERVER REAL-TIME LAYOUT" provided above and respond warmly and proudly in Bengali!
   • Greet the user respectfully (e.g. "আরে বস ${userName}! আমি আপনার পুরো সার্ভার স্ক্যান করেছি।")
   • If asking for CHANNELS/CATEGORIES: List EVERY category along with its text channels (#) and voice channels (🔊), noting if private (🔒). Show uncategorized channels if any.
   • If asking for ROLES: List ALL roles from highest to lowest hierarchy, showing their member counts and key permissions (Admin, Mod, etc.).
   • If asking for FULL SERVER: Give the complete overview of all categories, channels, and roles with exact total counts!
   • Proactively ask: "আপনি কি কোনো চ্যানেল/ক্যাটাগরি উপরে-নিচে সাজাতে চান, কোনো নতুন ক্যাটাগরি যোগ করতে চান, নাকি কোনো চ্যানেলের পারমিশন সেট করতে চান? আমাকে বলুন, আমি এক্ষুনি সাজিয়ে দিচ্ছি! 🚀"
   • DO NOT output any JSON action for simple view/list queries. Just reply naturally in Bengali.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 BANGLISH & BILINGUAL MASTERY — CRITICAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Users communicate in Banglish (Bengali written phonetically in English letters). You MUST understand ALL of it instantly — NEVER ask what it means.

📌 GENERAL BANGLISH VOCAB:
  • "korte hobe" / "kora lagbe" / "korte chai" / "dorkar" → Need to do / want to do
  • "banaw" / "banaye dao" / "khule dao" / "create koro" / "koro" / "bana" → Create / build / open
  • "koekta" / "koyekta" / "kichu" → A few / some / several
  • "chanel" / "chenel" / "channel" → Discord channel
  • "category" / "categori" / "folder" → Discord category
  • "role" / "rol" → Discord role
  • "permission" / "parmission" / "access" / "odhikar" → Permission / access rights
  • "shajaw" / "sundor koro" / "organize koro" / "revamp koro" → Beautify / organize / restructure
  • "muche dao" / "delete koro" / "bad dao" / "remove koro" → Delete / remove
  • "bujhe na" / "bujhteso na" / "amar kotha thik moto bujho na" → You aren't understanding me
  • "thik koro" / "thik kore dao" / "fix koro" / "improve koro" → Fix / correct / enhance
  • "ki kora jay" / "ki korbo" / "amake bolo" → What should be done / give advice
  • "amake help koro" / "sahajjo koro" → Help me
  • "arektu" / "aaro" → A bit more / additionally
  • "shob" / "shobgula" / "sob" → All of them
  • "nao" / "niye jao" / "transfer koro" / "move koro" → Move / transfer
  • "naam change" / "rename koro" / "naam bodlao" → Rename
  • "valo" / "bhalo" / "sera" / "onek valo" → Good / awesome / great
  • "kemon acho" / "ki obostha" → How are you / what's up

📌 ROLE & PERMISSION BANGLISH:
  • "role banao" / "role khulte chai" → Create a role
  • "shob permission" / "sob permission" / "full permission" → Administrator permission
  • "admin banai" / "admin role" → Role with Administrator permission
  • "moderator" / "mod role" → Moderation role
  • "ban korte parbe" / "ban dite parbe" → Can ban members
  • "kick korte parbe" / "kick dite parbe" → Can kick members
  • "channel manage korte parbe" / "channel manage" → Manage channels permission
  • "role dite parbe" / "role manage" → Manage roles permission
  • "message delete korte parbe" → Manage messages permission
  • "mute korte parbe" / "timeout dite parbe" → Timeout members permission
  • "hoist" / "alag dekhabe" / "member list e alag thakbe" → Hoist = show role separately in member list
  • "mention korte parbe" / "mentionable" → Role can be @mentioned
  • "role er permission change koro" / "permission update koro" → set_role_permissions action
  • "role er naam bodlao" → rename_role action

📌 CHANNEL & CATEGORY BANGLISH:
  • "channel ta oi category te nao" / "category change koro" / "move koro" → move_channel_to_category action
  • "channel er category bodlao" → move_channel_to_category action
  • "private category" / "secret category" / "shudhu admin ra dekhbe" → create_category_with_channels with private: true
  • "category te channel banao" / "oi category r modhye channel" → create_channel with category parameter
  • "voice channel banao" / "voice room" → channel type: voice
  • "announcement channel" / "news channel" → channel type: announcement

📌 RESPONSE TONE:
  - Always reply in warm, friendly Bengali (বাংলা লিপি) when the user speaks Banglish.
  - Address users politely: "আরে বস!", "অবশ্যই!", "চিন্তা করবেন না!", "আমি এক্ষুনি দেখছি!"
  - Keep Discord terms, channel/role names, and commands in English with emojis (\`#general-chat\`, \`📌・rules\`, \`/play\`).
  - If the user says you didn't understand them, apologize warmly and ask specifically what they want.
  - NEVER give robotic or generic Discord UI instructions like "right-click and create channel".

🚀 PROACTIVE INTENT HANDLING:
  - "koekta channel create korte hobe" → Instantly propose a beautiful full channel layout.
  - "role set koro" → Ask what permissions the role needs, then create it.
  - "category te channel nao" → Identify which channel and which category, then propose move_channel_to_category.
  - "role er permission thik kore dao" → Ask current role name and desired permissions, then propose set_role_permissions.
  - Always offer to do the task — NEVER instruct the user to do it manually.

${includeActions ? ACTION_SYSTEM_INSTRUCTIONS : ''}
${customPrompt ? `\nServer Custom Prompt:\n${customPrompt}` : ''}
`.trim();
}

/**
 * Send a prompt to the AI provider (Gemini or OpenAI) with conversation history.
 * Supports optional image parts for vision/multimodal requests.
 * @param {string} prompt
 * @param {string} [systemPrompt]
 * @param {Array<{role: string, text: string}>} [history]
 * @param {Array<{inlineData: {mimeType: string, data: string}}>} [imageParts]
 * @returns {Promise<string>}
 */
async function generateAIResponse(
  prompt,
  systemPrompt = null,
  history = [],
  imageParts = []
) {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!geminiKey && !openaiKey) {
    return '⚡ **Jarvis AI**: AI features require a `GEMINI_API_KEY` (or `OPENAI_API_KEY`) in the bot environment `.env`. Please add your key to activate AI chat.';
  }

  const activeSystemPrompt = systemPrompt || buildAssistantSystemPrompt({ includeActions: false });

  // ── 1. Try Google Gemini API ────────────────────────────────────────────────
  if (geminiKey) {
    const modelCandidates = [
      process.env.GEMINI_MODEL,
      'gemini-3.5-flash',
      'gemini-flash-lite-latest',
      'gemini-flash-latest',
    ].filter(Boolean);

    // Build multi-turn contents for Gemini ensuring valid alternations
    const contents = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const msg of history) {
        if (msg.text && typeof msg.text === 'string') {
          const role = msg.role === 'model' || msg.role === 'assistant' ? 'model' : 'user';
          // Prevent consecutive duplicate roles
          if (contents.length > 0 && contents[contents.length - 1].role === role) {
            contents[contents.length - 1].parts[0].text += `\n${msg.text}`;
          } else {
            contents.push({
              role,
              parts: [{ text: msg.text }],
            });
          }
        }
      }
    }
    // Final user prompt — include image parts if present
    const userMsgParts = [...imageParts, { text: prompt }];
    if (contents.length > 0 && contents[contents.length - 1].role === 'user' && imageParts.length === 0) {
      // No images: safe to append to the last user message
      contents[contents.length - 1].parts[0].text += `\n${prompt}`;
    } else {
      // Has images OR last message is from model: push a new user turn
      contents.push({
        role: 'user',
        parts: userMsgParts,
      });
    }

    for (const model of modelCandidates) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: activeSystemPrompt }],
            },
            contents,
          }),
          signal: AbortSignal.timeout(18000),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.warn(`[AI Assistant] Model ${model} returned ${response.status}:`, errText);
          continue;
        }

        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) return reply.trim();
      } catch (err) {
        console.warn(`[AI Assistant] Model ${model} request error:`, err.message);
      }
    }

    // Fallback: If multi-turn history caused API rejection, retry with standalone prompt
    if (contents.length > 1) {
      try {
        const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiKey}`;
        const fbRes = await fetch(fallbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: activeSystemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
          }),
          signal: AbortSignal.timeout(15000),
        });
        if (fbRes.ok) {
          const fbData = await fbRes.json();
          const reply = fbData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) return reply.trim();
        }
      } catch (fbErr) {
        console.warn('[AI Assistant] Standalone fallback error:', fbErr.message);
      }
    }
  }

  // ── 2. Fallback to OpenAI API if available ──────────────────────────────────
  if (openaiKey) {
    try {
      const messages = [{ role: 'system', content: systemPrompt }];
      if (Array.isArray(history) && history.length > 0) {
        for (const msg of history) {
          if (msg.text) {
            messages.push({
              role: msg.role === 'model' || msg.role === 'assistant' ? 'assistant' : 'user',
              content: msg.text,
            });
          }
        }
      }
      messages.push({ role: 'user', content: prompt });

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages,
          max_tokens: 1500,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return text.trim();
      }
    } catch (err) {
      console.warn('[AI Assistant] OpenAI API error:', err.message);
    }
  }

  return '⚠️ **Jarvis AI**: Sorry, I encountered an issue communicating with the AI service. Please verify your `GEMINI_API_KEY` or try again shortly.';
}

/**
 * Handles AI chat when the bot is @mentioned, replied to, in active 15-minute session, or in the AI channel.
 * @param {import('discord.js').Message} message
 * @returns {Promise<boolean>} true if message was handled by AI
 */
async function handleAIChatChannel(message) {
  if (!message.guild || message.author.bot) return false;

  // Ignore command messages starting with standard prefixes
  const firstChar = message.content.trim()[0];
  if (firstChar === '/' || firstChar === '!' || firstChar === '?' || firstChar === '.') {
    return false;
  }

  const client = message.client;
  const botId = client.user.id;

  // ── 1. Check Active 15-Minute Conversation Session ─────────────────────────
  const sessionKey = `${message.channel.id}:${message.author.id}`;
  const existingSession = activeSessions.get(sessionKey);
  const isSessionActive = Boolean(existingSession && Date.now() < existingSession.expiresAt);

  // ── 2. Check if bot was @mentioned or replied to ───────────────────────────
  const isMentioned = message.mentions.has(botId, {
    ignoreEveryone: true,
    ignoreRoles: true,
  });

  let isReplyToBot = false;
  if (message.reference?.messageId) {
    try {
      const referencedMsg = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
      if (referencedMsg && referencedMsg.author?.id === botId) {
        isReplyToBot = true;
      }
    } catch (e) {
      // Non-fatal
    }
  }

  // ── 3. Check if message is in an AI-allowed channel ────────────────────────
  // Supports multi-channel whitelist (AI_ALLOWED_CHANNEL_IDS, comma-separated)
  // Falls back to legacy AI_CHAT_CHANNEL_ID if whitelist is not configured.
  const allowedChannelsSetting = await getSetting(message.guild.id, 'AI_ALLOWED_CHANNEL_IDS');
  let isAiChannel = false;

  if (allowedChannelsSetting && allowedChannelsSetting.trim()) {
    // New multi-channel whitelist mode
    const allowedIds = allowedChannelsSetting.split(',').map(id => id.trim()).filter(Boolean);
    isAiChannel = allowedIds.includes(message.channel.id);
  } else {
    // Legacy single-channel fallback
    const legacyChannelId = await getSetting(message.guild.id, 'AI_CHAT_CHANNEL_ID');
    isAiChannel = Boolean(legacyChannelId && message.channel.id === legacyChannelId);
  }

  // ── Whitelist gate ──────────────────────────────────────────────────────────
  // If whitelist IS configured:
  // - In whitelisted channels: Jarvis responds to all messages (no @mention needed!)
  // - In non-whitelisted channels: Silently ignore all chatter; only admins can reach bot with explicit @mention/reply
  const whitelistActive = Boolean(allowedChannelsSetting && allowedChannelsSetting.trim());
  if (whitelistActive && !isAiChannel) {
    const hasAdmin = await canManageBot(message.member).catch(() => false);
    if (!hasAdmin || (!isMentioned && !isReplyToBot)) {
      return false; // Silently ignore non-whitelisted channels
    }
  }

  // If NOT mentioned, NOT replying, NOT in AI channel, AND NO active session → ignore
  if (!isMentioned && !isReplyToBot && !isAiChannel && !isSessionActive) {
    return false;
  }

  // ── 4. Check if AI feature is enabled for this server ──────────────────────
  const aiEnabled = await getSetting(message.guild.id, 'AI_ENABLED');
  if (aiEnabled === 'false') {
    if (isMentioned || isReplyToBot || isSessionActive) {
      await message
        .reply({
          content: '⚠️ AI chat is currently disabled in this server by administrators.',
          allowedMentions: { repliedUser: false },
        })
        .catch(() => null);
      return true;
    }
    return false;
  }

  // ── 5. Clean prompt by stripping the @mention ───────────────────────────────
  const mentionRegex = new RegExp(`<@!?${botId}>`, 'g');
  const cleanPrompt = message.content.replace(mentionRegex, '').trim();

  // Allow user to gracefully end the session early
  const exitKeywords = ['stop', 'bye', 'goodbye', 'exit', 'quit', 'বাই', 'বিদায়', 'পরে কথা হবে', 'end chat'];
  if (isSessionActive && exitKeywords.includes(cleanPrompt.toLowerCase())) {
    activeSessions.delete(sessionKey);
    await message
      .reply({
        content: '👋 ঠিক আছে! আমাদের ১৫ মিনিটের চ্যাট সেশন সমাপ্ত করা হলো। আবার কথা বলতে চাইলে আমাকে শুধু একবার `@mention` করবেন!',
        allowedMentions: { repliedUser: true },
      })
      .catch(() => null);
    return true;
  }

  // If user just @mentioned the bot with no question or prompt
  if (!cleanPrompt) {
    // Start session even on empty mention
    activeSessions.set(sessionKey, {
      expiresAt: Date.now() + SESSION_DURATION,
      history: [],
    });

    await message
      .reply({
        content: `👋 Hello ${message.author}! How can I help you today? পরবর্তী ১৫ মিনিট আপনি আমাকে **@mention না করেই** যেকোনো প্রশ্ন করতে পারেন!`,
        allowedMentions: { repliedUser: true },
      })
      .catch(() => null);
    return true;
  }

  // ── 6. Extract image attachments for vision support ─────────────────────────
  const imageParts = [];
  if (message.attachments?.size > 0) {
    for (const attachment of message.attachments.values()) {
      const mime = attachment.contentType?.split(';')[0] || '';
      if (mime.startsWith('image/') && attachment.size < 10 * 1024 * 1024) {
        try {
          const imgRes = await fetch(attachment.url, { signal: AbortSignal.timeout(8000) });
          if (imgRes.ok) {
            const buffer = await imgRes.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');
            imageParts.push({ inlineData: { mimeType: mime, data: base64 } });
          }
        } catch (imgErr) {
          console.warn('[AI Assistant] Failed to fetch image attachment:', imgErr.message);
        }
      }
    }
  }

  // ── 7. Send typing indicator while waiting for AI ───────────────────────────
  await message.channel.sendTyping().catch(() => null);
  const typingTimer = setInterval(() => {
    message.channel.sendTyping().catch(() => null);
  }, 4000);

  try {
    if (message.guild) {
      await Promise.all([
        message.guild.channels.fetch().catch(() => null),
        message.guild.roles.fetch().catch(() => null),
      ]);
    }

    const customSystemPrompt = await getSetting(message.guild.id, 'AI_SYSTEM_PROMPT');
    const systemPrompt = buildAssistantSystemPrompt({
      guild: message.guild,
      member: message.member,
      customPrompt: customSystemPrompt,
      includeActions: true,
    });

    // Use conversation history for multi-turn context
    const currentHistory = isSessionActive && existingSession?.history ? [...existingSession.history] : [];
    const fullResponse = await generateAIResponse(cleanPrompt, systemPrompt, currentHistory, imageParts);
    clearInterval(typingTimer);

    // ── 7. Check if a server action was requested ─────────────────────────────
    const { cleanText, actionData } = extractActionPayload(fullResponse);

    if (actionData && actionData.action) {
      // Security Gate: verify member has administrative rights
      const isManager = await canManageBot(message.member);
      const hasManageGuild = message.member.permissions?.has(PermissionFlagsBits.ManageGuild);
      const hasAdmin = message.member.permissions?.has(PermissionFlagsBits.Administrator);
      const isOwner = message.author.id === message.guild.ownerId;

      if (!isManager && !hasManageGuild && !hasAdmin && !isOwner) {
        await message.reply({
          content: "You don't have admin or manage guild permission for this guild.",
          allowedMentions: { repliedUser: false },
        });
        return true;
      }

      // ── 7.1 Format Proposal Preview & Require User Confirmation ───────────
      const proposalId = `prop_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      const preview = formatActionPreview(message.guild, actionData.action, actionData.parameters || {});

      // Save proposal in memory map
      pendingProposals.set(proposalId, {
        id: proposalId,
        guildId: message.guild.id,
        channelId: message.channel.id,
        authorId: message.author.id,
        authorTag: message.author.tag,
        action: actionData.action,
        parameters: actionData.parameters || {},
        cleanText,
        preview,
        messageRef: message,
        createdAt: Date.now(),
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      });

      // Construct Proposal Embed
      const proposalDesc = [
        cleanText ? `${cleanText}\n` : '',
        preview.description,
        '\n────────────────────────────────',
        '**📌 আপনার করণীয়:**',
        '• ড্রাফট পরিবর্তন করতে চাইলে চ্যাটে মেসেজ লিখে জানান।',
        `• সার্ভারে কার্যকর করতে নিচের **${preview.isDestructive ? 'Confirm & Delete' : 'Confirm & Apply'}** বাটনে ক্লিক করুন।`,
      ].filter(Boolean).join('\n');

      const safeDesc = proposalDesc.length > 4000 ? proposalDesc.slice(0, 3950) + '\n\n*(...truncated)*' : proposalDesc;

      const embed = new EmbedBuilder()
        .setColor(preview.isDestructive ? 0xED4245 : 0x5865F2)
        .setTitle(preview.title)
        .setDescription(safeDesc)
        .setFooter({ text: `Proposal ID: ${proposalId} • 10m to confirm • Requested by ${message.author.tag}` })
        .setTimestamp();

      if (preview.summary) {
        embed.addFields({ name: '📊 Plan Summary', value: `\`${preview.summary}\`` });
      }

      // Buttons
      const confirmButton = new ButtonBuilder()
        .setCustomId(`ai_prop_confirm_${proposalId}`)
        .setLabel(preview.isDestructive ? 'Confirm & Delete' : 'Confirm & Apply')
        .setStyle(preview.isDestructive ? ButtonStyle.Danger : ButtonStyle.Success)
        .setEmoji(preview.isDestructive ? '🗑️' : '✅');

      const cancelButton = new ButtonBuilder()
        .setCustomId(`ai_prop_cancel_${proposalId}`)
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('❌');

      const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

      let replyMsg;
      try {
        replyMsg = await message.reply({
          embeds: [embed],
          components: [row],
          allowedMentions: { repliedUser: true },
        });
      } catch (sendErr) {
        replyMsg = await message.reply({
          content: safeDesc.slice(0, 1950),
          components: [row],
          allowedMentions: { repliedUser: true },
        }).catch(console.error);
      }

      // Update session timer and history
      currentHistory.push({ role: 'user', text: cleanPrompt });
      currentHistory.push({ role: 'model', text: cleanText || preview.title });
      if (currentHistory.length > 10) currentHistory.splice(0, currentHistory.length - 10);
      activeSessions.set(sessionKey, {
        expiresAt: Date.now() + SESSION_DURATION,
        history: currentHistory,
      });

      if (!replyMsg) return true;

      // ── 7.2 Attach Interactive Component Collector ─────────────────────────
      const collector = replyMsg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 10 * 60 * 1000,
      });

      collector.on('collect', async (btnInteraction) => {
        // Gated to the requesting admin or guild owner
        const canClick = btnInteraction.user.id === message.author.id || btnInteraction.user.id === message.guild.ownerId;
        if (!canClick) {
          return btnInteraction.reply({
            content: '❌ Only the administrator who initiated this proposal can confirm or cancel it.',
            ephemeral: true,
          });
        }

        const prop = pendingProposals.get(proposalId);
        if (!prop) {
          collector.stop('already_handled');
          return btnInteraction.reply({
            content: '⚠️ This proposal has already been handled or has expired.',
            ephemeral: true,
          });
        }

        if (btnInteraction.customId === `ai_prop_cancel_${proposalId}`) {
          pendingProposals.delete(proposalId);
          collector.stop('cancelled');

          const cancelEmbed = EmbedBuilder.from(embed)
            .setColor(0x747F8D)
            .setTitle('🚫 Action Cancelled')
            .setDescription(`${cleanText ? `${cleanText}\n\n` : ''}❌ **Proposal was cancelled by ${btnInteraction.user}.** No changes were made to the server.`)
            .setFields([]);

          return btnInteraction.update({
            embeds: [cancelEmbed],
            components: [],
          }).catch(console.error);
        }

        if (btnInteraction.customId === `ai_prop_confirm_${proposalId}`) {
          pendingProposals.delete(proposalId);
          collector.stop('confirmed');

          // Notify user execution is in progress
          await btnInteraction.update({
            embeds: [
              EmbedBuilder.from(embed)
                .setColor(0xFEE75C)
                .setTitle('⏳ Executing Server Actions...')
                .setDescription('Applying the requested modifications to the server. Please wait a moment...')
                .setFields([]),
            ],
            components: [],
          }).catch(console.error);

          // Execute verified server action
          const result = await executeServerAction(message, prop.action, prop.parameters);

          const resultEmbed = new EmbedBuilder()
            .setColor(result.success ? 0x57F287 : 0xED4245)
            .setTitle(result.success ? '✅ Server Action Complete' : '⚠️ Action Notice')
            .setDescription(result.message)
            .setFooter({ text: `Confirmed & applied by ${btnInteraction.user.tag}` })
            .setTimestamp();

          if (result.details) {
            resultEmbed.addFields({ name: '📋 Action Info', value: String(result.details).slice(0, 1000) });
          }

          return replyMsg.edit({
            embeds: [resultEmbed],
            components: [],
          }).catch(console.error);
        }
      });

      collector.on('end', (collected, reason) => {
        if (reason === 'time' && pendingProposals.has(proposalId)) {
          pendingProposals.delete(proposalId);
          const disabledRow = new ActionRowBuilder().addComponents(
            ButtonBuilder.from(confirmButton).setDisabled(true).setLabel('Expired'),
            ButtonBuilder.from(cancelButton).setDisabled(true)
          );
          replyMsg.edit({ components: [disabledRow] }).catch(() => null);
        }
      });

      return true;
    }

    // ── 8. Update Session Memory & Extend 15-Minute Window ─────────────────────
    currentHistory.push({ role: 'user', text: cleanPrompt });
    currentHistory.push({ role: 'model', text: cleanText || fullResponse });
    if (currentHistory.length > 10) currentHistory.splice(0, currentHistory.length - 10);

    const wasSessionJustStarted = !isSessionActive && (isMentioned || isReplyToBot);
    activeSessions.set(sessionKey, {
      expiresAt: Date.now() + SESSION_DURATION,
      history: currentHistory,
    });

    // Helpful note on the very first mention starting the session
    const sessionNotice = wasSessionJustStarted
      ? '\n\n*(💬 ১৫ মিনিটের চ্যাট সেশন শুরু হয়েছে — এখন @mention ছাড়াই কথা বলতে পারবেন)*'
      : '';
    const finalReply = `${cleanText}${sessionNotice}`;

    // ── 9. Send reply (handling Discord 2000 character limit) ─────────────────
    if (finalReply.length > 2000) {
      const chunks = finalReply.match(/[\s\S]{1,1950}/g) || [finalReply];
      for (let i = 0; i < chunks.length; i++) {
        if (i === 0) {
          await message.reply({ content: chunks[i], allowedMentions: { repliedUser: true } }).catch(console.error);
        } else {
          await message.channel.send({ content: chunks[i] }).catch(console.error);
        }
      }
    } else {
      await message.reply({ content: finalReply, allowedMentions: { repliedUser: true } }).catch(console.error);
    }

    return true;
  } catch (err) {
    clearInterval(typingTimer);
    console.error('[AI Assistant] Error handling chat:', err);
    await message
      .reply({
        content: '❌ Sorry, an error occurred while processing your request.',
        allowedMentions: { repliedUser: false },
      })
      .catch(() => null);
    return true;
  }
}

/**
 * Fallback handler for proposal buttons if interaction arrives via interactionCreate event.
 * @param {import('discord.js').ButtonInteraction} interaction
 * @returns {Promise<boolean>}
 */
async function handleProposalButton(interaction) {
  const customId = interaction.customId;
  const isConfirm = customId.startsWith('ai_prop_confirm_');
  const isCancel = customId.startsWith('ai_prop_cancel_');
  if (!isConfirm && !isCancel) return false;

  const proposalId = customId.replace(/^ai_prop_(?:confirm|cancel)_/, '');
  const prop = pendingProposals.get(proposalId);

  if (!prop) {
    await interaction.reply({
      content: '⚠️ This proposal has already been handled, cancelled, or expired.',
      ephemeral: true,
    }).catch(() => null);
    return true;
  }

  // Check authorization (author or server owner or admin)
  const isAuthor = interaction.user.id === prop.authorId;
  const isOwner = interaction.user.id === interaction.guild?.ownerId;
  const isAdmin = interaction.member?.permissions?.has(PermissionFlagsBits.Administrator);

  if (!isAuthor && !isOwner && !isAdmin) {
    await interaction.reply({
      content: '❌ Only the administrator who initiated this proposal can confirm or cancel it.',
      ephemeral: true,
    }).catch(() => null);
    return true;
  }

  pendingProposals.delete(proposalId);

  if (isCancel) {
    const cancelEmbed = new EmbedBuilder()
      .setColor(0x747F8D)
      .setTitle('🚫 Action Cancelled')
      .setDescription(`❌ **Proposal was cancelled by ${interaction.user}.** No changes were made to the server.`);

    await interaction.update({ embeds: [cancelEmbed], components: [] }).catch(console.error);
    return true;
  }

  if (isConfirm) {
    await interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(0xFEE75C)
          .setTitle('⏳ Executing Server Actions...')
          .setDescription('Applying the requested modifications to the server. Please wait a moment...'),
      ],
      components: [],
    }).catch(console.error);

    const result = await executeServerAction(prop.messageRef, prop.action, prop.parameters);

    const resultEmbed = new EmbedBuilder()
      .setColor(result.success ? 0x57F287 : 0xED4245)
      .setTitle(result.success ? '✅ Server Action Complete' : '⚠️ Action Notice')
      .setDescription(result.message)
      .setFooter({ text: `Confirmed & applied by ${interaction.user.tag}` })
      .setTimestamp();

    if (result.details) {
      resultEmbed.addFields({ name: '📋 Action Info', value: String(result.details).slice(0, 1000) });
    }

    await interaction.editReply({ embeds: [resultEmbed], components: [] }).catch(console.error);
    return true;
  }

  return true;
}

module.exports = {
  generateAIResponse,
  buildAssistantSystemPrompt,
  extractActionPayload,
  handleAIChatChannel,
  handleProposalButton,
  pendingProposals,
};



