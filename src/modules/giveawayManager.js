// src/modules/giveawayManager.js
// ─────────────────────────────────────────────────────────────────────────────
// Giveaway Engine & Entry Handler
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { supabase } = require('../config/supabase');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * Handle user clicking "🎉 Enter Giveaway"
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function handleGiveawayJoin(interaction) {
  const messageId = interaction.message.id;
  const userId = interaction.user.id;

  const { data: giveaway, error } = await supabase
    .from('giveaways')
    .select('*')
    .eq('message_id', messageId)
    .eq('is_ended', false)
    .single();

  if (error || !giveaway) {
    return interaction.reply({ content: '⚠️ This giveaway has already ended.', ephemeral: true });
  }

  let entries = giveaway.entries || [];
  if (entries.includes(userId)) {
    // Leave giveaway
    entries = entries.filter(id => id !== userId);
    await supabase.from('giveaways').update({ entries }).eq('id', giveaway.id);
    return interaction.reply({ content: '❌ You left the giveaway.', ephemeral: true });
  } else {
    // Join giveaway
    entries.push(userId);
    await supabase.from('giveaways').update({ entries }).eq('id', giveaway.id);
    return interaction.reply({ content: `🎉 You entered the giveaway for **${giveaway.prize}**! Entries: **${entries.length}**`, ephemeral: true });
  }
}

/**
 * Conclude a giveaway and pick random winners
 * @param {import('discord.js').Client} client
 * @param {any} giveaway
 */
async function endGiveaway(client, giveaway) {
  try {
    const channel = client.channels.cache.get(giveaway.channel_id);
    if (!channel) return;

    const message = await channel.messages.fetch(giveaway.message_id).catch(() => null);
    const entries = giveaway.entries || [];
    const winnerCount = Math.min(giveaway.winner_count || 1, entries.length);

    let winners = [];
    if (entries.length > 0) {
      // Pick unique random winners
      const shuffled = [...entries].sort(() => 0.5 - Math.random());
      winners = shuffled.slice(0, winnerCount);
    }

    await supabase
      .from('giveaways')
      .update({ is_ended: true, winners })
      .eq('id', giveaway.id);

    const winnerText = winners.length > 0
      ? winners.map(w => `<@${w}>`).join(', ')
      : 'No valid entries.';

    if (message) {
      const endedEmbed = new EmbedBuilder()
        .setColor(winners.length > 0 ? 0x10b981 : 0xf43f5e)
        .setTitle(`🎉 GIVEAWAY ENDED: ${giveaway.prize}`)
        .setDescription(`**Winner(s):** ${winnerText}\n**Total Entries:** ${entries.length}`)
        .setFooter({ text: 'Jarvis Giveaway Engine • Made by trj7' })
        .setTimestamp();

      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('giveaway_enter')
          .setLabel(`Ended (${entries.length} entries)`)
          .setEmoji('🎉')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      );

      await message.edit({ embeds: [endedEmbed], components: [disabledRow] }).catch(console.error);
    }

    if (winners.length > 0) {
      await channel.send({ content: `🎉 Congratulations ${winnerText}! You won **${giveaway.prize}**!` }).catch(console.error);
    }
  } catch (err) {
    console.error('[End Giveaway] Error:', err);
  }
}

module.exports = {
  handleGiveawayJoin,
  endGiveaway
};
