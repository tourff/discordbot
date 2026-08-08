const { EmbedBuilder } = require('discord.js');

module.exports = (client) => {
  const distube = client.distube;

  // ── 1. Play Song ────────────────────────────────────────────────────────────
  distube.on('playSong', (queue, song) => {
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🎶 Now Playing')
      .setDescription(`[${song.name}](${song.url})`)
      .setThumbnail(song.thumbnail)
      .addFields(
        { name: 'Duration', value: song.formattedDuration, inline: true },
        { name: 'Requested by', value: `${song.user}`, inline: true }
      )
      .setFooter({ text: `Volume: ${queue.volume}% | Loop: ${queue.repeatMode ? (queue.repeatMode === 2 ? 'Queue' : 'Song') : 'Off'}` });

    queue.textChannel.send({ embeds: [embed] }).catch(console.error);
  });

  // ── 2. Add Song ─────────────────────────────────────────────────────────────
  distube.on('addSong', (queue, song) => {
    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle('✅ Added to Queue')
      .setDescription(`[${song.name}](${song.url}) - \`${song.formattedDuration}\``)
      .setThumbnail(song.thumbnail)
      .setFooter({ text: `Requested by ${song.user.tag}`, iconURL: song.user.displayAvatarURL() });

    queue.textChannel.send({ embeds: [embed] }).catch(console.error);
  });

  // ── 3. Add Playlist ─────────────────────────────────────────────────────────
  distube.on('addList', (queue, playlist) => {
    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle('✅ Playlist Added')
      .setDescription(`[${playlist.name}](${playlist.url})`)
      .addFields(
        { name: 'Songs', value: `${playlist.songs.length}`, inline: true },
        { name: 'Requested by', value: `${playlist.user}`, inline: true }
      );

    queue.textChannel.send({ embeds: [embed] }).catch(console.error);
  });

  // ── 4. Empty Queue (Finished) ───────────────────────────────────────────────
  distube.on('finish', (queue) => {
    const embed = new EmbedBuilder()
      .setColor(0xed4245)
      .setDescription('🏁 The queue has ended. Leaving the voice channel...');
    queue.textChannel.send({ embeds: [embed] }).catch(console.error);
    if (queue.voice) queue.voice.leave();
  });

  // ── 5. Empty Channel ────────────────────────────────────────────────────────
  distube.on('empty', (queue) => {
    const embed = new EmbedBuilder()
      .setColor(0xed4245)
      .setDescription('👻 The voice channel is empty. Leaving...');
    queue.textChannel.send({ embeds: [embed] }).catch(console.error);
    if (queue.voice) queue.voice.leave();
  });

  // ── 6. Error Handling ───────────────────────────────────────────────────────
  distube.on('error', (channel, error) => {
    console.error('[DisTube]', error);
    if (channel) {
      const embed = new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle('❌ An error occurred')
        .setDescription(`\`\`\`js\n${error.message.slice(0, 2000)}\n\`\`\``);
      channel.send({ embeds: [embed] }).catch(console.error);
    }
  });
};
