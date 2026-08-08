const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Displays a list of all available commands.'),
  
  async execute(interaction) {
    const { commands } = interaction.client;
    
    // Group commands by category (which is the folder name they are in)
    // However, since we don't store category explicitly in the command object,
    // we will just list them all cleanly.
    const commandList = commands.map(cmd => {
      return `**/${cmd.data.name}**\n↳ *${cmd.data.description}*`;
    }).join('\n\n');

    const embed = new EmbedBuilder()
      .setColor(0x5865f2) // Discord Blurple
      .setTitle('📚 Bot Commands Help')
      .setDescription(`Here is a list of all the commands you can use:\n\n${commandList}`)
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
