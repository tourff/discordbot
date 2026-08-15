const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Displays a list of all available commands.'),
  
  async execute(interaction) {
    const { commands } = interaction.client;
    
    // Group commands by category to count them
    const categories = {};
    commands.forEach(cmd => {
      const cat = (cmd.category || 'General').toLowerCase();
      if (!categories[cat]) categories[cat] = 0;
      categories[cat]++;
    });

    const helpEmbed = new EmbedBuilder()
      .setTitle(`🤖 ${interaction.client.user.username} | Help Center`)
      .setDescription('Below is a categorized overview of all available commands. Select a category from the dropdown menu below for detailed information.')
      .setColor('#00E5FF') // Cyan color matching the vibe
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .addFields(
        { name: '🎮 Esports', value: `\`${categories['esports'] || 0} Commands\``, inline: true },
        { name: '🛡️ Moderation', value: `\`${categories['moderation'] || 0} Commands\``, inline: true },
        { name: '🛠️ Utility', value: `\`${categories['utility'] || 0} Commands\``, inline: true },
        { name: '🎵 Music', value: `\`${categories['music'] || 0} Commands\``, inline: true },
        { name: '📌 General', value: `\`${categories['general'] || 0} Commands\``, inline: true }
      )
      .setFooter({ 
        text: `Requested by ${interaction.user.tag}`, 
        iconURL: interaction.user.displayAvatarURL() 
      })
      .setTimestamp();

    const selectMenu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('help_category_select')
        .setPlaceholder('📂 Select a category to view commands...')
        .addOptions([
          {
            label: 'Esports Commands',
            description: 'IDP, Tagcheck, Scrims, Tourneys',
            value: 'help_esports',
            emoji: '🎮',
          },
          {
            label: 'Moderation Commands',
            description: 'Ban, Kick, Mute, Warn and moderation tools',
            value: 'help_moderation',
            emoji: '🛡️',
          },
          {
            label: 'Music Commands',
            description: 'Play, Queue, Skip, Pause and audio controls',
            value: 'help_music',
            emoji: '🎵',
          },
          {
            label: 'Utility Commands',
            description: 'Setup, Roles, Dashboards, and general utils',
            value: 'help_utility',
            emoji: '🛠️',
          },
          {
            label: 'General Commands',
            description: 'Basic commands and other general tools',
            value: 'help_general',
            emoji: '📌',
          }
        ])
    );

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Support Server')
        .setStyle(ButtonStyle.Link)
        .setURL('https://discord.gg/your-invite'), // Update this link as needed
      new ButtonBuilder()
        .setLabel('Invite Bot')
        .setStyle(ButtonStyle.Link)
        .setURL(`https://discord.com/api/oauth2/authorize?client_id=${interaction.client.user.id}&permissions=8&scope=bot%20applications.commands`)
    );

    await interaction.reply({
      embeds: [helpEmbed],
      components: [selectMenu, buttons]
    });
  },
};
