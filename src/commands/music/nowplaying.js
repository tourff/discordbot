const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Displays information about the currently playing song.'),
  
  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction);
    if (!queue) {
      return interaction.reply({ content: '❌ There is no music playing right now!', ephemeral: true });
    }

    const song = queue.songs[0];
    
    // Create a simple text-based progress bar
    const totalLength = 20;
    const progress = Math.round((queue.currentTime / song.duration) * totalLength);
    const progressBar = '▬'.repeat(progress) + '🔘' + '▬'.repeat(totalLength - progress);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🎶 Now Playing')
      .setDescription(`[${song.name}](${song.url})\n\n\`${queue.formattedCurrentTime} ${progressBar} ${song.formattedDuration}\``)
      .setThumbnail(song.thumbnail)
      .addFields(
        { name: 'Requested by', value: `${song.user}`, inline: true },
        { name: 'Views/Likes', value: `${song.views.toLocaleString()} / ${song.likes.toLocaleString()}`, inline: true },
      )
      .setFooter({ text: `Volume: ${queue.volume}% | Loop: ${queue.repeatMode ? (queue.repeatMode === 2 ? 'Queue' : 'Song') : 'Off'}` });

    await interaction.reply({ embeds: [embed] });
  },
};
