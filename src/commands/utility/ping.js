// src/commands/utility/ping.js
'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const supabase = require('../../config/supabase');

module.exports = {
  category: 'utility',
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription("Check the bot's and database's response latency."),

  async execute(interaction) {
    const wsPing = interaction.client.ws.ping;
    
    await interaction.deferReply();

    const dbStart = Date.now();
    const { error } = await supabase.from('bot_settings').select('count').limit(1);
    const dbPing = Date.now() - dbStart;

    const embed = new EmbedBuilder()
      .setColor(0x00FFB3)
      .setTitle('🏓 Pong!')
      .addFields(
        { name: '🤖 Bot Latency', value: `\`${wsPing} ms\``, inline: true },
        { name: '🗄️ Database Latency', value: `\`${dbPing} ms\``, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
