'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const FEATURES = [
  {
    icon: '🛡️',
    title: 'Permission Control',
    desc: 'Granular role & user-level access control for every bot command. Fine-tune who can do what.',
    gradient: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0.05) 100%)',
    border: 'rgba(99,102,241,0.22)',
    glow: 'rgba(99,102,241,0.2)',
    accent: '#818cf8',
  },
  {
    icon: '🤖',
    title: 'Auto-Moderation',
    desc: 'Automatic bad word filter, anti-spam detection, invite link blocker — protect your community effortlessly.',
    gradient: 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.04) 100%)',
    border: 'rgba(239,68,68,0.22)',
    glow: 'rgba(239,68,68,0.2)',
    accent: '#f87171',
  },
  {
    icon: '👋',
    title: 'Welcome & Goodbye',
    desc: 'Fully customizable welcome & goodbye messages with dynamic placeholders and rich formatting.',
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.04) 100%)',
    border: 'rgba(16,185,129,0.22)',
    glow: 'rgba(16,185,129,0.2)',
    accent: '#34d399',
  },
  {
    icon: '🌐',
    title: 'Social Notifier',
    desc: 'Auto-post YouTube, Facebook, Instagram & TikTok updates to your Discord — via RSS feeds.',
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.04) 100%)',
    border: 'rgba(245,158,11,0.22)',
    glow: 'rgba(245,158,11,0.2)',
    accent: '#fbbf24',
  },
  {
    icon: '📋',
    title: 'Mod Logging',
    desc: 'Full audit trail of moderation actions & server events. Bans, kicks, edits all logged.',
    gradient: 'linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(139,92,246,0.05) 100%)',
    border: 'rgba(139,92,246,0.22)',
    glow: 'rgba(139,92,246,0.2)',
    accent: '#a78bfa',
  },
  {
    icon: '🎵',
    title: 'Music Player',
    desc: 'High-quality music playback with queue, skip, volume, seek, and now-playing display.',
    gradient: 'linear-gradient(135deg, rgba(236,72,153,0.15) 0%, rgba(236,72,153,0.04) 100%)',
    border: 'rgba(236,72,153,0.22)',
    glow: 'rgba(236,72,153,0.2)',
    accent: '#f472b6',
  },
];

const STATS = [
  { value: '99.9%', label: 'Uptime' },
  { value: '<50ms', label: 'Latency' },
  { value: '7+', label: 'Features' },
];

const STEPS = [
  { num: '01', title: 'Login with Discord', desc: 'Authenticate securely via OAuth2. No passwords stored.' },
  { num: '02', title: 'Select Your Server', desc: 'Choose from servers where you have admin privileges.' },
  { num: '03', title: 'Configure & Deploy', desc: 'Set permissions, automod, social feeds. Changes apply instantly.' },
];

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState(null);

  useEffect(() => {
    if (status === 'authenticated') router.push('/dashboard');
  }, [status, router]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    await signIn('discord');
  };

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 20px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 500 }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', overflowX: 'hidden', position: 'relative' }}>

      {/* Noise texture */}
      <div className="noise-overlay" />

      {/* Background orbs */}
      <div className="orb animate-float" style={{ width: 700, height: 700, background: 'radial-gradient(circle, rgba(99,102,241,0.13) 0%, transparent 70%)', top: '-20%', left: '-15%', position: 'fixed' }} />
      <div className="orb animate-float-delayed" style={{ width: 600, height: 600, background: 'radial-gradient(circle, rgba(139,92,246,0.11) 0%, transparent 70%)', bottom: '-15%', right: '-10%', position: 'fixed' }} />
      <div className="orb animate-pulse-glow" style={{ width: 350, height: 350, background: 'radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)', top: '45%', right: '18%', position: 'fixed' }} />

      {/* Mesh grid */}
      <div className="mesh-grid" style={{ position: 'fixed' }} />

      {/* ─── NAVBAR ─── */}
      <nav className="navbar-premium">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="logo-icon">
            <JarvisIcon size={22} />
          </div>
          <div>
            <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.03em' }}>
              <span className="gradient-text">Jarvis</span>
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}> Bot</span>
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="badge-live" style={{ fontSize: 10.5 }}>
            <span className="badge-live-dot" />
            All Systems Operational
          </span>
          <button
            id="navbar-signin-btn"
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="btn-primary"
            style={{ padding: '9px 22px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <DiscordIcon size={16} />
            <span>{isSigningIn ? 'Connecting…' : 'Sign In'}</span>
          </button>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '140px 24px 100px', textAlign: 'center',
        position: 'relative', zIndex: 1,
      }}>

        {/* Pill badge */}
        <div className="pill-badge animate-slide-up" style={{ marginBottom: 32 }}>
          <span style={{ display: 'inline-block', width: 7, height: 7, background: '#818cf8', borderRadius: '50%', boxShadow: '0 0 10px #818cf8', animation: 'blink-dot 1.8s ease-in-out infinite' }} />
          AI-Powered Discord Bot &nbsp;·&nbsp; Made by <span style={{ color: '#a78bfa', fontWeight: 700 }}>trj7</span>
        </div>

        {/* Title */}
        <h1 className="animate-slide-up-delay-1" style={{
          fontSize: 'clamp(48px, 8vw, 88px)',
          fontWeight: 900, letterSpacing: '-0.05em',
          lineHeight: 1.0, marginBottom: 28, maxWidth: 900,
        }}>
          Meet <span className="shimmer-text">Jarvis.</span>
          <br />
          <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: '0.5em', letterSpacing: '-0.02em', lineHeight: 2.2 }}>
            Your Discord Server, Supercharged.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="animate-slide-up-delay-2" style={{
          fontSize: 'clamp(16px, 2.2vw, 20px)',
          color: 'var(--text-secondary)',
          maxWidth: 600, lineHeight: 1.75, marginBottom: 52, fontWeight: 400,
        }}>
          A powerful multi-feature Discord bot with a sleek management dashboard.
          Control moderation, automod, social feeds, welcome messages, logging, roles & music — all from one place.
        </p>

        {/* CTA */}
        <div className="animate-slide-up-delay-3" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 80 }}>
          <button
            id="hero-login-btn"
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="btn-primary"
            style={{ padding: '17px 38px', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12, borderRadius: 14 }}
          >
            <DiscordIcon size={22} />
            <span>{isSigningIn ? 'Connecting to Discord…' : 'Login with Discord'}</span>
          </button>

          <a
            href="#features"
            style={{
              padding: '17px 30px', fontSize: 15, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 8,
              borderRadius: 14, cursor: 'pointer', textDecoration: 'none',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--text-secondary)',
              transition: 'all 0.25s ease',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            Explore Features <span style={{ fontSize: 18 }}>↓</span>
          </a>
        </div>

        {/* Stats */}
        <div className="animate-slide-up-delay-4" style={{ display: 'flex', gap: 64, flexWrap: 'wrap', justifyContent: 'center' }}>
          {STATS.map((s, i) => (
            <div key={s.label} className="hero-stat" style={{ paddingRight: i < STATS.length - 1 ? 64 : 0 }}>
              <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }} className="gradient-text">{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', opacity: 0.4 }}>
          <div style={{ width: 24, height: 38, border: '1.5px solid rgba(99,102,241,0.4)', borderRadius: 12, display: 'flex', justifyContent: 'center', paddingTop: 7 }}>
            <div style={{ width: 4, height: 8, background: '#818cf8', borderRadius: 4, animation: 'float 1.8s ease-in-out infinite' }} />
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" style={{ padding: '120px 24px', maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#818cf8', marginBottom: 16 }}>
            Core Features
          </div>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 16 }}>
            Everything your server needs,
            <br /><span className="gradient-text">all in one place.</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 17, maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
            Jarvis Bot combines powerful moderation, automation, and entertainment features — fully configurable from the dashboard.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 20 }}>
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="feature-card animate-slide-up"
              onMouseEnter={() => setHoveredFeature(i)}
              onMouseLeave={() => setHoveredFeature(null)}
              style={{ animationDelay: `${0.1 * i}s`, opacity: 0, animationFillMode: 'forwards' }}
            >
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg, transparent, ${f.accent}, transparent)`,
                opacity: hoveredFeature === i ? 1 : 0, transition: 'opacity 0.3s ease',
              }} />
              <div style={{
                position: 'absolute', inset: 0, background: f.gradient,
                opacity: hoveredFeature === i ? 1 : 0, transition: 'opacity 0.35s ease',
                borderRadius: 'inherit', pointerEvents: 'none',
              }} />
              <div style={{
                width: 54, height: 54, borderRadius: 16, fontSize: 24,
                background: f.gradient, border: `1px solid ${f.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20, position: 'relative', zIndex: 1,
                boxShadow: hoveredFeature === i ? `0 0 30px ${f.glow}` : 'none',
                transition: 'box-shadow 0.35s ease',
              }}>{f.icon}</div>
              <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 10, letterSpacing: '-0.02em', position: 'relative', zIndex: 1 }}>{f.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14.5, lineHeight: 1.65, position: 'relative', zIndex: 1 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section style={{ padding: '100px 24px', position: 'relative', zIndex: 1, borderTop: '1px solid rgba(99,102,241,0.07)', borderBottom: '1px solid rgba(99,102,241,0.07)', background: 'rgba(10,14,28,0.4)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#a78bfa', marginBottom: 16 }}>How It Works</div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 64 }}>
            Get started in <span className="shimmer-text">3 simple steps</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32 }}>
            {STEPS.map((step) => (
              <div key={step.num}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1))',
                  border: '1px solid rgba(99,102,241,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                  fontSize: 16, fontWeight: 800, color: '#818cf8',
                  fontFamily: "'Inter', monospace",
                  boxShadow: '0 0 30px rgba(99,102,241,0.12)',
                }}>{step.num}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, letterSpacing: '-0.02em' }}>{step.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.65 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section style={{ padding: '120px 24px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{
            position: 'absolute', top: '30%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 500, height: 300,
            background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)',
            filter: 'blur(40px)', pointerEvents: 'none',
          }} />
          <h2 style={{ fontSize: 'clamp(36px, 5.5vw, 64px)', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1.0, marginBottom: 24, position: 'relative' }}>
            Ready to power up<br /><span className="shimmer-text">your server?</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 17, lineHeight: 1.7, marginBottom: 44 }}>
            Join servers already using Jarvis Bot to manage their communities more efficiently.
          </p>
          <button
            id="cta-login-btn"
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="btn-primary"
            style={{ padding: '18px 44px', fontSize: 17, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 13, borderRadius: 16 }}
          >
            <DiscordIcon size={24} />
            <span>{isSigningIn ? 'Connecting…' : 'Get Started Free'}</span>
          </button>
          <p style={{ marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>No credit card required · Free forever</p>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{
        borderTop: '1px solid rgba(99,102,241,0.07)',
        padding: '28px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16,
        position: 'relative', zIndex: 1,
        background: 'rgba(5, 7, 15, 0.6)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="logo-icon" style={{ width: 30, height: 30, fontSize: 15, borderRadius: 8 }}>
            <JarvisIcon size={16} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.02em' }}>
            <span className="gradient-text">Jarvis</span>
            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> Bot</span>
          </span>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 2 }}>
            Built with ❤️ for Discord communities
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            Made by&nbsp;
            <span style={{ color: '#818cf8', fontWeight: 700, letterSpacing: '-0.01em' }}>trj7</span>
          </p>
        </div>

        <div style={{ display: 'flex', gap: 20 }}>
          {['Privacy', 'Terms', 'Support'].map(link => (
            <span
              key={link}
              style={{ fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#818cf8'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >{link}</span>
          ))}
        </div>
      </footer>
    </div>
  );
}

function DiscordIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
    </svg>
  );
}

function JarvisIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 8v4l3 3"/>
      <path d="M8.5 8.5l7 7"/>
    </svg>
  );
}
