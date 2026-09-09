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

    const memberVoice = interaction.member.voice?.channel;
    if (!memberVoice) {
      return interaction.reply({ content: '❌ You must be in a voice channel!', ephemeral: true });
    }

    const botVoice = interaction.guild.members.me?.voice?.channel;
    if (botVoice && botVoice.id !== memberVoice.id) {
      return interaction.reply({ content: `❌ You must be in <#${botVoice.id}> to control the music!`, ephemeral: true });
    }

    const isPaused = typeof queue.isPaused === 'function' ? queue.isPaused() : Boolean(queue.paused);
    if (!isPaused) {
      return interaction.reply({ content: '⚠️ The music is not paused!', ephemeral: true });
    }

    try {
      await queue.resume();
      await interaction.reply({ content: '▶️ Music resumed.' });
    } catch (err) {
      console.error('[Resume command error]', err);
      await interaction.reply({ content: `❌ Failed to resume: ${err.message}`, ephemeral: true });
    }
  },
};
