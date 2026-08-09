const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Displays a list of all available commands.'),
  
  async execute(interaction) {
    const { commands } = interaction.client;
    
    // Group commands by category
    const categories = {};
    commands.forEach(cmd => {
      const cat = cmd.category || 'General';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(`\`/${cmd.data.name}\` - ${cmd.data.description}`);
    });

    const embed = new EmbedBuilder()
      .setColor(0x2B2D31) // Professional dark theme color
      .setAuthor({ 
        name: `${interaction.client.user.username} Help Center`, 
        iconURL: interaction.client.user.displayAvatarURL() 
      })
      .setDescription('Here is a detailed list of all available commands. Use them to interact with the bot!')
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .setFooter({ 
        text: `Requested by ${interaction.user.tag}`, 
        iconURL: interaction.user.displayAvatarURL() 
      })
      .setTimestamp();

    // Map categories to emojis for a better look
    const categoryEmojis = {
      moderation: '🛡️',
      music: '🎵',
      utility: '🛠️',
      General: '📌'
    };

    // Add fields for each category
    for (const [cat, cmds] of Object.entries(categories)) {
      const emoji = categoryEmojis[cat] || '✨';
      const formattedCategory = cat.charAt(0).toUpperCase() + cat.slice(1); // Capitalize first letter
      
      embed.addFields({
        name: `${emoji} ${formattedCategory} Commands`,
        value: cmds.join('\n'),
        inline: false
      });
    }

    await interaction.reply({ embeds: [embed] });
  },
};
