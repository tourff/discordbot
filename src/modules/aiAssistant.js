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
} = require('discord.js');
const { getSetting } = require('./settings');
const { canManageBot } = require('./permissions');
const { executeServerAction, formatActionPreview, findChannel } = require('./aiActions');

// Pending AI server action proposals awaiting interactive confirmation button click
const pendingProposals = new Map();

const ACTION_SYSTEM_INSTRUCTIONS = `
You are Jarvis, an expert Discord server architect and assistant.
When a user asks you to revamp, beautify, redesign, organize, create, or delete channels or categories:

🤝 CONVERSATIONAL DESIGN & PLANNING PROTOCOL:
1. DISCUSS & PROPOSE FIRST:
   - Talk to the user in Bengali (or their language). Discuss ideas, layout recommendations, and theme suggestions.
   - Present a well-structured, beautiful markdown list of proposed categories and channels with attractive emojis (e.g., 📁, 💬, 🔊, 📌, 📢).
   - Inform the user clearly: "আমি আপনার সার্ভারের জন্য একটি খসড়া লেআউট তৈরি করেছি। নিচে খসড়াটি দেখে নিন। আপনি চাইলে যেকোনো নাম পরিবর্তন, নতুন চ্যানেল যোগ বা বাদ দিতে পারেন। সব পছন্দ হলে নিচের 'Confirm & Apply' বাটনে ক্লিক করলে তা সার্ভারে তৈরি হবে।"
2. NEVER CLAIM IMMEDIATE EXECUTION:
   - Since every action requires the user to click a confirmation button, NEVER say "আমি এখনই তৈরি করে দিয়েছি" or "ডিলিট করে দিলাম". Always say "আমি খসড়া তৈরি করেছি, বাটনে ক্লিক করলেই কার্যকর হবে।"
3. ITERATIVE REFINEMENTS:
   - When the user asks to modify the draft (e.g., "rules er naam change koro", "voice lounge e arekta channel add koro", "tournament zone ta bad dao"), update the layout and present the updated list!
4. DESTRUCTIVE DELETION SAFETY:
   - NEVER mass delete channels automatically!
   - If the user asks to delete channels or categories, clearly list the specific channels targeted for deletion in your message, and output the deletion action JSON so an interactive confirmation button is provided.

FORMAT FOR PROPOSAL PAYLOAD:
When you have formulated a concrete channel layout, creation, or deletion plan, output the JSON block at the VERY END of your message:
\`\`\`json
{
  "action": "<action_name>",
  "parameters": { ... }
}
\`\`\`

Supported Action Types:
1. revamp_server: Propose a complete layout with multiple categories and nested channels in batch. (Existing channels are preserved; nothing is deleted).
   Parameters:
   {
     "categories": [
       {
         "name": "📜 ┊ INFORMATION",
         "channels": [
           { "name": "📌・rules", "type": "text" },
           { "name": "📢・announcements", "type": "text" },
           { "name": "🎉・giveaways", "type": "text" }
         ]
       },
       {
         "name": "💬 ┊ COMMUNITY HUB",
         "channels": [
           { "name": "💬・general-chat", "type": "text" },
           { "name": "🤖・bot-commands", "type": "text" },
           { "name": "📸・media-share", "type": "text" }
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

2. batch: Execute multiple actions in one go:
   {
     "actions": [
       { "action": "create_channel", "parameters": { "name": "rules", "type": "text" } },
       { "action": "create_channel", "parameters": { "name": "announcements", "type": "text" } }
     ]
   }

3. create_category_with_channels:
   {
     "name": string,
     "channels": Array<string | { name: string, type: "text"|"voice" }>
   }

4. create_channel: { "name": string, "type": "text"|"voice"|"category" }
5. delete_channel: { "name": string } // ONLY when user explicitly asks to delete a specific channel
6. delete_multiple_channels: { "channels": string[] } // ONLY when user explicitly asks to delete specific channels
7. setup_welcome: { "channel"?: string, "message"?: string }
8. setup_goodbye: { "channel"?: string, "message"?: string }
9. lock_channel: { "channel"?: string }
10. unlock_channel: { "channel"?: string }
11. purge_messages: { "amount": number }
12. create_role: { "name": string, "color"?: string }
13. create_tournament: { "name": string, "slots"?: number }
14. set_bot_mode: { "mode": "public"|"restricted"|"admins_only" }

If the user is only chatting, asking general questions, discussing server concepts, or not ready for a proposal payload, DO NOT output any JSON block. Just respond naturally.
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
      'gemini-flash-lite-latest',
      'gemini-2.5-flash',
      'gemini-1.5-flash',
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
    // Final user prompt
    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
      contents[contents.length - 1].parts[0].text += `\n${prompt}`;
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: prompt }],
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
              parts: [{ text: systemPrompt }],
            },
            contents,
          }),
          signal: AbortSignal.timeout(20000),
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
        const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`;
        const fbRes = await fetch(fallbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
          }),
          signal: AbortSignal.timeout(20000),
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
  handleAIChatChannel,
  handleProposalButton,
  pendingProposals,
};



