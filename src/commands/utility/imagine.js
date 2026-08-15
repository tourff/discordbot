// src/commands/utility/imagine.js
'use strict';

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('imagine')
    .setDescription('Generate stunning high-definition AI images from text prompts')
    .addStringOption(opt =>
      opt.setName('prompt')
        .setDescription('Describe what image you want Jarvis AI to create')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('aspect_ratio')
        .setDescription('Image dimensions & aspect ratio')
        .setRequired(false)
        .addChoices(
          { name: 'Square (1:1)', value: '1024x1024' },
          { name: 'Landscape (16:9)', value: '1280x720' },
          { name: 'Portrait (9:16)', value: '720x1280' }
        )
    ),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const prompt = interaction.options.getString('prompt');
    const dimensions = interaction.options.getString('aspect_ratio') || '1024x1024';
    const [width, height] = dimensions.split('x');

    await interaction.deferReply();

    try {
      const seed = Math.floor(Math.random() * 9999999);
      const encodedPrompt = encodeURIComponent(prompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=true`;

      const embed = new EmbedBuilder()
        .setColor(0x6366f1)
        .setTitle('🎨 Jarvis AI Image Synthesis')
        .setDescription(`**Prompt:** *${prompt}*\n**Resolution:** \`${dimensions}\` • **Seed:** \`${seed}\``)
        .setImage(imageUrl)
        .setFooter({ text: `Requested by ${interaction.user.tag} • Jarvis AI Art` })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('View Full Resolution')
          .setURL(imageUrl)
          .setStyle(ButtonStyle.Link)
      );

      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (err) {
      console.error('[Imagine] Error:', err);
      await interaction.editReply({ content: '❌ Failed to generate AI image.' });
    }
  },
};
