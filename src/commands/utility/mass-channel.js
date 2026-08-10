const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mass-channel')
    .setDescription('Manage mass creation, broadcasting, and deletion of private channels.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Create multiple private channels and roles.')
        .addStringOption(option =>
          option.setName('name')
            .setDescription('The prefix/name for the channels and roles (e.g., event)')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('count')
            .setDescription('Number of channels/roles to create (Max 50)')
            .setMinValue(1)
            .setMaxValue(50)
            .setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('broadcast')
        .setDescription('Send a message to all channels with a specific prefix.')
        .addStringOption(option =>
          option.setName('name')
            .setDescription('The prefix of the channels to send the message to')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('message')
            .setDescription('The message to broadcast')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('delay_minutes')
            .setDescription('Delay in minutes before sending (0 for instant)')
            .setMinValue(0)
            .setRequired(false))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('delete')
        .setDescription('Delete all channels and roles with a specific prefix.')
        .addStringOption(option =>
          option.setName('name')
            .setDescription('The prefix of the channels/roles to delete')
            .setRequired(true))
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const prefixName = interaction.options.getString('name').toLowerCase().replace(/\s+/g, '-');

    if (subcommand === 'create') {
      const count = interaction.options.getInteger('count');
      await interaction.reply({ content: `⏳ Creating Category, ${count} Roles, and ${count} Channels. This might take a moment...`, ephemeral: true });

      try {
        // 1. Create Category
        const category = await interaction.guild.channels.create({
          name: prefixName,
          type: ChannelType.GuildCategory,
        });

        // 2. Loop and create roles + channels
        for (let i = 1; i <= count; i++) {
          const itemName = `${prefixName}-${i}`;

          // Create Role
          const role = await interaction.guild.roles.create({
            name: itemName,
            reason: `Mass channel creation by ${interaction.user.tag}`,
          });

          // Create Channel
          await interaction.guild.channels.create({
            name: itemName,
            type: ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: [
              {
                id: interaction.guild.id, // @everyone role
                deny: [PermissionFlagsBits.ViewChannel], // Private
              },
              {
                id: role.id, // The specific role
                allow: [PermissionFlagsBits.ViewChannel], // Can view
              },
              {
                id: interaction.client.user.id, // Bot itself
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
              }
            ],
          });
        }

        await interaction.editReply({ content: `✅ Successfully created ${count} channels and roles under the category **${prefixName}**.` });
      } catch (error) {
        console.error(error);
        await interaction.editReply({ content: `❌ An error occurred while creating channels: ${error.message}` });
      }
    } 
    
    else if (subcommand === 'broadcast') {
      const messageContent = interaction.options.getString('message');
      const delayMinutes = interaction.options.getInteger('delay_minutes') || 0;
      
      // Find all text channels that start with the prefix
      const channelsToMsg = interaction.guild.channels.cache.filter(c => 
        c.type === ChannelType.GuildText && c.name.startsWith(`${prefixName}-`)
      );

      if (channelsToMsg.size === 0) {
        return interaction.reply({ content: `❌ No text channels found starting with **${prefixName}-**.`, ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor('#00E5FF')
        .setTitle('📢 Announcement')
        .setDescription(messageContent)
        .setTimestamp()
        .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() });

      if (delayMinutes === 0) {
        await interaction.reply({ content: `⏳ Sending message to ${channelsToMsg.size} channels...`, ephemeral: true });
        let sent = 0;
        for (const [id, channel] of channelsToMsg) {
          try {
            await channel.send({ embeds: [embed] });
            sent++;
          } catch (e) {
            console.error(`Failed to send to ${channel.name}:`, e);
          }
        }
        await interaction.editReply({ content: `✅ Broadcast complete! Sent to ${sent}/${channelsToMsg.size} channels.` });
      } else {
        await interaction.reply({ content: `✅ Message scheduled! It will be sent to ${channelsToMsg.size} channels in **${delayMinutes} minute(s)**.`, ephemeral: true });
        
        // In-memory scheduler
        setTimeout(async () => {
          for (const [id, channel] of channelsToMsg) {
            try {
              await channel.send({ embeds: [embed] });
            } catch (e) {
              console.error(`Failed to send scheduled msg to ${channel.name}:`, e);
            }
          }
        }, delayMinutes * 60 * 1000);
      }
    } 
    
    else if (subcommand === 'delete') {
      await interaction.reply({ content: `⏳ Deleting all channels, roles, and categories associated with **${prefixName}**...`, ephemeral: true });

      try {
        let deletedChannels = 0;
        let deletedRoles = 0;

        // Delete Text Channels and Categories matching prefix
        const channelsToDelete = interaction.guild.channels.cache.filter(c => 
          c.name.startsWith(`${prefixName}-`) || c.name === prefixName
        );
        for (const [id, channel] of channelsToDelete) {
          await channel.delete();
          deletedChannels++;
        }

        // Delete Roles matching prefix
        const rolesToDelete = interaction.guild.roles.cache.filter(r => 
          r.name.startsWith(`${prefixName}-`)
        );
        for (const [id, role] of rolesToDelete) {
          await role.delete();
          deletedRoles++;
        }

        await interaction.editReply({ content: `✅ Cleanup complete! Deleted **${deletedChannels}** channels/categories and **${deletedRoles}** roles.` });
      } catch (error) {
        console.error(error);
        await interaction.editReply({ content: `❌ An error occurred during cleanup: ${error.message}` });
      }
    }
  },
};
