// src/commands/general/afk.js
'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { setAFK } = require('../../modules/afkManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('afk')
    .setDescription('Set your AFK status so others know you are away when mentioned')
    .addStringOption(opt =>
      opt.setName('reason')
        .setDescription('Why are you going AFK?')
        .setRequired(false)
    ),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const reason = interaction.options.getString('reason') || 'AFK';

    await setAFK(interaction.guild.id, interaction.user.id, reason);

    await interaction.reply({
      content: `💤 ${interaction.user}, I have set your status to **AFK**: *${reason}*.\nI will notify anyone who mentions you and automatically remove it when you chat next.`
    });
  },
};
