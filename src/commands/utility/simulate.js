const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('simulate')
    .setDescription('Simulate a user joining or leaving the server to test your systems.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(option =>
      option.setName('event')
        .setDescription('Which event do you want to simulate?')
        .setRequired(true)
        .addChoices(
          { name: 'Member Join (Welcome Message)', value: 'join' },
          { name: 'Member Leave (Goodbye Message)', value: 'leave' }
        )
    ),
  
  async execute(interaction) {
    const event = interaction.options.getString('event');

    await interaction.reply({ content: `✅ Simulating a member **${event}** event using your profile...`, ephemeral: true });

    if (event === 'join') {
      // Emit the guildMemberAdd event using the user who ran the command
      interaction.client.emit('guildMemberAdd', interaction.member);
    } else if (event === 'leave') {
      // Emit the guildMemberRemove event using the user who ran the command
      interaction.client.emit('guildMemberRemove', interaction.member);
    }
  },
};
