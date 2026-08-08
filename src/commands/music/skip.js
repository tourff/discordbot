const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skips the currently playing song.'),
  
  async execute(interaction) {
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({ content: '❌ You must be in a voice channel!', ephemeral: true });
    }

    const queue = interaction.client.distube.getQueue(interaction);
    if (!queue) {
      return interaction.reply({ content: '❌ There is no music playing right now!', ephemeral: true });
    }

    try {
      if (queue.songs.length === 1 && queue.autoplay === false) {
        queue.stop();
        await interaction.reply({ content: '⏭️ Skipped! Queue is now empty.' });
      } else {
        await queue.skip();
        await interaction.reply({ content: '⏭️ Skipped to the next song!' });
      }
    } catch (e) {
      console.error(e);
      await interaction.reply({ content: '❌ An error occurred while skipping.', ephemeral: true });
    }
  },
};
