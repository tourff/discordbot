// src/scripts/restore_server.js
// ─────────────────────────────────────────────────────────────────────────────
// Emergency Server Recovery Script
// Restores deleted categories and channels for the Free Fire Esports Server
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { Client, GatewayIntentBits, ChannelType } = require('discord.js');

const GUILD_ID = '1508559562473472094'; // 🏆 Official Free Fire Community Esports

// Unwanted dummy channels created by the bot during the incident to remove
const DUMMY_CHANNELS_TO_CLEAN = [
  '📌・rules',
  '📢・announcements',
  '🎉・giveaways',
  '💬・general-chat',
  '🤖・bot-commands',
  '📸・media-share',
  '🐸・memes',
  '📢・tournament-info',
  '📝・registration',
  '📊・brackets-schedule',
  '🔊・Lounge (Public)',
  '🎮・Squad Room 1',
  '🎮・Squad Room 2',
];

// Server layout to restore
const RESTORE_LAYOUT = [
  {
    name: '𝐆𝐀𝐓𝐄𝐖𝐀𝐘',
    type: ChannelType.GuildCategory,
    channels: [
      { name: '❓┃-𝐅𝐀𝐐', type: ChannelType.GuildText },
      { name: '🔗┃-𝐎𝐔𝐑-𝐒𝐎𝐂𝐈𝐀𝐋𝐒', type: ChannelType.GuildText },
      { name: '✨┃-𝐖𝐄𝐋𝐂𝐎𝐌𝐄', type: ChannelType.GuildText },
      { name: '🔗┃-𝐏𝐄𝐑𝐌𝐀𝐍𝐄𝐍𝐓-𝐋𝐈𝐍𝐊', type: ChannelType.GuildText },
    ],
  },
  {
    name: '𝐍𝐎𝐓𝐈𝐅𝐈𝐂𝐀𝐓𝐈𝐎𝐍𝐒',
    type: ChannelType.GuildCategory,
    channels: [
      { name: '🎬┃-𝐍𝐄𝐖-𝐘𝐎𝐔𝐓𝐔𝐁𝐄-𝐕𝐈𝐃𝐄𝐎', type: ChannelType.GuildText },
      { name: '📢-announcement', type: ChannelType.GuildAnnouncement },
    ],
  },
  {
    name: '𝐓𝐎𝐔𝐑𝐍𝐀𝐌𝐄𝐍𝐓 𝐙𝐎𝐍𝐄',
    type: ChannelType.GuildCategory,
    channels: [
      { name: '🕒┃-𝐌𝐀𝐓𝐂𝐇-𝐒𝐂𝐇𝐄𝐃𝐔𝐋𝐄𝐒', type: ChannelType.GuildText },
      { name: '📆┃-𝐔𝐏𝐂𝐎𝐌𝐈𝐍𝐆-𝐄𝐕𝐄𝐍𝐓𝐒', type: ChannelType.GuildText },
      { name: '📝┃-𝐒𝐂𝐑𝐈𝐌𝐒-𝐑𝐄𝐆𝐈𝐒𝐓𝐑𝐀𝐓𝐈𝐎𝐍', type: ChannelType.GuildText },
      { name: '✅┃-𝐑𝐄𝐒𝐔𝐋𝐓𝐒-𝐀𝐍𝐃-𝐒𝐂𝐎𝐑𝐄𝐒', type: ChannelType.GuildText },
      { name: '🚨┃-𝐑𝐄𝐏𝐎𝐑𝐓-𝐂𝐄𝐍𝐓𝐄𝐑', type: ChannelType.GuildText },
      { name: '🎁┃-𝗚𝗜𝗩𝗘𝗔𝗪𝗔𝗬𝗦', type: ChannelType.GuildText },
      { name: '🏆┃-𝗪𝗜𝗡𝗡𝗘𝗥𝗦-𝗛𝗔𝗟𝗟-𝗢𝗙-𝗙𝗔𝗠𝗘', type: ChannelType.GuildText },
    ],
  },
  {
    name: '𝐂𝐎𝐌𝐌𝐔𝐍𝐈𝐓𝐘',
    type: ChannelType.GuildCategory,
    channels: [
      { name: '📸┃-𝐌𝐄𝐃𝐈𝐀-𝐒𝐇𝐀𝐑𝐄', type: ChannelType.GuildText },
      { name: '🎯┃-𝐋𝐎𝐎𝐊𝐈𝐍𝐆-𝐅𝐎𝐑-𝐒𝐐𝐔𝐀𝐃', type: ChannelType.GuildText },
      { name: '💬┃-𝐆𝐄𝐍𝐄𝐑𝐀𝐋-𝐂𝐇𝐀𝐓', type: ChannelType.GuildText },
      { name: '😂┃-𝐌𝐄𝐌𝐄𝐒-𝐀𝐍𝐃-𝐅𝐔𝐍', type: ChannelType.GuildText },
      { name: '🎮┃-𝐎𝐅𝐅-𝐓𝐎𝐏𝐈𝐂', type: ChannelType.GuildText },
    ],
  },
  {
    name: '𝐒𝐐𝐔𝐀𝐃𝐒',
    type: ChannelType.GuildCategory,
    channels: [
      { name: '👥┃-𝐅𝐈𝐍𝐃-𝐓𝐄𝐀𝐌𝐒', type: ChannelType.GuildText },
      { name: '📝┃-𝐏𝐋𝐀𝐘𝐄𝐑-𝐑𝐄𝐐𝐔𝐈𝐑𝐄𝐌𝐄𝐍𝐓𝐒', type: ChannelType.GuildText },
      { name: '📣┃-𝐏𝐑𝐎𝐌𝐎𝐓𝐄𝐒', type: ChannelType.GuildText },
    ],
  },
  {
    name: '📚 𝗧𝗢𝗨𝗥𝗡𝗔𝗠𝗘𝗡𝗧 𝗥𝗘𝗦𝗢𝗨𝗥𝗖𝗘𝗦',
    type: ChannelType.GuildCategory,
    channels: [
      { name: '📄┃-𝗧𝗢𝗨𝗥𝗡𝗔𝗠𝗘𝗡𝗧-𝗥𝗨𝗟𝗘𝗦', type: ChannelType.GuildText },
      { name: '📊┃-𝗦𝗧𝗔𝗧𝗦-𝗔𝗡𝗗-𝗟𝗘𝗔𝗗𝗕𝗢𝗔𝗥𝗗𝗦', type: ChannelType.GuildText },
      { name: '🎥┃-𝗠𝗔𝗧𝗖𝗛-𝗥𝗘𝗖𝗢𝗥𝗗𝗦', type: ChannelType.GuildText },
      { name: '📚┃-𝗧𝗨𝗧𝗢𝗥𝗜𝗔𝗟𝗦', type: ChannelType.GuildText },
    ],
  },
  {
    name: '𝐆𝐀𝐌𝐄 𝐙𝐎𝐍𝐄',
    type: ChannelType.GuildCategory,
    channels: [
      { name: '🎮┃-𝐃𝐔𝐎', type: ChannelType.GuildVoice },
      { name: '🎮┃- BLACK ROCK 33', type: ChannelType.GuildVoice },
      { name: '🎮┃- BLACK ROCK - 31', type: ChannelType.GuildVoice },
      { name: '🎮 | - BLACK ROCK -30', type: ChannelType.GuildVoice },
      { name: '🎮┃- BLACK ROCK - 32', type: ChannelType.GuildVoice },
      { name: '🎮┃- BLACK ROCK - 29', type: ChannelType.GuildVoice },
      { name: '🎮┃- BLACK ROCK - 28', type: ChannelType.GuildVoice },
      { name: '⚔️🔥┃BLACK ROCK WAR ROOM', type: ChannelType.GuildVoice },
    ],
  },
  {
    name: '𝐇𝐎𝐒𝐓 𝐋𝐎𝐁𝐁𝐘',
    type: ChannelType.GuildCategory,
    // Re-link existing orphan channels
    relinkChannels: [
      '📑┃-𝐌𝐀𝐓𝐂𝐇-𝐒𝐄𝐓𝐔𝐏',
      '🗨️┃-𝐇𝐎𝐒𝐓𝐈𝐍𝐆-𝐙𝐎𝐍𝐄',
      '🎮┃-𝐈𝐍-𝐌𝐀𝐓𝐂𝐇',
      '🔊┃-𝐇𝐎𝐒𝐓-𝐕𝐂',
      '🔴┃-𝐋𝐈𝐕𝐄',
      '🔊┃-𝐆𝐀𝐌𝐄-𝐕𝐂',
    ],
  },
  {
    name: '𝐏𝐑𝐈𝐕𝐀𝐓𝐄 𝐀𝐑𝐄𝐀',
    type: ChannelType.GuildCategory,
    // Re-link existing orphan channels
    relinkChannels: [
      '📌┃-𝐑𝐔𝐋𝐄𝐒',
      '🔐┃-𝐌𝐎𝐃𝐄𝐑𝐀𝐓𝐎𝐑-𝐂𝐇𝐀𝐓',
      '📂┃-𝐒𝐓𝐀𝐅𝐅-𝐃𝐎𝐂𝐔𝐌𝐄𝐍𝐓𝐒',
      '📊┃-𝐂𝐎𝐍𝐅𝐈𝐃𝐄𝐍𝐓𝐈𝐀𝐋-𝐑𝐄𝐏𝐎𝐑𝐓𝐒',
    ],
  },
  {
    name: '𝗕𝗢𝗧 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦',
    type: ChannelType.GuildCategory,
    relinkChannels: [
      '⚙️┃-𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦',
      '📜┃-𝗕𝗢𝗧-𝗥𝗨𝗟𝗘𝗦',
    ],
    channels: [
      { name: '🤖┃-𝗕𝗢𝗧-𝗦𝗨𝗣𝗣𝗢𝗥𝗧', type: ChannelType.GuildText },
      { name: 'tourney-slotmanager', type: ChannelType.GuildText },
    ],
  },
  {
    name: '🆔  ID PASS CHANNEL  🔐✅',
    type: ChannelType.GuildCategory,
    channels: [],
  },
];

async function restoreServer() {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  client.once('ready', async () => {
    console.log(`[Restore] Logged in as ${client.user.tag}`);
    const guild = await client.guilds.fetch(GUILD_ID).catch(() => null);
    if (!guild) {
      console.error(`[Restore] Guild ${GUILD_ID} not found!`);
      process.exit(1);
    }

    console.log(`[Restore] Connected to guild: "${guild.name}"`);

    // 1. Fetch all current channels
    let allChannels = await guild.channels.fetch();

    // 2. Remove unwanted dummy channels created by the bot
    console.log('\n--- Step 1: Cleaning up mistakenly created dummy channels ---');
    for (const dummyName of DUMMY_CHANNELS_TO_CLEAN) {
      const match = allChannels.find(c => c && c.name === dummyName && !c.parentId);
      if (match) {
        try {
          await match.delete('Cleaning up dummy channel created during incident');
          console.log(`🗑️ Removed dummy channel: ${dummyName} (${match.id})`);
          await new Promise(r => setTimeout(r, 300));
        } catch (e) {
          console.warn(`Failed to delete dummy channel ${dummyName}:`, e.message);
        }
      }
    }

    // Refresh channel cache
    allChannels = await guild.channels.fetch();

    // 3. Restore Categories & Channels
    console.log('\n--- Step 2: Restoring Categories and Channels ---');
    for (const group of RESTORE_LAYOUT) {
      // Check if category already exists
      let category = allChannels.find(
        c => c && c.type === ChannelType.GuildCategory && c.name === group.name
      );

      if (!category) {
        try {
          category = await guild.channels.create({
            name: group.name,
            type: ChannelType.GuildCategory,
            reason: 'Emergency server layout restoration',
          });
          console.log(`📁 Created category: "${category.name}"`);
          await new Promise(r => setTimeout(r, 350));
        } catch (e) {
          console.error(`Failed to create category ${group.name}:`, e.message);
          continue;
        }
      } else {
        console.log(`📁 Category already exists: "${category.name}"`);
      }

      // Re-link existing orphan channels
      if (Array.isArray(group.relinkChannels)) {
        for (const orphanName of group.relinkChannels) {
          const orphan = allChannels.find(c => c && c.name === orphanName);
          if (orphan) {
            try {
              await orphan.setParent(category.id, { lockPermissions: false });
              console.log(`  🔗 Moved existing channel "${orphan.name}" into "${category.name}"`);
              await new Promise(r => setTimeout(r, 300));
            } catch (e) {
              console.warn(`  Failed to relink channel ${orphanName}:`, e.message);
            }
          }
        }
      }

      // Create missing channels
      if (Array.isArray(group.channels)) {
        for (const ch of group.channels) {
          // Check if already exists in guild
          const exists = allChannels.find(c => c && c.name === ch.name);
          if (exists) {
            console.log(`  ℹ️ Channel "${ch.name}" already exists, skipping.`);
            continue;
          }

          try {
            const created = await guild.channels.create({
              name: ch.name,
              type: ch.type,
              parent: category.id,
              reason: 'Emergency server channel restoration',
            });
            console.log(`  ✅ Created ${ch.type === ChannelType.GuildVoice ? 'voice' : 'text'} channel: "${created.name}"`);
            await new Promise(r => setTimeout(r, 350));
          } catch (e) {
            console.error(`  ❌ Failed to create channel "${ch.name}":`, e.message);
          }
        }
      }
    }

    console.log('\n🎉 Server restoration complete!');
    client.destroy();
    process.exit(0);
  });

  client.login(process.env.BOT_TOKEN);
}

if (require.main === module) {
  restoreServer();
}

module.exports = { restoreServer };
