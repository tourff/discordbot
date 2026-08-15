'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const FEATURES = [
  {
    icon: '🛡️',
    title: 'Command Permissions',
    desc: 'Fine-grained role & user access rules. Lock administrative commands to verified server staff.',
    tag: 'Security',
  },
  {
    icon: '🤖',
    title: 'Auto-Moderation Engine',
    desc: 'Proactively eliminates spam bursts, blacklisted offensive terms, and unwanted invite links in real-time.',
    tag: 'Safety',
  },
  {
    icon: '✨',
    title: 'Welcome & Farewell Suite',
    desc: 'Engage newcomers with custom formatted greetings, user mentions, and server statistics.',
    tag: 'Automation',
  },
  {
    icon: '🌐',
    title: 'Social Broadcast Feeds',
    desc: 'Automatically mirror new YouTube uploads, TikTok videos, and Facebook posts directly to text channels.',
    tag: 'Feeds',
  },
  {
    icon: '📜',
    title: 'Comprehensive Audit Logs',
    desc: 'Full forensic tracking of kicks, bans, warnings, deleted messages, and edited chat logs.',
    tag: 'Audit',
  },
  {
    icon: '🎵',
    title: 'Lossless Music Player',
    desc: 'High-fidelity audio streaming with queue management, volume leveling, and rich embed previews.',
    tag: 'Media',
  },
];

const COMMANDS = [
  '/ban', '/kick', '/mute', '/warn', '/play', '/skip', '/queue',
  '/setup-roles', '/ssverify', '/roleall', '/nowplaying', '/volume',
  '/modlog', '/welcome', '/goodbye', '/antispam', '/automod',
  '/permissions', '/pause', '/resume', '/stop', '/seek',
];

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (status === 'authenticated') router.push('/dashboard');
  }, [status, router]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    await signIn('discord');
  };

  if (!mounted || status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
        <div className="luxe-spinner" style={{ width: 28, height: 28 }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-high)', position: 'relative', overflowX: 'hidden' }} className="bg-grid-mesh">

      {/* Ambient background glows */}
      <div className="ambient-glow-1" style={{ top: '-15%', left: '20%' }} />
      <div className="ambient-glow-2" style={{ top: '30%', right: '10%' }} />

      {/* ─── NAVBAR ─── */}
      <nav style={{
        height: 64,
        background: 'rgba(8, 10, 15, 0.8)',
        backdropFilter: 'blur(24px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.03em', color: '#fff' }}>JARVIS</span>
          <span className="luxe-badge luxe-badge-indigo" style={{ fontSize: 10, padding: '2px 7px' }}>BY TRJ7</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="luxe-badge luxe-badge-emerald">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
            Operational
          </div>

          <button
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="btn-luxe-primary"
            style={{ padding: '8px 18px', fontSize: 13 }}
          >
            {isSigningIn ? 'Connecting...' : 'Sign In with Discord'}
          </button>
        </div>
      </nav>

      {/* ─── HERO SECTION ─── */}
      <section style={{
        maxWidth: 1100, margin: '0 auto',
        padding: '100px 24px 70px',
        textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        position: 'relative', zIndex: 1,
      }}>
        {/* Pill Tag */}
        <div className="luxe-badge luxe-badge-indigo" style={{ padding: '5px 14px', fontSize: 12, marginBottom: 28 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#818cf8', boxShadow: '0 0 10px #818cf8' }} />
          The Next-Generation Discord Management Bot
        </div>

        {/* Hero Title */}
        <h1 style={{
          fontSize: 'clamp(44px, 7vw, 76px)',
          fontWeight: 800, letterSpacing: '-0.04em',
          lineHeight: 1.05, marginBottom: 24,
          color: '#ffffff',
          maxWidth: 900,
        }}>
          Server Management,<br />
          <span style={{
            background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Engineered with Precision.
          </span>
        </h1>

        {/* Hero Description */}
        <p style={{
          fontSize: 'clamp(16px, 2vw, 18px)',
          color: 'var(--text-medium)',
          maxWidth: 620, lineHeight: 1.6, marginBottom: 40,
          fontWeight: 400,
        }}>
          Jarvis delivers enterprise-grade moderation, real-time social syndication, autoroles, and lossless music playback with an ultra-refined dashboard.
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 60 }}>
          <button
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="btn-luxe-primary"
            style={{ padding: '14px 32px', fontSize: 15, borderRadius: 12 }}
          >
            {isSigningIn ? 'Connecting to Discord...' : 'Open Dashboard →'}
          </button>
        </div>

        {/* ─── MOCK WINDOW PREVIEW ─── */}
        <div className="luxe-card" style={{ width: '100%', maxWidth: 840, padding: '0', overflow: 'hidden', textAlign: 'left', boxShadow: '0 30px 80px -20px rgba(0, 0, 0, 0.8), 0 0 60px rgba(99, 102, 241, 0.15)' }}>
          {/* Window Chrome */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '12px 18px',
            display: 'flex', alignItems: 'center', gap: 8,
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#ef4444', opacity: 0.8 }} />
              <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#f59e0b', opacity: 0.8 }} />
              <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#10b981', opacity: 0.8 }} />
            </div>
            <div style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              jarvis-bot.dashboard • v2.4.0
            </div>
          </div>

          {/* Window Body Mock */}
          <div style={{ padding: '24px', background: 'rgba(10, 13, 20, 0.95)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>AutoMod Shield</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#34d399', marginTop: 4 }}>100% Protected</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Anti-spam & invite blocker active</div>
            </div>

            <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Active Shard</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#818cf8', marginTop: 4 }}>Shard #1 • 18ms</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>High-speed websocket sync</div>
            </div>

            <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Social Feeds</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#f43f5e', marginTop: 4 }}>YouTube & TikTok</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Real-time push notifications</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── MARQUEE COMMANDS STRIP ─── */}
      <div style={{
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '14px 0',
        background: 'rgba(6, 8, 14, 0.8)',
      }}>
        <div className="marquee-container">
          <div className="marquee-content">
            {COMMANDS.map((cmd, i) => (
              <span key={i} className="luxe-code" style={{ padding: '4px 12px', fontSize: 13, color: '#a5b4fc' }}>
                {cmd}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ─── FEATURES BENTO GRID ─── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '100px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div className="luxe-badge luxe-badge-indigo" style={{ marginBottom: 16 }}>SYSTEM CAPABILITIES</div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>
            Built for Modern Discord Communities
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 18 }}>
          {FEATURES.map(f => (
            <div key={f.title} className="luxe-card" style={{ padding: '26px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 24 }}>{f.icon}</span>
                <span className="luxe-badge luxe-badge-muted">{f.tag}</span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{f.title}</h3>
              <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.55 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16,
        maxWidth: 1100, margin: '0 auto',
        fontSize: 13, color: 'var(--text-muted)',
      }}>
        <div>JARVIS BOT • Engineered by <strong style={{ color: '#fff' }}>trj7</strong></div>
        <div style={{ display: 'flex', gap: 20 }}>
          <span>Privacy</span>
          <span>Terms</span>
          <span>Support</span>
        </div>
      </footer>

    </div>
  );
}
