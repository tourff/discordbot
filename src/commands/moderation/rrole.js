// src/commands/moderation/rrole.js
// Remove role from member(s) or all members
'use strict';

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  category: 'moderation',
  data: new SlashCommandBuilder()
    .setName('rrole')
    .setDescription('Remove a role from one or multiple members.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addRoleOption(o => o.setName('role').setDescription('Role to remove').setRequired(true))
    .addUserOption(o => o.setName('user1').setDescription('Member to remove role from'))
    .addUserOption(o => o.setName('user2').setDescription('Member to remove role from'))
    .addUserOption(o => o.setName('user3').setDescription('Member to remove role from'))
    .addUserOption(o => o.setName('user4').setDescription('Member to remove role from'))
    .addUserOption(o => o.setName('user5').setDescription('Member to remove role from')),

  async execute(interaction) {
    const role = interaction.options.getRole('role');

    if (role.managed) {
      return interaction.reply({ content: '❌ That role is managed by an integration.', ephemeral: true });
    }
    if (role.position >= interaction.guild.members.me.roles.highest.position) {
      return interaction.reply({ content: '❌ That role is above my highest role.', ephemeral: true });
    }

    // Collect specified users
    const specifiedUsers = [];
    for (let i = 1; i <= 5; i++) {
      const u = interaction.options.getUser(`user${i}`);
      if (u) specifiedUsers.push(u);
    }

    await interaction.deferReply();

    let targets = [];
    const reason = `Mass role remove by ${interaction.user.tag}`;

    if (specifiedUsers.length > 0) {
      // Remove from specified users only
      for (const user of specifiedUsers) {
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (member && member.roles.cache.has(role.id)) {
          targets.push(member);
        }
      }
    } else {
      // Remove from ALL members who have this role
      await interaction.guild.members.fetch();
      targets = [...interaction.guild.members.cache.values()].filter(m => m.roles.cache.has(role.id));
    }

    if (targets.length === 0) {
      return interaction.editReply({ content: `❌ No members with ${role} found.` });
    }

    let success = 0, failed = 0;

    for (const member of targets) {
      try {
        await member.roles.remove(role, reason);
        success++;
        if (success % 5 === 0) await new Promise(r => setTimeout(r, 500));
      } catch {
        failed++;
      }
    }

    const embed = new EmbedBuilder()
      .setColor(0xff8800)
      .setTitle('✅ Role Removed')
      .addFields(
        { name: 'Role', value: `${role}`, inline: true },
        { name: 'Success', value: `${success}`, inline: true },
        { name: 'Failed', value: `${failed}`, inline: true },
        { name: 'Removed by', value: `${interaction.user}`, inline: true },
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
