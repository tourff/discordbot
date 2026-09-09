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

    const memberVoice = interaction.member.voice?.channel;
    if (!memberVoice) {
      return interaction.reply({ content: '❌ You must be in a voice channel!', ephemeral: true });
    }

    const botVoice = interaction.guild.members.me?.voice?.channel;
    if (botVoice && botVoice.id !== memberVoice.id) {
      return interaction.reply({ content: `❌ You must be in <#${botVoice.id}> to control the music!`, ephemeral: true });
    }

    try {
      await queue.stop();
      await interaction.reply({ content: '⏹️ Music stopped and queue cleared!' });
    } catch (err) {
      console.error('[Stop command error]', err);
      await interaction.reply({ content: `❌ Failed to stop music: ${err.message}`, ephemeral: true });
    }
  },
};
