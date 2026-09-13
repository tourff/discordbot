// dashboard/src/app/api/social/resolve/route.js
// ─────────────────────────────────────────────────────────────────────────────
// Resolves social URLs (especially YouTube handles, channel links, and custom RSS)
// into valid XML feed URLs and extracts channel metadata in real time.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { url: rawUrl, platform = 'youtube' } = body;

    if (!rawUrl || typeof rawUrl !== 'string') {
      return NextResponse.json({ success: false, error: 'Feed or channel URL is required.' }, { status: 400 });
    }

    let url = rawUrl.trim();

    // ── 1. YouTube Resolution ───────────────────────────────────────────────
    if (platform === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be') || url.startsWith('@')) {
      let channelId = null;

      // Case A: Already a feed URL
      if (url.includes('feeds/videos.xml?channel_id=')) {
        const m = url.match(/channel_id=([a-zA-Z0-9_-]+)/);
        if (m) channelId = m[1];
      }
      // Case B: Raw Channel ID (e.g. UC...)
      else if (url.startsWith('UC') && url.length >= 20 && !url.includes('/') && !url.includes('.')) {
        channelId = url;
      }
      // Case C: /channel/UC...
      else if (url.includes('channel/')) {
        const m = url.match(/channel\/(UC[a-zA-Z0-9_-]+)/);
        if (m) channelId = m[1];
      }
      // Case D: Handle @username, /c/name, /user/name, video link, or general page
      else {
        let fetchUrl = url;
        if (fetchUrl.startsWith('@')) {
          fetchUrl = `https://www.youtube.com/${fetchUrl}`;
        } else if (!fetchUrl.startsWith('http://') && !fetchUrl.startsWith('https://')) {
          fetchUrl = `https://www.youtube.com/@${fetchUrl}`;
        }

        const pageRes = await fetch(fetchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          next: { revalidate: 300 }
        });

        if (!pageRes.ok) {
          return NextResponse.json({
            success: false,
            error: `YouTube returned HTTP status ${pageRes.status}. Please check that the channel exists and is public.`
          }, { status: 400 });
        }

        const html = await pageRes.text();
        const mRss = html.match(/feeds\/videos\.xml\?channel_id=([a-zA-Z0-9_-]+)/);
        const mMeta = html.match(/<meta itemprop="identifier" content="([a-zA-Z0-9_-]+)"/);
        const mJson = html.match(/"channelId":"(UC[a-zA-Z0-9_-]+)"/);
        const mExt = html.match(/"externalId":"(UC[a-zA-Z0-9_-]+)"/);

        channelId = mRss?.[1] || mMeta?.[1] || mJson?.[1] || mExt?.[1];

        if (!channelId) {
          // If it was a video URL (e.g. watch?v= or youtu.be), extract from oEmbed
          if (url.includes('watch?v=') || url.includes('youtu.be/')) {
            try {
              const oEmbedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
              if (oEmbedRes.ok) {
                const oData = await oEmbedRes.json();
                if (oData.author_url) {
                  const authorRes = await fetch(oData.author_url, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
                  });
                  const aHtml = await authorRes.text();
                  const aRss = aHtml.match(/feeds\/videos\.xml\?channel_id=([a-zA-Z0-9_-]+)/);
                  const aMeta = aHtml.match(/<meta itemprop="identifier" content="([a-zA-Z0-9_-]+)"/);
                  channelId = aRss?.[1] || aMeta?.[1];
                }
              }
            } catch {}
          }
        }
      }

      if (!channelId) {
        return NextResponse.json({
          success: false,
          error: 'Could not detect YouTube Channel ID. Please paste your Channel ID (starts with UC...) or full channel URL.'
        }, { status: 400 });
      }

      const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

      // Fetch and validate the actual XML feed
      const feedRes = await fetch(feedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; JarvisBotFeedChecker/2.0)',
          'Accept': 'application/xml, text/xml, */*'
        },
        next: { revalidate: 60 }
      });

      if (!feedRes.ok) {
        return NextResponse.json({
          success: false,
          error: `Failed to load YouTube RSS feed (Status: ${feedRes.status}).`
        }, { status: 400 });
      }

      const xml = await feedRes.text();
      const titleMatch = xml.match(/<feed[^>]*>[\s\S]*?<title>([^<]+)<\/title>/i);
      const videoTitleMatch = xml.match(/<entry>[\s\S]*?<title>([^<]+)<\/title>/i);
      const videoLinkMatch = xml.match(/<entry>[\s\S]*?<link[^>]+href="([^"]+)"/i);
      const pubDateMatch = xml.match(/<entry>[\s\S]*?<published>([^<]+)<\/published>/i);

      const channelTitle = titleMatch ? titleMatch[1].trim() : 'YouTube Channel';
      const latestPost = videoTitleMatch ? {
        title: videoTitleMatch[1].trim(),
        link: videoLinkMatch ? videoLinkMatch[1].trim() : '',
        date: pubDateMatch ? pubDateMatch[1].trim() : ''
      } : null;

      return NextResponse.json({
        success: true,
        platform: 'youtube',
        channelId,
        feedUrl,
        title: channelTitle,
        latestPost
      });
    }

    // ── 2. Custom RSS / Atom / Other Platforms ──────────────────────────────
    try {
      let testUrl = url;
      if (!testUrl.startsWith('http://') && !testUrl.startsWith('https://')) {
        testUrl = `https://${testUrl}`;
      }

      const feedRes = await fetch(testUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; JarvisBotFeedChecker/2.0)',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*'
        },
        next: { revalidate: 60 }
      });

      if (!feedRes.ok) {
        return NextResponse.json({
          success: false,
          error: `Feed URL returned status ${feedRes.status}. Please make sure the URL is public and valid.`
        }, { status: 400 });
      }

      const text = await feedRes.text();
      const isXml = text.includes('<rss') || text.includes('<feed') || text.includes('<channel');
      if (!isXml) {
        return NextResponse.json({
          success: false,
          error: 'The provided URL returned HTML or non-RSS data instead of an RSS/Atom XML feed.'
        }, { status: 400 });
      }

      const titleMatch = text.match(/<title>([^<]+)<\/title>/i);
      const itemTitleMatch = text.match(/<item>[\s\S]*?<title>([^<]+)<\/title>/i) ||
                             text.match(/<entry>[\s\S]*?<title>([^<]+)<\/title>/i);
      const itemLinkMatch = text.match(/<item>[\s\S]*?<link>([^<]+)<\/link>/i) ||
                            text.match(/<entry>[\s\S]*?<link[^>]+href="([^"]+)"/i);

      return NextResponse.json({
        success: true,
        platform: platform || 'custom',
        channelId: '',
        feedUrl: testUrl,
        title: titleMatch ? titleMatch[1].trim() : 'Social Feed',
        latestPost: itemTitleMatch ? {
          title: itemTitleMatch[1].trim(),
          link: itemLinkMatch ? itemLinkMatch[1].trim() : ''
        } : null
      });
    } catch (err) {
      return NextResponse.json({
        success: false,
        error: `Could not reach feed: ${err.message}`
      }, { status: 400 });
    }
  } catch (error) {
    console.error('[API/social/resolve] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'An internal error occurred while resolving the feed URL.'
    }, { status: 500 });
  }
}
