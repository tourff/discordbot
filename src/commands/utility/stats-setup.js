// src/commands/utility/stats-setup.js
'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { supabase } = require('../../config/supabase');
const { updateServerStats } = require('../../modules/statsCounters');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats-setup')
    .setDescription('Automatically create live server stats voice counters'),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '🚫 You must be an Administrator to run this command.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });
    const guild = interaction.guild;

    try {
      // 1. Create Category
      const category = await guild.channels.create({
        name: '📊 SERVER STATS',
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.Connect],
          },
        ],
      });

      // 2. Create Voice Channels
      const totalCh = await guild.channels.create({
        name: `👥 Members: ${guild.memberCount.toLocaleString()}`,
        type: ChannelType.GuildVoice,
        parent: category.id,
        permissionOverwrites: [{ id: guild.id, deny: [PermissionFlagsBits.Connect] }],
      });

      const onlineCh = await guild.channels.create({
        name: `🟢 Online: Calculating...`,
        type: ChannelType.GuildVoice,
        parent: category.id,
        permissionOverwrites: [{ id: guild.id, deny: [PermissionFlagsBits.Connect] }],
      });

      const boostCh = await guild.channels.create({
        name: `🚀 Boosts: ${guild.premiumSubscriptionCount || 0}`,
        type: ChannelType.GuildVoice,
        parent: category.id,
        permissionOverwrites: [{ id: guild.id, deny: [PermissionFlagsBits.Connect] }],
      });

      // Save IDs to bot_settings
      await supabase.from('bot_settings').upsert([
        { guild_id: guild.id, key: 'STATS_COUNTERS_ENABLED', value: 'true' },
        { guild_id: guild.id, key: 'STATS_TOTAL_CHANNEL_ID', value: totalCh.id },
        { guild_id: guild.id, key: 'STATS_ONLINE_CHANNEL_ID', value: onlineCh.id },
        { guild_id: guild.id, key: 'STATS_BOOSTS_CHANNEL_ID', value: boostCh.id },
      ], { onConflict: 'guild_id,key' });

      // Immediate refresh
      await updateServerStats(guild);

      await interaction.editReply({ content: '✅ Live server stats counter channels created and configured!' });
    } catch (err) {
      console.error('[Stats Setup] Error:', err);
      await interaction.editReply({ content: '❌ Failed to create stats channels. Check bot permissions.' });
    }
  },
};
