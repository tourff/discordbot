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

const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getSetting } = require('./settings');
const { canManageBot } = require('./permissions');
const { executeServerAction } = require('./aiActions');

const ACTION_SYSTEM_INSTRUCTIONS = `
You have advanced Discord server operator capabilities. When a user asks you to perform a server maintenance task (in Bengali, Banglish, or English), you can execute it!

Supported Action Types:
1. create_channel: { "name": string, "type": "text"|"voice"|"category" }
   - Example phrases: "announcements channel create koro", "notun voice channel banao gaming", "create a category Staff"
2. delete_channel: { "name": string }
   - Example phrases: "spam channel ta delete koro", "delete channel general-2"
3. setup_welcome: { "channel"?: string, "message"?: string }
   - Example phrases: "welcome message setup koro: Hey {user} welcome to {server}!", "welcome channel #general e set koro"
4. setup_goodbye: { "channel"?: string, "message"?: string }
   - Example phrases: "goodbye message set koro: {user} left"
5. lock_channel: { "channel"?: string }
   - Example phrases: "channel lock koro", "lock this channel", "general channel ta lock koro"
6. unlock_channel: { "channel"?: string }
   - Example phrases: "channel unlock koro", "unlock this channel"
7. purge_messages: { "amount": number }
   - Example phrases: "20 ta message delete koro", "purge 50 messages"
8. create_role: { "name": string, "color"?: string }
   - Example phrases: "VIP role create koro", "create role Moderator with blue color"
9. create_tournament: { "name": string, "slots"?: number }
   - Example phrases: "tournament create koro PUBG Cup", "create a tournament called Valorant 50 slots"
10. set_bot_mode: { "mode": "public"|"restricted"|"admins_only" }
   - Example phrases: "bot access mode restricted koro", "make bot public"

RULE FOR SERVER ACTIONS:
If the user's message is asking you to perform one of these actions, YOU MUST:
1. Write a short friendly natural reply in the user's language (Bengali or English) confirming you are doing it.
2. AT THE VERY END OF YOUR RESPONSE, output a JSON block with the action:
\`\`\`json
{
  "action": "<action_name>",
  "parameters": { ... }
}
\`\`\`
If the user is NOT asking to perform a server action (they are just chatting, asking questions, or discussing ideas), DO NOT output any JSON block. Just respond naturally.
`;

/**
 * Extracts action payload from AI reply if present.
 * @param {string} text
 * @returns {{ cleanText: string, actionData: object|null }}
 */
function extractActionPayload(text) {
  if (!text) return { cleanText: text, actionData: null };

  const jsonBlockRegex = /```(?:json)?\s*(\{[\s\S]*?"action"\s*:[\s\S]*?\})\s*```/i;
  const match = text.match(jsonBlockRegex);

  if (match) {
    try {
      const actionData = JSON.parse(match[1]);
      const cleanText = text.replace(match[0], '').trim();
      return { cleanText, actionData };
    } catch (e) {
      // JSON parse failed
    }
  }

  const rawJsonMatch = /(\{[\s\n\r]*"action"[\s\S]*?\})$/i;
  const rawMatch = text.match(rawJsonMatch);
  if (rawMatch) {
    try {
      const actionData = JSON.parse(rawMatch[1]);
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
 * Send a prompt to the AI provider (Gemini or OpenAI) with conversation history
 * @param {string} prompt
 * @param {string} [systemPrompt]
 * @param {Array<{role: string, text: string}>} [history]
 * @returns {Promise<string>}
 */
async function generateAIResponse(
  prompt,
  systemPrompt = 'You are Jarvis, a highly intelligent and helpful Discord AI assistant created by trj7. Respond concisely and cleanly in Markdown.',
  history = []
) {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!geminiKey && !openaiKey) {
    return '⚡ **Jarvis AI**: AI features require a `GEMINI_API_KEY` (or `OPENAI_API_KEY`) in the bot environment `.env`. Please add your key to activate AI chat.';
  }

  // ── 1. Try Google Gemini API ────────────────────────────────────────────────
  if (geminiKey) {
    const modelCandidates = [
      process.env.GEMINI_MODEL,
      'gemini-flash-latest',
      'gemini-3.6-flash',
      'gemini-pro-latest',
    ].filter(Boolean);

    // Build multi-turn contents for Gemini
    const contents = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const msg of history) {
        if (msg.text) {
          contents.push({
            role: msg.role === 'model' || msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.text }],
          });
        }
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

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
              parts: [{ text: systemPrompt }],
            },
            contents,
          }),
          signal: AbortSignal.timeout(15000),
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

  // ── 3. Check if message is in dedicated AI channel ─────────────────────────
  const aiChannelId = await getSetting(message.guild.id, 'AI_CHAT_CHANNEL_ID');
  const isAiChannel = Boolean(aiChannelId && message.channel.id === aiChannelId);

  // If NOT mentioned, NOT replying, NOT in AI channel, AND NO active session -> ignore!
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

  // ── 6. Send typing indicator while waiting for AI ───────────────────────────
  await message.channel.sendTyping().catch(() => null);
  const typingTimer = setInterval(() => {
    message.channel.sendTyping().catch(() => null);
  }, 4000);

  try {
    const customSystemPrompt = await getSetting(message.guild.id, 'AI_SYSTEM_PROMPT');
    const systemPrompt =
      (customSystemPrompt ? `${customSystemPrompt}\n\n` : '') +
      `You are Jarvis, a smart, friendly, and helpful Discord AI assistant created by trj7 for the server "${message.guild.name}". ` +
      `The user chatting with you is "${message.member?.displayName || message.author.username}". ` +
      `You are in an active ongoing 15-minute conversation session with this user. ` +
      `If the user speaks to you in Bengali or any other language, always reply naturally in that same language.\n\n` +
      ACTION_SYSTEM_INSTRUCTIONS;

    // Use conversation history for multi-turn context
    const currentHistory = isSessionActive && existingSession?.history ? [...existingSession.history] : [];
    const fullResponse = await generateAIResponse(cleanPrompt, systemPrompt, currentHistory);
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

      // Execute the server action
      const result = await executeServerAction(message, actionData.action, actionData.parameters || {});

      const embed = new EmbedBuilder()
        .setColor(result.success ? 0x57F287 : 0xED4245)
        .setTitle(result.success ? '🛠️ Server Maintenance Action' : '⚠️ Action Notice')
        .setDescription(`${cleanText ? `${cleanText}\n\n` : ''}${result.message}`)
        .setFooter({ text: `Requested by ${message.author.tag} • 15m Session Active` })
        .setTimestamp();

      if (result.details) {
        embed.addFields({ name: '📋 Action Info', value: result.details });
      }

      // Update session timer and history
      currentHistory.push({ role: 'user', text: cleanPrompt });
      currentHistory.push({ role: 'model', text: result.message });
      if (currentHistory.length > 10) currentHistory.splice(0, currentHistory.length - 10);
      activeSessions.set(sessionKey, {
        expiresAt: Date.now() + SESSION_DURATION,
        history: currentHistory,
      });

      await message.reply({ embeds: [embed] }).catch(console.error);
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

module.exports = {
  generateAIResponse,
  handleAIChatChannel,
};



