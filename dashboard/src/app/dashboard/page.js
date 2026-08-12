'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// ─── Icons ───────────────────────────────────────────────────
function IconShield() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
function IconServer() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" /><rect x="2" y="14" width="20" height="8" rx="2" ry="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function IconTrash() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function DiscordIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
    </svg>
  );
}

// ─── Toast Component ─────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      animation: 'slide-up 0.3s ease',
      display: 'flex', alignItems: 'center', gap: 10,
      minWidth: 260,
    }} className={type === 'success' ? 'toast-success' : 'toast-error'}>
      {type === 'success' ? <IconCheck /> : '⚠️'}
      {message}
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────
const TABS = [
  { id: 'permissions', label: 'Permissions', icon: <IconShield /> },
  { id: 'settings', label: 'Welcome & Goodbye', icon: <IconSettings /> },
];

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
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const guildIcon = selectedGuild?.icon
    ? `https://cdn.discordapp.com/icons/${selectedGuild.id}/${selectedGuild.icon}.png`
    : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      {/* Background */}
      <div className="orb" style={{ width: 500, height: 500, background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', top: '-10%', right: '-5%', position: 'fixed', pointerEvents: 'none' }} />
      <div className="orb" style={{ width: 400, height: 400, background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)', bottom: '10%', left: '-5%', position: 'fixed', pointerEvents: 'none', animationDelay: '2s' }} />

      {/* ── Top Navbar ── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
        background: 'rgba(8,11,20,0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(99,102,241,0.1)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, boxShadow: '0 0 16px rgba(99,102,241,0.4)',
          }}>⚡</div>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em' }}>
            <span className="gradient-text">Bot</span>
            <span style={{ color: 'var(--text-muted)' }}> Dashboard</span>
          </span>
        </div>

        {/* User info + logout */}
        {session && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {session.user?.image && (
              <img
                src={session.user.image}
                alt={session.user.name}
                style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(99,102,241,0.4)' }}
              />
            )}
            <div style={{ lineHeight: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{session.user?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Administrator</div>
            </div>
            <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.08)', margin: '0 4px' }} />
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="btn-ghost"
              style={{ padding: '7px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 7 }}
            >
              <IconLogout />
              Logout
            </button>
          </div>
        )}
      </header>

      {/* ── Main Layout ── */}
      <div style={{ display: 'flex', flex: 1, paddingTop: 60 }}>

        {/* ── Left Sidebar ── */}
        <aside className="glass-sidebar" style={{
          width: 260, flexShrink: 0,
          position: 'fixed', top: 60, bottom: 0, left: 0,
          overflowY: 'auto', padding: '20px 12px',
          display: 'flex', flexDirection: 'column', gap: 6,
          zIndex: 40,
        }}>
          {/* Sidebar header */}
          <div style={{ padding: '4px 8px 16px', marginBottom: 4, borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <IconServer />
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                Your Servers
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 26 }}>
              {guilds.length} admin server{guilds.length !== 1 ? 's' : ''}
            </div>
          </div>

          {guilds.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '32px 16px',
              color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6,
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🌐</div>
              No servers found where<br />you are an administrator.
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
                  style={{ width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', background: 'none' }}
                >
                  {icon ? (
                    <img src={icon} alt="" style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0 }} />
                  ) : (
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      background: isActive ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.07)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, color: isActive ? '#818cf8' : 'var(--text-muted)',
                    }}>
                      {guild.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {guild.name}
                  </span>
                  {isActive && (
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#818cf8', boxShadow: '0 0 8px #818cf8', flexShrink: 0 }} />
                  )}
                </button>
              );
            })
          )}
        </aside>

        {/* ── Main Content ── */}
        <main style={{ flex: 1, marginLeft: 260, padding: '28px 32px', minWidth: 0 }}>

          {!selectedGuild ? (
            /* Empty state */
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              minHeight: 'calc(100vh - 120px)',
              textAlign: 'center',
            }} className="animate-fade-in">
              <div style={{
                width: 100, height: 100, borderRadius: 24,
                background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.1))',
                border: '1px solid rgba(99,102,241,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 44, marginBottom: 28,
                boxShadow: '0 0 60px rgba(99,102,241,0.1)',
              }}>
                🖥️
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Select a Server</h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: 360, lineHeight: 1.6, fontSize: 15 }}>
                Choose one of your admin servers from the sidebar to start managing bot permissions and settings.
              </p>
            </div>
          ) : (
            <div className="animate-fade-in">
              {/* ── Server Header ── */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 28, flexWrap: 'wrap', gap: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {guildIcon ? (
                    <img src={guildIcon} alt="" style={{ width: 52, height: 52, borderRadius: 14, border: '2px solid rgba(99,102,241,0.3)', boxShadow: '0 0 20px rgba(99,102,241,0.2)' }} />
                  ) : (
                    <div style={{
                      width: 52, height: 52, borderRadius: 14,
                      background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22, fontWeight: 700, color: 'white',
                      boxShadow: '0 0 20px rgba(99,102,241,0.3)',
                    }}>
                      {selectedGuild.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>{selectedGuild.name}</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#34d399', fontWeight: 600 }}>
                        <span style={{ width: 6, height: 6, background: '#34d399', borderRadius: '50%', boxShadow: '0 0 6px #34d399', display: 'inline-block' }} />
                        Active
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>•</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>ID: {selectedGuild.id}</span>
                    </div>
                  </div>
                </div>

                {/* Stat chips */}
                <div style={{ display: 'flex', gap: 12 }}>
                  {[
                    { label: 'Permissions', value: permissions.length, color: '#818cf8' },
                  ].map(s => (
                    <div key={s.label} style={{
                      padding: '10px 18px', borderRadius: 12,
                      background: 'rgba(99,102,241,0.1)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, fontWeight: 500 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Tabs ── */}
              <div style={{
                display: 'flex', gap: 4, marginBottom: 24,
                background: 'rgba(8,11,20,0.6)',
                border: '1px solid rgba(99,102,241,0.1)',
                borderRadius: 12, padding: 4,
                width: 'fit-content',
              }}>
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '9px 18px', borderRadius: 9,
                      fontSize: 14, fontWeight: 600, cursor: 'pointer',
                      border: 'none',
                      transition: 'all 0.2s ease',
                      background: activeTab === tab.id
                        ? 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(168,85,247,0.15))'
                        : 'transparent',
                      color: activeTab === tab.id ? '#818cf8' : 'var(--text-muted)',
                      boxShadow: activeTab === tab.id ? '0 0 20px rgba(99,102,241,0.1)' : 'none',
                    }}
                  >
                    <span style={{ color: activeTab === tab.id ? '#818cf8' : 'var(--text-muted)' }}>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* ── Loading state ── */}
              {isLoadingData ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
                  <div className="spinner" />
                </div>
              ) : (
                <>
                  {/* ── PERMISSIONS TAB ── */}
                  {activeTab === 'permissions' && (
                    <div className="animate-fade-in">
                      {/* Add permission form */}
                      <div className="glass-card" style={{ padding: '24px', marginBottom: 20 }}>
                        <div className="section-header">
                          <div className="section-icon" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8' }}>
                            <IconPlus />
                          </div>
                          <div>
                            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Add Permission</h2>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Grant a role or user access to bot commands</p>
                          </div>
                        </div>
                        <form onSubmit={handleAddPermission} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          <select
                            value={newType}
                            onChange={e => setNewType(e.target.value)}
                            className="input-field"
                            style={{ padding: '10px 14px', fontSize: 14, cursor: 'pointer', minWidth: 120 }}
                          >
                            <option value="role">🎭 Role ID</option>
                            <option value="user">👤 User ID</option>
                          </select>
                          <input
                            type="text"
                            value={newId}
                            onChange={e => setNewId(e.target.value)}
                            placeholder="Enter Discord ID (e.g. 123456789...)"
                            required
                            className="input-field"
                            style={{ padding: '10px 16px', fontSize: 14, flex: 1, minWidth: 200 }}
                          />
                          <button
                            type="submit"
                            disabled={isSaving}
                            className="btn-primary"
                            style={{ padding: '10px 24px', fontSize: 14, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 8, position: 'relative', zIndex: 1 }}
                          >
                            <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 7 }}>
                              {isSaving ? (
                                <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin-slow 0.8s linear infinite' }} />
                              ) : <IconPlus />}
                              {isSaving ? 'Adding...' : 'Add'}
                            </span>
                          </button>
                        </form>
                      </div>

                      {/* Permissions list */}
                      <div className="glass-card" style={{ padding: '24px' }}>
                        <div className="section-header">
                          <div className="section-icon" style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.2)', color: '#c084fc' }}>
                            <IconShield />
                          </div>
                          <div>
                            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Authorized Entities</h2>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                              {permissions.length === 0 ? 'Only server admins can use the bot' : `${permissions.length} entit${permissions.length === 1 ? 'y has' : 'ies have'} been granted access`}
                            </p>
                          </div>
                        </div>

                        {permissions.length === 0 ? (
                          <div style={{
                            textAlign: 'center', padding: '40px 20px',
                            color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7,
                            background: 'rgba(8,11,20,0.4)', borderRadius: 12,
                            border: '1px dashed rgba(99,102,241,0.15)',
                          }}>
                            <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
                            <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>No permissions configured</div>
                            Only server administrators can use the bot commands.<br />
                            Add roles or users above to grant access.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {permissions.map((p) => (
                              <div key={p.id} className="permission-item">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                  <span className={p.type === 'role' ? 'badge-role' : 'badge-user'}>
                                    {p.type === 'role' ? '🎭 Role' : '👤 User'}
                                  </span>
                                  <code style={{
                                    fontFamily: 'monospace', fontSize: 13,
                                    color: 'var(--text-secondary)',
                                    background: 'rgba(255,255,255,0.04)',
                                    padding: '2px 8px', borderRadius: 6,
                                    border: '1px solid rgba(255,255,255,0.06)',
                                  }}>{p.target_id}</code>
                                </div>
                                <button
                                  onClick={() => handleRemovePermission(p.id)}
                                  className="btn-danger"
                                  style={{ padding: '7px 14px', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                                >
                                  <IconTrash /> Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── SETTINGS TAB ── */}
                  {activeTab === 'settings' && (
                    <form onSubmit={handleSaveSettings} className="animate-fade-in">
                      {/* Welcome */}
                      <div className="glass-card" style={{ padding: '28px', marginBottom: 20 }}>
                        <div className="section-header">
                          <div className="section-icon" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)', fontSize: 18 }}>
                            👋
                          </div>
                          <div>
                            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#818cf8' }}>Welcome Configuration</h2>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Greet new members when they join</p>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                          <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                              Welcome Channel ID
                            </label>
                            <input
                              type="text"
                              value={settings.WELCOME_CHANNEL_ID}
                              onChange={e => setSettings({ ...settings, WELCOME_CHANNEL_ID: e.target.value })}
                              placeholder="e.g. 123456789012345678"
                              className="input-field"
                              style={{ width: '100%', padding: '11px 14px', fontSize: 14 }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                              Welcome Message
                              <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>
                                Use {'{user}'} and {'{server}'}
                              </span>
                            </label>
                            <textarea
                              value={settings.WELCOME_MESSAGE}
                              onChange={e => setSettings({ ...settings, WELCOME_MESSAGE: e.target.value })}
                              placeholder="Welcome {user} to {server}! 🎉"
                              rows={3}
                              className="input-field"
                              style={{ width: '100%', padding: '11px 14px', fontSize: 14, resize: 'none' }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Goodbye */}
                      <div className="glass-card" style={{ padding: '28px', marginBottom: 28 }}>
                        <div className="section-header">
                          <div className="section-icon" style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.2)', fontSize: 18 }}>
                            🚪
                          </div>
                          <div>
                            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#c084fc' }}>Goodbye Configuration</h2>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Say farewell to departing members</p>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                          <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                              Goodbye Channel ID
                            </label>
                            <input
                              type="text"
                              value={settings.GOODBYE_CHANNEL_ID}
                              onChange={e => setSettings({ ...settings, GOODBYE_CHANNEL_ID: e.target.value })}
                              placeholder="e.g. 123456789012345678"
                              className="input-field"
                              style={{ width: '100%', padding: '11px 14px', fontSize: 14 }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                              Goodbye Message
                              <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>
                                Use {'{user}'} and {'{server}'}
                              </span>
                            </label>
                            <textarea
                              value={settings.GOODBYE_MESSAGE}
                              onChange={e => setSettings({ ...settings, GOODBYE_MESSAGE: e.target.value })}
                              placeholder="Goodbye {user}, we'll miss you! 👋"
                              rows={3}
                              className="input-field"
                              style={{ width: '100%', padding: '11px 14px', fontSize: 14, resize: 'none' }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Save button */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="submit"
                          disabled={isSavingSettings}
                          className="btn-primary"
                          style={{ padding: '13px 32px', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10, borderRadius: 12, position: 'relative', zIndex: 1 }}
                        >
                          <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                            {isSavingSettings ? (
                              <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin-slow 0.8s linear infinite' }} />
                            ) : <IconCheck />}
                            {isSavingSettings ? 'Saving...' : 'Save Settings'}
                          </span>
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
