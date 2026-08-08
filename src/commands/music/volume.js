const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Changes the music playback volume.')
    .addIntegerOption(option => 
      option.setName('amount')
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
    
    const volume = interaction.options.getInteger('amount');
    queue.setVolume(volume);
    
    await interaction.reply({ content: `🔊 Volume changed to **${volume}%**` });
  },
};
