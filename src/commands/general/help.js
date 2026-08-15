// src/commands/general/help.js
// ─────────────────────────────────────────────────────────────────────────────
// Modern Multi-Category Interactive Help Menu for Jarvis Bot
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} = require('discord.js');

const CATEGORY_METADATA = {
  ai: {
    label: 'AI & Creativity',
    emoji: '🤖',
    desc: 'Gemini AI Assistant, chat summaries & image generation',
    color: 0x6366f1,
  },
  welcome: {
    label: 'Welcome & Departure',
    emoji: '👋',
    desc: 'Welcome & Goodbye message and card setups',
    color: 0x10b981,
  },
  leveling: {
    label: 'Leveling & XP',
    emoji: '📈',
    desc: 'Member experience points, rank cards & leaderboards',
    color: 0xf59e0b,
  },
  tickets: {
    label: 'Support Tickets',
    emoji: '🎟️',
    desc: 'Interactive button support ticket desks & transcripts',
    color: 0x06b6d4,
  },
  giveaways: {
    label: 'Giveaways',
    emoji: '🎁',
    desc: 'Host interactive giveaways with automated countdowns',
    color: 0xec4899,
  },
  economy: {
    label: 'Economy & Mini-Games',
    emoji: '🪙',
    desc: 'Daily coins, balance, coinflip, trivia & truth or dare',
    color: 0xfbbf24,
  },
  birthdays: {
    label: 'Birthdays',
    emoji: '🎂',
    desc: 'Register birthdays and daily server celebration wishes',
    color: 0xf472b6,
  },
  voice: {
    label: 'Voice & Counters',
    emoji: '🔊',
    desc: 'Temp voice rooms and live server stats counters',
    color: 0x3b82f6,
  },
  moderation: {
    label: 'Moderation & Security',
    emoji: '🛡️',
    desc: 'Bans, kicks, mutes, purges, locks & captcha verification',
    color: 0xef4444,
  },
  esports: {
    label: 'Esports Suite',
    emoji: '🎮',
    desc: 'Tournament registration, slot management & screenshot verification',
    color: 0x8b5cf6,
  },
  music: {
    label: 'Music Player',
    emoji: '🎵',
    desc: 'Lossless audio streaming, queues, volume & playback controls',
    color: 0xd946ef,
  },
  utility: {
    label: 'Utility & Tools',
    emoji: '🛠️',
    desc: 'Tags, embeds, reminders, and server configuration',
    color: 0x64748b,
  },
  general: {
    label: 'General & Info',
    emoji: '📌',
    desc: 'Bot latency, info, invite links, and system stats',
    color: 0x94a3b8,
  }
};

function generateMainHelpEmbed(client, commands, user) {
  const catCounts = {};
  commands.forEach(cmd => {
    const cat = (cmd.category || 'general').toLowerCase();
    catCounts[cat] = (catCounts[cat] || 0) + 1;
  });

  const fields = Object.entries(CATEGORY_METADATA)
    .filter(([key]) => (catCounts[key] || 0) > 0)
    .map(([key, meta]) => ({
      name: `${meta.emoji} ${meta.label}`,
      value: `\`${catCounts[key] || 0} Commands\`\n*${meta.desc.slice(0, 32)}...*`,
      inline: true
    }));

  return new EmbedBuilder()
    .setColor(0x6366f1)
    .setAuthor({ name: `${client.user.username} | Help Center`, iconURL: client.user.displayAvatarURL() })
    .setTitle('⚡ Jarvis Bot Command Matrix')
    .setDescription(
      `Welcome to **Jarvis Bot** — Crafted by **trj7**.\nBelow is the categorized overview of all **${commands.size} available commands**.\n\n👇 **Select a category from the dropdown menu below** to explore detailed commands and usage.`
    )
    .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 256 }))
    .addFields(fields)
    .setFooter({ text: `Requested by ${user.tag} • Jarvis by trj7`, iconURL: user.displayAvatarURL() })
    .setTimestamp();
}

function generateCategoryEmbed(categoryKey, client, commands, user) {
  const meta = CATEGORY_METADATA[categoryKey] || {
    label: categoryKey.toUpperCase(),
    emoji: '📁',
    desc: 'Commands in this category',
    color: 0x6366f1
  };

  const catCommands = commands.filter(cmd => (cmd.category || 'general').toLowerCase() === categoryKey.toLowerCase());

  const cmdList = catCommands.map(cmd => {
    const desc = cmd.data.description || 'No description provided';
    return `### \`/${cmd.data.name}\`\n> ${desc}`;
  }).join('\n\n') || '*No commands found in this category.*';

  return new EmbedBuilder()
    .setColor(meta.color)
    .setAuthor({ name: `${client.user.username} | ${meta.label}`, iconURL: client.user.displayAvatarURL() })
    .setTitle(`${meta.emoji} ${meta.label} Commands (${catCommands.size})`)
    .setDescription(`*${meta.desc}*\n\n${cmdList}`)
    .setFooter({ text: `Requested by ${user.tag} • Use /help to return to overview`, iconURL: user.displayAvatarURL() })
    .setTimestamp();
}

function buildSelectMenu(commands) {
  const catCounts = {};
  commands.forEach(cmd => {
    const cat = (cmd.category || 'general').toLowerCase();
    catCounts[cat] = (catCounts[cat] || 0) + 1;
  });

  const options = [
    {
      label: 'Main Overview',
      value: 'help_main',
      description: 'Return to the main category overview',
      emoji: '🏠'
    },
    ...Object.entries(CATEGORY_METADATA)
      .filter(([key]) => (catCounts[key] || 0) > 0)
      .map(([key, meta]) => ({
        label: meta.label,
        value: `help_cat_${key}`,
        description: `${catCounts[key]} commands • ${meta.desc.slice(0, 45)}`,
        emoji: meta.emoji
      }))
  ];

  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('help_category_select')
      .setPlaceholder('📂 Select a category to inspect commands...')
      .addOptions(options.slice(0, 25))
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Displays a categorized list of all available commands'),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const { commands } = interaction.client;
    const initialEmbed = generateMainHelpEmbed(interaction.client, commands, interaction.user);
    const selectMenuRow = buildSelectMenu(commands);

    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Dashboard')
        .setStyle(ButtonStyle.Link)
        .setURL('http://localhost:3000')
        .setEmoji('🖥️'),
      new ButtonBuilder()
        .setLabel('Invite Jarvis')
        .setStyle(ButtonStyle.Link)
        .setURL(`https://discord.com/api/oauth2/authorize?client_id=${interaction.client.user.id}&permissions=8&scope=bot%20applications.commands`)
        .setEmoji('🤖')
    );

    const response = await interaction.reply({
      embeds: [initialEmbed],
      components: [selectMenuRow, buttonRow],
      fetchReply: true
    });

    // Create interactive collector for 2 minutes
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 120000
    });

    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: '⚠️ Only the user who ran /help can control this menu.', ephemeral: true });
      }

      const selected = i.values[0];

      if (selected === 'help_main') {
        const mainEmbed = generateMainHelpEmbed(interaction.client, commands, interaction.user);
        await i.update({ embeds: [mainEmbed] });
      } else if (selected.startsWith('help_cat_')) {
        const catKey = selected.replace('help_cat_', '');
        const catEmbed = generateCategoryEmbed(catKey, interaction.client, commands, interaction.user);
        await i.update({ embeds: [catEmbed] });
      }
    });

    collector.on('end', async () => {
      const disabledRow = buildSelectMenu(commands);
      disabledRow.components[0].setDisabled(true);
      await interaction.editReply({ components: [disabledRow, buttonRow] }).catch(() => null);
    });
  },
};
