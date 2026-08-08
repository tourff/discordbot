const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stops the music and clears the queue.'),
  
  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction);
    if (!queue) {
      return interaction.reply({ content: '❌ There is no music playing right now!', ephemeral: true });
    }
    
    queue.stop();
    await interaction.reply({ content: '⏹️ Music stopped and queue cleared!' });
  },
};
