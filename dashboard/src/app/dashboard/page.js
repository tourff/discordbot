'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// ─── Icons ─────────────────────────────────────────────────────────────────────
const Icon = {
  Shield:       () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Server:       () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>,
  Logout:       () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Plus:         () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Trash:        () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Check:        () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Hash:         () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>,
  Robot:        () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M12 2a3 3 0 0 0-3 3v6h6V5a3 3 0 0 0-3-3z"/><line x1="8" y1="22" x2="8" y2="16"/><line x1="16" y1="22" x2="16" y2="16"/><circle cx="9" cy="15" r="1" fill="currentColor"/><circle cx="15" cy="15" r="1" fill="currentColor"/></svg>,
  Logs:         () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  Roles:        () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Globe:        () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  Music:        () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  Gamepad:      () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><circle cx="15" cy="12" r="1" fill="currentColor"/><circle cx="18" cy="10" r="1" fill="currentColor"/><path d="M17.5 7H6.5a5 5 0 0 0-5 5 5 5 0 0 0 5 5h11a5 5 0 0 0 5-5 5 5 0 0 0-5-5z"/></svg>,
  ChevronRight: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  Quotient:     ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/><path d="M8.5 8.5l7 7"/></svg>,
};

// ─── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10, minWidth: 280, maxWidth: 380 }}
      className={type === 'success' ? 'toast-success' : 'toast-error'}>
      <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {type === 'success' ? <Icon.Check /> : '⚠'}
      </div>
      <span style={{ flex: 1, lineHeight: 1.4 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', opacity: 0.6, fontSize: 16, padding: '0 2px', flexShrink: 0 }}>×</button>
    </div>
  );
}

// ─── Toggle Switch ──────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, label, desc, accent = '#818cf8' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 20px',
      background: checked ? 'rgba(99,102,241,0.05)' : 'rgba(5,7,15,0.5)',
      border: `1px solid ${checked ? `${accent}33` : 'rgba(255,255,255,0.05)'}`,
      borderRadius: 14, transition: 'all 0.3s ease',
    }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{label}</div>
        {desc && <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3 }}>{desc}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        style={{
          width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
          background: checked ? accent : 'rgba(255,255,255,0.1)',
          position: 'relative', flexShrink: 0, transition: 'all 0.3s ease',
          boxShadow: checked ? `0 0 20px ${accent}55` : 'none',
        }}
        aria-pressed={checked}
      >
        <span style={{
          position: 'absolute', top: 3, left: checked ? 25 : 3, width: 20, height: 20,
          background: 'white', borderRadius: 10,
          transition: 'left 0.3s cubic-bezier(0.16,1,0.3,1)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        }} />
      </button>
    </div>
  );
}

// ─── Field ─────────────────────────────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: 9 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '-0.01em' }}>{label}</span>
        {hint && <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{hint}</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Section Heading ────────────────────────────────────────────────────────────
function SectionHeading({ icon, iconBg, iconColor, title, subtitle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 13,
        background: iconBg, border: `1px solid ${iconColor}33`, color: iconColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, flexShrink: 0,
      }}>{icon}</div>
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{title}</h2>
        <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</p>
      </div>
    </div>
  );
}

// ─── Save Footer ────────────────────────────────────────────────────────────────
function SaveFooter({ isSaving, label, hint }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '16px 24px',
      background: 'rgba(5,7,15,0.6)',
      border: '1px solid rgba(99,102,241,0.08)',
      borderRadius: 16,
    }}>
      <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{hint || 'Changes saved to database'}</div>
      <button
        type="submit"
        disabled={isSaving}
        className="btn-primary"
        style={{ padding: '11px 28px', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 9, borderRadius: 12 }}
      >
        {isSaving
          ? <><span className="spinner-sm" /><span>Saving…</span></>
          : <><Icon.Check /><span>{label || 'Save Settings'}</span></>
        }
      </button>
    </div>
  );
}

// ─── Tabs config ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'permissions', label: 'Permissions',     icon: <Icon.Shield />,   color: '#818cf8', bg: 'rgba(99,102,241,0.12)',   desc: 'Manage bot access' },
  { id: 'welcome',     label: 'Welcome',          icon: '👋',              color: '#34d399', bg: 'rgba(16,185,129,0.12)',   desc: 'Join & leave messages' },
  { id: 'automod',     label: 'AutoMod',          icon: <Icon.Robot />,    color: '#f87171', bg: 'rgba(239,68,68,0.12)',    desc: 'Auto moderation' },
  { id: 'logging',     label: 'Logging',          icon: <Icon.Logs />,     color: '#a78bfa', bg: 'rgba(139,92,246,0.12)',   desc: 'Audit & event logs' },
  { id: 'roles',       label: 'Roles & Auto',     icon: <Icon.Roles />,    color: '#fbbf24', bg: 'rgba(245,158,11,0.12)',   desc: 'Auto role assignment' },
  { id: 'esports',     label: 'Esports & SS',     icon: <Icon.Gamepad />,  color: '#10b981', bg: 'rgba(16,185,129,0.12)',   desc: 'Screenshot verify' },
  { id: 'social',      label: 'Social Notifier',  icon: <Icon.Globe />,    color: '#38bdf8', bg: 'rgba(56,189,248,0.12)',   desc: 'Social media feeds' },
  { id: 'music',       label: 'Music',            icon: <Icon.Music />,    color: '#f472b6', bg: 'rgba(244,114,182,0.12)',  desc: 'Music player' },
];

const SOCIAL_PLATFORMS = [
  { key: 'YOUTUBE',   label: 'YouTube',   emoji: '▶️', color: '#ff0000', bg: 'rgba(255,0,0,0.1)',   border: 'rgba(255,0,0,0.2)' },
  { key: 'FACEBOOK',  label: 'Facebook',  emoji: '📘', color: '#1877f2', bg: 'rgba(24,119,242,0.1)', border: 'rgba(24,119,242,0.2)' },
  { key: 'INSTAGRAM', label: 'Instagram', emoji: '📸', color: '#e1306c', bg: 'rgba(225,48,108,0.1)', border: 'rgba(225,48,108,0.2)' },
  { key: 'TIKTOK',    label: 'TikTok',    emoji: '🎵', color: '#69c9d0', bg: 'rgba(105,201,208,0.1)', border: 'rgba(105,201,208,0.2)' },
];

const MUSIC_COMMANDS = [
  { cmd: '/play',       desc: 'Play a song by URL or search query' },
  { cmd: '/pause',      desc: 'Pause the current track' },
  { cmd: '/resume',     desc: 'Resume paused playback' },
  { cmd: '/stop',       desc: 'Stop music and clear the queue' },
  { cmd: '/skip',       desc: 'Skip to the next song' },
  { cmd: '/queue',      desc: 'Display the current song queue' },
  { cmd: '/nowplaying', desc: 'Show the currently playing track' },
  { cmd: '/volume',     desc: 'Set the playback volume (0–100)' },
  { cmd: '/seek',       desc: 'Seek to a specific timestamp' },
];

// ─── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [guilds, setGuilds]               = useState([]);
  const [selectedGuild, setSelectedGuild] = useState(null);
  const [activeTab, setActiveTab]         = useState('permissions');
  const [toast, setToast]                 = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // ── Tab states ──────────────────────────────────────────────────────────────
  const [permissions, setPermissions] = useState([]);
  const [newType, setNewType]         = useState('role');
  const [newId, setNewId]             = useState('');
  const [isSavingPerm, setIsSavingPerm] = useState(false);

  const [welcome, setWelcome] = useState({ WELCOME_CHANNEL_ID: '', WELCOME_MESSAGE: '', GOODBYE_CHANNEL_ID: '', GOODBYE_MESSAGE: '' });
  const [isSavingWelcome, setIsSavingWelcome] = useState(false);

  const [automod, setAutomod] = useState({ AUTOMOD_BAD_WORDS: '', AUTOMOD_ANTI_SPAM: 'true', AUTOMOD_BLOCK_INVITES: 'true', AUTOMOD_BLOCK_URLS: 'false' });
  const [isSavingAutomod, setIsSavingAutomod] = useState(false);

  const [logging, setLogging] = useState({ MOD_LOGS_CHANNEL_ID: '', SERVER_LOGS_CHANNEL_ID: '' });
  const [isSavingLogging, setIsSavingLogging] = useState(false);

  const [roles, setRoles] = useState({ DEFAULT_MEMBER_ROLE_ID: '', AUTOROLE_HUMANS_ROLE_ID: '', AUTOROLE_BOTS_ROLE_ID: '' });
  const [isSavingRoles, setIsSavingRoles] = useState(false);

  const [esports, setEsports] = useState({ SS_VERIFY_CHANNEL: '', SS_VERIFY_ROLE: '' });
  const [isSavingEsports, setIsSavingEsports] = useState(false);

  const [social, setSocial] = useState({
    YOUTUBE_URL: '', YOUTUBE_CHANNEL_ID: '', YOUTUBE_MESSAGE: '',
    FACEBOOK_URL: '', FACEBOOK_CHANNEL_ID: '', FACEBOOK_MESSAGE: '',
    INSTAGRAM_URL: '', INSTAGRAM_CHANNEL_ID: '', INSTAGRAM_MESSAGE: '',
    TIKTOK_URL: '', TIKTOK_CHANNEL_ID: '', TIKTOK_MESSAGE: '',
  });
  const [isSavingSocial, setIsSavingSocial] = useState(false);
  const [activeSocialPlatform, setActiveSocialPlatform] = useState('YOUTUBE');

  const showToast = useCallback((msg, type = 'success') => setToast({ message: msg, type }), []);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/');
  }, [status, router]);

  // ── Fetch guilds ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session?.accessToken) return;
    fetch('https://discord.com/api/users/@me/guilds', {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setGuilds(data.filter(g => (g.permissions & 8) === 8));
      })
      .catch(console.error);
  }, [session]);

  // ── Fetch guild data ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedGuild) return;
    setIsLoadingData(true);

    const SETTINGS_KEYS = [
      'WELCOME_CHANNEL_ID','WELCOME_MESSAGE','GOODBYE_CHANNEL_ID','GOODBYE_MESSAGE',
      'AUTOMOD_BAD_WORDS','AUTOMOD_ANTI_SPAM','AUTOMOD_BLOCK_INVITES','AUTOMOD_BLOCK_URLS',
      'MOD_LOGS_CHANNEL_ID','SERVER_LOGS_CHANNEL_ID','DEFAULT_MEMBER_ROLE_ID',
      'AUTOROLE_HUMANS_ROLE_ID','AUTOROLE_BOTS_ROLE_ID','SS_VERIFY_CHANNEL','SS_VERIFY_ROLE',
      'YOUTUBE_URL','YOUTUBE_CHANNEL_ID','YOUTUBE_MESSAGE',
      'FACEBOOK_URL','FACEBOOK_CHANNEL_ID','FACEBOOK_MESSAGE',
      'INSTAGRAM_URL','INSTAGRAM_CHANNEL_ID','INSTAGRAM_MESSAGE',
      'TIKTOK_URL','TIKTOK_CHANNEL_ID','TIKTOK_MESSAGE',
    ];

    Promise.all([
      supabase.from('bot_permissions').select('*').eq('guild_id', selectedGuild.id),
      supabase.from('bot_settings').select('*').eq('guild_id', selectedGuild.id),
    ]).then(([permRes, setRes]) => {
      if (!permRes.error && permRes.data) setPermissions(permRes.data);
      if (!setRes.error && setRes.data) {
        const map = {};
        setRes.data.forEach(r => { map[r.key] = r.value; });

        setWelcome({
          WELCOME_CHANNEL_ID: map.WELCOME_CHANNEL_ID || '',
          WELCOME_MESSAGE:    map.WELCOME_MESSAGE    || '',
          GOODBYE_CHANNEL_ID: map.GOODBYE_CHANNEL_ID || '',
          GOODBYE_MESSAGE:    map.GOODBYE_MESSAGE    || '',
        });
        setAutomod({
          AUTOMOD_BAD_WORDS:    map.AUTOMOD_BAD_WORDS    || '',
          AUTOMOD_ANTI_SPAM:    map.AUTOMOD_ANTI_SPAM    ?? 'true',
          AUTOMOD_BLOCK_INVITES:map.AUTOMOD_BLOCK_INVITES ?? 'true',
          AUTOMOD_BLOCK_URLS:   map.AUTOMOD_BLOCK_URLS   ?? 'false',
        });
        setLogging({
          MOD_LOGS_CHANNEL_ID:    map.MOD_LOGS_CHANNEL_ID    || '',
          SERVER_LOGS_CHANNEL_ID: map.SERVER_LOGS_CHANNEL_ID || '',
        });
        setRoles({
          DEFAULT_MEMBER_ROLE_ID: map.DEFAULT_MEMBER_ROLE_ID || '',
          AUTOROLE_HUMANS_ROLE_ID: map.AUTOROLE_HUMANS_ROLE_ID || '',
          AUTOROLE_BOTS_ROLE_ID: map.AUTOROLE_BOTS_ROLE_ID || '',
        });
        setEsports({
          SS_VERIFY_CHANNEL: map.SS_VERIFY_CHANNEL || '',
          SS_VERIFY_ROLE: map.SS_VERIFY_ROLE || '',
        });
        setSocial({
          YOUTUBE_URL: map.YOUTUBE_URL || '', YOUTUBE_CHANNEL_ID: map.YOUTUBE_CHANNEL_ID || '', YOUTUBE_MESSAGE: map.YOUTUBE_MESSAGE || '',
          FACEBOOK_URL: map.FACEBOOK_URL || '', FACEBOOK_CHANNEL_ID: map.FACEBOOK_CHANNEL_ID || '', FACEBOOK_MESSAGE: map.FACEBOOK_MESSAGE || '',
          INSTAGRAM_URL: map.INSTAGRAM_URL || '', INSTAGRAM_CHANNEL_ID: map.INSTAGRAM_CHANNEL_ID || '', INSTAGRAM_MESSAGE: map.INSTAGRAM_MESSAGE || '',
          TIKTOK_URL: map.TIKTOK_URL || '', TIKTOK_CHANNEL_ID: map.TIKTOK_CHANNEL_ID || '', TIKTOK_MESSAGE: map.TIKTOK_MESSAGE || '',
        });
      }
    }).finally(() => setIsLoadingData(false));
  }, [selectedGuild]);

  // ── Save helpers ─────────────────────────────────────────────────────────────
  const saveSettings = async (data) => {
    const upserts = Object.entries(data).map(([key, value]) => ({ guild_id: selectedGuild.id, key, value: String(value) }));
    const { error } = await supabase.from('bot_settings').upsert(upserts, { onConflict: 'guild_id,key' });
    return !error;
  };

  const handleSaveWelcome = async (e) => {
    e.preventDefault();
    setIsSavingWelcome(true);
    const ok = await saveSettings(welcome);
    showToast(ok ? 'Welcome settings saved! ✨' : 'Failed to save.', ok ? 'success' : 'error');
    setIsSavingWelcome(false);
  };

  const handleSaveAutomod = async (e) => {
    e.preventDefault();
    setIsSavingAutomod(true);
    const ok = await saveSettings(automod);
    showToast(ok ? 'AutoMod settings saved! 🤖' : 'Failed to save.', ok ? 'success' : 'error');
    setIsSavingAutomod(false);
  };

  const handleSaveLogging = async (e) => {
    e.preventDefault();
    setIsSavingLogging(true);
    const ok = await saveSettings(logging);
    showToast(ok ? 'Logging settings saved! 📋' : 'Failed to save.', ok ? 'success' : 'error');
    setIsSavingLogging(false);
  };

  const handleSaveRoles = async (e) => {
    e.preventDefault();
    setIsSavingRoles(true);
    const ok = await saveSettings(roles);
    showToast(ok ? 'Role settings saved! 🎭' : 'Failed to save.', ok ? 'success' : 'error');
    setIsSavingRoles(false);
  };

  const handleSaveEsports = async (e) => {
    e.preventDefault();
    setIsSavingEsports(true);
    const ok = await saveSettings(esports);
    showToast(ok ? 'Esports settings saved! 🎮' : 'Failed to save.', ok ? 'success' : 'error');
    setIsSavingEsports(false);
  };

  const handleSaveSocial = async (e) => {
    e.preventDefault();
    setIsSavingSocial(true);
    const ok = await saveSettings(social);
    showToast(ok ? 'Social notifier saved! 🌐' : 'Failed to save.', ok ? 'success' : 'error');
    setIsSavingSocial(false);
  };

  const handleAddPermission = async (e) => {
    e.preventDefault();
    if (!selectedGuild || !newId.trim()) return;
    setIsSavingPerm(true);
    const { data, error } = await supabase.from('bot_permissions').insert([{ guild_id: selectedGuild.id, type: newType, target_id: newId.trim() }]).select();
    if (!error && data) { setPermissions(prev => [...prev, ...data]); setNewId(''); showToast('Permission added!'); }
    else showToast('Failed to add permission.', 'error');
    setIsSavingPerm(false);
  };

  const handleRemovePermission = async (id) => {
    const { error } = await supabase.from('bot_permissions').delete().eq('id', id);
    if (!error) { setPermissions(prev => prev.filter(p => p.id !== id)); showToast('Permission removed.'); }
    else showToast('Failed to remove.', 'error');
  };

  // ── Loading screen ───────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1))', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 40px rgba(99,102,241,0.15)' }}>
            <div className="spinner" style={{ width: 28, height: 28, borderWidth: 2.5 }} />
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500 }}>Loading Quotient Dashboard…</p>
        </div>
      </div>
    );
  }

  const guildIcon = selectedGuild?.icon ? `https://cdn.discordapp.com/icons/${selectedGuild.id}/${selectedGuild.icon}.png` : null;
  const activeTabConfig = TABS.find(t => t.id === activeTab);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>

      {/* Background ambience */}
      <div style={{ position: 'fixed', top: '-20%', right: '-10%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(60px)', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-10%', left: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(60px)', zIndex: 0 }} />
      <div className="mesh-grid" style={{ position: 'fixed', opacity: 0.35, zIndex: 0 }} />

      {/* ─── TOP NAVBAR ─── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 62,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
        background: 'rgba(5,7,15,0.95)',
        backdropFilter: 'blur(40px)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        boxShadow: '0 1px 0 rgba(99,102,241,0.06), 0 4px 32px rgba(0,0,0,0.4)',
      }}>
        {/* Left: Logo + breadcrumbs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="logo-icon" style={{ width: 36, height: 36, borderRadius: 10 }}>
            <Icon.Quotient size={19} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 15.5, letterSpacing: '-0.03em' }}>
            <span className="gradient-text">Quotient</span>
            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> Bot</span>
          </span>
          {selectedGuild && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginLeft: 8 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)' }}>/</span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedGuild.name}</span>
              {activeTabConfig && <>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)' }}>/</span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: activeTabConfig.color }}>{activeTabConfig.label}</span>
              </>}
            </div>
          )}
        </div>

        {/* Right: Status + User */}
        {session && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="badge-live" style={{ fontSize: 10.5 }}>
              <span className="badge-live-dot" />
              Online
            </span>
            <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.07)' }} />
            <div style={{ position: 'relative' }}>
              {session.user?.image
                ? <img src={session.user.image} alt="" style={{ width: 34, height: 34, borderRadius: '50%', border: '2px solid rgba(99,102,241,0.4)', boxShadow: '0 0 14px rgba(99,102,241,0.2)' }} />
                : <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white' }}>{session.user?.name?.charAt(0)}</div>
              }
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, background: '#34d399', borderRadius: '50%', border: '2px solid var(--bg-primary)', boxShadow: '0 0 6px #34d399' }} />
            </div>
            <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.07)' }} />
            <button onClick={() => signOut({ callbackUrl: '/' })} className="btn-ghost" style={{ padding: '7px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 7 }}>
              <Icon.Logout /> Logout
            </button>
          </div>
        )}
      </header>

      {/* ─── MAIN LAYOUT ─── */}
      <div style={{ display: 'flex', flex: 1, paddingTop: 62 }}>

        {/* ─── LEFT SIDEBAR: Server list ─── */}
        <aside style={{
          width: 260, flexShrink: 0,
          position: 'fixed', top: 62, bottom: 0, left: 0,
          overflowY: 'auto',
          padding: '20px 12px',
          display: 'flex', flexDirection: 'column', gap: 2,
          zIndex: 40,
          background: 'rgba(5,7,15,0.98)',
          backdropFilter: 'blur(40px)',
          borderRight: '1px solid rgba(255,255,255,0.03)',
        }}>
          <div style={{ padding: '0 8px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ color: 'rgba(99,102,241,0.6)' }}><Icon.Server /></div>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-muted)' }}>Your Servers</span>
              </div>
              {guilds.length > 0 && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 999, fontSize: 10.5, color: '#818cf8', fontWeight: 700 }}>
                  {guilds.length}
                </div>
              )}
            </div>
            <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(99,102,241,0.15), transparent)' }} />
          </div>

          {guilds.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 14px', color: 'var(--text-muted)', fontSize: 12.5, lineHeight: 1.65 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(99,102,241,0.07)', border: '1px dashed rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, margin: '0 auto 14px' }}>🌐</div>
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>No servers found</div>
              You need admin privileges to manage a server.
            </div>
          ) : (
            guilds.map((guild) => {
              const icon = guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null;
              const isActive = selectedGuild?.id === guild.id;
              return (
                <button
                  key={guild.id}
                  onClick={() => { setSelectedGuild(guild); setActiveTab('permissions'); }}
                  style={{
                    width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                    background: isActive ? 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.08) 100%)' : 'transparent',
                    fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 11,
                    padding: '10px 12px', borderRadius: 12,
                    color: isActive ? '#a5b4fc' : 'var(--text-secondary)',
                    fontWeight: 600, fontSize: 13.5,
                    transition: 'all 0.22s ease',
                    borderWidth: 1, borderStyle: 'solid',
                    borderColor: isActive ? 'rgba(99,102,241,0.25)' : 'transparent',
                    position: 'relative', letterSpacing: '-0.01em',
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
                >
                  {isActive && <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, background: 'linear-gradient(180deg, #6366f1, #a855f7)', borderRadius: '0 4px 4px 0' }} />}
                  {icon
                    ? <img src={icon} alt="" style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, boxShadow: isActive ? '0 0 12px rgba(99,102,241,0.35)' : 'none' }} />
                    : <div style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, background: isActive ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: isActive ? 'white' : 'var(--text-muted)' }}>{guild.name.charAt(0)}</div>
                  }
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{guild.name}</span>
                  {isActive && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#818cf8', flexShrink: 0, boxShadow: '0 0 8px #818cf8' }} />}
                </button>
              );
            })
          )}

          {session && (
            <div style={{ marginTop: 'auto', padding: '14px 10px 4px', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 10px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.08)', borderRadius: 12 }}>
                {session.user?.image
                  ? <img src={session.user.image} alt="" style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(99,102,241,0.3)', flexShrink: 0 }} />
                  : <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0 }}>{session.user?.name?.charAt(0)}</div>
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.user?.name}</div>
                  <div style={{ fontSize: 10.5, color: '#818cf8', fontWeight: 600 }}>Administrator</div>
                </div>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399', flexShrink: 0 }} />
              </div>
            </div>
          )}
        </aside>

        {/* ─── MAIN CONTENT ─── */}
        <main style={{ flex: 1, marginLeft: 260, minWidth: 0, display: 'flex', flexDirection: 'column' }}>

          {!selectedGuild ? (
            // ─── EMPTY / WELCOME STATE ───
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 62px)', textAlign: 'center', padding: '40px 24px' }} className="animate-fade-in">
              <div style={{ position: 'relative', marginBottom: 36 }}>
                <div style={{ width: 120, height: 120, borderRadius: 32, background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.08))', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52, boxShadow: '0 0 80px rgba(99,102,241,0.12), 0 32px 80px rgba(0,0,0,0.4)' }}>
                  <span style={{ animation: 'float 4s ease-in-out infinite' }}>⚡</span>
                </div>
                <div style={{ position: 'absolute', inset: -20, borderRadius: 52, border: '1px dashed rgba(99,102,241,0.12)', animation: 'spin-slow 25s linear infinite' }} />
                <div style={{ position: 'absolute', inset: -40, borderRadius: 68, border: '1px dashed rgba(139,92,246,0.07)', animation: 'spin-slow 40s linear infinite reverse' }} />
              </div>
              <h2 style={{ fontSize: 30, fontWeight: 900, marginBottom: 12, letterSpacing: '-0.04em' }}>Select a <span className="gradient-text">Server</span></h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: 400, lineHeight: 1.75, fontSize: 15.5, marginBottom: 36 }}>
                Choose one of your admin servers from the sidebar to start managing Quotient Bot settings.
              </p>
              {guilds.length > 0 && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 540 }}>
                  {guilds.slice(0, 4).map((g) => {
                    const icon = g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null;
                    return (
                      <button key={g.id} onClick={() => setSelectedGuild(g)} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 18px', fontSize: 13.5, fontWeight: 600, borderRadius: 13 }}>
                        {icon ? <img src={icon} alt="" style={{ width: 22, height: 22, borderRadius: 7 }} /> : <div style={{ width: 22, height: 22, borderRadius: 7, background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#818cf8' }}>{g.name.charAt(0)}</div>}
                        {g.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 62px)' }}>

              {/* ─── SETTINGS NAV (vertical module tabs) ─── */}
              <div style={{ width: 220, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.03)', background: 'rgba(8,11,22,0.7)', display: 'flex', flexDirection: 'column' }}>

                {/* Server header in nav */}
                <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    {guildIcon
                      ? <img src={guildIcon} alt="" style={{ width: 40, height: 40, borderRadius: 12, border: '2px solid rgba(99,102,241,0.3)', boxShadow: '0 0 20px rgba(99,102,241,0.15)' }} />
                      : <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: 'white', boxShadow: '0 0 20px rgba(99,102,241,0.3)' }}>{selectedGuild.name.charAt(0)}</div>
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 800, letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedGuild.name}</div>
                      <span className="badge-live" style={{ fontSize: 9.5, padding: '2px 7px', marginTop: 3, display: 'inline-flex' }}><span className="badge-live-dot" />Active</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <div style={{ flex: 1, padding: '8px 10px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 10, textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1 }} className="gradient-text">{permissions.length}</div>
                      <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Perms</div>
                    </div>
                    <div style={{ flex: 1, padding: '8px 10px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 10, textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1, color: '#a78bfa' }}>{TABS.length}</div>
                      <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Modules</div>
                    </div>
                  </div>
                </div>

                {/* Module list */}
                <div style={{ flex: 1, padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
                  <div style={{ padding: '8px 6px 6px', fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>Modules</div>
                  {TABS.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                          width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 12px', borderRadius: 11,
                          background: isActive ? `linear-gradient(135deg, ${tab.bg}, rgba(99,102,241,0.03))` : 'transparent',
                          color: isActive ? tab.color : 'var(--text-muted)',
                          fontWeight: 600, fontSize: 13,
                          transition: 'all 0.2s ease',
                          borderWidth: 1, borderStyle: 'solid',
                          borderColor: isActive ? `${tab.color}30` : 'transparent',
                          position: 'relative', letterSpacing: '-0.01em',
                        }}
                        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(99,102,241,0.05)'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
                        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
                      >
                        {isActive && <div style={{ position: 'absolute', left: 0, top: '25%', bottom: '25%', width: 3, background: tab.color, borderRadius: '0 3px 3px 0', boxShadow: `0 0 8px ${tab.color}` }} />}
                        <span style={{ display: 'flex', alignItems: 'center', fontSize: typeof tab.icon === 'string' ? 16 : 18, flexShrink: 0 }}>{tab.icon}</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{tab.label}</span>
                        {isActive && <Icon.ChevronRight />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ─── TAB CONTENT ─── */}
              <div style={{ flex: 1, padding: '28px 32px', overflowY: 'auto', minWidth: 0 }}>

                {/* Active tab heading */}
                {activeTabConfig && (
                  <div style={{ marginBottom: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: activeTabConfig.bg, border: `1px solid ${activeTabConfig.color}33`, color: activeTabConfig.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: `0 0 30px ${activeTabConfig.color}22` }}>{activeTabConfig.icon}</div>
                      <div>
                        <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1 }}>{activeTabConfig.label}</h1>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{activeTabConfig.desc}</p>
                      </div>
                    </div>
                    <div style={{ height: 1, background: `linear-gradient(90deg, ${activeTabConfig.color}30, transparent)`, marginTop: 16 }} />
                  </div>
                )}

              {/* Loading */}
              {isLoadingData ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 0' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto 14px' }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Fetching settings…</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* ══════════════════════════════════════════ */}
                  {/* ─── TAB: PERMISSIONS ─── */}
                  {/* ══════════════════════════════════════════ */}
                  {activeTab === 'permissions' && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                      <div className="glass-card-static" style={{ padding: '24px 26px' }}>
                        <SectionHeading icon={<Icon.Plus />} iconBg="rgba(99,102,241,0.12)" iconColor="#818cf8" title="Add Permission" subtitle="Grant a role or user access to bot commands" />
                        <form onSubmit={handleAddPermission} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                          <div style={{ minWidth: 130 }}>
                            <Field label="Type">
                              <select value={newType} onChange={e => setNewType(e.target.value)} className="input-field" style={{ padding: '10px 13px', width: '100%', cursor: 'pointer' }}>
                                <option value="role">🎭 Role ID</option>
                                <option value="user">👤 User ID</option>
                              </select>
                            </Field>
                          </div>
                          <div style={{ flex: 1, minWidth: 200 }}>
                            <Field label="Discord ID">
                              <input type="text" value={newId} onChange={e => setNewId(e.target.value)} placeholder="e.g. 123456789012345678" required className="input-field" style={{ padding: '10px 13px', width: '100%' }} />
                            </Field>
                          </div>
                          <button type="submit" disabled={isSavingPerm} className="btn-primary" style={{ padding: '10px 22px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' }}>
                            {isSavingPerm ? <span className="spinner-sm" /> : <Icon.Plus />}
                            <span>{isSavingPerm ? 'Adding…' : 'Add'}</span>
                          </button>
                        </form>
                      </div>

                      <div className="glass-card-static" style={{ padding: '24px 26px' }}>
                        <SectionHeading icon={<Icon.Shield />} iconBg="rgba(139,92,246,0.12)" iconColor="#a78bfa" title="Authorized Entities" subtitle={permissions.length === 0 ? 'Only server admins can use the bot' : `${permissions.length} entit${permissions.length === 1 ? 'y has' : 'ies have'} been granted access`} />

                        {permissions.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', background: 'rgba(5,7,15,0.5)', borderRadius: 13, border: '1px dashed rgba(99,102,241,0.12)' }}>
                            <div style={{ width: 48, height: 48, borderRadius: 13, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, margin: '0 auto 14px' }}>🔒</div>
                            <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5, fontSize: 14 }}>No permissions configured</div>
                            <div style={{ fontSize: 13 }}>Only server admins can use bot commands. Add roles or users above.</div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {permissions.map((p, i) => (
                              <div key={p.id} className="permission-item" style={{ animationDelay: `${0.05 * i}s` }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                                  <span className={p.type === 'role' ? 'badge-role' : 'badge-user'}>{p.type === 'role' ? '🎭 Role' : '👤 User'}</span>
                                  <code style={{ fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace", fontSize: 12, color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.04)', padding: '3px 9px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.05)' }}>{p.target_id}</code>
                                </div>
                                <button onClick={() => handleRemovePermission(p.id)} className="btn-danger" style={{ padding: '6px 13px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <Icon.Trash /> Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ══════════════════════════════════════════ */}
                  {/* ─── TAB: WELCOME ─── */}
                  {/* ══════════════════════════════════════════ */}
                  {activeTab === 'welcome' && (
                    <form onSubmit={handleSaveWelcome} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                      <div className="glass-card-static" style={{ padding: '24px 26px' }}>
                        <SectionHeading icon="👋" iconBg="rgba(16,185,129,0.12)" iconColor="#34d399" title="Welcome Configuration" subtitle="Greet new members when they join your server" />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
                          <Field label="Welcome Channel ID">
                            <input type="text" value={welcome.WELCOME_CHANNEL_ID} onChange={e => setWelcome({ ...welcome, WELCOME_CHANNEL_ID: e.target.value })} placeholder="e.g. 123456789012345678" className="input-field" style={{ padding: '10px 13px', width: '100%' }} />
                          </Field>
                          <Field label="Welcome Message" hint="Use {user} and {server}">
                            <textarea value={welcome.WELCOME_MESSAGE} onChange={e => setWelcome({ ...welcome, WELCOME_MESSAGE: e.target.value })} placeholder={`Welcome {user} to {server}! 🎉`} rows={3} className="input-field" style={{ padding: '10px 13px', width: '100%', resize: 'none', lineHeight: 1.6 }} />
                          </Field>
                        </div>
                      </div>

                      <div className="glass-card-static" style={{ padding: '24px 26px' }}>
                        <SectionHeading icon="🚪" iconBg="rgba(139,92,246,0.12)" iconColor="#a78bfa" title="Goodbye Configuration" subtitle="Say farewell to departing members" />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
                          <Field label="Goodbye Channel ID">
                            <input type="text" value={welcome.GOODBYE_CHANNEL_ID} onChange={e => setWelcome({ ...welcome, GOODBYE_CHANNEL_ID: e.target.value })} placeholder="e.g. 123456789012345678" className="input-field" style={{ padding: '10px 13px', width: '100%' }} />
                          </Field>
                          <Field label="Goodbye Message" hint="Use {user} and {server}">
                            <textarea value={welcome.GOODBYE_MESSAGE} onChange={e => setWelcome({ ...welcome, GOODBYE_MESSAGE: e.target.value })} placeholder={`Goodbye {user}, we'll miss you! 👋`} rows={3} className="input-field" style={{ padding: '10px 13px', width: '100%', resize: 'none', lineHeight: 1.6 }} />
                          </Field>
                        </div>
                      </div>

                      <SaveFooter isSaving={isSavingWelcome} label="Save Welcome Settings" hint="Changes apply instantly to new joins" />
                    </form>
                  )}

                  {/* ══════════════════════════════════════════ */}
                  {/* ─── TAB: AUTOMOD ─── */}
                  {/* ══════════════════════════════════════════ */}
                  {activeTab === 'automod' && (
                    <form onSubmit={handleSaveAutomod} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                      {/* Info banner */}
                      <div style={{ padding: '14px 18px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 13, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <span style={{ fontSize: 20, flexShrink: 0 }}>🤖</span>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#fca5a5', marginBottom: 3 }}>Auto-Moderation System</div>
                          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55 }}>
                            AutoMod automatically monitors all messages in your server. Moderators (MANAGE_MESSAGES) bypass all AutoMod rules. Toggle features below and save.
                          </div>
                        </div>
                      </div>

                      <div className="glass-card-static" style={{ padding: '24px 26px' }}>
                        <SectionHeading icon={<Icon.Robot />} iconBg="rgba(239,68,68,0.1)" iconColor="#f87171" title="AutoMod Toggles" subtitle="Enable or disable automatic moderation features" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <Toggle checked={automod.AUTOMOD_ANTI_SPAM === 'true'} onChange={v => setAutomod({ ...automod, AUTOMOD_ANTI_SPAM: String(v) })} label="Anti-Spam" desc="Delete messages if a user sends more than 5 within 3 seconds" accent="#f87171" />
                          <Toggle checked={automod.AUTOMOD_BLOCK_INVITES === 'true'} onChange={v => setAutomod({ ...automod, AUTOMOD_BLOCK_INVITES: String(v) })} label="Block Discord Invites" desc="Delete messages containing Discord invite links" accent="#f87171" />
                          <Toggle checked={automod.AUTOMOD_BLOCK_URLS === 'true'} onChange={v => setAutomod({ ...automod, AUTOMOD_BLOCK_URLS: String(v) })} label="Block All URLs" desc="Delete messages containing any URL (invite links always blocked regardless)" accent="#f87171" />
                        </div>
                      </div>

                      <div className="glass-card-static" style={{ padding: '24px 26px' }}>
                        <SectionHeading icon="🚫" iconBg="rgba(239,68,68,0.1)" iconColor="#f87171" title="Bad Word Filter" subtitle="Messages containing these words will be auto-deleted" />
                        <Field label="Blacklisted Words" hint="comma-separated">
                          <textarea value={automod.AUTOMOD_BAD_WORDS} onChange={e => setAutomod({ ...automod, AUTOMOD_BAD_WORDS: e.target.value })} placeholder="badword1, slur1, offensiveterm" rows={4} className="input-field" style={{ padding: '11px 13px', width: '100%', resize: 'vertical', lineHeight: 1.6, fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: 13 }} />
                        </Field>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                          ⚠️ Words are stored in the database and synced to the bot. Separate each word or phrase with a comma.
                        </p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Changes apply instantly</span>
                        <button type="submit" disabled={isSavingAutomod} className="btn-primary" style={{ padding: '11px 28px', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 9, borderRadius: 12 }}>
                          {isSavingAutomod ? <span className="spinner-sm" /> : <Icon.Check />}
                          <span>{isSavingAutomod ? 'Saving…' : 'Save AutoMod'}</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* ══════════════════════════════════════════ */}
                  {/* ─── TAB: LOGGING ─── */}
                  {/* ══════════════════════════════════════════ */}
                  {activeTab === 'logging' && (
                    <form onSubmit={handleSaveLogging} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                      <div className="glass-card-static" style={{ padding: '24px 26px' }}>
                        <SectionHeading icon={<Icon.Logs />} iconBg="rgba(139,92,246,0.12)" iconColor="#a78bfa" title="Mod Logs" subtitle="Where moderation actions are recorded (ban, kick, mute, warn)" />
                        <Field label="Mod Logs Channel ID">
                          <input type="text" value={logging.MOD_LOGS_CHANNEL_ID} onChange={e => setLogging({ ...logging, MOD_LOGS_CHANNEL_ID: e.target.value })} placeholder="e.g. 123456789012345678" className="input-field" style={{ padding: '10px 13px', width: '100%', maxWidth: 480 }} />
                        </Field>
                        <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)', borderRadius: 10, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55 }}>
                          <strong style={{ color: '#a78bfa' }}>Logged events:</strong> Ban · Kick · Mute/Unmute · Warn · AutoMod actions
                        </div>
                      </div>

                      <div className="glass-card-static" style={{ padding: '24px 26px' }}>
                        <SectionHeading icon="📋" iconBg="rgba(99,102,241,0.12)" iconColor="#818cf8" title="Server Logs" subtitle="Where server events are recorded (message edits, deletes, member joins/leaves)" />
                        <Field label="Server Logs Channel ID">
                          <input type="text" value={logging.SERVER_LOGS_CHANNEL_ID} onChange={e => setLogging({ ...logging, SERVER_LOGS_CHANNEL_ID: e.target.value })} placeholder="e.g. 123456789012345678" className="input-field" style={{ padding: '10px 13px', width: '100%', maxWidth: 480 }} />
                        </Field>
                        <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 10, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55 }}>
                          <strong style={{ color: '#818cf8' }}>Logged events:</strong> Message edit · Message delete · Member join · Member leave · Role changes
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Changes apply instantly</span>
                        <button type="submit" disabled={isSavingLogging} className="btn-primary" style={{ padding: '11px 28px', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 9, borderRadius: 12 }}>
                          {isSavingLogging ? <span className="spinner-sm" /> : <Icon.Check />}
                          <span>{isSavingLogging ? 'Saving…' : 'Save Logging'}</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* ══════════════════════════════════════════ */}
                  {/* ─── TAB: ROLES ─── */}
                  {/* ══════════════════════════════════════════ */}
                  {activeTab === 'roles' && (
                    <form onSubmit={handleSaveRoles} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                      <div className="glass-card-static" style={{ padding: '24px 26px' }}>
                        <SectionHeading icon={<Icon.Roles />} iconBg="rgba(245,158,11,0.12)" iconColor="#fbbf24" title="Autoroles" subtitle="Automatically assign roles to joining members" />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
                          <Field label="Default Member Role ID" hint="assigned to all humans (legacy/fallback)">
                            <input type="text" value={roles.DEFAULT_MEMBER_ROLE_ID} onChange={e => setRoles({ ...roles, DEFAULT_MEMBER_ROLE_ID: e.target.value })} placeholder="e.g. 123456789012345678" className="input-field" style={{ padding: '10px 13px', width: '100%' }} />
                          </Field>
                          <Field label="Human Autorole ID" hint="assigned to joining human members">
                            <input type="text" value={roles.AUTOROLE_HUMANS_ROLE_ID} onChange={e => setRoles({ ...roles, AUTOROLE_HUMANS_ROLE_ID: e.target.value })} placeholder="e.g. 123456789012345678" className="input-field" style={{ padding: '10px 13px', width: '100%' }} />
                          </Field>
                          <Field label="Bot Autorole ID" hint="assigned to joining bot accounts">
                            <input type="text" value={roles.AUTOROLE_BOTS_ROLE_ID} onChange={e => setRoles({ ...roles, AUTOROLE_BOTS_ROLE_ID: e.target.value })} placeholder="e.g. 123456789012345678" className="input-field" style={{ padding: '10px 13px', width: '100%' }} />
                          </Field>
                        </div>
                        <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)', borderRadius: 10, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55 }}>
                          💡 <strong style={{ color: '#fbbf24' }}>Tip:</strong> Right-click a role in Discord → Copy Role ID. Make sure Quotient Bot's role is above these roles in the hierarchy.
                        </div>
                      </div>

                      <div className="glass-card-static" style={{ padding: '24px 26px' }}>
                        <SectionHeading icon="🎭" iconBg="rgba(245,158,11,0.12)" iconColor="#fbbf24" title="Button Roles" subtitle="Self-assignable roles via buttons (use /setup-roles command in Discord)" />
                        <div style={{ padding: '16px', background: 'rgba(5,7,15,0.5)', border: '1px dashed rgba(245,158,11,0.15)', borderRadius: 12, fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                          <div style={{ marginBottom: 10 }}>Button roles are configured directly in Discord using the <code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 5, fontFamily: 'monospace', fontSize: 12, color: '#fbbf24' }}>/setup-roles</code> command.</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {[
                              'Run /setup-roles in a channel',
                              'Add roles using the interactive menu',
                              'Members click buttons to self-assign roles',
                            ].map((step, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fbbf24', flexShrink: 0 }}>{i + 1}</div>
                                {step}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Changes apply on member join</span>
                        <button type="submit" disabled={isSavingRoles} className="btn-primary" style={{ padding: '11px 28px', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 9, borderRadius: 12 }}>
                          {isSavingRoles ? <span className="spinner-sm" /> : <Icon.Check />}
                          <span>{isSavingRoles ? 'Saving…' : 'Save Role Settings'}</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* ══════════════════════════════════════════ */}
                  {/* ─── TAB: SOCIAL NOTIFIER ─── */}
                  {/* ══════════════════════════════════════════ */}
                  {activeTab === 'social' && (
                    <form onSubmit={handleSaveSocial} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                      {/* Platform tabs */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {SOCIAL_PLATFORMS.map(p => (
                          <button key={p.key} type="button" onClick={() => setActiveSocialPlatform(p.key)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px',
                              borderRadius: 12, border: `1px solid ${activeSocialPlatform === p.key ? p.border : 'rgba(99,102,241,0.1)'}`,
                              background: activeSocialPlatform === p.key ? p.bg : 'rgba(5,7,15,0.5)',
                              color: activeSocialPlatform === p.key ? p.color : 'var(--text-muted)',
                              fontWeight: 600, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit',
                              transition: 'all 0.22s ease',
                              boxShadow: activeSocialPlatform === p.key ? `0 0 20px ${p.bg}` : 'none',
                            }}>
                            <span>{p.emoji}</span> {p.label}
                            {social[`${p.key}_URL`] && <span style={{ width: 6, height: 6, background: '#34d399', borderRadius: '50%', boxShadow: '0 0 6px #34d399' }} />}
                          </button>
                        ))}
                      </div>

                      {SOCIAL_PLATFORMS.filter(p => p.key === activeSocialPlatform).map(p => (
                        <div key={p.key} className="glass-card-static" style={{ padding: '24px 26px' }}>
                          <SectionHeading icon={p.emoji} iconBg={p.bg} iconColor={p.color} title={`${p.label} Notifications`} subtitle={`Post new ${p.label} content automatically to a Discord channel`} />
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
                            <Field label="RSS Feed URL" hint={p.key === 'YOUTUBE' ? 'YouTube channel Atom feed' : 'RSS/Atom feed URL'}>
                              <input type="text" value={social[`${p.key}_URL`]} onChange={e => setSocial({ ...social, [`${p.key}_URL`]: e.target.value })} placeholder={p.key === 'YOUTUBE' ? 'https://www.youtube.com/feeds/videos.xml?channel_id=...' : 'https://rsshub.app/...'} className="input-field" style={{ padding: '10px 13px', width: '100%' }} />
                            </Field>
                            <Field label="Notification Channel ID">
                              <input type="text" value={social[`${p.key}_CHANNEL_ID`]} onChange={e => setSocial({ ...social, [`${p.key}_CHANNEL_ID`]: e.target.value })} placeholder="e.g. 123456789012345678" className="input-field" style={{ padding: '10px 13px', width: '100%' }} />
                            </Field>
                            <div style={{ gridColumn: '1 / -1' }}>
                              <Field label="Custom Notification Message" hint="optional, leave blank for default">
                                <textarea value={social[`${p.key}_MESSAGE`]} onChange={e => setSocial({ ...social, [`${p.key}_MESSAGE`]: e.target.value })} placeholder={`🎥 New ${p.label} video just dropped! Check it out below:`} rows={2} className="input-field" style={{ padding: '10px 13px', width: '100%', resize: 'none', lineHeight: 1.6 }} />
                              </Field>
                            </div>
                          </div>

                          {p.key === 'YOUTUBE' && (
                            <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(255,0,0,0.05)', border: '1px solid rgba(255,0,0,0.1)', borderRadius: 10, fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                              💡 <strong style={{ color: '#fca5a5' }}>YouTube URL:</strong> Go to your channel → View source → Search for <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: 11 }}>channelId</code>. Then use: <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: 11 }}>https://www.youtube.com/feeds/videos.xml?channel_id=YOUR_ID</code>
                            </div>
                          )}
                          {(p.key === 'TIKTOK' || p.key === 'INSTAGRAM') && (
                            <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(105,201,208,0.05)', border: '1px solid rgba(105,201,208,0.1)', borderRadius: 10, fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                              💡 Use an RSS bridge like <a href="https://rsshub.app" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'none' }}>rsshub.app</a> to generate an RSS feed URL for {p.label}.
                            </div>
                          )}
                        </div>
                      ))}

                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Polls every 5 minutes</span>
                        <button type="submit" disabled={isSavingSocial} className="btn-primary" style={{ padding: '11px 28px', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 9, borderRadius: 12 }}>
                          {isSavingSocial ? <span className="spinner-sm" /> : <Icon.Check />}
                          <span>{isSavingSocial ? 'Saving…' : 'Save Social Config'}</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* ══════════════════════════════════════════ */}
                  {/* ─── TAB: ESPORTS ─── */}
                  {/* ══════════════════════════════════════════ */}
                  {activeTab === 'esports' && (
                    <form onSubmit={handleSaveEsports} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                      <div className="glass-card-static" style={{ padding: '24px 26px' }}>
                        <SectionHeading icon="🎮" iconBg="rgba(16,185,129,0.12)" iconColor="#10b981" title="Screenshot Verification" subtitle="Configure screenshots log channel and role to assign" />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
                          <Field label="Verification Log Channel ID" hint="where staff approves/rejects submissions">
                            <input type="text" value={esports.SS_VERIFY_CHANNEL} onChange={e => setEsports({ ...esports, SS_VERIFY_CHANNEL: e.target.value })} placeholder="e.g. 123456789012345678" className="input-field" style={{ padding: '10px 13px', width: '100%' }} />
                          </Field>
                          <Field label="Verified Role ID" hint="role given upon successful verification">
                            <input type="text" value={esports.SS_VERIFY_ROLE} onChange={e => setEsports({ ...esports, SS_VERIFY_ROLE: e.target.value })} placeholder="e.g. 123456789012345678" className="input-field" style={{ padding: '10px 13px', width: '100%' }} />
                          </Field>
                        </div>
                        <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)', borderRadius: 10, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55 }}>
                          💡 <strong style={{ color: '#10b981' }}>How it works:</strong> Users submit screenshot attachments via `/ssverify submit`. The bot will post them to the log channel with **Approve** and **Reject** buttons for staff members.
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Changes apply instantly</span>
                        <button type="submit" disabled={isSavingEsports} className="btn-primary" style={{ padding: '11px 28px', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 9, borderRadius: 12 }}>
                          {isSavingEsports ? <span className="spinner-sm" /> : <Icon.Check />}
                          <span>{isSavingEsports ? 'Saving…' : 'Save Esports Settings'}</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* ══════════════════════════════════════════ */}
                  {/* ─── TAB: MUSIC ─── */}
                  {/* ══════════════════════════════════════════ */}
                  {activeTab === 'music' && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                      {/* Status banner */}
                      <div style={{ padding: '18px 22px', background: 'linear-gradient(135deg, rgba(236,72,153,0.1), rgba(139,92,246,0.06))', border: '1px solid rgba(236,72,153,0.18)', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(236,72,153,0.15)', border: '1px solid rgba(236,72,153,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🎵</div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3, letterSpacing: '-0.02em' }}>Music System</div>
                          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>Quotient Bot includes a full-featured music player. Use slash commands in any voice channel to play music.</div>
                        </div>
                        <span className="badge-live" style={{ marginLeft: 'auto', flexShrink: 0 }}><span className="badge-live-dot" />Active</span>
                      </div>

                      <div className="glass-card-static" style={{ padding: '24px 26px' }}>
                        <SectionHeading icon={<Icon.Music />} iconBg="rgba(236,72,153,0.12)" iconColor="#f472b6" title="Music Commands" subtitle="All available music commands — use these in Discord" />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
                          {MUSIC_COMMANDS.map((m, i) => (
                            <div key={m.cmd} className="permission-item" style={{ animationDelay: `${0.04 * i}s` }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <code style={{ fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace", fontSize: 12.5, color: '#f472b6', background: 'rgba(236,72,153,0.08)', padding: '3px 10px', borderRadius: 7, border: '1px solid rgba(236,72,153,0.15)', flexShrink: 0 }}>{m.cmd}</code>
                                <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{m.desc}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="glass-card-static" style={{ padding: '24px 26px' }}>
                        <SectionHeading icon="⚙️" iconBg="rgba(236,72,153,0.12)" iconColor="#f472b6" title="Music Configuration" subtitle="Note: Music settings are managed via bot commands, not the dashboard" />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                          {[
                            { label: 'Default Volume', value: '70%', icon: '🔊' },
                            { label: 'Max Queue Size', value: 'Unlimited', icon: '📋' },
                            { label: 'Audio Quality', value: 'High', icon: '✨' },
                            { label: 'Source', value: 'YouTube', icon: '▶️' },
                          ].map(stat => (
                            <div key={stat.label} style={{ padding: '16px 18px', background: 'rgba(5,7,15,0.5)', border: '1px solid rgba(236,72,153,0.1)', borderRadius: 13 }}>
                              <div style={{ fontSize: 20, marginBottom: 8 }}>{stat.icon}</div>
                              <div style={{ fontSize: 18, fontWeight: 800, color: '#f472b6', letterSpacing: '-0.02em', lineHeight: 1 }}>{stat.value}</div>
                              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{stat.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              </div>
            </div>
          )}
        </main>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
