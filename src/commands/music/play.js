const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Plays a song from YouTube, Spotify, or SoundCloud.')
    .addStringOption((option) =>
      option
        .setName('query')
        .setDescription('The name or URL of the song/playlist.')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    // Need at least 2 chars to search meaningfully
    if (!focusedValue || focusedValue.trim().length < 2) {
      return await interaction.respond([]);
    }

    try {
      if (typeof interaction.client.distube.search === 'function') {
        // Discord autocomplete has a hard 3-second deadline.
        // Race the search against a 2.5s timeout so we always respond in time.
        const searchPromise = interaction.client.distube.search(focusedValue.trim(), { limit: 6 });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('autocomplete_timeout')), 2500)
        );

        const results = await Promise.race([searchPromise, timeoutPromise]);
        const choices = (results || []).slice(0, 10).map((song) => ({
          name: `${song.name} (${song.formattedDuration || '??:??'})`.slice(0, 100),
          value: song.url || song.name,
        }));
        return await interaction.respond(choices);
      }
      return await interaction.respond([]);
    } catch (err) {
      if (err?.message === 'autocomplete_timeout') {
        console.warn('[Autocomplete] Search timed out for query:', focusedValue);
      }
      // Always respond to avoid Discord showing an error
      return await interaction.respond([]).catch(() => null);
    }
  },

  async execute(interaction) {
    const query = interaction.options.getString('query');
    const voiceChannel = interaction.member.voice?.channel;

    if (!voiceChannel) {
      return interaction.reply({ content: '❌ You must be in a voice channel to play music!', ephemeral: true });
    }

    // Permission checks
    const botMember = interaction.guild.members.me;
    if (botMember) {
      const permissions = voiceChannel.permissionsFor(botMember);
      if (!permissions.has(PermissionFlagsBits.Connect)) {
        return interaction.reply({ content: '❌ I do not have permission to join your voice channel!', ephemeral: true });
      }
      if (!permissions.has(PermissionFlagsBits.Speak)) {
        return interaction.reply({ content: '❌ I do not have permission to speak in your voice channel!', ephemeral: true });
      }
    }

    const botVoiceChannel = botMember?.voice?.channel;
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
      console.error('[Play command error]', e);
      await interaction.editReply({ content: `❌ An error occurred: ${e.message ? e.message.slice(0, 150) : 'Failed to play song'}` });
    }
  },
};
