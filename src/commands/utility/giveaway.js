// src/commands/utility/giveaway.js
'use strict';

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const { supabase } = require('../../config/supabase');
const { endGiveaway } = require('../../modules/giveawayManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Host and manage giveaways on the server')
    .addSubcommand(sub =>
      sub.setName('start')
        .setDescription('Start a new timed giveaway')
        .addStringOption(opt =>
          opt.setName('prize')
            .setDescription('What is being given away? (e.g. Discord Nitro / VIP Role)')
            .setRequired(true)
        )
        .addIntegerOption(opt =>
          opt.setName('duration_minutes')
            .setDescription('Duration of giveaway in minutes')
            .setMinValue(1)
            .setMaxValue(10080)
            .setRequired(true)
        )
        .addIntegerOption(opt =>
          opt.setName('winners')
            .setDescription('Number of winners to draw (default: 1)')
            .setMinValue(1)
            .setMaxValue(20)
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub.setName('end')
        .setDescription('Instantly conclude an ongoing giveaway')
        .addStringOption(opt =>
          opt.setName('message_id')
            .setDescription('Message ID of the giveaway embed')
            .setRequired(true)
        )
    ),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: '🚫 You must have Manage Server permissions to host giveaways.', ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'start') {
      const prize = interaction.options.getString('prize');
      const minutes = interaction.options.getInteger('duration_minutes');
      const winnerCount = interaction.options.getInteger('winners') || 1;

      const endTime = new Date(Date.now() + minutes * 60 * 1000);
      const endTimestamp = Math.floor(endTime.getTime() / 1000);

      const embed = new EmbedBuilder()
        .setColor(0x6366f1)
        .setTitle(`🎉 GIVEAWAY: ${prize}`)
        .setDescription(`Click the button below to enter!\n\n**Winners:** \`${winnerCount}\`\n**Hosted By:** <@${interaction.user.id}>\n**Ends:** <t:${endTimestamp}:R> (<t:${endTimestamp}:f>)`)
        .setFooter({ text: 'Jarvis Giveaway • Made by trj7' })
        .setTimestamp(endTime);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('giveaway_enter')
          .setLabel('Enter Giveaway')
          .setEmoji('🎉')
          .setStyle(ButtonStyle.Primary)
      );

      const sentMsg = await interaction.channel.send({ embeds: [embed], components: [row] });

      await supabase.from('giveaways').insert([{
        guild_id: interaction.guild.id,
        channel_id: interaction.channel.id,
        message_id: sentMsg.id,
        prize,
        winner_count: winnerCount,
        end_time: endTime.toISOString(),
        is_ended: false,
        entries: []
      }]);

      await interaction.reply({ content: `✅ Giveaway started in <#${interaction.channel.id}>!`, ephemeral: true });
    }

    if (sub === 'end') {
      const messageId = interaction.options.getString('message_id');
      const { data: giveaway } = await supabase
        .from('giveaways')
        .select('*')
        .eq('message_id', messageId)
        .eq('is_ended', false)
        .single();

      if (!giveaway) {
        return interaction.reply({ content: '⚠️ Active giveaway not found with that message ID.', ephemeral: true });
      }

      await endGiveaway(interaction.client, giveaway);
      await interaction.reply({ content: '✅ Giveaway concluded and winner(s) picked!', ephemeral: true });
    }
  },
};
