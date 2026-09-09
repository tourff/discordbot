const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Changes the music playback volume.')
    .addIntegerOption((option) =>
      option
        .setName('amount')
        .setDescription('The volume level (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    ),

  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction);
    if (!queue) {
      return interaction.reply({ content: '❌ There is no music playing right now!', ephemeral: true });
    }

    const memberVoice = interaction.member.voice?.channel;
    if (!memberVoice) {
      return interaction.reply({ content: '❌ You must be in a voice channel to change the volume!', ephemeral: true });
    }

    const botVoice = interaction.guild.members.me?.voice?.channel;
    if (botVoice && botVoice.id !== memberVoice.id) {
      return interaction.reply({ content: `❌ You must be in <#${botVoice.id}> to control the music!`, ephemeral: true });
    }

    const volume = interaction.options.getInteger('amount');
    queue.setVolume(volume);

    await interaction.reply({ content: `🔊 Volume changed to **${volume}%**` });
  },
};
