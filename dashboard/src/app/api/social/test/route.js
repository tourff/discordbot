// dashboard/src/app/api/social/test/route.js
// ─────────────────────────────────────────────────────────────────────────────
// Dispatches an instant test notification to Discord to verify that the
// target announcement channel and embed formatting work perfectly.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const PLATFORM_COLORS = {
  youtube: 0xff0000,
  facebook: 0x1877f2,
  instagram: 0xe1306c,
  tiktok: 0x010101,
  rss: 0x5865f2,
  custom: 0x5865f2,
};

const PLATFORM_ICONS = {
  youtube: '▶️',
  facebook: '📘',
  instagram: '📸',
  tiktok: '🎵',
  rss: '📡',
  custom: '📡',
};

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { feed } = body;

    if (!feed || !feed.channelId) {
      return NextResponse.json({ error: 'Feed object with valid channelId is required.' }, { status: 400 });
    }

    const botToken = process.env.DISCORD_BOT_TOKEN || process.env.BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ error: 'Bot token not configured on server.' }, { status: 500 });
    }

    const platformKey = (feed.platform || 'youtube').toLowerCase();
    const color = PLATFORM_COLORS[platformKey] || 0x5865f2;
    const emoji = PLATFORM_ICONS[platformKey] || '📡';
    const platformLabel = platformKey.toUpperCase();

    const authorName = feed.name || (platformKey === 'youtube' ? 'Falcon Gaming' : 'Official Page');
    const postTitle = '⚡ Grand Finals - High Voltage Esports Showdown [TEST ANNOUNCEMENT]';
    const postUrl = feed.url?.includes('http') ? feed.url : 'https://discord.gg/H8vDYMQdJ8';

    // Format notification text message
    let template = feed.message || '📢 **{author}** posted new content on **{platform}**!\n**{title}**\n{url}';
    let text = template
      .replace(/\{author\}/gi, authorName)
      .replace(/\{channel\}/gi, authorName)
      .replace(/\{title\}/gi, postTitle)
      .replace(/\{url\}/gi, postUrl)
      .replace(/\{link\}/gi, postUrl)
      .replace(/\{platform\}/gi, platformLabel);

    if (feed.ping && feed.ping !== 'none') {
      text = `${feed.ping} ${text}`;
    }

    const embed = {
      title: postTitle,
      url: postUrl,
      color,
      author: {
        name: `${emoji} New ${platformLabel} Post - ${authorName}`.slice(0, 100),
      },
      description: `⚡ **Verification Test**: This is a test notification from the **Jarvis Bot Dashboard**.\n\nYour feed **${feed.name || authorName}** is properly connected to the database and will notify this channel automatically every 5 minutes when new content is uploaded!`,
      fields: [
        { name: 'Target Channel', value: `<#${feed.channelId}>`, inline: true },
        { name: 'Mention Setting', value: feed.ping && feed.ping !== 'none' ? `\`${feed.ping}\`` : 'None', inline: true },
        { name: 'Status', value: feed.enabled !== false ? '🟢 Active' : '⏸️ Paused', inline: true }
      ],
      footer: {
        text: `${platformLabel} • ${feed.name || 'Social Feed'} • Jarvis Core v2.4`,
      },
      timestamp: new Date().toISOString(),
    };

    const discordRes = await fetch(`https://discord.com/api/v10/channels/${feed.channelId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: text,
        embeds: [embed],
      }),
    });

    if (!discordRes.ok) {
      const errJson = await discordRes.json().catch(() => ({}));
      console.error('[API/social/test] Discord API error:', discordRes.status, errJson);

      let msg = errJson.message || `Discord API error (${discordRes.status})`;
      if (discordRes.status === 403) {
        msg = 'Bot does not have permission to send messages or embeds in the selected Discord channel. Please check bot permissions.';
      } else if (discordRes.status === 404) {
        msg = 'Channel not found. Please verify the channel exists on the server.';
      }

      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }

    const result = await discordRes.json();
    return NextResponse.json({ success: true, messageId: result.id });
  } catch (error) {
    console.error('[API/social/test] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error while sending test notification.' }, { status: 500 });
  }
}
