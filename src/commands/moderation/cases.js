// src/commands/moderation/cases.js

'use strict';

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const supabase = require('../../config/supabase');

const ACTION_EMOJIS = {
  kick:   '👢',
  ban:    '🔨',
  mute:   '🔇',
  unmute: '🔊',
  warn:   '⚠️',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cases')
    .setDescription('View all moderation cases for a user.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(opt =>
      opt.setName('user').setDescription('The user to look up.').setRequired(true)
    ),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const targetUser = interaction.options.getUser('user');

    const { data: cases, error } = await supabase
      .from('mod_cases')
      .select('*')
      .eq('guild_id', interaction.guildId)
      .eq('user_id',  targetUser.id)
      .order('created_at', { ascending: false })
      .limit(25);

    if (error) {
      console.error('[cases] Supabase error:', error);
      return interaction.editReply({ content: '❌ Failed to fetch cases from the database.' });
    }

    if (!cases || cases.length === 0) {
      return interaction.editReply({
        content: `✅ No moderation cases found for **${targetUser.tag}**.`,
      });
    }

    // Build list of case entries
    const caseLines = cases.map(c => {
      const emoji     = ACTION_EMOJIS[c.action] ?? '📋';
      const timestamp = `<t:${Math.floor(new Date(c.created_at).getTime() / 1000)}:d>`;
      return `**#${c.id}** ${emoji} \`${c.action.toUpperCase()}\` — ${timestamp}\n> ${c.reason}`;
    });

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`📋 Mod Cases — ${targetUser.tag}`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .setDescription(caseLines.join('\n\n').slice(0, 4096))
      .setFooter({ text: `${cases.length} case(s) shown • User ID: ${targetUser.id}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
