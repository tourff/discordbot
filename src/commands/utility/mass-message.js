const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mass-message')
    .setDescription('Send a message/embed to all channels within a category.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option.setName('category')
        .setDescription('The category containing the channels')
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('message')
        .setDescription('The message content to send')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('timer')
        .setDescription('Delay in minutes before sending (Optional)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(1440) // max 24 hours
    ),

  async execute(interaction) {
    const category = interaction.options.getChannel('category');
    const messageContent = interaction.options.getString('message');
    const timerMinutes = interaction.options.getInteger('timer');

    await interaction.deferReply({ ephemeral: true });

    // Fetch all text channels under this category
    const channels = category.children.cache.filter(c => c.type === ChannelType.GuildText);

    if (channels.size === 0) {
      return interaction.editReply({ content: `❌ No text channels found in category **${category.name}**.` });
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2) // Professional blurple
      .setAuthor({ name: 'Announcement', iconURL: interaction.client.user.displayAvatarURL() })
      .setDescription(messageContent)
      .setFooter({ text: `Sent by ${interaction.user.tag}` })
      .setTimestamp();

    // Function to broadcast the message
    const broadcast = async () => {
      let successCount = 0;
      for (const [id, channel] of channels) {
        try {
          await channel.send({ embeds: [embed] });
          successCount++;
        } catch (error) {
          console.error(`[Mass-Message] Failed to send to ${channel.name}:`, error);
        }
      }
      return successCount;
    };

    if (timerMinutes) {
      // Schedule it
      const ms = timerMinutes * 60 * 1000;
      setTimeout(async () => {
        await broadcast();
      }, ms);

      const replyEmbed = new EmbedBuilder()
        .setColor(0xFFA500) // Orange for pending
        .setTitle('⏳ Message Scheduled')
        .setDescription(`Your message is scheduled to be sent to **${channels.size}** channels in **${timerMinutes} minute(s)**.\n\n*Note: If the bot restarts during this time, the scheduled message will be cancelled.*`);
      
      await interaction.editReply({ embeds: [replyEmbed] });

    } else {
      // Send immediately
      const successCount = await broadcast();
      
      const replyEmbed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('✅ Mass Message Sent')
        .setDescription(`Successfully sent the message to **${successCount} / ${channels.size}** channels in the **${category.name}** category.`);
      
      await interaction.editReply({ embeds: [replyEmbed] });
    }
  },
};
