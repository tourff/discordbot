const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mass-delete')
    .setDescription('Deletes all channels in a category, their corresponding roles, and the category itself.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option.setName('category')
        .setDescription('The category to delete (along with its channels and roles)')
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(true)
    ),

  async execute(interaction) {
    const category = interaction.options.getChannel('category');
    const guild = interaction.guild;

    await interaction.deferReply({ ephemeral: true });

    try {
      // 1. Fetch all child channels
      const channels = category.children.cache;
      let deletedChannelsCount = 0;
      let deletedRolesCount = 0;

      // Ensure we have the latest roles cache
      await guild.roles.fetch();

      // 2. Loop through each channel to delete it and its matching role
      for (const [id, channel] of channels) {
        const channelName = channel.name; // e.g., "team-1"
        
        // Find the role with the same name (case-insensitive for safety)
        const role = guild.roles.cache.find(r => r.name.toLowerCase() === channelName.toLowerCase());

        // Delete Role
        if (role) {
          try {
            await role.delete(`Mass deleted via category ${category.name}`);
            deletedRolesCount++;
          } catch (err) {
            console.error(`[Mass-Delete] Failed to delete role ${role.name}:`, err);
          }
        }

        // Delete Channel
        try {
          await channel.delete(`Mass deleted via category ${category.name}`);
          deletedChannelsCount++;
        } catch (err) {
          console.error(`[Mass-Delete] Failed to delete channel ${channel.name}:`, err);
        }
      }

      // 3. Delete the category itself
      const categoryName = category.name;
      try {
        await category.delete(`Mass deletion requested by ${interaction.user.tag}`);
      } catch (err) {
        console.error(`[Mass-Delete] Failed to delete category ${categoryName}:`, err);
      }

      const embed = new EmbedBuilder()
        .setColor(0xFF0000) // Red for deletion
        .setTitle('🗑️ Mass Deletion Complete')
        .setDescription(`Successfully deleted category **${categoryName}** and all its contents.`)
        .addFields(
          { name: 'Channels Deleted', value: `${deletedChannelsCount}`, inline: true },
          { name: 'Roles Deleted', value: `${deletedRolesCount}`, inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('[Mass-Delete Error]', error);
      await interaction.editReply({ content: `❌ An error occurred: ${error.message}` });
    }
  },
};
