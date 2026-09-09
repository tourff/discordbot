const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skips the currently playing song.'),

  async execute(interaction) {
    const memberVoice = interaction.member.voice?.channel;
    if (!memberVoice) {
      return interaction.reply({ content: '❌ You must be in a voice channel!', ephemeral: true });
    }

    const botVoice = interaction.guild.members.me?.voice?.channel;
    if (botVoice && botVoice.id !== memberVoice.id) {
      return interaction.reply({ content: `❌ You must be in <#${botVoice.id}> to control the music!`, ephemeral: true });
    }

    const queue = interaction.client.distube.getQueue(interaction);
    if (!queue) {
      return interaction.reply({ content: '❌ There is no music playing right now!', ephemeral: true });
    }

    try {
      if (queue.songs.length <= 1 && !queue.autoplay) {
        await queue.stop();
        return await interaction.reply({ content: '⏭️ Skipped! Queue is now empty.' });
      }

      const nextSong = await queue.skip();
      await interaction.reply({ content: `⏭️ Skipped! Now playing: **${nextSong?.name || 'next song'}**` });
    } catch (e) {
      // If skip threw because there were no more songs, stop cleanly
      try {
        await queue.stop();
        await interaction.reply({ content: '⏭️ Skipped! Queue has ended.' });
      } catch {
        await interaction.reply({ content: '❌ Could not skip to a next song.', ephemeral: true });
      }
    }
  },
};
