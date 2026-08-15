const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mass-role')
    .setDescription('Easily assign or remove a role from multiple users at once.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a role to multiple users.')
        .addRoleOption(option =>
          option.setName('role')
            .setDescription('The role to assign')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('users')
            .setDescription('Mention users or paste their IDs (separated by space)')
            .setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a role from multiple users.')
        .addRoleOption(option =>
          option.setName('role')
            .setDescription('The role to remove')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('users')
            .setDescription('Mention users or paste their IDs (separated by space)')
            .setRequired(true))
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const targetRole = interaction.options.getRole('role');
    const usersString = interaction.options.getString('users');

    // Prevent giving/removing roles higher than the bot's own role
    if (interaction.guild.members.me.roles.highest.position <= targetRole.position) {
      return interaction.reply({ 
        content: `❌ I cannot manage the **${targetRole.name}** role because it is higher than or equal to my highest role.`, 
        ephemeral: true 
      });
    }

    // Extract all user IDs using regex (matches standard Discord mentions <@ID> or raw IDs)
    const idMatches = usersString.match(/(?:<@!?)?(\d{17,19})>?/g);
    
    if (!idMatches || idMatches.length === 0) {
      return interaction.reply({ 
        content: '❌ No valid users or IDs found in your input. Please mention them or paste their IDs.', 
        ephemeral: true 
      });
    }

    // Extract raw IDs from the matches
    const userIds = idMatches.map(match => match.replace(/[<@!>]/g, ''));
    // Remove duplicates
    const uniqueUserIds = [...new Set(userIds)];

    await interaction.deferReply();

    let successCount = 0;
    let failCount = 0;

    for (const userId of uniqueUserIds) {
      try {
        const member = await interaction.guild.members.fetch(userId);
        
        if (subcommand === 'add') {
          await member.roles.add(targetRole);
        } else if (subcommand === 'remove') {
          await member.roles.remove(targetRole);
        }
        
        successCount++;
      } catch (error) {
        console.error(`[Mass-Role] Failed to ${subcommand} role for ${userId}:`, error.message);
        failCount++;
      }
    }

    const actionText = subcommand === 'add' ? 'Added' : 'Removed';
    const embed = new EmbedBuilder()
      .setColor(subcommand === 'add' ? 0x00FF00 : 0xFF0000)
      .setTitle(`✅ Mass Role ${actionText}`)
      .setDescription(`Action completed for the role ${targetRole}.`)
      .addFields(
        { name: 'Role', value: `${targetRole}`, inline: true },
        { name: 'Successful', value: `${successCount} Users`, inline: true },
        { name: 'Failed', value: `${failCount} Users`, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
