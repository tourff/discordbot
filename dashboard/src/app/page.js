'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const FEATURES = [
  {
    icon: '🛡️',
    title: 'Permission Control',
    desc: 'Granular role & user-level access control for every bot command.',
    color: 'rgba(99,102,241,0.15)',
    border: 'rgba(99,102,241,0.25)',
  },
  {
    icon: '👋',
    title: 'Welcome System',
    desc: 'Fully customizable welcome & goodbye messages with dynamic placeholders.',
    color: 'rgba(168,85,247,0.15)',
    border: 'rgba(168,85,247,0.25)',
  },
  {
    icon: '⚡',
    title: 'Instant Sync',
    desc: 'Changes propagate to your bot in real-time via Supabase.',
    color: 'rgba(236,72,153,0.15)',
    border: 'rgba(236,72,153,0.25)',
  },
];

const STATS = [
  { value: '99.9%', label: 'Uptime' },
  { value: '<50ms', label: 'Response' },
  { value: '∞', label: 'Servers' },
];

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    await signIn('discord');
  };

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', overflow: 'hidden', position: 'relative' }}>

      {/* Animated background orbs */}
      <div className="orb animate-float" style={{ width: 600, height: 600, background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)', top: '-15%', left: '-10%' }} />
      <div className="orb animate-float-delayed" style={{ width: 500, height: 500, background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)', bottom: '-10%', right: '-5%' }} />
      <div className="orb" style={{ width: 300, height: 300, background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)', top: '40%', right: '20%', animationDelay: '1s', animation: 'pulse-glow 5s ease-in-out infinite 1s' }} />

      {/* Dot grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(rgba(99,102,241,0.08) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        padding: '16px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(8,11,20,0.7)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(99,102,241,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, boxShadow: '0 0 20px rgba(99,102,241,0.4)',
          }}>⚡</div>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em' }}>
            <span className="gradient-text">Bot</span>
            <span style={{ color: 'var(--text-secondary)' }}> Dashboard</span>
          </span>
        </div>
        <button
          onClick={handleSignIn}
          disabled={isSigningIn}
          className="btn-primary"
          style={{ padding: '8px 20px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, position: 'relative', zIndex: 1 }}
        >
          <DiscordIcon size={16} />
          <span style={{ position: 'relative', zIndex: 1 }}>Sign In</span>
        </button>
      </nav>

      {/* Hero */}
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '120px 24px 80px', textAlign: 'center', position: 'relative',
      }}>
        {/* Badge */}
        <div className="animate-slide-up" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 16px',
          background: 'rgba(99,102,241,0.1)',
          border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: 999, fontSize: 13, fontWeight: 600,
          color: '#818cf8', marginBottom: 28,
          backdropFilter: 'blur(10px)',
        }}>
          <span style={{ display: 'inline-block', width: 7, height: 7, background: '#818cf8', borderRadius: '50%', boxShadow: '0 0 8px #818cf8', animation: 'pulse-glow 2s ease-in-out infinite' }} />
          Now with Real-time Sync
        </div>

        {/* Title */}
        <h1 className="animate-slide-up-delay-1" style={{
          fontSize: 'clamp(42px, 7vw, 80px)',
          fontWeight: 900,
          letterSpacing: '-0.04em',
          lineHeight: 1.05,
          marginBottom: 24, maxWidth: 800,
        }}>
          Your Bot.
          <br />
          <span className="shimmer-text">Your Rules.</span>
        </h1>

        <p className="animate-slide-up-delay-2" style={{
          fontSize: 'clamp(16px, 2vw, 20px)',
          color: 'var(--text-secondary)',
          maxWidth: 560, lineHeight: 1.7, marginBottom: 48,
        }}>
          A sleek, powerful dashboard to manage your Discord bot's permissions,
          welcome messages, and server settings — all in one place.
        </p>

        {/* CTA */}
        <div className="animate-slide-up-delay-3" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="btn-primary"
            style={{
              padding: '16px 36px', fontSize: 16, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1,
              borderRadius: 14,
            }}
          >
            <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
              <DiscordIcon size={22} />
              {isSigningIn ? 'Connecting...' : 'Login with Discord'}
            </span>
          </button>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex', gap: 48, marginTop: 72, flexWrap: 'wrap', justifyContent: 'center',
        }}>
          {STATS.map((s) => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em' }} className="gradient-text">{s.value}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="divider" style={{ width: '100%', maxWidth: 600, marginTop: 72 }} />

        {/* Feature cards */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 20, marginTop: 0, width: '100%', maxWidth: 900,
        }}>
          {FEATURES.map((f, i) => (
            <div key={f.title} className="glass-card animate-slide-up" style={{
              padding: '28px 24px', textAlign: 'left',
              animationDelay: `${0.1 * i + 0.5}s`,
              opacity: 0, animationFillMode: 'forwards',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, fontSize: 22,
                background: f.color, border: `1px solid ${f.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16,
              }}>{f.icon}</div>
              <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center', padding: '24px',
        color: 'var(--text-muted)', fontSize: 13,
        borderTop: '1px solid rgba(99,102,241,0.08)',
        position: 'relative',
      }}>
        Built with ❤️ for Discord communities
      </div>
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
