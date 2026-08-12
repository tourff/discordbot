// src/modules/esportsHandlers.js
'use strict';

const supabase = require('../config/supabase');
const { PermissionFlagsBits } = require('discord.js');

async function handleEasytag(message) {
  // If the message contains an 18-20 digit ID, check if this is an easytag channel
  const idRegex = /\b\d{17,20}\b/g;
  if (!idRegex.test(message.content)) return false;

  const { data: easytagConfig } = await supabase
    .from('easytag_config')
    .select('channel_id')
    .eq('channel_id', message.channel.id)
    .single();

  if (!easytagConfig) return false;

  // It is an easytag channel, convert IDs
  let newContent = message.content.replace(idRegex, match => `<@${match}>`);
  
  if (newContent !== message.content) {
    try {
      // Send a webhook impersonating the user, or just reply
      // For simplicity, we just send a new message with the converted tags, deleting original
      const webhooks = await message.channel.fetchWebhooks();
      let webhook = webhooks.find(wh => wh.token);
      if (!webhook) {
        webhook = await message.channel.createWebhook({
          name: 'Jarvis EasyTag',
          avatar: message.client.user.displayAvatarURL()
        });
      }

      await webhook.send({
        content: newContent,
        username: message.member.displayName,
        avatarURL: message.author.displayAvatarURL(),
      });

      await message.delete().catch(() => null);
      return true;
    } catch (err) {
      console.error('[easytag] error:', err);
    }
  }
  return false;
}

async function handleTagcheck(message) {
  const { data: tagcheckConfig } = await supabase
    .from('tagcheck_config')
    .select('*')
    .eq('channel_id', message.channel.id)
    .single();

  if (!tagcheckConfig) return false;

  const requiredMentions = tagcheckConfig.required_mentions || 4;
  const userMentions = message.mentions.users.filter(u => !u.bot).size;

  if (userMentions < requiredMentions) {
    if (tagcheckConfig.delete_after) {
      await message.delete().catch(() => null);
    }
    
    // Check if we already warned recently to avoid spam (optional, but good)
    const warning = await message.channel.send({
      content: `⚠️ ${message.author}, you need to mention at least **${requiredMentions}** teammates.`
    }).catch(() => null);

    if (warning) {
      setTimeout(() => warning.delete().catch(() => null), 5000);
    }
    return true;
  }
  
  // They met the requirement
  return false;
}

module.exports = {
  handleEasytag,
  handleTagcheck
};
