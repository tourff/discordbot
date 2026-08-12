'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// ─── SVG Icons ───────────────────────────────────────────────
function IconShield() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
function IconServer() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" /><rect x="2" y="14" width="20" height="8" rx="2" ry="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconHash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" /><line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  );
}
function DiscordIcon({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
    </svg>
  );
}

// ─── Toast Component ─────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3800);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: 10,
      minWidth: 280, maxWidth: 380,
    }} className={type === 'success' ? 'toast-success' : 'toast-error'}>
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        background: type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {type === 'success' ? <IconCheck /> : <span style={{ fontSize: 13 }}>⚠</span>}
      </div>
      <span style={{ flex: 1, lineHeight: 1.4 }}>{message}</span>
      <button onClick={onClose} style={{
        background: 'none', border: 'none', color: 'inherit',
        cursor: 'pointer', opacity: 0.6, fontSize: 16, padding: '0 2px',
        transition: 'opacity 0.2s', flexShrink: 0,
      }}
        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
        onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
      >×</button>
    </div>
  );
}

// ─── Tabs config ─────────────────────────────────────────────
const TABS = [
  { id: 'permissions', label: 'Permissions', icon: <IconShield /> },
  { id: 'settings', label: 'Welcome & Goodbye', icon: <IconSettings /> },
];

// ─── Label Component ─────────────────────────────────────────
function Label({ children, hint }) {
  return (
    <label style={{ display: 'block', marginBottom: 9 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '-0.01em' }}>
        {children}
      </span>
      {hint && (
        <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>
          {hint}
        </span>
      )}
    </label>
  );
}

// ─── Section Heading ─────────────────────────────────────────
function SectionHeading({ icon, iconBg, iconColor, title, subtitle }) {
  return (
    <div className="section-header">
      <div className="section-icon" style={{ background: iconBg, border: `1px solid ${iconColor}22`, color: iconColor }}>
        {icon}
      </div>
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{title}</h2>
        <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</p>
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────
export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [guilds, setGuilds] = useState([]);
  const [selectedGuild, setSelectedGuild] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [activeTab, setActiveTab] = useState('permissions');
  const [toast, setToast] = useState(null);

  const [newType, setNewType] = useState('role');
  const [newId, setNewId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const [settings, setSettings] = useState({
    WELCOME_CHANNEL_ID: '',
    WELCOME_MESSAGE: '',
    GOODBYE_CHANNEL_ID: '',
    GOODBYE_MESSAGE: '',
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/');
  }, [status, router]);

  useEffect(() => {
    async function fetchGuilds() {
      if (!session?.accessToken) return;
      try {
        const res = await fetch('https://discord.com/api/users/@me/guilds', {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        const data = await res.json();
        const adminGuilds = Array.isArray(data) ? data.filter((g) => (g.permissions & 8) === 8) : [];
        setGuilds(adminGuilds);
      } catch (e) {
        console.error('Failed to fetch guilds:', e);
      }
    }
    fetchGuilds();
  }, [session]);

  useEffect(() => {
    if (!selectedGuild) return;
    async function fetchData() {
      setIsLoadingData(true);
      const [permRes, setRes] = await Promise.all([
        supabase.from('bot_permissions').select('*').eq('guild_id', selectedGuild.id),
        supabase.from('bot_settings').select('*').eq('guild_id', selectedGuild.id),
      ]);
      if (!permRes.error && permRes.data) setPermissions(permRes.data);
      if (!setRes.error && setRes.data) {
        const s = { WELCOME_CHANNEL_ID: '', WELCOME_MESSAGE: '', GOODBYE_CHANNEL_ID: '', GOODBYE_MESSAGE: '' };
        setRes.data.forEach(item => { if (s[item.key] !== undefined) s[item.key] = item.value; });
        setSettings(s);
      }
      setIsLoadingData(false);
    }
    fetchData();
  }, [selectedGuild]);

  const handleAddPermission = async (e) => {
    e.preventDefault();
    if (!selectedGuild || !newId.trim()) return;
    setIsSaving(true);
    const { data, error } = await supabase
      .from('bot_permissions')
      .insert([{ guild_id: selectedGuild.id, type: newType, target_id: newId.trim() }])
      .select();
    if (!error && data) {
      setPermissions(prev => [...prev, ...data]);
      setNewId('');
      showToast('Permission added successfully!');
    } else {
      showToast('Failed to add permission.', 'error');
    }
    setIsSaving(false);
  };

  const handleRemovePermission = async (id) => {
    const { error } = await supabase.from('bot_permissions').delete().eq('id', id);
    if (!error) {
      setPermissions(prev => prev.filter(p => p.id !== id));
      showToast('Permission removed.');
    } else {
      showToast('Failed to remove permission.', 'error');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!selectedGuild) return;
    setIsSavingSettings(true);
    const upserts = Object.keys(settings).map(key => ({
      guild_id: selectedGuild.id,
      key,
      value: settings[key],
    }));
    const { error } = await supabase.from('bot_settings').upsert(upserts, { onConflict: 'guild_id,key' });
    if (error) {
      showToast('Failed to save settings.', 'error');
    } else {
      showToast('Settings saved successfully! ✨');
    }
    setIsSavingSettings(false);
  };

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 60, height: 60, borderRadius: 18,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1))',
            border: '1px solid rgba(99,102,241,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 0 40px rgba(99,102,241,0.15)',
          }}>
            <div className="spinner" style={{ width: 28, height: 28, borderWidth: 2.5 }} />
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500 }}>Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  const guildIcon = selectedGuild?.icon
    ? `https://cdn.discordapp.com/icons/${selectedGuild.id}/${selectedGuild.icon}.png`
    : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>

      {/* Fixed background orbs */}
      <div className="orb animate-pulse-glow" style={{
        width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)',
        top: '-10%', right: '-5%', position: 'fixed', pointerEvents: 'none',
      }} />
      <div className="orb animate-pulse-glow" style={{
        width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)',
        bottom: '5%', left: '-5%', position: 'fixed', pointerEvents: 'none',
        animationDelay: '2.5s',
      }} />

      {/* Mesh grid overlay */}
      <div className="mesh-grid" style={{ position: 'fixed', opacity: 0.5 }} />

      {/* ─── TOP NAVBAR ─── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
        background: 'rgba(5, 7, 15, 0.92)',
        backdropFilter: 'blur(32px)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        boxShadow: '0 1px 0 rgba(99,102,241,0.06), 0 4px 24px rgba(0,0,0,0.3)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div className="logo-icon" style={{ width: 34, height: 34, borderRadius: 10, fontSize: 17 }}>⚡</div>
          <div>
            <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.03em' }}>
              <span className="gradient-text">Nexus</span>
              <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> Bot</span>
            </span>
          </div>
        </div>

        {/* Center breadcrumb */}
        {selectedGuild && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Dashboard</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{selectedGuild.name}</span>
          </div>
        )}

        {/* User section */}
        {session && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Avatar */}
            <div style={{ position: 'relative' }}>
              {session.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name}
                  style={{
                    width: 34, height: 34, borderRadius: '50%',
                    border: '2px solid rgba(99,102,241,0.35)',
                    boxShadow: '0 0 12px rgba(99,102,241,0.2)',
                  }}
                />
              ) : (
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: 'white',
                }}>
                  {session.user?.name?.charAt(0) || '?'}
                </div>
              )}
              <div style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 9, height: 9, background: '#34d399',
                borderRadius: '50%', border: '2px solid var(--bg-primary)',
                boxShadow: '0 0 6px #34d399',
              }} />
            </div>

            <div style={{ lineHeight: 1.2, display: 'none' }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{session.user?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Admin</div>
            </div>

            <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.07)', margin: '0 2px' }} />

            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="btn-ghost"
              style={{ padding: '7px 13px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 7 }}
            >
              <IconLogout />
              <span style={{ display: 'none' }}>Logout</span>
            </button>
          </div>
        )}
      </header>

      {/* ─── MAIN LAYOUT ─── */}
      <div style={{ display: 'flex', flex: 1, paddingTop: 60 }}>

        {/* ─── SIDEBAR ─── */}
        <aside className="glass-sidebar" style={{
          width: 264, flexShrink: 0,
          position: 'fixed', top: 60, bottom: 0, left: 0,
          overflowY: 'auto', padding: '18px 10px',
          display: 'flex', flexDirection: 'column', gap: 4,
          zIndex: 40,
        }}>
          {/* Sidebar section label */}
          <div style={{ padding: '4px 10px 14px', marginBottom: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ color: 'var(--text-muted)' }}><IconServer /></div>
              <span style={{
                fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.12em', color: 'var(--text-muted)',
              }}>
                Your Servers
              </span>
            </div>

            {guilds.length > 0 && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '3px 10px',
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.15)',
                borderRadius: 999, fontSize: 11, color: '#818cf8', fontWeight: 600,
              }}>
                <span style={{ width: 5, height: 5, background: '#818cf8', borderRadius: '50%', display: 'inline-block' }} />
                {guilds.length} admin server{guilds.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(99,102,241,0.08)', margin: '0 4px 8px' }} />

          {guilds.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '40px 16px',
              color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.65,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, margin: '0 auto 14px',
              }}>🌐</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 4 }}>No servers found</div>
              <div style={{ fontSize: 12 }}>You need admin privileges to manage a server.</div>
            </div>
          ) : (
            guilds.map((guild) => {
              const icon = guild.icon
                ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
                : null;
              const isActive = selectedGuild?.id === guild.id;
              return (
                <button
                  key={guild.id}
                  onClick={() => setSelectedGuild(guild)}
                  className={`nav-item${isActive ? ' active' : ''}`}
                  style={{ width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', background: 'none', fontFamily: 'inherit' }}
                >
                  {icon ? (
                    <img src={icon} alt="" style={{
                      width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                      boxShadow: isActive ? '0 0 12px rgba(99,102,241,0.3)' : 'none',
                      transition: 'box-shadow 0.25s ease',
                    }} />
                  ) : (
                    <div style={{
                      width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(99,102,241,0.35), rgba(139,92,246,0.2))'
                        : 'rgba(255,255,255,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 800,
                      color: isActive ? '#a5b4fc' : 'var(--text-muted)',
                    }}>
                      {guild.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <span style={{
                    fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap', flex: 1, letterSpacing: '-0.01em',
                  }}>
                    {guild.name}
                  </span>

                  {isActive && (
                    <div style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: '#818cf8', flexShrink: 0,
                      boxShadow: '0 0 8px #818cf8',
                    }} />
                  )}
                </button>
              );
            })
          )}

          {/* Bottom user info */}
          {session && (
            <div style={{
              marginTop: 'auto',
              padding: '12px 10px 4px',
              borderTop: '1px solid rgba(99,102,241,0.07)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {session.user?.image ? (
                  <img src={session.user.image} alt="" style={{
                    width: 32, height: 32, borderRadius: '50%',
                    border: '2px solid rgba(99,102,241,0.3)',
                  }} />
                ) : (
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, color: 'white',
                  }}>
                    {session.user?.name?.charAt(0)}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {session.user?.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Administrator</div>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  title="Logout"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', padding: 4,
                    transition: 'color 0.2s', flexShrink: 0,
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <IconLogout />
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* ─── MAIN CONTENT ─── */}
        <main style={{ flex: 1, marginLeft: 264, padding: '32px 36px', minWidth: 0 }}>

          {!selectedGuild ? (
            /* Empty state */
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              minHeight: 'calc(100vh - 130px)',
              textAlign: 'center',
            }} className="animate-fade-in">
              {/* Animated icon */}
              <div style={{
                width: 110, height: 110, borderRadius: 28,
                background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))',
                border: '1px solid rgba(99,102,241,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 48, marginBottom: 32,
                boxShadow: '0 0 60px rgba(99,102,241,0.1), 0 24px 64px rgba(0,0,0,0.4)',
                position: 'relative',
              }}>
                <span style={{ animation: 'float 4s ease-in-out infinite' }}>🖥️</span>
                {/* Decorative ring */}
                <div style={{
                  position: 'absolute', inset: -16,
                  borderRadius: 44,
                  border: '1px dashed rgba(99,102,241,0.15)',
                  animation: 'spin-slow 20s linear infinite',
                }} />
              </div>

              <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.03em' }}>
                Select a Server
              </h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: 380, lineHeight: 1.7, fontSize: 15.5, marginBottom: 32 }}>
                Choose one of your admin servers from the sidebar to start managing bot permissions and settings.
              </p>

              {guilds.length > 0 && (
                <div style={{
                  display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 500,
                }}>
                  {guilds.slice(0, 4).map((g) => {
                    const icon = g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null;
                    return (
                      <button
                        key={g.id}
                        onClick={() => setSelectedGuild(g)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '9px 16px',
                          background: 'rgba(10,14,28,0.8)',
                          border: '1px solid rgba(99,102,241,0.15)',
                          borderRadius: 12, cursor: 'pointer',
                          color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600,
                          transition: 'all 0.25s ease', fontFamily: 'inherit',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)';
                          e.currentTarget.style.color = 'var(--text-primary)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'rgba(99,102,241,0.15)';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        {icon ? (
                          <img src={icon} alt="" style={{ width: 22, height: 22, borderRadius: 6 }} />
                        ) : (
                          <div style={{
                            width: 22, height: 22, borderRadius: 6,
                            background: 'rgba(99,102,241,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 800, color: '#818cf8',
                          }}>{g.name.charAt(0)}</div>
                        )}
                        {g.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="animate-fade-in">

              {/* ─── SERVER HEADER ─── */}
              <div style={{
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                marginBottom: 32, flexWrap: 'wrap', gap: 20,
              }}>
                {/* Guild info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                  {guildIcon ? (
                    <img src={guildIcon} alt="" style={{
                      width: 58, height: 58, borderRadius: 16,
                      border: '2px solid rgba(99,102,241,0.3)',
                      boxShadow: '0 0 24px rgba(99,102,241,0.2), 0 8px 32px rgba(0,0,0,0.4)',
                    }} />
                  ) : (
                    <div style={{
                      width: 58, height: 58, borderRadius: 16,
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 24, fontWeight: 900, color: 'white',
                      boxShadow: '0 0 24px rgba(99,102,241,0.35), 0 8px 32px rgba(0,0,0,0.4)',
                    }}>
                      {selectedGuild.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>
                      {selectedGuild.name}
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span className="badge-live" style={{ fontSize: 10 }}>
                        <span className="badge-live-dot" />
                        Active
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}>
                        <IconHash />
                        <code style={{ fontFamily: 'monospace', fontSize: 11 }}>{selectedGuild.id}</code>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stat chips */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{
                    padding: '12px 22px',
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.18)',
                    borderRadius: 14, textAlign: 'center',
                    minWidth: 90,
                    transition: 'all 0.25s ease',
                  }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)';
                      e.currentTarget.style.background = 'rgba(99,102,241,0.12)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'rgba(99,102,241,0.18)';
                      e.currentTarget.style.background = 'rgba(99,102,241,0.08)';
                    }}
                  >
                    <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.04em' }} className="gradient-text">
                      {permissions.length}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Permissions
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── TABS ─── */}
              <div className="tab-container" style={{ marginBottom: 28 }}>
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
                  >
                    <span style={{ color: activeTab === tab.id ? '#a5b4fc' : 'var(--text-muted)', transition: 'color 0.25s' }}>
                      {tab.icon}
                    </span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Loading state */}
              {isLoadingData ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 0' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto 16px' }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>Fetching data…</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* ─── PERMISSIONS TAB ─── */}
                  {activeTab === 'permissions' && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                      {/* Add permission */}
                      <div className="glass-card-static" style={{ padding: '26px 28px' }}>
                        <SectionHeading
                          icon={<IconPlus />}
                          iconBg="rgba(99,102,241,0.12)"
                          iconColor="#818cf8"
                          title="Add Permission"
                          subtitle="Grant a role or user access to bot commands"
                        />
                        <form onSubmit={handleAddPermission} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                          <div style={{ minWidth: 140 }}>
                            <Label>Type</Label>
                            <select
                              value={newType}
                              onChange={e => setNewType(e.target.value)}
                              className="input-field"
                              style={{ padding: '10px 14px', width: '100%', cursor: 'pointer' }}
                            >
                              <option value="role">🎭 Role ID</option>
                              <option value="user">👤 User ID</option>
                            </select>
                          </div>

                          <div style={{ flex: 1, minWidth: 220 }}>
                            <Label>Discord ID</Label>
                            <input
                              type="text"
                              value={newId}
                              onChange={e => setNewId(e.target.value)}
                              placeholder="e.g. 123456789012345678"
                              required
                              className="input-field"
                              style={{ padding: '10px 14px', width: '100%' }}
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={isSaving}
                            className="btn-primary"
                            style={{ padding: '10px 24px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}
                          >
                            {isSaving ? <span className="spinner-sm" /> : <IconPlus />}
                            <span>{isSaving ? 'Adding…' : 'Add'}</span>
                          </button>
                        </form>
                      </div>

                      {/* Permissions list */}
                      <div className="glass-card-static" style={{ padding: '26px 28px' }}>
                        <SectionHeading
                          icon={<IconShield />}
                          iconBg="rgba(139,92,246,0.12)"
                          iconColor="#a78bfa"
                          title="Authorized Entities"
                          subtitle={permissions.length === 0
                            ? 'Only server admins can use the bot'
                            : `${permissions.length} entit${permissions.length === 1 ? 'y has' : 'ies have'} been granted access`}
                        />

                        {permissions.length === 0 ? (
                          <div style={{
                            textAlign: 'center', padding: '44px 24px',
                            color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7,
                            background: 'rgba(5, 7, 15, 0.5)',
                            borderRadius: 14,
                            border: '1px dashed rgba(99,102,241,0.12)',
                          }}>
                            <div style={{
                              width: 52, height: 52, borderRadius: 14,
                              background: 'rgba(99,102,241,0.08)',
                              border: '1px solid rgba(99,102,241,0.15)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 22, margin: '0 auto 16px',
                            }}>🔒</div>
                            <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, fontSize: 15 }}>
                              No permissions configured
                            </div>
                            <div style={{ fontSize: 13.5 }}>
                              Only server administrators can use bot commands.
                              <br />Add roles or users above to grant access.
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                            {permissions.map((p, i) => (
                              <div key={p.id} className="permission-item" style={{ animationDelay: `${0.05 * i}s` }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  <span className={p.type === 'role' ? 'badge-role' : 'badge-user'}>
                                    {p.type === 'role' ? '🎭 Role' : '👤 User'}
                                  </span>
                                  <code style={{
                                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                                    fontSize: 12.5,
                                    color: 'var(--text-secondary)',
                                    background: 'rgba(255,255,255,0.04)',
                                    padding: '3px 10px', borderRadius: 7,
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    letterSpacing: '0.01em',
                                  }}>{p.target_id}</code>
                                </div>
                                <button
                                  onClick={() => handleRemovePermission(p.id)}
                                  className="btn-danger"
                                  style={{ padding: '7px 14px', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6 }}
                                >
                                  <IconTrash />
                                  <span>Remove</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ─── SETTINGS TAB ─── */}
                  {activeTab === 'settings' && (
                    <form onSubmit={handleSaveSettings} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                      {/* Welcome config */}
                      <div className="glass-card-static" style={{ padding: '26px 28px' }}>
                        <SectionHeading
                          icon="👋"
                          iconBg="rgba(99,102,241,0.12)"
                          iconColor="#818cf8"
                          title="Welcome Configuration"
                          subtitle="Greet new members when they join your server"
                        />

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
                          <div>
                            <Label>Welcome Channel ID</Label>
                            <input
                              type="text"
                              value={settings.WELCOME_CHANNEL_ID}
                              onChange={e => setSettings({ ...settings, WELCOME_CHANNEL_ID: e.target.value })}
                              placeholder="e.g. 123456789012345678"
                              className="input-field"
                              style={{ width: '100%', padding: '11px 14px' }}
                            />
                          </div>
                          <div>
                            <Label hint="Use {user} and {server}">Welcome Message</Label>
                            <textarea
                              value={settings.WELCOME_MESSAGE}
                              onChange={e => setSettings({ ...settings, WELCOME_MESSAGE: e.target.value })}
                              placeholder={`Welcome {user} to {server}! 🎉`}
                              rows={3}
                              className="input-field"
                              style={{ width: '100%', padding: '11px 14px', resize: 'none', lineHeight: 1.6 }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Goodbye config */}
                      <div className="glass-card-static" style={{ padding: '26px 28px' }}>
                        <SectionHeading
                          icon="🚪"
                          iconBg="rgba(139,92,246,0.12)"
                          iconColor="#a78bfa"
                          title="Goodbye Configuration"
                          subtitle="Say farewell to departing members"
                        />

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
                          <div>
                            <Label>Goodbye Channel ID</Label>
                            <input
                              type="text"
                              value={settings.GOODBYE_CHANNEL_ID}
                              onChange={e => setSettings({ ...settings, GOODBYE_CHANNEL_ID: e.target.value })}
                              placeholder="e.g. 123456789012345678"
                              className="input-field"
                              style={{ width: '100%', padding: '11px 14px' }}
                            />
                          </div>
                          <div>
                            <Label hint="Use {user} and {server}">Goodbye Message</Label>
                            <textarea
                              value={settings.GOODBYE_MESSAGE}
                              onChange={e => setSettings({ ...settings, GOODBYE_MESSAGE: e.target.value })}
                              placeholder={`Goodbye {user}, we'll miss you! 👋`}
                              rows={3}
                              className="input-field"
                              style={{ width: '100%', padding: '11px 14px', resize: 'none', lineHeight: 1.6 }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Save button */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 14 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          Changes apply instantly to your bot
                        </span>
                        <button
                          type="submit"
                          disabled={isSavingSettings}
                          className="btn-primary"
                          style={{ padding: '13px 32px', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10, borderRadius: 13 }}
                        >
                          {isSavingSettings ? <span className="spinner-sm" /> : <IconCheck />}
                          <span>{isSavingSettings ? 'Saving…' : 'Save Settings'}</span>
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Toast notification */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
