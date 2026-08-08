const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pauses the currently playing music.'),
  
  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction);
    if (!queue) {
      return interaction.reply({ content: '❌ There is no music playing right now!', ephemeral: true });
    }
    
    if (queue.paused) {
      return interaction.reply({ content: '⚠️ The music is already paused!', ephemeral: true });
    }

    queue.pause();
    await interaction.reply({ content: '⏸️ Music paused.' });
  },
};
