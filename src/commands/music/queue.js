const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Displays the current music queue.'),
  
  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction);
    if (!queue) {
      return interaction.reply({ content: '❌ There is no music playing right now!', ephemeral: true });
    }

    const q = queue.songs
      .map((song, i) => `${i === 0 ? '**Playing:**' : `**${i}.**`} ${song.name} - \`${song.formattedDuration}\``)
      .slice(0, 10)
      .join('\n');

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('📑 Current Queue')
      .setDescription(`${q}\n\n${queue.songs.length > 10 ? `*...and ${queue.songs.length - 10} more songs*` : ''}`)
      .setFooter({ text: `Total duration: ${queue.formattedDuration}` });

    await interaction.reply({ embeds: [embed] });
  },
};
