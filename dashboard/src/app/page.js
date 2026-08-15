'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const FEATURES = [
  {
    icon: '🛡️',
    title: 'Permission Control',
    desc: 'Granular role & user-level access control for every bot command. Fine-tune who can do what.',
    gradient: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(99,102,241,0.05) 100%)',
    border: 'rgba(99,102,241,0.3)',
    glow: 'rgba(99,102,241,0.3)',
    accent: '#818cf8',
    tag: 'Security',
  },
  {
    icon: '🤖',
    title: 'Auto-Moderation',
    desc: 'Automatic bad word filter, anti-spam detection, invite link blocker — protect your community effortlessly.',
    gradient: 'linear-gradient(135deg, rgba(239,68,68,0.18) 0%, rgba(239,68,68,0.05) 100%)',
    border: 'rgba(239,68,68,0.3)',
    glow: 'rgba(239,68,68,0.25)',
    accent: '#f87171',
    tag: 'AutoMod',
  },
  {
    icon: '👋',
    title: 'Welcome & Goodbye',
    desc: 'Fully customizable welcome & goodbye messages with dynamic placeholders and rich formatting.',
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(16,185,129,0.05) 100%)',
    border: 'rgba(16,185,129,0.3)',
    glow: 'rgba(16,185,129,0.25)',
    accent: '#34d399',
    tag: 'Events',
  },
  {
    icon: '🌐',
    title: 'Social Notifier',
    desc: 'Auto-post YouTube, Facebook, Instagram & TikTok updates to your Discord — via RSS feeds.',
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(245,158,11,0.05) 100%)',
    border: 'rgba(245,158,11,0.3)',
    glow: 'rgba(245,158,11,0.25)',
    accent: '#fbbf24',
    tag: 'Social',
  },
  {
    icon: '📋',
    title: 'Mod Logging',
    desc: 'Full audit trail of moderation actions & server events. Bans, kicks, edits all logged.',
    gradient: 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(139,92,246,0.05) 100%)',
    border: 'rgba(139,92,246,0.3)',
    glow: 'rgba(139,92,246,0.25)',
    accent: '#a78bfa',
    tag: 'Logs',
  },
  {
    icon: '🎵',
    title: 'Music Player',
    desc: 'High-quality music playback with queue, skip, volume, seek, and now-playing display.',
    gradient: 'linear-gradient(135deg, rgba(236,72,153,0.18) 0%, rgba(236,72,153,0.05) 100%)',
    border: 'rgba(236,72,153,0.3)',
    glow: 'rgba(236,72,153,0.25)',
    accent: '#f472b6',
    tag: 'Music',
  },
];

const STEPS = [
  { num: '01', title: 'Login with Discord', desc: 'Authenticate securely via OAuth2. No passwords stored.', icon: '🔐' },
  { num: '02', title: 'Select Your Server', desc: 'Choose from servers where you have admin privileges.', icon: '🏠' },
  { num: '03', title: 'Configure & Deploy', desc: 'Set permissions, automod, social feeds. Changes apply instantly.', icon: '⚡' },
];

const ALL_COMMANDS = [
  '/ban', '/kick', '/mute', '/warn', '/play', '/skip', '/queue',
  '/setup-roles', '/ssverify', '/roleall', '/nowplaying', '/volume',
  '/modlog', '/welcome', '/goodbye', '/antispam', '/automod',
  '/permissions', '/pause', '/resume', '/stop', '/seek',
];

const DISCORD_MESSAGES = [
  { content: '✅ Ban applied to <strong style="color:#fff">@spammer</strong> — Reason: Spam', color: '#818cf8', label: 'Moderation' },
  { content: '👋 Welcome to <strong style="color:#fff">Jarvis Server</strong>, @NewUser! You are member #1,337.', color: '#34d399', label: 'Welcome' },
  { content: '🎵 Now playing: <strong style="color:#fff">Blinding Lights</strong> by The Weeknd', color: '#f472b6', label: 'Music' },
  { content: '🛡️ AutoMod removed a message containing a blacklisted word from @user', color: '#f87171', label: 'AutoMod' },
];

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [msgIndex, setMsgIndex] = useState(0);
  const [msgVisible, setMsgVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (status === 'authenticated') router.push('/dashboard');
  }, [status, router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgVisible(false);
      setTimeout(() => {
        setMsgIndex(prev => (prev + 1) % DISCORD_MESSAGES.length);
        setMsgVisible(true);
      }, 350);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    await signIn('discord');
  };

  if (status === 'loading' || !mounted) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(ellipse 120% 120% at 50% -10%, rgba(99,102,241,0.25) 0%, #05070f 60%)',
        flexDirection: 'column', gap: 20,
      }}>
        {/* Animated logo */}
        <div style={{ position: 'relative' }}>
          <div style={{
            width: 80, height: 80, borderRadius: 24,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 60px rgba(99,102,241,0.6), 0 0 120px rgba(99,102,241,0.3)',
            animation: 'pulse-glow 2s ease-in-out infinite',
          }}>
            <JarvisIcon size={38} />
          </div>
          <div style={{ position: 'absolute', inset: -12, borderRadius: 36, border: '2px solid rgba(99,102,241,0.25)', animation: 'spin-slow 4s linear infinite' }} />
          <div style={{ position: 'absolute', inset: -24, borderRadius: 48, border: '1px solid rgba(139,92,246,0.12)', animation: 'spin-slow 6s linear infinite reverse' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em' }}>
            <span className="gradient-text">Jarvis</span>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}> Bot</span>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 6, fontWeight: 500 }}>Initializing systems...</div>
        </div>
      </div>
    );
  }

  const msg = DISCORD_MESSAGES[msgIndex];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#05070f',
      color: '#f0f4ff',
      overflowX: 'hidden',
      position: 'relative',
    }}>

      {/* ═══ BACKGROUND SYSTEM ═══ */}

      {/* Primary gradient — top center radial */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 80% 60% at 50% -5%, rgba(99,102,241,0.28) 0%, transparent 70%)',
      }} />

      {/* Left purple orb */}
      <div style={{
        position: 'fixed', width: 700, height: 700, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
        filter: 'blur(80px)', top: '-15%', left: '-15%',
        pointerEvents: 'none', zIndex: 0,
        animation: 'float 9s ease-in-out infinite',
      }} />

      {/* Right violet orb */}
      <div style={{
        position: 'fixed', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
        filter: 'blur(80px)', bottom: '-10%', right: '-10%',
        pointerEvents: 'none', zIndex: 0,
        animation: 'float-delayed 11s ease-in-out infinite',
      }} />

      {/* Pink accent orb */}
      <div style={{
        position: 'fixed', width: 350, height: 350, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)',
        filter: 'blur(60px)', top: '45%', right: '15%',
        pointerEvents: 'none', zIndex: 0,
        animation: 'pulse-glow 5s ease-in-out infinite',
      }} />

      {/* Mesh grid */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
        maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
      }} />

      {/* Noise texture */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.03,
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'repeat', backgroundSize: '128px 128px',
      }} />

      {/* ═══ NAVBAR ═══ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px',
        background: 'rgba(5,7,15,0.8)',
        backdropFilter: 'blur(32px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 1px 0 rgba(99,102,241,0.1), 0 8px 40px rgba(0,0,0,0.4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99,102,241,0.6), 0 0 40px rgba(99,102,241,0.2)',
            flexShrink: 0,
          }}>
            <JarvisIcon size={20} />
          </div>
          <div>
            <span style={{ fontWeight: 900, fontSize: 17, letterSpacing: '-0.04em' }}>
              <span style={{
                background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #e879f9 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Jarvis</span>
              <span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 400 }}> Bot</span>
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
            color: '#34d399', padding: '4px 12px', borderRadius: 999,
            fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            <span style={{ width: 5, height: 5, background: '#34d399', borderRadius: '50%', boxShadow: '0 0 8px #34d399', animation: 'blink-dot 1.8s ease-in-out infinite' }} />
            All Systems Operational
          </span>
          <button
            id="navbar-signin-btn"
            onClick={handleSignIn}
            disabled={isSigningIn}
            style={{
              position: 'relative', overflow: 'hidden',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #7c3aed)',
              backgroundSize: '200% 200%',
              color: 'white', fontWeight: 700, fontSize: 14,
              fontFamily: 'inherit', borderRadius: 12,
              border: '1px solid rgba(139,92,246,0.4)',
              padding: '10px 24px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 9,
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
              animation: 'gradient-shift 4s ease infinite',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 0 1px rgba(139,92,246,0.6), 0 8px 40px rgba(99,102,241,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.3)'; e.currentTarget.style.transform = 'none'; }}
          >
            <DiscordIcon size={16} />
            <span>{isSigningIn ? 'Connecting…' : 'Sign In'}</span>
          </button>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '120px 24px 80px', textAlign: 'center',
        position: 'relative', zIndex: 1,
      }}>

        {/* Badge */}
        <div className="animate-slide-up" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '8px 20px',
          background: 'rgba(99,102,241,0.08)',
          border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: 999, fontSize: 13, fontWeight: 600, color: '#a5b4fc',
          backdropFilter: 'blur(12px)', marginBottom: 36,
          boxShadow: '0 0 30px rgba(99,102,241,0.12)',
          animation: 'shimmer-border 3s ease-in-out infinite',
        }}>
          <span style={{ width: 7, height: 7, background: '#818cf8', borderRadius: '50%', boxShadow: '0 0 12px #818cf8', animation: 'blink-dot 1.8s ease-in-out infinite' }} />
          AI-Powered Discord Bot &nbsp;·&nbsp; Made by <span style={{ color: '#e879f9', fontWeight: 800 }}>trj7</span>
        </div>

        {/* Main title */}
        <h1 className="animate-slide-up-delay-1" style={{
          fontSize: 'clamp(56px, 10vw, 110px)',
          fontWeight: 900, letterSpacing: '-0.06em',
          lineHeight: 0.95, marginBottom: 32, maxWidth: 1000,
        }}>
          <span style={{
            background: 'linear-gradient(135deg, #c4b5fd 0%, #818cf8 30%, #a78bfa 60%, #f0abfc 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            filter: 'drop-shadow(0 0 40px rgba(139,92,246,0.4))',
            backgroundSize: '300% auto', animation: 'shimmer 5s linear infinite',
          }}>Jarvis.</span>
          <br />
          <span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 400, fontSize: '0.42em', letterSpacing: '-0.02em', lineHeight: 2.8, display: 'block' }}>
            Your Discord Server, Supercharged.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="animate-slide-up-delay-2" style={{
          fontSize: 'clamp(16px, 2vw, 19px)',
          color: 'rgba(136,146,176,0.9)',
          maxWidth: 580, lineHeight: 1.8, marginBottom: 56, fontWeight: 400,
        }}>
          A powerful multi-feature Discord bot with a sleek management dashboard.
          Control moderation, automod, social feeds, welcome messages, logging, roles & music — all from one place.
        </p>

        {/* CTAs */}
        <div className="animate-slide-up-delay-3" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 80 }}>
          <button
            id="hero-login-btn"
            onClick={handleSignIn}
            disabled={isSigningIn}
            style={{
              position: 'relative', overflow: 'hidden',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #7c3aed)',
              backgroundSize: '200% 200%', color: 'white',
              fontWeight: 700, fontSize: 17, fontFamily: 'inherit',
              borderRadius: 16, border: '1px solid rgba(139,92,246,0.4)',
              padding: '18px 44px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 14,
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 40px rgba(99,102,241,0.4), 0 0 0 1px rgba(99,102,241,0.2)',
              animation: 'gradient-shift 4s ease infinite',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 0 2px rgba(139,92,246,0.7), 0 16px 60px rgba(99,102,241,0.55)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 8px 40px rgba(99,102,241,0.4), 0 0 0 1px rgba(99,102,241,0.2)'; e.currentTarget.style.transform = 'none'; }}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%)', pointerEvents: 'none' }} />
            <DiscordIcon size={22} />
            <span>{isSigningIn ? 'Connecting to Discord…' : 'Login with Discord'}</span>
          </button>

          <a href="#features" style={{
            padding: '18px 32px', fontSize: 16, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 10,
            borderRadius: 16, cursor: 'pointer', textDecoration: 'none',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(136,146,176,0.9)',
            transition: 'all 0.25s ease', fontFamily: 'inherit',
            backdropFilter: 'blur(12px)',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#f0f4ff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(136,146,176,0.9)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          >
            Explore Features <span style={{ fontSize: 20 }}>↓</span>
          </a>
        </div>

        {/* Stats Row */}
        <div className="animate-slide-up-delay-4" style={{ display: 'flex', gap: 56, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 72 }}>
          {[
            { value: '99.9%', label: 'Uptime', icon: '⚡' },
            { value: '<50ms', label: 'Response', icon: '🚀' },
            { value: '7+', label: 'Modules', icon: '🔥' },
          ].map((s, i) => (
            <div key={s.label} style={{ textAlign: 'center', position: 'relative', paddingRight: i < 2 ? 56 : 0 }}>
              {i < 2 && <div style={{ position: 'absolute', right: -4, top: '10%', bottom: '10%', width: 1, background: 'linear-gradient(180deg, transparent, rgba(99,102,241,0.3), transparent)' }} />}
              <div style={{ fontSize: 12, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1, background: 'linear-gradient(135deg, #818cf8, #a78bfa, #e879f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'rgba(74,85,104,1)', marginTop: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ══ DISCORD PREVIEW CARD ══ */}
        <div className="animate-slide-up-delay-4" style={{ position: 'relative', maxWidth: 580, width: '100%', marginTop: 8 }}>

          {/* Glow behind */}
          <div style={{
            position: 'absolute', inset: -60,
            background: 'radial-gradient(ellipse, rgba(99,102,241,0.3) 0%, rgba(139,92,246,0.15) 40%, transparent 70%)',
            filter: 'blur(40px)', pointerEvents: 'none', zIndex: -1,
          }} />

          {/* Animated gradient border */}
          <div style={{
            position: 'relative', borderRadius: 20, padding: '1.5px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.6), rgba(139,92,246,0.3), rgba(236,72,153,0.2), rgba(99,102,241,0.5))',
            backgroundSize: '300% 300%',
            animation: 'border-flow 5s ease infinite',
            boxShadow: '0 0 60px rgba(99,102,241,0.2), 0 40px 80px rgba(0,0,0,0.5)',
          }}>
            <div style={{ borderRadius: 19, overflow: 'hidden', background: '#1e1f22' }}>

              {/* Window chrome */}
              <div style={{ background: '#111214', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', gap: 7 }}>
                  {['#ff5f57', '#ffbd2e', '#28c840'].map(c => <div key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />)}
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '4px 14px' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(99,102,241,0.6)' }} />
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>discord.com — Jarvis Bot Dashboard</span>
                  </div>
                </div>
              </div>

              {/* Discord Layout */}
              <div style={{ display: 'flex', height: 260 }}>

                {/* Server icons */}
                <div style={{ background: '#1e1f22', width: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 0', gap: 10, borderRight: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
                  {[
                    { bg: 'linear-gradient(135deg,#6366f1,#8b5cf6)', letter: 'J', active: true },
                    { bg: '#3ba55c', letter: 'G', active: false },
                    { bg: '#ed4245', letter: 'F', active: false },
                    { bg: '#faa61a', letter: 'M', active: false },
                  ].map((s, i) => (
                    <div key={i} style={{
                      width: 40, height: 40,
                      borderRadius: s.active ? 14 : 20,
                      background: s.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 900, color: 'white',
                      boxShadow: s.active ? '0 0 20px rgba(99,102,241,0.6)' : 'none',
                      outline: s.active ? '2px solid rgba(99,102,241,0.8)' : 'none',
                      outlineOffset: 2, flexShrink: 0, transition: 'all 0.2s ease',
                    }}>{s.letter}</div>
                  ))}
                </div>

                {/* Channel list */}
                <div style={{ background: '#2b2d31', width: 175, padding: '14px 8px', borderRight: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#8e919a', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 8px', marginBottom: 8 }}>Jarvis Server</div>
                  {[
                    { name: '# general', active: false },
                    { name: '# bot-commands', active: true },
                    { name: '# logs', active: false },
                    { name: '# music', active: false },
                    { name: '🔊 Voice', active: false },
                  ].map((ch) => (
                    <div key={ch.name} style={{
                      padding: '5px 10px', borderRadius: 5,
                      fontSize: 13, color: ch.active ? '#fff' : '#72767d',
                      background: ch.active ? 'rgba(255,255,255,0.12)' : 'transparent',
                      fontFamily: 'Inter, sans-serif', marginBottom: 2,
                      fontWeight: ch.active ? 600 : 400,
                    }}>{ch.name}</div>
                  ))}
                </div>

                {/* Messages */}
                <div style={{ flex: 1, background: '#313338', padding: '16px 16px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 12, overflow: 'hidden' }}>

                  {/* Old message (faded) */}
                  <div style={{ opacity: 0.28, fontSize: 12.5, color: '#8e919a', fontFamily: 'Inter,sans-serif' }}>
                    <span style={{ color: '#a78bfa', fontWeight: 600 }}>trj7</span>
                    <span style={{ marginLeft: 8 }}>/play Blinding Lights</span>
                  </div>

                  {/* Animated bot message */}
                  <div style={{
                    transition: 'opacity 0.3s ease, transform 0.3s ease',
                    opacity: msgVisible ? 1 : 0,
                    transform: msgVisible ? 'translateY(0)' : 'translateY(6px)',
                  }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                        boxShadow: '0 0 14px rgba(99,102,241,0.5)',
                      }}>⚡</div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: msg.color, fontFamily: 'Inter,sans-serif' }}>Jarvis Bot</span>
                          <span style={{ fontSize: 9.5, fontWeight: 700, background: '#5865f2', color: 'white', padding: '1px 5px', borderRadius: 3 }}>BOT</span>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontFamily: 'Inter,sans-serif' }}>Today at 7:06 PM</span>
                        </div>
                        <div style={{ fontSize: 13.5, color: '#dbdee1', lineHeight: 1.5, fontFamily: 'Inter,sans-serif' }}
                          dangerouslySetInnerHTML={{ __html: msg.content }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Typing dots */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#5865f2', animation: `blink-dot 1.2s ease-in-out ${i * 0.22}s infinite` }} />
                      ))}
                    </div>
                    <span style={{ fontSize: 11.5, color: '#8e919a', fontFamily: 'Inter,sans-serif' }}>Jarvis Bot is typing...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', opacity: 0.35 }}>
          <div style={{ width: 24, height: 38, border: '1.5px solid rgba(99,102,241,0.5)', borderRadius: 12, display: 'flex', justifyContent: 'center', paddingTop: 7 }}>
            <div style={{ width: 4, height: 9, background: 'linear-gradient(180deg,#818cf8,#a78bfa)', borderRadius: 4, animation: 'float 1.8s ease-in-out infinite' }} />
          </div>
        </div>
      </section>

      {/* ═══ COMMANDS MARQUEE ═══ */}
      <div style={{
        position: 'relative', zIndex: 1, overflow: 'hidden',
        borderTop: '1px solid rgba(99,102,241,0.08)',
        borderBottom: '1px solid rgba(99,102,241,0.08)',
        background: 'rgba(5,7,15,0.9)',
        padding: '16px 0',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #05070f 0%, transparent 12%, transparent 88%, #05070f 100%)', zIndex: 2, pointerEvents: 'none' }} />
        <div style={{ display: 'flex' }}>
          <div className="marquee-track">
            {[...ALL_COMMANDS, ...ALL_COMMANDS].map((cmd, i) => (
              <div key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '6px 16px', margin: '0 6px',
                background: 'rgba(10,14,28,0.95)',
                border: '1px solid rgba(99,102,241,0.15)',
                borderRadius: 999, fontSize: 12.5, fontWeight: 600,
                color: 'rgba(136,146,176,0.8)', whiteSpace: 'nowrap',
                fontFamily: "'JetBrains Mono', monospace",
                flexShrink: 0,
              }}>
                <span style={{ color: '#818cf8', fontWeight: 800 }}>/</span>
                {cmd.replace('/', '')}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ FEATURES ═══ */}
      <section id="features" style={{ padding: '120px 24px', maxWidth: 1300, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 80 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#818cf8', marginBottom: 18 }}>Core Features</div>
          <h2 style={{ fontSize: 'clamp(36px, 5vw, 58px)', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1.05, marginBottom: 20 }}>
            Everything your server needs,
            <br />
            <span style={{ background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 45%, #e879f9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>all in one place.</span>
          </h2>
          <p style={{ color: 'rgba(136,146,176,0.8)', fontSize: 17, maxWidth: 540, margin: '0 auto', lineHeight: 1.8 }}>
            Jarvis Bot combines powerful moderation, automation, and entertainment features — fully configurable from the dashboard.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="animate-slide-up"
              onMouseEnter={() => setHoveredFeature(i)}
              onMouseLeave={() => setHoveredFeature(null)}
              style={{
                position: 'relative', overflow: 'hidden',
                background: hoveredFeature === i ? f.gradient : 'rgba(10,14,28,0.8)',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${hoveredFeature === i ? f.border : 'rgba(99,102,241,0.1)'}`,
                borderRadius: 20, padding: '28px 26px',
                transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
                transform: hoveredFeature === i ? 'translateY(-8px)' : 'none',
                boxShadow: hoveredFeature === i ? `0 32px 80px rgba(0,0,0,0.5), 0 0 60px ${f.glow}` : '0 4px 20px rgba(0,0,0,0.2)',
                animationDelay: `${0.08 * i}s`, opacity: 0, animationFillMode: 'forwards',
                cursor: 'default',
              }}
            >
              {/* Inner light */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%)', pointerEvents: 'none' }} />

              {/* Top accent */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${f.accent}, transparent)`, opacity: hoveredFeature === i ? 1 : 0, transition: 'opacity 0.3s' }} />

              {/* Tag */}
              <div style={{ position: 'absolute', top: 18, right: 18 }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', background: `${f.border}`, border: `1px solid ${f.border}`, borderRadius: 999, color: f.accent, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{f.tag}</span>
              </div>

              <div style={{ width: 56, height: 56, borderRadius: 16, fontSize: 26, background: f.gradient, border: `1px solid ${f.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22, position: 'relative', zIndex: 1, boxShadow: hoveredFeature === i ? `0 0 40px ${f.glow}` : 'none', transition: 'box-shadow 0.35s ease' }}>{f.icon}</div>
              <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 10, letterSpacing: '-0.03em', position: 'relative', zIndex: 1 }}>{f.title}</h3>
              <p style={{ color: 'rgba(136,146,176,0.85)', fontSize: 14, lineHeight: 1.7, position: 'relative', zIndex: 1 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section style={{ padding: '100px 24px', position: 'relative', zIndex: 1, background: 'rgba(8,11,22,0.6)', borderTop: '1px solid rgba(99,102,241,0.07)', borderBottom: '1px solid rgba(99,102,241,0.07)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#a78bfa', marginBottom: 18 }}>How It Works</div>
          <h2 style={{ fontSize: 'clamp(30px, 4.5vw, 52px)', fontWeight: 900, letterSpacing: '-0.05em', marginBottom: 72 }}>
            Get started in{' '}
            <span style={{ background: 'linear-gradient(90deg, #818cf8 0%, #a78bfa 30%, #e879f9 60%, #a78bfa 80%, #818cf8 100%)', backgroundSize: '300% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'shimmer 5s linear infinite' }}>3 simple steps</span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 40 }}>
            {STEPS.map((step, i) => (
              <div key={step.num} style={{ position: 'relative' }}>
                {i < STEPS.length - 1 && (
                  <div style={{ position: 'absolute', top: 35, left: 'calc(50% + 50px)', right: 'calc(-50% + 50px)', height: 1, background: 'linear-gradient(90deg, rgba(99,102,241,0.3), transparent)', display: 'none' }} />
                )}
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: 28 }}>
                  <div style={{ width: 72, height: 72, borderRadius: 22, background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1))', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: 30, boxShadow: '0 0 50px rgba(99,102,241,0.15)' }}>{step.icon}</div>
                  <div style={{ position: 'absolute', bottom: -6, right: -6, width: 24, height: 24, borderRadius: 999, background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: 'white', boxShadow: '0 0 16px rgba(99,102,241,0.6)' }}>{step.num.replace('0', '')}</div>
                </div>
                <h3 style={{ fontSize: 19, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.03em' }}>{step.title}</h3>
                <p style={{ color: 'rgba(136,146,176,0.8)', fontSize: 14.5, lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TRUST ═══ */}
      <section style={{ padding: '72px 24px', position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <p style={{ fontSize: 12.5, color: 'rgba(74,85,104,0.9)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 32 }}>Trusted by Discord communities worldwide</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          {[
            { letter: 'J', bg: 'linear-gradient(135deg,#6366f1,#8b5cf6)', name: 'Jarvis HQ' },
            { letter: 'G', bg: '#3ba55c', name: 'GamersHub' },
            { letter: 'F', bg: '#ed4245', name: 'Fragnatics' },
            { letter: 'M', bg: '#faa61a', name: 'MetaVerse' },
            { letter: 'C', bg: '#5865f2', name: 'CyberNexus' },
            { letter: 'P', bg: '#f472b6', name: 'ProZone' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'default', transition: 'transform 0.2s ease' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <div style={{ width: 50, height: 50, borderRadius: 15, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: 'white', border: '2px solid rgba(99,102,241,0.2)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>{s.letter}</div>
              <span style={{ fontSize: 11, color: 'rgba(74,85,104,0.9)', fontWeight: 600, maxWidth: 72, textAlign: 'center', lineHeight: 1.3 }}>{s.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section style={{ padding: '100px 24px 120px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 700, margin: '0 auto', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 400, background: 'radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.22)', borderRadius: 999, fontSize: 13, fontWeight: 600, color: '#a5b4fc', marginBottom: 28 }}>
            <span style={{ fontSize: 15 }}>🚀</span> Free to use · No credit card required
          </div>

          <h2 style={{ fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 900, letterSpacing: '-0.06em', lineHeight: 0.95, marginBottom: 28, position: 'relative' }}>
            Ready to power up<br />
            <span style={{ background: 'linear-gradient(90deg, #818cf8 0%, #a78bfa 30%, #e879f9 60%, #a78bfa 80%, #818cf8 100%)', backgroundSize: '300% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'shimmer 5s linear infinite' }}>your server?</span>
          </h2>
          <p style={{ color: 'rgba(136,146,176,0.8)', fontSize: 17, lineHeight: 1.8, marginBottom: 48 }}>
            Join servers already using Jarvis Bot to manage their communities more efficiently.
          </p>
          <button
            id="cta-login-btn"
            onClick={handleSignIn}
            disabled={isSigningIn}
            style={{
              position: 'relative', overflow: 'hidden',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #7c3aed)',
              backgroundSize: '200% 200%', color: 'white',
              fontWeight: 700, fontSize: 18, fontFamily: 'inherit',
              borderRadius: 18, border: '1px solid rgba(139,92,246,0.4)',
              padding: '20px 54px', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 14,
              transition: 'all 0.3s ease',
              boxShadow: '0 12px 50px rgba(99,102,241,0.45), 0 0 0 1px rgba(99,102,241,0.2)',
              animation: 'gradient-shift 4s ease infinite',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(139,92,246,0.7), 0 20px 70px rgba(99,102,241,0.6)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 12px 50px rgba(99,102,241,0.45), 0 0 0 1px rgba(99,102,241,0.2)'; }}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%)', pointerEvents: 'none' }} />
            <DiscordIcon size={24} />
            <span>{isSigningIn ? 'Connecting…' : 'Get Started Free'}</span>
          </button>
          <p style={{ marginTop: 20, fontSize: 13, color: 'rgba(74,85,104,0.9)' }}>No credit card required · Free forever · Instant setup</p>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.04)',
        padding: '32px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16,
        position: 'relative', zIndex: 1,
        background: 'rgba(5,7,15,0.9)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg,#6366f1,#8b5cf6,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(99,102,241,0.5)' }}>
            <JarvisIcon size={15} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-0.03em' }}>
            <span style={{ background: 'linear-gradient(135deg,#818cf8,#a78bfa,#e879f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Jarvis</span>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 400 }}> Bot</span>
          </span>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'rgba(74,85,104,0.8)', fontSize: 13, marginBottom: 3 }}>Built with ❤️ for Discord communities</p>
          <p style={{ color: 'rgba(74,85,104,0.8)', fontSize: 12 }}>Made by <span style={{ color: '#818cf8', fontWeight: 800 }}>trj7</span></p>
        </div>

        <div style={{ display: 'flex', gap: 24 }}>
          {['Privacy', 'Terms', 'Support'].map(link => (
            <span key={link} style={{ fontSize: 13, color: 'rgba(74,85,104,0.7)', cursor: 'pointer', transition: 'color 0.2s', fontWeight: 500 }}
              onMouseEnter={e => e.currentTarget.style.color = '#818cf8'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(74,85,104,0.7)'}
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
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: 'white' }}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
}
