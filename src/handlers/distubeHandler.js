const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = (client) => {
  const distube = client.distube;

  // ── 1. Play Song ────────────────────────────────────────────────────────────
  distube.on('playSong', (queue, song) => {
    const embed = new EmbedBuilder()
      .setColor(0xff00a6) // Diva Pink
      .setTitle('Now Playing')
      .setDescription(`[**${song.name}**](${song.url})\n\n**Duration:** \`${song.formattedDuration}\`\n**Requested by:** ${song.user}`)
      .setThumbnail(song.thumbnail)
      .setFooter({ text: `Volume: ${queue.volume}% | Loop: ${queue.repeatMode ? (queue.repeatMode === 2 ? 'Queue' : 'Song') : 'Off'}` });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('music_pause')
        .setLabel('Pause / Play')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('⏸️'),
      new ButtonBuilder()
        .setCustomId('music_skip')
        .setLabel('Skip')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('⏭️'),
      new ButtonBuilder()
        .setCustomId('music_stop')
        .setLabel('Stop')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('⏹️'),
      new ButtonBuilder()
        .setCustomId('music_loop')
        .setLabel('Loop')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🔁')
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('music_rewind')
        .setLabel('-15s')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('⏪'),
      new ButtonBuilder()
        .setCustomId('music_forward')
        .setLabel('+15s')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('⏩')
    );

    queue.textChannel.send({ embeds: [embed], components: [row, row2] }).catch(console.error);
  });

  // ── 2. Add Song ─────────────────────────────────────────────────────────────
  distube.on('addSong', (queue, song) => {
    const embed = new EmbedBuilder()
      .setColor(0x2f3136) // Dark grey
      .setDescription(`✅ **Track queued - Position #${queue.songs.length}**\n\nAdded [**${song.name}**](${song.url}) (\`${song.formattedDuration}\`) to the queue`)
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
  distube.on('error', (error, queue, song) => {
    console.error('[DisTube]', error);
    const channel = queue?.textChannel || song?.metadata?.textChannel;
    if (channel) {
      const embed = new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle('❌ An error occurred')
        .setDescription(`\`\`\`js\n${String(error).slice(0, 2000)}\n\`\`\``);
      channel.send({ embeds: [embed] }).catch(console.error);
    }
  });
};
