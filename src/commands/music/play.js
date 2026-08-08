const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Plays a song from YouTube, Spotify, or SoundCloud.')
    .addStringOption(option => 
      option.setName('query')
        .setDescription('The name or URL of the song/playlist.')
        .setRequired(true)
    ),
  
  async execute(interaction) {
    const query = interaction.options.getString('query');
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({ content: '❌ You must be in a voice channel to play music!', ephemeral: true });
    }

    const botVoiceChannel = interaction.guild.members.me.voice.channel;
    if (botVoiceChannel && botVoiceChannel.id !== voiceChannel.id) {
      return interaction.reply({ content: `❌ I am already playing music in <#${botVoiceChannel.id}>!`, ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      await interaction.client.distube.play(voiceChannel, query, {
        member: interaction.member,
        textChannel: interaction.channel,
      });
      await interaction.editReply({ content: '✅ Request received! Check the channel for updates.' });
    } catch (e) {
      console.error(e);
      await interaction.editReply({ content: `❌ An error occurred: ${e.message.slice(0, 100)}` });
    }
  },
};
