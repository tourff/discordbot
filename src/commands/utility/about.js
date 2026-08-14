// src/commands/utility/about.js
'use strict';

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const os = require('os');

module.exports = {
  category: 'utility',
  data: new SlashCommandBuilder()
    .setName('about')
    .setDescription('Display information and statistics about the bot.'),

  async execute(interaction) {
    const client = interaction.client;
    
    // Uptime calculation
    const totalSecs = process.uptime();
    const days = Math.floor(totalSecs / 86400);
    const hours = Math.floor((totalSecs % 86400) / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = Math.floor(totalSecs % 60);
    const uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    // Resource usage
    const totalMemory = (os.totalmem() / 1024 / 1024).toFixed(0);
    const freeMemory = (os.freemem() / 1024 / 1024).toFixed(0);
    const usedMemory = (totalMemory - freeMemory);
    const cpuLoad = os.loadavg()[0].toFixed(2);

    // Bot stats
    const totalGuilds = client.guilds.cache.size;
    const totalMembers = client.guilds.cache.reduce((acc, guild) => acc + (guild.memberCount || 0), 0);
    const totalChannels = client.channels.cache.size;

    const embed = new EmbedBuilder()
      .setColor(0x00FFB3)
      .setTitle('🏆 Quotient - The Legacy Continues')
      .setDescription(
        `Originally created by **Rohit**, whose vision built the foundation of Quotient.\n` +
        `This legacy is preserved and maintained to honor his memory.`
      )
      .addFields(
        { name: '🌐 Servers', value: `\`${totalGuilds.toLocaleString()}\``, inline: true },
        { name: '👥 Members', value: `\`${totalMembers.toLocaleString()}\``, inline: true },
        { name: '💬 Channels', value: `\`${totalChannels.toLocaleString()}\``, inline: true },
        { name: '⏱️ Uptime', value: `\`${uptimeStr}\``, inline: true },
        { name: '💾 Memory', value: `\`${usedMemory}/${totalMemory} MB\``, inline: true },
        { name: '⚙️ CPU Load', value: `\`${cpuLoad}%\``, inline: true }
      )
      .setFooter({ text: `Made with discord.js v14` })
      .setTimestamp();

    const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`;
    const supportUrl = 'https://discord.gg/quotient';

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Invite Bot')
        .setURL(inviteUrl)
        .setStyle(ButtonStyle.Link),
      new ButtonBuilder()
        .setLabel('Support Server')
        .setURL(supportUrl)
        .setStyle(ButtonStyle.Link)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
