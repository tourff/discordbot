// src/modules/tourneyUI.js
'use strict';

const { EmbedBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const supabase = require('../config/supabase');

/**
 * Handles all button clicks related to the Tournament Manager.
 */
async function handleTourneyButtons(interaction) {
  const customId = interaction.customId;

  // 1. Single-slot Approve / Deny buttons
  if (customId.startsWith('tourney_approve_') || customId.startsWith('tourney_deny_')) {
    const parts = customId.split('_');
    const action = parts[1]; // 'approve' or 'deny'
    const slotId = parts[2];

    const { data: slot } = await supabase.from('tourney_slots').select('*').eq('id', slotId).single();
    if (!slot) return interaction.reply({ content: '❌ Registration not found.', ephemeral: true });

    if (slot.status !== 'pending') {
      return interaction.reply({ content: '⚠️ This registration was already processed.', ephemeral: true });
    }

    if (action === 'approve') {
      // Calculate next available slot number
      const { data: tourney } = await supabase.from('tourneys').select('*').eq('id', slot.tourney_id).single();
      const { data: existingSlots } = await supabase.from('tourney_slots').select('slot_num').eq('tourney_id', tourney.id).neq('slot_num', null);

      const assignedNums = existingSlots ? existingSlots.map(s => s.slot_num) : [];
      let nextSlot = 1;
      while (assignedNums.includes(nextSlot)) nextSlot++;

      await supabase.from('tourney_slots').update({ status: 'approved', slot_num: nextSlot }).eq('id', slotId);

      // Assign tournament role if configured
      if (tourney && tourney.role_id) {
        const guild = interaction.guild;
        const role = guild.roles.cache.get(tourney.role_id);
        if (role) {
          const member = guild.members.cache.get(slot.user_id) || await guild.members.fetch(slot.user_id).catch(() => null);
          if (member && member.manageable) {
            await member.roles.add(role, 'Tournament Registration Approved').catch(() => null);
          }
        }
      }

      await interaction.update({ content: `✅ Approved by ${interaction.user}. Assigned Slot **#${nextSlot}** for **${slot.team_name}**`, components: [] });
    } else {
      await supabase.from('tourney_slots').update({ status: 'denied' }).eq('id', slotId);
      await interaction.update({ content: `❌ Denied by ${interaction.user} for **${slot.team_name}**.`, components: [] });
    }
    return;
  }

  // 2. Create Tournament
  if (customId === 'tourney_create') {
    const modal = new ModalBuilder()
      .setCustomId('tourney_create_modal')
      .setTitle('Create New Tournament');

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('tourney_name').setLabel('Tournament Name').setStyle(TextInputStyle.Short).setPlaceholder('e.g. Summer Esports Cup').setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('total_slots').setLabel('Total Slots (e.g. 64)').setStyle(TextInputStyle.Short).setValue('64').setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('req_mentions').setLabel('Required Teammate Mentions (e.g. 4)').setStyle(TextInputStyle.Short).setValue('4').setRequired(true)
      )
    );

    await interaction.showModal(modal);
    return;
  }

  // 3. Edit Settings
  if (customId === 'tourney_edit') {
    const { data: tourneys } = await supabase.from('tourneys').select('*').eq('guild_id', interaction.guild.id);
    if (!tourneys || tourneys.length === 0) {
      return interaction.reply({ content: '❌ No tournaments found for this server.', ephemeral: true });
    }

    const options = tourneys.map(t => ({
      label: t.name,
      description: `Edit channels and role for ${t.name}`,
      value: `edit_${t.id}`
    }));

    const select = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('tourney_select_edit')
        .setPlaceholder('Select a tournament to edit')
        .addOptions(options)
    );

    await interaction.reply({ content: '🏆 **Select a tournament to edit settings:**', components: [select], ephemeral: true });
    return;
  }

  // 4. Open / Close Registration
  if (customId === 'tourney_toggle_reg') {
    const { data: tourneys } = await supabase.from('tourneys').select('*').eq('guild_id', interaction.guild.id);
    if (!tourneys || tourneys.length === 0) {
      return interaction.reply({ content: '❌ No tournaments found for this server.', ephemeral: true });
    }

    const options = tourneys.map(t => ({
      label: t.name,
      description: `Status: ${t.is_open ? '🔓 Open' : '🔒 Closed'}`,
      value: `toggle_${t.id}`
    }));

    const select = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('tourney_select_toggle')
        .setPlaceholder('Select a tournament to toggle registration')
        .addOptions(options)
    );

    await interaction.reply({ content: '🏆 **Select a tournament to toggle registration state:**', components: [select], ephemeral: true });
    return;
  }

  // 5. Pending Confirmations
  if (customId === 'tourney_confirm') {
    const { data: tourneys } = await supabase.from('tourneys').select('*').eq('guild_id', interaction.guild.id);
    if (!tourneys || tourneys.length === 0) {
      return interaction.reply({ content: '❌ No tournaments found for this server.', ephemeral: true });
    }

    const options = tourneys.map(t => ({
      label: t.name,
      description: `View pending registration applications`,
      value: `confirm_${t.id}`
    }));

    const select = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('tourney_select_confirm')
        .setPlaceholder('Select a tournament to view pending applications')
        .addOptions(options)
    );

    await interaction.reply({ content: '📋 **Select a tournament to manage pending applications:**', components: [select], ephemeral: true });
    return;
  }

  // 6. Manage Groups
  if (customId === 'tourney_groups') {
    const { data: tourneys } = await supabase.from('tourneys').select('*').eq('guild_id', interaction.guild.id);
    if (!tourneys || tourneys.length === 0) {
      return interaction.reply({ content: '❌ No tournaments found for this server.', ephemeral: true });
    }

    const options = tourneys.map(t => ({
      label: t.name,
      description: `Assign groups or generate tournament group lists`,
      value: `groups_${t.id}`
    }));

    const select = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('tourney_select_groups')
        .setPlaceholder('Select a tournament to manage groups')
        .addOptions(options)
    );

    await interaction.reply({ content: '📊 **Select a tournament to manage groups/brackets:**', components: [select], ephemeral: true });
    return;
  }
}

/**
 * Handles modal submissions for tournament creation and edits.
 */
async function handleTourneyModals(interaction) {
  if (interaction.customId === 'tourney_create_modal') {
    const name = interaction.fields.getTextInputValue('tourney_name');
    const slots = parseInt(interaction.fields.getTextInputValue('total_slots')) || 64;
    const mentions = parseInt(interaction.fields.getTextInputValue('req_mentions')) || 4;

    const { data: tourney, error } = await supabase.from('tourneys').insert({
      guild_id: interaction.guild.id,
      name: name,
      total_slots: slots,
      required_mentions: mentions,
      enabled: true,
      is_open: false,
      no_duplicate_name: true,
      multiregister: false,
      autodelete_rejects: true
    }).select().single();

    if (error) {
      console.error('[tourney create]', error);
      return interaction.reply({ content: '❌ Failed to create tournament.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(0xFF00FF)
      .setTitle(`🏆 Tournament Created: ${name}`)
      .setDescription(`Tournament created successfully!\n\n**Next Steps:**\nUse the **Edit Settings** button on the \`/tourney\` menu to set the Registration Channel, Slotlist Channel, Confirmation Channel, and Success Role for this tournament.`);

    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  if (interaction.customId.startsWith('tourney_edit_modal_')) {
    const tourneyId = interaction.customId.replace('tourney_edit_modal_', '');

    const regChan = interaction.fields.getTextInputValue('reg_chan') || null;
    const slotChan = interaction.fields.getTextInputValue('slot_chan') || null;
    const confirmChan = interaction.fields.getTextInputValue('confirm_chan') || null;
    const roleId = interaction.fields.getTextInputValue('role_id') || null;

    const updates = {};
    if (regChan !== null) updates.registration_channel_id = regChan.trim() || null;
    if (slotChan !== null) updates.slotlist_channel_id = slotChan.trim() || null;
    if (confirmChan !== null) updates.confirm_channel_id = confirmChan.trim() || null;
    if (roleId !== null) updates.role_id = roleId.trim() || null;

    if (Object.keys(updates).length > 0) {
      await supabase.from('tourneys').update(updates).eq('id', tourneyId);
    }

    await interaction.reply({ content: '✅ Tournament settings updated successfully!', ephemeral: true });
    return;
  }
}

/**
 * Handles select menu choices for editing, toggling registration, pending confirmations, and group management.
 */
async function handleTourneySelect(interaction) {
  const selected = interaction.values[0];

  // A. Select Edit Tournament
  if (interaction.customId === 'tourney_select_edit') {
    const tourneyId = selected.replace('edit_', '');
    const { data: tourney } = await supabase.from('tourneys').select('*').eq('id', tourneyId).single();

    const modal = new ModalBuilder()
      .setCustomId(`tourney_edit_modal_${tourneyId}`)
      .setTitle(`Edit Tournament: ${(tourney?.name || '').substring(0, 20)}`);

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('reg_chan').setLabel('Registration Channel ID').setStyle(TextInputStyle.Short).setValue(tourney?.registration_channel_id || '').setRequired(false)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('slot_chan').setLabel('Slotlist Channel ID').setStyle(TextInputStyle.Short).setValue(tourney?.slotlist_channel_id || '').setRequired(false)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('confirm_chan').setLabel('Confirmation Channel ID').setStyle(TextInputStyle.Short).setValue(tourney?.confirm_channel_id || '').setRequired(false)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('role_id').setLabel('Success Role ID').setStyle(TextInputStyle.Short).setValue(tourney?.role_id || '').setRequired(false)
      )
    );

    await interaction.showModal(modal);
    return;
  }

  // B. Select Toggle Registration State
  if (interaction.customId === 'tourney_select_toggle') {
    const tourneyId = selected.replace('toggle_', '');
    const { data: tourney } = await supabase.from('tourneys').select('*').eq('id', tourneyId).single();
    if (!tourney) return interaction.reply({ content: '❌ Tournament not found.', ephemeral: true });

    const newOpen = !tourney.is_open;
    await supabase.from('tourneys').update({ is_open: newOpen }).eq('id', tourneyId);

    if (tourney.registration_channel_id) {
      const regChannel = interaction.guild.channels.cache.get(tourney.registration_channel_id);
      if (regChannel) {
        if (newOpen) {
          await regChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true }).catch(() => null);
          const embed = new EmbedBuilder()
            .setColor(0x00FFB3)
            .setTitle(`🏆 Tournament Registration OPEN`)
            .setDescription(`Registration for **${tourney.name}** is now **OPEN**!\n\nMention at least **${tourney.required_mentions || 4}** teammates to register your team.`);
          await regChannel.send({ embeds: [embed] }).catch(() => null);
        } else {
          await regChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false }).catch(() => null);
          const embed = new EmbedBuilder()
            .setColor(0xFF0055)
            .setTitle(`🔒 Tournament Registration CLOSED`)
            .setDescription(`Registration for **${tourney.name}** is now **CLOSED**.`);
          await regChannel.send({ embeds: [embed] }).catch(() => null);
        }
      }
    }

    await interaction.reply({ content: `✅ Registration status for **${tourney.name}** is now **${newOpen ? 'OPEN' : 'CLOSED'}**.`, ephemeral: true });
    return;
  }

  // C. Select Pending Confirmations
  if (interaction.customId === 'tourney_select_confirm') {
    const tourneyId = selected.replace('confirm_', '');
    const { data: tourney } = await supabase.from('tourneys').select('*').eq('id', tourneyId).single();
    const { data: pendingSlots } = await supabase.from('tourney_slots').select('*').eq('tourney_id', tourneyId).eq('status', 'pending');

    if (!pendingSlots || pendingSlots.length === 0) {
      return interaction.reply({ content: `✅ There are no pending applications for **${tourney?.name}**.`, ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(0xFFA500)
      .setTitle(`📋 Pending Applications for ${tourney?.name}`)
      .setDescription(pendingSlots.map((s, i) => `\`${i + 1}.\` **${s.team_name}** | Leader: <@${s.user_id}> | [Message Link](${s.jump_url || '#'})`).join('\n'))
      .setFooter({ text: `Total Pending: ${pendingSlots.length}` });

    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  // D. Select Manage Groups
  if (interaction.customId === 'tourney_select_groups') {
    const tourneyId = selected.replace('groups_', '');
    const { data: tourney } = await supabase.from('tourneys').select('*').eq('id', tourneyId).single();
    const { data: approvedSlots } = await supabase.from('tourney_slots').select('*').eq('tourney_id', tourneyId).eq('status', 'approved').order('slot_num', { ascending: true });

    if (!approvedSlots || approvedSlots.length === 0) {
      return interaction.reply({ content: `❌ No approved teams yet for **${tourney?.name}**.`, ephemeral: true });
    }

    // Auto-divide into groups of 16
    const teamsPerGroup = 16;
    const totalGroups = Math.ceil(approvedSlots.length / teamsPerGroup);
    const groups = {};

    approvedSlots.forEach((slot, index) => {
      const groupLetter = String.fromCharCode(65 + Math.floor(index / teamsPerGroup)); // A, B, C...
      if (!groups[groupLetter]) groups[groupLetter] = [];
      groups[groupLetter].push(slot);
    });

    const embed = new EmbedBuilder()
      .setColor(0x00E5FF)
      .setTitle(`📊 Group Standings / Brackets - ${tourney?.name}`)
      .setFooter({ text: `Total Approved Teams: ${approvedSlots.length} | Groups: ${totalGroups}` });

    let desc = '';
    for (const [grp, teams] of Object.entries(groups)) {
      desc += `\n**Group ${grp}:**\n` + teams.map(t => `\`Slot #${t.slot_num}\` - **${t.team_name}** (<@${t.user_id}>)`).join('\n') + '\n';
    }
    embed.setDescription(desc || 'No groups formed.');

    // If slotlist channel is configured, publish roster there
    if (tourney?.slotlist_channel_id) {
      const slotChannel = interaction.guild.channels.cache.get(tourney.slotlist_channel_id);
      if (slotChannel) {
        await slotChannel.send({ embeds: [embed] }).catch(() => null);
        return interaction.reply({ content: `✅ Generated and posted tournament groups to <#${tourney.slotlist_channel_id}>!`, ephemeral: true });
      }
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }
}

module.exports = {
  handleTourneyButtons,
  handleTourneyModals,
  handleTourneySelect
};
