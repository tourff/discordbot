// src/modules/aiAssistant.js
// ─────────────────────────────────────────────────────────────────────────────
// Jarvis AI Intelligence Suite (Google Gemini / Custom AI)
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { getSetting } = require('./autoMod');

/**
 * Send a prompt to the AI provider
 * @param {string} prompt
 * @param {string} systemPrompt
 * @returns {Promise<string>}
 */
async function generateAIResponse(prompt, systemPrompt = 'You are Jarvis, a highly intelligent and helpful Discord AI assistant created by trj7. Respond concisely and cleanly in Markdown.') {
  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return '⚡ **Jarvis AI**: AI features require a `GEMINI_API_KEY` in the bot environment. Please add your key to `.env` to activate AI chat.';
  }

  const modelCandidates = [
    process.env.GEMINI_MODEL,
    'gemini-flash-lite-latest',
    'gemini-flash-latest',
    'gemini-3.5-flash',
  ].filter(Boolean);

  let lastError = null;

  for (const model of modelCandidates) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        }),
        signal: AbortSignal.timeout(12000)
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`[AI Assistant] Model ${model} returned ${response.status}:`, errText);
        lastError = errText;
        continue;
      }

      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply) return reply;
    } catch (err) {
      console.warn(`[AI Assistant] Model ${model} request error:`, err.message);
      lastError = err.message;
    }
  }

  console.error('[AI Assistant] All candidate models failed. Last error:', lastError);
  return '⚠️ **Jarvis AI**: Sorry, I encountered an issue communicating with the AI service. Please try again in a moment.';
}

/**
 * Auto-reply if message is sent in the designated AI channel
 * @param {import('discord.js').Message} message
 */
async function handleAIChatChannel(message) {
  if (!message.guild || message.author.bot) return false;

  const aiChannelId = await getSetting(message.guild.id, 'AI_CHAT_CHANNEL_ID');
  const aiEnabled = await getSetting(message.guild.id, 'AI_ENABLED');

  if (aiEnabled !== 'true' || !aiChannelId) return false;

  if (message.channel.id === aiChannelId) {
    await message.channel.sendTyping();
    const reply = await generateAIResponse(message.content);
    // Split into 2000 char chunks if long
    if (reply.length > 2000) {
      const chunks = reply.match(/[\s\S]{1,1950}/g) || [reply];
      for (const chunk of chunks) {
        await message.reply(chunk).catch(console.error);
      }
    } else {
      await message.reply(reply).catch(console.error);
    }
    return true;
  }

  return false;
}

module.exports = {
  generateAIResponse,
  handleAIChatChannel
};
