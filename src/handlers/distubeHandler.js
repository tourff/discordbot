// src/handlers/distubeHandler.js
// ─────────────────────────────────────────────────────────────────────────────
// DisTube event listeners for playing songs, queueing tracks, and errors.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = (client) => {
  const distube = client.distube;

  // ── 1. Play Song ────────────────────────────────────────────────────────────
  distube.on('playSong', (queue, song) => {
    if (!queue.textChannel) return;

    const userTag = song.user?.tag || song.member?.user?.tag || (song.user ? `${song.user}` : 'Someone');
    const embed = new EmbedBuilder()
      .setColor(0xff00a6) // Diva Pink
      .setTitle('Now Playing')
      .setDescription(`[**${song.name}**](${song.url})\n\n**Duration:** \`${song.formattedDuration || 'N/A'}\`\n**Requested by:** ${song.user || userTag}`)
      .setThumbnail(song.thumbnail || null)
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
    if (!queue.textChannel) return;

    const userTag = song.user?.tag || song.member?.user?.tag || 'User';
    const avatar = song.user?.displayAvatarURL?.() || song.member?.user?.displayAvatarURL?.() || null;

    const embed = new EmbedBuilder()
      .setColor(0x2f3136) // Dark grey
      .setDescription(`✅ **Track queued - Position #${queue.songs.length}**\n\nAdded [**${song.name}**](${song.url}) (\`${song.formattedDuration || 'N/A'}\`) to the queue`)
      .setFooter({ text: `Requested by ${userTag}`, iconURL: avatar });

    queue.textChannel.send({ embeds: [embed] }).catch(console.error);
  });

  // ── 3. Add Playlist ─────────────────────────────────────────────────────────
  distube.on('addList', (queue, playlist) => {
    if (!queue.textChannel) return;

    const requester = playlist.user || playlist.member?.user || 'User';
    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle('✅ Playlist Added')
      .setDescription(`[${playlist.name}](${playlist.url})`)
      .addFields(
        { name: 'Songs', value: `${playlist.songs.length}`, inline: true },
        { name: 'Requested by', value: `${requester}`, inline: true }
      );

    queue.textChannel.send({ embeds: [embed] }).catch(console.error);
  });

  // ── 4. Empty Queue (Finished) ───────────────────────────────────────────────
  distube.on('finish', (queue) => {
    if (queue.textChannel) {
      const embed = new EmbedBuilder()
        .setColor(0xed4245)
        .setDescription('🏁 The queue has ended. Leaving the voice channel...');
      queue.textChannel.send({ embeds: [embed] }).catch(console.error);
    }
    if (queue.voice) queue.voice.leave();
  });

  // ── 5. Empty Channel ────────────────────────────────────────────────────────
  distube.on('empty', (queue) => {
    if (queue.textChannel) {
      const embed = new EmbedBuilder()
        .setColor(0xed4245)
        .setDescription('👻 The voice channel is empty. Leaving...');
      queue.textChannel.send({ embeds: [embed] }).catch(console.error);
    }
    if (queue.voice) queue.voice.leave();
  });

  // ── 6. Error & Debug Handling ──────────────────────────────────────────────
  distube.on('ffmpegDebug', (debugMessage) => {
    // Only log warnings and errors to keep terminal output clean
    if (debugMessage && (debugMessage.includes('error') || debugMessage.includes('warning') || debugMessage.includes('failed'))) {
      console.warn('[FFmpeg Debug]', debugMessage);
    }
  });

  distube.on('error', (error, queue, song) => {
    console.error('[DisTube Error]', error);

    const errorMessage = String(error?.message || error || '');
    
    // Ignore benign pipe-closure errors during track transitions, skips, or stops
    const isTransitionError = 
      errorMessage.includes('code 251') || 
      errorMessage.includes('code 255') ||
      errorMessage.includes('ERR_STREAM_PREMATURE_CLOSE') ||
      error?.code === 'ERR_STREAM_PREMATURE_CLOSE';

    // If a new song is actively playing or queued, don't spam Discord with previous stream exit codes
    if (isTransitionError && queue?.songs?.length > 0) {
      console.log('[DisTube] Ignored benign stream abort code during track playback transition.');
      return;
    }

    const channel = queue?.textChannel || song?.metadata?.textChannel;
    if (channel) {
      const displayMsg = errorMessage.includes('code 251')
        ? 'The audio stream connection was temporarily interrupted. Please try re-adding the track.'
        : errorMessage.slice(0, 1900);

      const embed = new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle('❌ Playback Error')
        .setDescription(`\`\`\`\n${displayMsg}\n\`\`\``);
      channel.send({ embeds: [embed] }).catch(console.error);
    }
  });
};
