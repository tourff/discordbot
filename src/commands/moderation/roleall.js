// src/commands/moderation/roleall.js
// Mass role assignment — add/remove role from all members, humans, or bots
'use strict';

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  category: 'moderation',
  data: new SlashCommandBuilder()
    .setName('roleall')
    .setDescription('Add a role to multiple members at once.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(sub =>
      sub.setName('all')
        .setDescription('Add a role to ALL members (humans + bots).')
        .addRoleOption(o => o.setName('role').setDescription('Role to add').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('humans')
        .setDescription('Add a role to all human members only.')
        .addRoleOption(o => o.setName('role').setDescription('Role to add').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('bots')
        .setDescription('Add a role to all bot members only.')
        .addRoleOption(o => o.setName('role').setDescription('Role to add').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const role = interaction.options.getRole('role');

    // Safety checks
    if (role.managed) {
      return interaction.reply({ content: '❌ That role is managed by an integration and cannot be assigned manually.', ephemeral: true });
    }
    if (role.position >= interaction.guild.members.me.roles.highest.position) {
      return interaction.reply({ content: '❌ That role is higher than or equal to my highest role. I cannot assign it.', ephemeral: true });
    }

    await interaction.deferReply();

    // Fetch all members
    await interaction.guild.members.fetch();

    let targets = [...interaction.guild.members.cache.values()];

    if (sub === 'humans') targets = targets.filter(m => !m.user.bot);
    else if (sub === 'bots') targets = targets.filter(m => m.user.bot);

    // Only members who don't already have the role
    targets = targets.filter(m => !m.roles.cache.has(role.id));

    if (targets.length === 0) {
      return interaction.editReply({ content: `✅ All matching members already have ${role}.` });
    }

    const progressEmbed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('⏳ Adding Role...')
      .setDescription(`Adding ${role} to **${targets.length}** member(s). This may take a while...`)
      .setTimestamp();

    await interaction.editReply({ embeds: [progressEmbed] });

    let success = 0, failed = 0;
    const reason = `Mass role add by ${interaction.user.tag}`;
    const successMemberIds = [];

    for (const member of targets) {
      try {
        await member.roles.add(role, reason);
        success++;
        successMemberIds.push(member.id);
        // Small delay to avoid rate limits
        if (success % 5 === 0) await new Promise(r => setTimeout(r, 500));
      } catch {
        failed++;
      }
    }

    const doneEmbed = new EmbedBuilder()
      .setColor(0x00ff88)
      .setTitle('✅ Role Added')
      .addFields(
        { name: 'Role', value: `${role}`, inline: true },
        { name: 'Target', value: sub.charAt(0).toUpperCase() + sub.slice(1), inline: true },
        { name: 'Success', value: `${success}`, inline: true },
        { name: 'Failed', value: `${failed}`, inline: true },
        { name: 'Added by', value: `${interaction.user}`, inline: true },
      )
      .setTimestamp();

    const components = [];
    if (success > 0) {
      const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
      const { saveTransaction } = require('../../modules/roleRevertCache');
      const txnId = `role_revert_${interaction.id}`;
      saveTransaction(txnId, role.id, successMemberIds, 'add');

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(txnId)
          .setLabel('Revert Action')
          .setStyle(ButtonStyle.Danger)
      );
      components.push(row);
    }

    await interaction.editReply({ embeds: [doneEmbed], components });
  },
};
