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

  try {
    // Call Google Gemini API (Free Tier endpoint)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
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
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[AI Assistant] API Error:', errText);
      return '⚠️ **Jarvis AI**: Sorry, I encountered an issue communicating with the AI service. Please verify your API key.';
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return reply || '⚡ **Jarvis AI**: I processed your request but received an empty response.';
  } catch (err) {
    console.error('[AI Assistant] Error:', err);
    return '⚠️ **Jarvis AI**: An error occurred while generating a response.';
  }
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
