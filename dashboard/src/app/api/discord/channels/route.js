// dashboard/src/app/api/discord/channels/route.js
// ─────────────────────────────────────────────────────────────────────────────
// Server-side API: Fetch Discord guild channels using the bot token.
// Called by the dashboard to populate the AI channel whitelist selector.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request) {
  try {
    // Auth guard — only logged-in users
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const guildId = searchParams.get('guildId');

    if (!guildId) {
      return NextResponse.json({ error: 'guildId is required' }, { status: 400 });
    }

    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
    }

    const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
      headers: {
        Authorization: `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 30 }, // cache for 30 seconds
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[API/discord/channels] Discord API error:', res.status, errText);
      return NextResponse.json({ error: `Discord API error: ${res.status}` }, { status: res.status });
    }

    const rawChannels = await res.json();

    // Filter and format — only text channels, voice channels, categories
    // Channel types: 0=text, 2=voice, 4=category, 5=announcement
    const ALLOWED_TYPES = [0, 2, 4, 5];
    const channels = rawChannels
      .filter(ch => ALLOWED_TYPES.includes(ch.type))
      .map(ch => ({
        id: ch.id,
        name: ch.name,
        type: ch.type,       // 0=text, 2=voice, 4=category, 5=announcement
        parentId: ch.parent_id || null,
        position: ch.position,
      }))
      .sort((a, b) => a.position - b.position);

    return NextResponse.json({ channels });
  } catch (err) {
    console.error('[API/discord/channels] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
