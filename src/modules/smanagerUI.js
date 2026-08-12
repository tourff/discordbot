// src/modules/smanagerUI.js
'use strict';

const { EmbedBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder } = require('discord.js');
const supabase = require('../config/supabase');

async function handleSManagerButtons(interaction) {
  const customId = interaction.customId;

  if (customId === 'smanager_create') {
    const modal = new ModalBuilder()
      .setCustomId('smanager_create_modal')
      .setTitle('Create New Scrim');

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('scrim_name').setLabel('Scrim Name').setStyle(TextInputStyle.Short).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('total_slots').setLabel('Total Slots (e.g. 20)').setStyle(TextInputStyle.Short).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('req_mentions').setLabel('Required Mentions (e.g. 4)').setStyle(TextInputStyle.Short).setRequired(true)
      )
    );

    await interaction.showModal(modal);
  } else if (customId === 'smanager_edit') {
    // Select a scrim to edit
    const { data: scrims } = await supabase.from('scrims').select('*').eq('guild_id', interaction.guild.id);
    const options = scrims.map(s => ({
      label: s.name,
      description: `Edit settings for ${s.name}`,
      value: `edit_${s.id}`
    }));

    const select = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('smanager_select_edit')
        .setPlaceholder('Select a scrim to edit')
        .addOptions(options)
    );

    await interaction.reply({ content: 'Select a scrim:', components: [select], ephemeral: true });
  } else if (customId === 'smanager_toggle_reg') {
    // Manually Open/Close Registration
    const { data: scrims } = await supabase.from('scrims').select('*').eq('guild_id', interaction.guild.id);
    const options = scrims.map(s => ({
      label: s.name,
      description: `Toggle reg for ${s.name} (Current: ${s.is_open ? 'Open' : 'Closed'})`,
      value: `toggle_${s.id}`
    }));

    const select = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('smanager_select_toggle')
        .setPlaceholder('Select a scrim to toggle registration')
        .addOptions(options)
    );

    await interaction.reply({ content: 'Select a scrim:', components: [select], ephemeral: true });
  }
}

async function handleSManagerModals(interaction) {
  if (interaction.customId === 'smanager_create_modal') {
    const name = interaction.fields.getTextInputValue('scrim_name');
    const slots = parseInt(interaction.fields.getTextInputValue('total_slots')) || 20;
    const mentions = parseInt(interaction.fields.getTextInputValue('req_mentions')) || 4;

    const { data: scrim, error } = await supabase.from('scrims').insert({
      guild_id: interaction.guild.id,
      name: name,
      total_slots: slots,
      required_mentions: mentions,
      enabled: true,
      is_open: false
    }).select().single();

    if (error) {
      console.error('[smanager create]', error);
      return interaction.reply({ content: '❌ Failed to create scrim.', ephemeral: true });
    }

    // Give instructions on how to configure channels
    const embed = new EmbedBuilder()
      .setColor(0x00FFB3)
      .setTitle(`✅ Scrim Created: ${name}`)
      .setDescription(`Scrim has been created successfully!\n\n**Next Steps:**\nUse the **Edit Settings** button on the \`/smanager\` menu to set the Registration Channel, Slotlist Channel, and Success Role for this scrim.`);

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}

async function handleSManagerSelect(interaction) {
  if (interaction.customId === 'smanager_select_toggle') {
    const scrimId = interaction.values[0].replace('toggle_', '');
    const { data: scrim } = await supabase.from('scrims').select('*').eq('id', scrimId).single();

    if (!scrim) return interaction.reply({ content: '❌ Scrim not found.', ephemeral: true });

    const newOpen = !scrim.is_open;
    await supabase.from('scrims').update({ is_open: newOpen }).eq('id', scrimId);

    if (newOpen) {
      // Clear old slots when opening
      await supabase.from('scrim_slots').delete().eq('scrim_id', scrimId);
      
      const channel = interaction.guild.channels.cache.get(scrim.registration_channel_id);
      if (channel) {
        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true });
        await channel.send('✅ **Registration is now OPEN!**').catch(() => null);
      }
      await interaction.reply({ content: `✅ Registration for **${scrim.name}** is now OPEN!`, ephemeral: true });
    } else {
      const { closeScrim } = require('./scrimsManager');
      await closeScrim(scrim, interaction.client);
      await interaction.reply({ content: `✅ Registration for **${scrim.name}** is now CLOSED!`, ephemeral: true });
    }
  } else if (interaction.customId === 'smanager_select_edit') {
    const scrimId = interaction.values[0].replace('edit_', '');
    // In a full implementation, this would show a new menu to edit Role, Channels, Times, etc.
    // For now, we will just show a modal to set the channels
    const modal = new ModalBuilder()
      .setCustomId(`smanager_edit_modal_${scrimId}`)
      .setTitle('Quick Edit Scrim Channels');

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('reg_chan').setLabel('Registration Channel ID').setStyle(TextInputStyle.Short).setRequired(false)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('slot_chan').setLabel('Slotlist Channel ID').setStyle(TextInputStyle.Short).setRequired(false)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('role_id').setLabel('Success Role ID').setStyle(TextInputStyle.Short).setRequired(false)
      )
    );

    await interaction.showModal(modal);
  }
}

async function handleSManagerEditModal(interaction) {
  if (interaction.customId.startsWith('smanager_edit_modal_')) {
    const scrimId = interaction.customId.replace('smanager_edit_modal_', '');
    
    const regChan = interaction.fields.getTextInputValue('reg_chan') || null;
    const slotChan = interaction.fields.getTextInputValue('slot_chan') || null;
    const roleId = interaction.fields.getTextInputValue('role_id') || null;

    const updates = {};
    if (regChan) updates.registration_channel_id = regChan;
    if (slotChan) updates.slotlist_channel_id = slotChan;
    if (roleId) updates.role_id = roleId;

    if (Object.keys(updates).length > 0) {
      await supabase.from('scrims').update(updates).eq('id', scrimId);
    }

    await interaction.reply({ content: `✅ Scrim settings updated!`, ephemeral: true });
  }
}

module.exports = {
  handleSManagerButtons,
  handleSManagerModals,
  handleSManagerSelect,
  handleSManagerEditModal
};
