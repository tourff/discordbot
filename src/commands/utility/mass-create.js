const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mass-create')
    .setDescription('Creates multiple private channels and roles under a category.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Base name for the category and channels (e.g., Team)')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('count')
        .setDescription('Number of channels/roles to create (Max 50)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(50)
    ),

  async execute(interaction) {
    const baseName = interaction.options.getString('name');
    const count = interaction.options.getInteger('count');
    const guild = interaction.guild;

    // Acknowledge the command since creating many channels takes time
    await interaction.deferReply({ ephemeral: true });

    try {
      // 1. Create Category
      const category = await guild.channels.create({
        name: baseName,
        type: ChannelType.GuildCategory,
      });

      const createdChannels = [];
      const createdRoles = [];

      // 2. Loop and create Roles & Channels
      for (let i = 1; i <= count; i++) {
        const itemName = `${baseName}-${i}`;

        // Create Role
        const newRole = await guild.roles.create({
          name: itemName,
          color: 'Random',
          reason: `Mass created by ${interaction.user.tag}`
        });
        createdRoles.push(newRole.id);

        // Create Text Channel
        const newChannel = await guild.channels.create({
          name: itemName,
          type: ChannelType.GuildText,
          parent: category.id,
          permissionOverwrites: [
            {
              id: guild.id, // @everyone role
              deny: [PermissionFlagsBits.ViewChannel],
            },
            {
              id: newRole.id, // The specific role
              allow: [PermissionFlagsBits.ViewChannel],
            },
          ],
        });
        createdChannels.push(newChannel.id);
      }

      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('✅ Mass Creation Successful')
        .setDescription(`Successfully created category **${baseName}** with **${count}** private channels and roles.`)
        .addFields(
          { name: 'Category', value: `<#${category.id}>`, inline: true },
          { name: 'Total Created', value: `${count} Channels & Roles`, inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('[Mass-Create Error]', error);
      await interaction.editReply({ content: `❌ An error occurred: ${error.message}` });
    }
  },
};
