// src/events/interactionCreate.js
// ─────────────────────────────────────────────────────────────────────────────
// Handles ALL incoming interactions:
//   • Slash commands  → dispatch to client.commands
//   • Button clicks   → dispatch to the buttonRoles handler
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { handleButtonRole } = require('../modules/buttonRoles');
const { hasPermission } = require('../modules/permissions');

module.exports = {
  name: 'interactionCreate',

  /**
   * @param {import('discord.js').Interaction} interaction
   * @param {import('discord.js').Client}       client
   */
  async execute(interaction, client) {

    // ── Slash commands ──────────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        const canUse = await hasPermission(interaction.member);
        if (!canUse) {
          return interaction.reply({ content: '🚫 You do not have permission to use this bot.', ephemeral: true });
        }
        
        await command.execute(interaction, client);
      } catch (err) {
        console.error(`[interactionCreate] Error executing /${interaction.commandName}:`, err);
        const msg = { content: '❌ An error occurred while running this command.', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(msg).catch(() => null);
        } else {
          await interaction.reply(msg).catch(() => null);
        }
      }
    }

    // ── Autocomplete ────────────────────────────────────────────────────────
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (!command || !command.autocomplete) return;

      try {
        await command.autocomplete(interaction, client);
      } catch (err) {
        console.error(`[interactionCreate] Error executing autocomplete for /${interaction.commandName}:`, err);
      }
    }

    // ── Button interactions ─────────────────────────────────────────────────
    if (interaction.isButton()) {
      if (interaction.customId === 'ticket_create') {
        const { handleTicketCreate } = require('../modules/ticketManager');
        return await handleTicketCreate(interaction).catch(console.error);
      } else if (interaction.customId === 'ticket_close') {
        const { handleTicketClose } = require('../modules/ticketManager');
        return await handleTicketClose(interaction).catch(console.error);
      } else if (interaction.customId === 'ticket_delete') {
        const { handleTicketDelete } = require('../modules/ticketManager');
        return await handleTicketDelete(interaction).catch(console.error);
      } else if (interaction.customId === 'giveaway_enter') {
        const { handleGiveawayJoin } = require('../modules/giveawayManager');
        return await handleGiveawayJoin(interaction).catch(console.error);
      } else if (interaction.customId === 'captcha_verify') {
        const { getSetting } = require('../modules/autoMod');
        const roleId = await getSetting(interaction.guild.id, 'CAPTCHA_VERIFIED_ROLE_ID');
        if (roleId && interaction.guild.roles.cache.has(roleId)) {
          await interaction.member.roles.add(roleId).catch(console.error);
          return await interaction.reply({ content: '✅ Verification successful! Welcome to the server!', ephemeral: true });
        } else {
          return await interaction.reply({ content: '⚠️ Verified role has not been configured by server administrators yet.', ephemeral: true });
        }
      } else if (interaction.customId.startsWith('role_')) {
        await handleButtonRole(interaction).catch(console.error);
      } else if (interaction.customId === 'welcome_msg_btn') {
        const { getWelcomeMessage } = require('../modules/settings');
        const currentMessage = await getWelcomeMessage(interaction.guild.id);
        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
        const modal = new ModalBuilder().setCustomId('welcome_message_modal').setTitle('Setup Welcome Message');
        const messageInput = new TextInputBuilder().setCustomId('welcome_message_input').setLabel('Welcome Message').setPlaceholder('Use {user} and {server}').setValue(currentMessage || `Hey {user}, glad you joined us!\n\n📋 Please read the rules before chatting.\n🎭 Head over to the roles channel to grab your roles.`).setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(2000);
        modal.addComponents(new ActionRowBuilder().addComponents(messageInput));
        await interaction.showModal(modal);
      } else if (interaction.customId === 'goodbye_msg_btn') {
        const { getGoodbyeMessage } = require('../modules/settings');
        const currentMessage = await getGoodbyeMessage(interaction.guild.id);
        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
        const modal = new ModalBuilder().setCustomId('goodbye_message_modal').setTitle('Setup Goodbye Message');
        const messageInput = new TextInputBuilder().setCustomId('goodbye_message_input').setLabel('Goodbye Message').setPlaceholder('Use {user} and {server}').setValue(currentMessage || `{user} left the server.`).setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(2000);
        modal.addComponents(new ActionRowBuilder().addComponents(messageInput));
        await interaction.showModal(modal);
      } else if (interaction.customId === 'welcome_disable_btn') {
        const { deleteSetting } = require('../modules/settings');
        await deleteSetting(interaction.guild.id, 'WELCOME_CHANNEL_ID');
        await deleteSetting(interaction.guild.id, 'WELCOME_MESSAGE');
        await interaction.reply({ content: '✅ Welcome system has been completely disabled.', ephemeral: true });
      } else if (interaction.customId === 'goodbye_disable_btn') {
        const { deleteSetting } = require('../modules/settings');
        await deleteSetting(interaction.guild.id, 'GOODBYE_CHANNEL_ID');
        await deleteSetting(interaction.guild.id, 'GOODBYE_MESSAGE');
        await interaction.reply({ content: '✅ Goodbye system has been completely disabled.', ephemeral: true });
      } else if (interaction.customId.startsWith('social_menu_')) {
        const platform = interaction.customId.split('_')[2];
        const { getSubDashboard } = require('../commands/utility/setupsocial');
        const subDash = await getSubDashboard(interaction.guild.id, platform);
        await interaction.update(subDash);
      } else if (interaction.customId === 'social_back') {
        const { getMainDashboard } = require('../commands/utility/setupsocial');
        await interaction.update(getMainDashboard());
      } else if (interaction.customId.startsWith('social_urlbtn_')) {
        const platform = interaction.customId.split('_')[2];
        const { getSocialPlatformConfig } = require('../modules/settings');
        const config = await getSocialPlatformConfig(interaction.guild.id, platform);
        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
        const modal = new ModalBuilder().setCustomId(`social_urlmodal_${platform}`).setTitle(`Set ${platform} RSS Link`);
        const urlInput = new TextInputBuilder().setCustomId('social_url_input').setLabel('RSS / Profile URL').setPlaceholder('Enter the full URL').setValue(config.url || '').setStyle(TextInputStyle.Short).setRequired(true);
        modal.addComponents(new ActionRowBuilder().addComponents(urlInput));
        await interaction.showModal(modal);
      } else if (interaction.customId.startsWith('social_msgbtn_')) {
        const platform = interaction.customId.split('_')[2];
        const { getSocialPlatformConfig } = require('../modules/settings');
        const config = await getSocialPlatformConfig(interaction.guild.id, platform);
        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
        const modal = new ModalBuilder().setCustomId(`social_msgmodal_${platform}`).setTitle(`Set ${platform} Message`);
        const messageInput = new TextInputBuilder().setCustomId('social_msg_input').setLabel('Custom Message').setPlaceholder('Message to send with the post').setValue(config.message || '').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(2000);
        modal.addComponents(new ActionRowBuilder().addComponents(messageInput));
        await interaction.showModal(modal);
      } else if (interaction.customId.startsWith('social_disable_')) {
        const platform = interaction.customId.split('_')[2];
        const { deleteSetting } = require('../modules/settings');
        await deleteSetting(interaction.guild.id, `${platform}_URL`);
        await deleteSetting(interaction.guild.id, `${platform}_CHANNEL_ID`);
        await deleteSetting(interaction.guild.id, `${platform}_MESSAGE`);
        const { getSubDashboard } = require('../commands/utility/setupsocial');
        const subDash = await getSubDashboard(interaction.guild.id, platform);
        await interaction.update(subDash);
      } else if (interaction.customId.startsWith('music_')) {
        const queue = client.distube.getQueue(interaction);
        if (!queue) return interaction.reply({ content: '❌ There is no music playing right now!', ephemeral: true });

        const memberVoice = interaction.member.voice.channel;
        if (!memberVoice || memberVoice.id !== queue.voice.channel.id) {
          return interaction.reply({ content: '❌ You must be in the same voice channel to use these buttons!', ephemeral: true });
        }

        switch (interaction.customId) {
          case 'music_pause':
            if (queue.paused) {
              queue.resume();
              await interaction.reply({ content: '▶️ Music resumed.', ephemeral: true });
            } else {
              queue.pause();
              await interaction.reply({ content: '⏸️ Music paused.', ephemeral: true });
            }
            break;
          case 'music_skip':
            if (queue.songs.length === 1 && !queue.autoplay) {
              queue.stop();
              await interaction.reply({ content: '⏭️ Skipped! Queue is now empty.', ephemeral: true });
            } else {
              await queue.skip();
              await interaction.reply({ content: '⏭️ Skipped to the next song.', ephemeral: true });
            }
            break;
          case 'music_stop':
            queue.stop();
            await interaction.reply({ content: '⏹️ Music stopped.', ephemeral: true });
            break;
          case 'music_loop':
            const mode = queue.repeatMode;
            // Modes: 0 = disabled, 1 = repeat song, 2 = repeat queue
            const nextMode = mode === 0 ? 1 : (mode === 1 ? 2 : 0);
            queue.setRepeatMode(nextMode);
            const modeName = nextMode === 0 ? 'Off' : (nextMode === 1 ? 'Song' : 'Queue');
            await interaction.reply({ content: `🔁 Loop mode set to: **${modeName}**`, ephemeral: true });
            break;
          case 'music_rewind':
            const newTimeBack = Math.max(0, queue.currentTime - 15);
            queue.seek(newTimeBack);
            await interaction.reply({ content: `⏪ Rewound 15 seconds.`, ephemeral: true });
            break;
          case 'music_forward':
            const newTimeFwd = queue.currentTime + 15;
            queue.seek(newTimeFwd);
            await interaction.reply({ content: `⏩ Skipped forward 15 seconds.`, ephemeral: true });
            break;
        }
      } else if (interaction.customId.startsWith('smanager_')) {
        const { handleSManagerButtons } = require('../modules/smanagerUI');
        await handleSManagerButtons(interaction).catch(console.error);
      } else if (interaction.customId.startsWith('tourney_')) {
        const { handleTourneyButtons } = require('../modules/tourneyUI');
        await handleTourneyButtons(interaction).catch(console.error);
      } else if (interaction.customId.startsWith('role_revert_')) {
        const { getTransaction, deleteTransaction } = require('../modules/roleRevertCache');
        const { PermissionFlagsBits } = require('discord.js');
        
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
          return interaction.reply({ content: '❌ You must have **Manage Roles** permission to revert this action.', ephemeral: true });
        }

        const txnId = interaction.customId;
        const txn = getTransaction(txnId);
        if (!txn) {
          return interaction.reply({ content: '❌ This transaction has expired or cannot be found.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const { roleId, memberIds, actionType } = txn;
        const role = interaction.guild.roles.cache.get(roleId);
        if (!role) {
          return interaction.editReply({ content: '❌ The role associated with this action no longer exists.' });
        }

        let success = 0, failed = 0;
        const reason = `Role action reverted by ${interaction.user.tag}`;

        for (const mId of memberIds) {
          const member = await interaction.guild.members.fetch(mId).catch(() => null);
          if (member) {
            try {
              if (actionType === 'add') {
                await member.roles.remove(role, reason);
              } else {
                await member.roles.add(role, reason);
              }
              success++;
            } catch {
              failed++;
            }
          }
        }

        deleteTransaction(txnId);

        const originalMessage = interaction.message;
        if (originalMessage) {
          await originalMessage.edit({ components: [] }).catch(() => null);
        }

        await interaction.editReply({
          content: `✅ Successfully reverted role action. Undid changes for **${success}** members (${failed} failed).`
        });
      } else if (interaction.customId.startsWith('ss_approve_')) {
        const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
          return interaction.reply({ content: '❌ You must have **Manage Roles** permission to verify screenshots.', ephemeral: true });
        }

        const targetUserId = interaction.customId.replace('ss_approve_', '');
        const targetMember = await interaction.guild.members.fetch(targetUserId).catch(() => null);

        if (!targetMember) {
          return interaction.reply({ content: '❌ The user who submitted this screenshot is no longer in this server.', ephemeral: true });
        }

        const { getSetting } = require('../modules/settings');
        const roleId = await getSetting(interaction.guild.id, 'SS_VERIFY_ROLE');
        const role = roleId ? interaction.guild.roles.cache.get(roleId) : null;

        if (!role) {
          return interaction.reply({ content: '❌ Screenshot verification role is not configured or not found in server settings. Set it up using `/ssverify setup`.', ephemeral: true });
        }

        await interaction.deferUpdate();

        try {
          await targetMember.roles.add(role, `Screenshot approved by ${interaction.user.tag}`);
          
          await targetMember.send({
            content: `✅ Your screenshot submission in **${interaction.guild.name}** was **approved** by staff! You have been assigned the **${role.name}** role.`
          }).catch(() => null);

          const oldEmbed = interaction.message.embeds[0];
          const newEmbed = EmbedBuilder.from(oldEmbed)
            .setColor(0x00ff88)
            .setTitle('📸 Screenshot Approved')
            .addFields(
              { name: 'Status', value: `✅ Approved by ${interaction.user}`, inline: true }
            );

          await interaction.message.edit({ embeds: [newEmbed], components: [] });
        } catch (err) {
          console.error(err);
          await interaction.followUp({ content: `❌ Failed to approve: ${err.message}`, ephemeral: true });
        }
      } else if (interaction.customId.startsWith('ss_reject_')) {
        const { PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
          return interaction.reply({ content: '❌ You must have **Manage Roles** permission to reject screenshots.', ephemeral: true });
        }

        const targetUserId = interaction.customId.replace('ss_reject_', '');

        const modal = new ModalBuilder()
          .setCustomId(`ss_reject_modal_${targetUserId}`)
          .setTitle('Reject Screenshot');

        const reasonInput = new TextInputBuilder()
          .setCustomId('ss_reject_reason')
          .setLabel('Rejection Reason')
          .setPlaceholder('Enter reason (e.g. invalid logo, crop, blurry image)')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(500);

        modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
        await interaction.showModal(modal);
      }
    }

    // ── Select Menu interactions ────────────────────────────────────────────
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'help_category_select') {
        const category = interaction.values[0].replace('help_', '');
        const { commands } = client;
        
        const categoryCommands = [];
        commands.forEach(cmd => {
          const cat = (cmd.category || 'General').toLowerCase();
          if (cat === category) {
            categoryCommands.push(`\`/${cmd.data.name}\` - ${cmd.data.description}`);
          }
        });

        const { EmbedBuilder } = require('discord.js');
        let emoji = '📌';
        if (category === 'esports') emoji = '🎮';
        if (category === 'moderation') emoji = '🛡️';
        if (category === 'music') emoji = '🎵';
        if (category === 'utility') emoji = '🛠️';

        const embed = new EmbedBuilder()
          .setColor('#00E5FF')
          .setTitle(`${emoji} ${category.charAt(0).toUpperCase() + category.slice(1)} Commands`)
          .setDescription(categoryCommands.join('\n') || 'No commands found in this category.')
          .setFooter({ 
            text: `Requested by ${interaction.user.tag}`, 
            iconURL: interaction.user.displayAvatarURL() 
          })
          .setTimestamp();
        
        await interaction.update({ embeds: [embed] });
        return;
      } else if (interaction.customId.startsWith('smanager_select_')) {
        const { handleSManagerSelect } = require('../modules/smanagerUI');
        await handleSManagerSelect(interaction).catch(console.error);
        return;
      } else if (interaction.customId.startsWith('tourney_select_')) {
        const { handleTourneySelect } = require('../modules/tourneyUI');
        await handleTourneySelect(interaction).catch(console.error);
        return;
      }
    }

    if (interaction.isChannelSelectMenu()) {
      if (interaction.customId === 'welcome_channel_select') {
        const channelId = interaction.values[0];
        const { setSetting } = require('../modules/settings');
        await setSetting(interaction.guild.id, 'WELCOME_CHANNEL_ID', channelId);
        await interaction.reply({ content: `✅ Welcome channel has been set to <#${channelId}>.`, ephemeral: true });
      } else if (interaction.customId === 'goodbye_channel_select') {
        const channelId = interaction.values[0];
        const { setSetting } = require('../modules/settings');
        await setSetting(interaction.guild.id, 'GOODBYE_CHANNEL_ID', channelId);
        await interaction.reply({ content: `✅ Goodbye channel has been set to <#${channelId}>.`, ephemeral: true });
      } else if (interaction.customId.startsWith('social_channel_')) {
        const platform = interaction.customId.split('_')[2];
        const channelId = interaction.values[0];
        const { setSetting } = require('../modules/settings');
        await setSetting(interaction.guild.id, `${platform}_CHANNEL_ID`, channelId);
        const { getSubDashboard } = require('../commands/utility/setupsocial');
        const subDash = await getSubDashboard(interaction.guild.id, platform);
        await interaction.update(subDash);
      }
    }

    // ── Modal Submits ───────────────────────────────────────────────────────
    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'welcome_message_modal') {
        const newMessage = interaction.fields.getTextInputValue('welcome_message_input');
        const { setSetting } = require('../modules/settings');
        const success = await setSetting(interaction.guild.id, 'WELCOME_MESSAGE', newMessage);
        if (success) {
          await interaction.reply({ content: '✅ Custom welcome message updated successfully!', ephemeral: true });
        } else {
          await interaction.reply({ content: '❌ Failed to update welcome message in database.', ephemeral: true });
        }
      } else if (interaction.customId === 'goodbye_message_modal') {
        const newMessage = interaction.fields.getTextInputValue('goodbye_message_input');
        const { setSetting } = require('../modules/settings');
        const success = await setSetting(interaction.guild.id, 'GOODBYE_MESSAGE', newMessage);
        if (success) {
          await interaction.reply({ content: '✅ Custom goodbye message updated successfully!', ephemeral: true });
        } else {
          await interaction.reply({ content: '❌ Failed to update goodbye message in database.', ephemeral: true });
        }
      } else if (interaction.customId.startsWith('social_urlmodal_')) {
        // customId format: social_urlmodal_PLATFORM (e.g. social_urlmodal_YOUTUBE)
        const platform = interaction.customId.replace('social_urlmodal_', '');
        const newUrl = interaction.fields.getTextInputValue('social_url_input').trim();
        const { setSetting } = require('../modules/settings');

        // Validate: try to parse the feed immediately so the user gets instant feedback
        const Parser = require('rss-parser');
        const testParser = new Parser();
        let feedOk = false;
        try {
          await testParser.parseURL(newUrl);
          feedOk = true;
        } catch (_e) {
          // Feed failed — still save it but warn the user
        }

        await setSetting(interaction.guild.id, `${platform}_URL`, newUrl);
        const { getSubDashboard } = require('../commands/utility/setupsocial');
        const subDash = await getSubDashboard(interaction.guild.id, platform);

        // Modals must use reply(), NOT update() — update() only works for button/select interactions
        if (feedOk) {
          await interaction.reply({ content: `✅ RSS link saved! The feed is valid and notifications will start within 5 minutes.`, ephemeral: true });
        } else {
          await interaction.reply({
            content: [
              `⚠️ Link saved, but the feed could **not** be reached or parsed.`,
              `Please double-check the URL — it must be a valid RSS/Atom feed.`,
              platform === 'YOUTUBE'
                ? '\n📌 **YouTube tip:** Use the Atom feed URL format:\n`https://www.youtube.com/feeds/videos.xml?channel_id=UCxxxxxx`'
                : platform === 'INSTAGRAM' || platform === 'TIKTOK'
                ? `\n📌 **${platform} tip:** Use an RSS bridge like \`https://rsshub.app/${platform.toLowerCase()}/user/USERNAME\``
                : '',
            ].join('\n'),
            ephemeral: true,
          });
        }
      } else if (interaction.customId.startsWith('social_msgmodal_')) {
        // customId format: social_msgmodal_PLATFORM
        const platform = interaction.customId.replace('social_msgmodal_', '');
        const newMessage = interaction.fields.getTextInputValue('social_msg_input');
        const { setSetting } = require('../modules/settings');
        await setSetting(interaction.guild.id, `${platform}_MESSAGE`, newMessage);

        // Modals must use reply(), NOT update()
        await interaction.reply({ content: `✅ Custom message for **${platform}** saved!`, ephemeral: true });
      } else if (interaction.customId.startsWith('embed_builder_')) {
        const channelId = interaction.customId.replace('embed_builder_', '');
        const channel = interaction.guild.channels.cache.get(channelId);
        
        if (!channel) return interaction.reply({ content: '❌ Channel not found.', ephemeral: true });

        const title = interaction.fields.getTextInputValue('embed_title') || null;
        const desc = interaction.fields.getTextInputValue('embed_desc');
        const colorInput = interaction.fields.getTextInputValue('embed_color') || '#5865F2';
        const thumbnail = interaction.fields.getTextInputValue('embed_thumbnail') || null;
        const image = interaction.fields.getTextInputValue('embed_image') || null;

        let color;
        try {
          color = parseInt(colorInput.replace('#', ''), 16);
          if (isNaN(color)) color = 0x5865F2;
        } catch {
          color = 0x5865F2;
        }

        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
          .setColor(color)
          .setDescription(desc);

        if (title) embed.setTitle(title);
        if (thumbnail && thumbnail.startsWith('http')) embed.setThumbnail(thumbnail);
        if (image && image.startsWith('http')) embed.setImage(image);

        try {
          await channel.send({ embeds: [embed] });
          await interaction.reply({ content: `✅ Embed sent to ${channel}!`, ephemeral: true });
        } catch (e) {
          console.error('[embed builder]', e);
          await interaction.reply({ content: `❌ Failed to send embed: ${e.message}`, ephemeral: true });
        }
      } else if (interaction.customId === 'smanager_create_modal') {
        const { handleSManagerModals } = require('../modules/smanagerUI');
        await handleSManagerModals(interaction).catch(console.error);
      } else if (interaction.customId.startsWith('smanager_edit_modal_')) {
        const { handleSManagerEditModal } = require('../modules/smanagerUI');
        await handleSManagerEditModal(interaction).catch(console.error);
      } else if (interaction.customId === 'tourney_create_modal' || interaction.customId.startsWith('tourney_edit_modal_')) {
        const { handleTourneyModals } = require('../modules/tourneyUI');
        await handleTourneyModals(interaction).catch(console.error);
      } else if (interaction.customId.startsWith('ss_reject_modal_')) {
        const { EmbedBuilder } = require('discord.js');
        const targetUserId = interaction.customId.replace('ss_reject_modal_', '');
        const reason = interaction.fields.getTextInputValue('ss_reject_reason');

        const targetMember = await interaction.guild.members.fetch(targetUserId).catch(() => null);

        await interaction.deferUpdate();

        if (targetMember) {
          await targetMember.send({
            content: `❌ Your screenshot submission in **${interaction.guild.name}** was **rejected** by staff.\n\n**Reason:** ${reason}`
          }).catch(() => null);
        }

        const oldEmbed = interaction.message.embeds[0];
        const newEmbed = EmbedBuilder.from(oldEmbed)
          .setColor(0xff4444)
          .setTitle('📸 Screenshot Rejected')
          .addFields(
            { name: 'Status', value: `❌ Rejected by ${interaction.user}`, inline: true },
            { name: 'Reason', value: reason, inline: false }
          );

        await interaction.message.edit({ embeds: [newEmbed], components: [] });
      }
    }
  },
};
