// src/commands/ai/ask.js
// ─────────────────────────────────────────────────────────────────────────────
// /ask - Ask Jarvis AI anything with intelligent real-time answers,
// native Romanized Bengali (Banglish) comprehension, and proactive server management proposals.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  PermissionFlagsBits,
} = require('discord.js');
const {
  generateAIResponse,
  buildAssistantSystemPrompt,
  extractActionPayload,
  pendingProposals,
} = require('../../modules/aiAssistant');
const { executeServerAction, formatActionPreview } = require('../../modules/aiActions');
const { getSetting } = require('../../modules/settings');
const { canManageBot } = require('../../modules/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ask')
    .setDescription('Ask Jarvis AI anything with intelligent real-time answers and server tools')
    .addStringOption(opt =>
      opt
        .setName('prompt')
        .setDescription('Your question, idea, or server request for Jarvis (supports English & Banglish)')
        .setRequired(true)
    ),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const prompt = interaction.options.getString('prompt');
    await interaction.deferReply();

    // 1. Build context-aware system prompt with Banglish comprehension and guild details
    let customPrompt = null;
    if (interaction.guildId) {
      customPrompt = await getSetting(interaction.guildId, 'AI_SYSTEM_PROMPT').catch(() => null);
    }

    const systemPrompt = buildAssistantSystemPrompt({
      guild: interaction.guild,
      member: interaction.member,
      customPrompt,
      includeActions: Boolean(interaction.guild),
    });

    // 2. Query the AI engine
    const fullResponse = await generateAIResponse(prompt, systemPrompt);

    // 3. Check for actionable server proposals (channel creation, revamp, etc.)
    const { cleanText, actionData } = extractActionPayload(fullResponse);

    if (actionData && actionData.action && interaction.guild && interaction.member) {
      // Permission verification
      const isManager = await canManageBot(interaction.member);
      const hasManageGuild = interaction.member.permissions?.has(PermissionFlagsBits.ManageGuild);
      const hasAdmin = interaction.member.permissions?.has(PermissionFlagsBits.Administrator);
      const isOwner = interaction.user.id === interaction.guild.ownerId;

      if (!isManager && !hasManageGuild && !hasAdmin && !isOwner) {
        return interaction.editReply({
          content: `${cleanText}\n\n⚠️ *Notice: You need Administrator or Manage Server permissions to execute server modifications.*`,
        });
      }

      // 4. Construct Interactive Proposal
      const proposalId = `prop_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      const preview = formatActionPreview(interaction.guild, actionData.action, actionData.parameters || {});

      pendingProposals.set(proposalId, {
        id: proposalId,
        guildId: interaction.guild.id,
        channelId: interaction.channelId,
        authorId: interaction.user.id,
        authorTag: interaction.user.tag,
        action: actionData.action,
        parameters: actionData.parameters || {},
        cleanText,
        preview,
        messageRef: interaction,
        createdAt: Date.now(),
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      });

      const proposalDesc = [
        cleanText ? `${cleanText}\n` : '',
        preview.description,
        '\n────────────────────────────────',
        '**📌 আপনার করণীয়:**',
        `• সার্ভারে বাস্তবায়ন করতে নিচের **${preview.isDestructive ? 'Confirm & Delete' : 'Confirm & Apply'}** বাটনে ক্লিক করুন।`,
      ].filter(Boolean).join('\n');

      const safeDesc = proposalDesc.length > 4000 ? proposalDesc.slice(0, 3950) + '\n\n*(...truncated)*' : proposalDesc;

      const embed = new EmbedBuilder()
        .setColor(preview.isDestructive ? 0xED4245 : 0x6366F1)
        .setAuthor({ name: 'Jarvis AI Architect', iconURL: interaction.client.user.displayAvatarURL() })
        .setTitle(preview.title)
        .setDescription(safeDesc)
        .setFooter({ text: `Proposal ID: ${proposalId} • 10m to confirm • Asked by ${interaction.user.tag}` })
        .setTimestamp();

      if (preview.summary) {
        embed.addFields({ name: '📊 Plan Summary', value: `\`${preview.summary}\`` });
      }

      const confirmButton = new ButtonBuilder()
        .setCustomId(`ai_prop_confirm_${proposalId}`)
        .setLabel(preview.isDestructive ? 'Confirm & Delete' : 'Confirm & Apply')
        .setStyle(preview.isDestructive ? ButtonStyle.Danger : ButtonStyle.Success)
        .setEmoji(preview.isDestructive ? '🗑️' : '✅');

      const cancelButton = new ButtonBuilder()
        .setCustomId(`ai_prop_cancel_${proposalId}`)
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('❌');

      const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

      await interaction.editReply({ embeds: [embed], components: [row] });

      // Start collector for interactive response
      try {
        const replyMsg = await interaction.fetchReply();
        const collector = replyMsg.createMessageComponentCollector({
          componentType: ComponentType.Button,
          time: 10 * 60 * 1000,
        });

        collector.on('collect', async btnInteraction => {
          if (
            btnInteraction.user.id !== interaction.user.id &&
            !btnInteraction.member?.permissions?.has(PermissionFlagsBits.Administrator)
          ) {
            return btnInteraction.reply({
              content: '❌ Only the administrator who initiated this proposal can confirm or cancel it.',
              ephemeral: true,
            });
          }

          if (btnInteraction.customId === `ai_prop_cancel_${proposalId}`) {
            pendingProposals.delete(proposalId);
            collector.stop('cancelled');

            const cancelEmbed = EmbedBuilder.from(embed)
              .setColor(0x747F8D)
              .setTitle('🚫 Action Cancelled')
              .setDescription(`${cleanText ? `${cleanText}\n\n` : ''}❌ **Proposal was cancelled by ${btnInteraction.user}.** No changes were made to the server.`)
              .setFields([]);

            return btnInteraction.update({ embeds: [cancelEmbed], components: [] }).catch(console.error);
          }

          if (btnInteraction.customId === `ai_prop_confirm_${proposalId}`) {
            pendingProposals.delete(proposalId);
            collector.stop('confirmed');

            await btnInteraction.update({
              embeds: [
                EmbedBuilder.from(embed)
                  .setColor(0xFEE75C)
                  .setTitle('⏳ Executing Server Actions...')
                  .setDescription('Applying the requested modifications to the server. Please wait a moment...')
                  .setFields([]),
              ],
              components: [],
            }).catch(console.error);

            const result = await executeServerAction(interaction, actionData.action, actionData.parameters || {});

            const resultEmbed = new EmbedBuilder()
              .setColor(result.success ? 0x57F287 : 0xED4245)
              .setTitle(result.success ? '✅ Server Action Complete' : '⚠️ Action Notice')
              .setDescription(result.message)
              .setFooter({ text: `Confirmed & applied by ${btnInteraction.user.tag}` })
              .setTimestamp();

            if (result.details) {
              resultEmbed.addFields({ name: '📋 Action Info', value: String(result.details).slice(0, 1000) });
            }

            return interaction.editReply({ embeds: [resultEmbed], components: [] }).catch(console.error);
          }
        });

        collector.on('end', (collected, reason) => {
          if (reason === 'time' && pendingProposals.has(proposalId)) {
            pendingProposals.delete(proposalId);
            const disabledRow = new ActionRowBuilder().addComponents(
              ButtonBuilder.from(confirmButton).setDisabled(true).setLabel('Expired'),
              ButtonBuilder.from(cancelButton).setDisabled(true)
            );
            interaction.editReply({ components: [disabledRow] }).catch(() => null);
          }
        });
      } catch (colErr) {
        console.error('[ask.js] Failed to start proposal collector:', colErr);
      }

      return;
    }

    // 5. Standard Answer Response (when no server actions are triggered)
    const displayText = cleanText || fullResponse;

    if (displayText.length > 2000) {
      const embed = new EmbedBuilder()
        .setColor(0x6366f1)
        .setAuthor({ name: 'Jarvis AI Intelligence', iconURL: interaction.client.user.displayAvatarURL() })
        .setTitle('Query Response')
        .setDescription(displayText.slice(0, 4000))
        .setFooter({ text: `Asked by ${interaction.user.tag} • Engineered by trj7` })
        .setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setColor(0x6366f1)
      .setAuthor({ name: 'Jarvis AI Intelligence', iconURL: interaction.client.user.displayAvatarURL() })
      .addFields(
        { name: '💬 Prompt', value: `*${prompt.length > 250 ? prompt.slice(0, 250) + '...' : prompt}*` },
        { name: '🧠 Response', value: displayText }
      )
      .setFooter({ text: `Asked by ${interaction.user.tag} • Engineered by trj7` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
