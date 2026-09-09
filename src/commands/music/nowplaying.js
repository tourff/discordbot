const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Displays information about the currently playing song.'),

  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction);
    if (!queue || !queue.songs || queue.songs.length === 0) {
      return interaction.reply({ content: '❌ There is no music playing right now!', ephemeral: true });
    }

    const song = queue.songs[0];

    // Create a safe text-based progress bar
    const totalLength = 20;
    let progressBar = '🔘' + '▬'.repeat(totalLength);
    if (song.isLive) {
      progressBar = '🔴 LIVE STREAM';
    } else if (song.duration && song.duration > 0) {
      const progress = Math.min(totalLength, Math.max(0, Math.round((queue.currentTime / song.duration) * totalLength)));
      progressBar = '▬'.repeat(progress) + '🔘' + '▬'.repeat(totalLength - progress);
    }

    const durationDisplay = song.isLive ? 'LIVE' : song.formattedDuration;
    const views = typeof song.views === 'number' ? song.views.toLocaleString() : 'N/A';
    const likes = typeof song.likes === 'number' ? song.likes.toLocaleString() : 'N/A';

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🎶 Now Playing')
      .setDescription(`[**${song.name}**](${song.url})\n\n\`${queue.formattedCurrentTime} ${progressBar} ${durationDisplay}\``)
      .setThumbnail(song.thumbnail || null)
      .addFields(
        { name: 'Requested by', value: `${song.user || 'Unknown'}`, inline: true },
        { name: 'Views / Likes', value: `${views} / ${likes}`, inline: true }
      )
      .setFooter({
        text: `Volume: ${queue.volume}% | Loop: ${queue.repeatMode ? (queue.repeatMode === 2 ? 'Queue' : 'Song') : 'Off'}`,
      });

    await interaction.reply({ embeds: [embed] });
  },
};
