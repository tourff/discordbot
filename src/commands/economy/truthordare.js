// src/commands/utility/truthordare.js
'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const TRUTHS = [
  'What is the most embarrassing thing you have ever done in a voice call?',
  'If you could delete one channel in this server without consequences, which one would it be?',
  'What is your biggest secret gaming guilty pleasure?',
  'Who is your favorite member on this server and why?',
  'Have you ever pretended to be AFK just to avoid talking to someone?',
];

const DARES = [
  'Change your Discord server nickname to "Jarvis Fanclub President" for 1 hour.',
  'Send your most recently saved meme in the chat with zero context.',
  'Sing the chorus of your favorite song in voice channel for 10 seconds.',
  'Ping the 3rd person in the online member list and tell them they are awesome.',
  'Type your next 3 messages in only uppercase letters.',
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('truthordare')
    .setDescription('Get a random Truth or Dare prompt for server party and voice chat')
    .addStringOption(opt =>
      opt.setName('type')
        .setDescription('Truth or Dare?')
        .setRequired(true)
        .addChoices(
          { name: 'Truth 💭', value: 'truth' },
          { name: 'Dare 🔥', value: 'dare' }
        )
    ),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const type = interaction.options.getString('type');
    const isTruth = type === 'truth';

    const pool = isTruth ? TRUTHS : DARES;
    const prompt = pool[Math.floor(Math.random() * pool.length)];

    const embed = new EmbedBuilder()
      .setColor(isTruth ? 0x06b6d4 : 0xf43f5e)
      .setTitle(isTruth ? '💭 TRUTH TIME!' : '🔥 DARE TIME!')
      .setDescription(`**Player:** <@${interaction.user.id}>\n\n### "${prompt}"`)
      .setFooter({ text: 'Jarvis Party Games • Made by trj7' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
