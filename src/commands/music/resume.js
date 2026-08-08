const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resumes the paused music.'),
  
  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction);
    if (!queue) {
      return interaction.reply({ content: '❌ There is no music playing right now!', ephemeral: true });
    }
    
    if (!queue.paused) {
      return interaction.reply({ content: '⚠️ The music is not paused!', ephemeral: true });
    }

    queue.resume();
    await interaction.reply({ content: '▶️ Music resumed.' });
  },
};
