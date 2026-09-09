const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('seek')
    .setDescription('Jump to a specific time in the current song.')
    .addIntegerOption((option) =>
      option
        .setName('seconds')
        .setDescription('The time in seconds to jump to.')
        .setRequired(true)
        .setMinValue(0)
    ),

  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction);
    if (!queue) {
      return interaction.reply({ content: '❌ There is no music playing right now!', ephemeral: true });
    }

    const memberVoice = interaction.member.voice?.channel;
    if (!memberVoice) {
      return interaction.reply({ content: '❌ You must be in a voice channel to seek!', ephemeral: true });
    }

    const botVoice = interaction.guild.members.me?.voice?.channel;
    if (botVoice && botVoice.id !== memberVoice.id) {
      return interaction.reply({ content: `❌ You must be in <#${botVoice.id}> to control the music!`, ephemeral: true });
    }

    const timeInSeconds = interaction.options.getInteger('seconds');

    try {
      await queue.seek(timeInSeconds);
      await interaction.reply({ content: `⏩ Seeked to **${timeInSeconds} seconds**.` });
    } catch (e) {
      console.error('[Seek command error]', e);
      await interaction.reply({ content: '❌ Could not seek. Ensure the time is within the song duration.', ephemeral: true });
    }
  },
};
