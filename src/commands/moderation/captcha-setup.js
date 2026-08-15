// src/commands/utility/captcha-setup.js
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

module.exports = {
  data: new SlashCommandBuilder()
    .setName('captcha-setup')
    .setDescription('Deploy a member verification panel to protect against spam bots')
    .addRoleOption(opt =>
      opt.setName('verified_role')
        .setDescription('The role given upon successful verification')
        .setRequired(true)
    ),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '🚫 You must be an Administrator to configure verification.', ephemeral: true });
    }

    const verifiedRole = interaction.options.getRole('verified_role');

    // Save verified role
    await supabase.from('bot_settings').upsert([
      { guild_id: interaction.guild.id, key: 'CAPTCHA_VERIFIED_ROLE_ID', value: verifiedRole.id },
    ], { onConflict: 'guild_id,key' });

    const embed = new EmbedBuilder()
      .setColor(0x10b981)
      .setTitle('🛡️ Server Member Verification')
      .setDescription('Welcome to the server! To protect our community from automated bots, please click the button below to complete verification and unlock server access.')
      .setFooter({ text: 'Jarvis Security Shield • Made by trj7' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('captcha_verify')
        .setLabel('Verify & Unlock Access')
        .setEmoji('✅')
        .setStyle(ButtonStyle.Success)
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: `✅ Verification panel successfully deployed! Members will receive <@&${verifiedRole.id}>.`, ephemeral: true });
  },
};
