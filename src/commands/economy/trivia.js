// src/commands/utility/trivia.js
'use strict';

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { modifyBalance } = require('../../modules/economy');

const TRIVIA_QUESTIONS = [
  { q: 'Which programming language is known as the language of the web?', options: ['Python', 'JavaScript', 'C++', 'Java'], correct: 1 },
  { q: 'In gaming, what does FPS stand for?', options: ['First Person Shooter', 'Frames Per Second', 'Fast Player Speed', 'Both A and B'], correct: 3 },
  { q: 'What is the largest planet in our Solar System?', options: ['Mars', 'Saturn', 'Jupiter', 'Neptune'], correct: 2 },
  { q: 'Which company created the Discord platform?', options: ['Valve', 'Discord Inc.', 'Microsoft', 'Meta'], correct: 1 },
  { q: 'What year was the first iPhone released?', options: ['2005', '2007', '2009', '2010'], correct: 1 },
  { q: 'Who created the Jarvis AI bot on this server?', options: ['Unknown', 'trj7', 'Discord Staff', 'OpenAI'], correct: 1 },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('trivia')
    .setDescription('Play an interactive trivia quiz and win Jarvis Coins!'),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const item = TRIVIA_QUESTIONS[Math.floor(Math.random() * TRIVIA_QUESTIONS.length)];

    const embed = new EmbedBuilder()
      .setColor(0x6366f1)
      .setTitle('🧠 Jarvis Trivia Challenge')
      .setDescription(`**Question:**\n### ${item.q}\n\n*Choose an option below within 15 seconds:*`)
      .setFooter({ text: 'Reward: +50 Jarvis Coins • Made by trj7' });

    const row = new ActionRowBuilder().addComponents(
      item.options.map((opt, i) =>
        new ButtonBuilder()
          .setCustomId(`trivia_${i}`)
          .setLabel(opt)
          .setStyle(ButtonStyle.Secondary)
      )
    );

    const reply = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    try {
      const confirmation = await reply.awaitMessageComponent({
        filter: i => i.user.id === interaction.user.id,
        time: 15000,
        componentType: ComponentType.Button,
      });

      const selectedIdx = Number(confirmation.customId.replace('trivia_', ''));
      const isCorrect = selectedIdx === item.correct;

      if (isCorrect) {
        await modifyBalance(interaction.user.id, 50);
        await confirmation.update({
          content: `🎉 **Correct!** You chose **${item.options[selectedIdx]}** and earned **+50 Jarvis Coins**!`,
          components: []
        });
      } else {
        await confirmation.update({
          content: `❌ **Wrong!** You chose **${item.options[selectedIdx]}**. The correct answer was **${item.options[item.correct]}**.`,
          components: []
        });
      }
    } catch {
      await interaction.editReply({ content: `⏰ Time's up! The correct answer was **${item.options[item.correct]}**.`, components: [] }).catch(() => null);
    }
  },
};
