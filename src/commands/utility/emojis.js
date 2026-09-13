// src/commands/utility/emojis.js
// ─────────────────────────────────────────────────────────────────────────────
// Shows all available animated & custom emojis usable with Jarvis Bot
// and provides instant copy syntax for welcome, goodbye, embeds, and notifications.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getAllAvailableEmojis } = require('../../modules/emojiResolver');

module.exports = {
  category: 'utility',
  data: new SlashCommandBuilder()
    .setName('emojis')
    .setDescription('Display all available animated & custom emojis you can use in messages and embeds.'),

  async execute(interaction, client) {
    const emojis = getAllAvailableEmojis(client, interaction.guild);

    const animated = emojis.filter(e => e.animated);
    const staticEm = emojis.filter(e => !e.animated);

    const embed = new EmbedBuilder()
      .setColor(0x8b5cf6)
      .setTitle('✨ Jarvis Bot — Animated & Custom Emoji Directory')
      .setDescription(
        'You can use any of these animated emojis in **Welcome Messages**, **Goodbye Messages**, **Social Notifications**, and **Custom Embeds**!\n\n' +
        '💡 **How to use:** Simply type `:emoji_name:` or copy the exact `<a:name:id>` tag below. Jarvis will automatically render it animated for everyone.'
      )
      .addFields(
        {
          name: `🎬 Animated Emojis (${animated.length})`,
          value: animated.length > 0
            ? animated.map(e => `${e.tag} \`:${e.name}:\` (${e.tag})`).slice(0, 15).join('\n')
            : 'None currently cached',
          inline: false
        },
        {
          name: `🎨 Popular Static Emojis (${Math.min(staticEm.length, 10)})`,
          value: staticEm.length > 0
            ? staticEm.slice(0, 10).map(e => `${e.tag} \`:${e.name}:\``).join('  ')
            : 'None',
          inline: false
        },
        {
          name: '🚀 Quick Tips for Server Admins',
          value:
            '• **In /setupwelcome & /setupgoodbye:** Type `:carydance:` or `:Arrowrcolor:` or `:diamond:` anywhere in the message.\n' +
            '• **In /embed:** Animated emojis work smoothly inside **Description** and **Fields**.\n' +
            '• **In /setupsocial:** Add `:bell:` or `:youtube:` or `<a:diamond:...>` in your custom announcement template.',
          inline: false
        }
      )
      .setFooter({ text: 'Jarvis Core Emoji Engine • Universal Animated Support', iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
