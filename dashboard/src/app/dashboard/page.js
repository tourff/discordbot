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
  Home:         () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Quotient:     ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/><path d="M8.5 8.5l7 7"/></svg>,
  Zap:          () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
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
        boxShadow: `0 0 24px ${iconColor}22`,
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
  { id: 'overview',    label: 'Overview',        icon: <Icon.Home />,    color: '#38bdf8', bg: 'rgba(56,189,248,0.12)',   desc: 'Server at a glance' },
  { id: 'permissions', label: 'Permissions',     icon: <Icon.Shield />,  color: '#818cf8', bg: 'rgba(99,102,241,0.12)',   desc: 'Manage bot access' },
  { id: 'welcome',     label: 'Welcome',          icon: '👋',             color: '#34d399', bg: 'rgba(16,185,129,0.12)',   desc: 'Join & leave messages' },
  { id: 'automod',     label: 'AutoMod',          icon: <Icon.Robot />,   color: '#f87171', bg: 'rgba(239,68,68,0.12)',    desc: 'Auto moderation' },
  { id: 'logging',     label: 'Logging',          icon: <Icon.Logs />,    color: '#a78bfa', bg: 'rgba(139,92,246,0.12)',   desc: 'Audit & event logs' },
  { id: 'roles',       label: 'Roles & Auto',     icon: <Icon.Roles />,   color: '#fbbf24', bg: 'rgba(245,158,11,0.12)',   desc: 'Auto role assignment' },
  { id: 'esports',     label: 'Esports & SS',     icon: <Icon.Gamepad />, color: '#10b981', bg: 'rgba(16,185,129,0.12)',   desc: 'Screenshot verify' },
  { id: 'social',      label: 'Social Notifier',  icon: <Icon.Globe />,   color: '#38bdf8', bg: 'rgba(56,189,248,0.12)',   desc: 'Social media feeds' },
  { id: 'music',       label: 'Music',            icon: <Icon.Music />,   color: '#f472b6', bg: 'rgba(244,114,182,0.12)',  desc: 'Music player' },
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
  const [activeTab, setActiveTab]         = useState('overview');
  const [toast, setToast]                 = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [nowPlayingBar, setNowPlayingBar] = useState(false);

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

    Promise.all([
      supabase.from('bot_permissions').select('*').eq('guild_id', selectedGuild.id),
      supabase.from('bot_settings').select('*').eq('guild_id', selectedGuild.id),
    ]).then(([permRes, setRes]) => {
      if (!permRes.error && permRes.data) setPermissions(permRes.data);
      if (!setRes.error && setRes.data) {
        const map = {};
        setRes.data.forEach(r => { map[r.key] = r.value; });
        setWelcome({ WELCOME_CHANNEL_ID: map.WELCOME_CHANNEL_ID || '', WELCOME_MESSAGE: map.WELCOME_MESSAGE || '', GOODBYE_CHANNEL_ID: map.GOODBYE_CHANNEL_ID || '', GOODBYE_MESSAGE: map.GOODBYE_MESSAGE || '' });
        setAutomod({ AUTOMOD_BAD_WORDS: map.AUTOMOD_BAD_WORDS || '', AUTOMOD_ANTI_SPAM: map.AUTOMOD_ANTI_SPAM ?? 'true', AUTOMOD_BLOCK_INVITES: map.AUTOMOD_BLOCK_INVITES ?? 'true', AUTOMOD_BLOCK_URLS: map.AUTOMOD_BLOCK_URLS ?? 'false' });
        setLogging({ MOD_LOGS_CHANNEL_ID: map.MOD_LOGS_CHANNEL_ID || '', SERVER_LOGS_CHANNEL_ID: map.SERVER_LOGS_CHANNEL_ID || '' });
        setRoles({ DEFAULT_MEMBER_ROLE_ID: map.DEFAULT_MEMBER_ROLE_ID || '', AUTOROLE_HUMANS_ROLE_ID: map.AUTOROLE_HUMANS_ROLE_ID || '', AUTOROLE_BOTS_ROLE_ID: map.AUTOROLE_BOTS_ROLE_ID || '' });
        setEsports({ SS_VERIFY_CHANNEL: map.SS_VERIFY_CHANNEL || '', SS_VERIFY_ROLE: map.SS_VERIFY_ROLE || '' });
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

  const handleSaveWelcome  = async (e) => { e.preventDefault(); setIsSavingWelcome(true);  const ok = await saveSettings(welcome);  showToast(ok ? 'Welcome settings saved! ✨' : 'Failed to save.', ok ? 'success' : 'error'); setIsSavingWelcome(false); };
  const handleSaveAutomod  = async (e) => { e.preventDefault(); setIsSavingAutomod(true);  const ok = await saveSettings(automod);  showToast(ok ? 'AutoMod settings saved! 🤖' : 'Failed to save.', ok ? 'success' : 'error'); setIsSavingAutomod(false); };
  const handleSaveLogging  = async (e) => { e.preventDefault(); setIsSavingLogging(true);  const ok = await saveSettings(logging);  showToast(ok ? 'Logging settings saved! 📋' : 'Failed to save.', ok ? 'success' : 'error'); setIsSavingLogging(false); };
  const handleSaveRoles    = async (e) => { e.preventDefault(); setIsSavingRoles(true);    const ok = await saveSettings(roles);    showToast(ok ? 'Role settings saved! 🎭' : 'Failed to save.', ok ? 'success' : 'error'); setIsSavingRoles(false); };
  const handleSaveEsports  = async (e) => { e.preventDefault(); setIsSavingEsports(true);  const ok = await saveSettings(esports);  showToast(ok ? 'Esports settings saved! 🎮' : 'Failed to save.', ok ? 'success' : 'error'); setIsSavingEsports(false); };
  const handleSaveSocial   = async (e) => { e.preventDefault(); setIsSavingSocial(true);   const ok = await saveSettings(social);   showToast(ok ? 'Social notifier saved! 🌐' : 'Failed to save.', ok ? 'success' : 'error'); setIsSavingSocial(false); };

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
          <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1))', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 60px rgba(99,102,241,0.2)' }}>
            <div className="spinner" style={{ width: 32, height: 32, borderWidth: 2.5 }} />
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Loading Dashboard</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Jarvis Bot</p>
        </div>
      </div>
    );
  }

  const guildIcon = selectedGuild?.icon ? `https://cdn.discordapp.com/icons/${selectedGuild.id}/${selectedGuild.icon}.png` : null;
  const activeTabConfig = TABS.find(t => t.id === activeTab);

  // Compute module stats for overview
  const configuredModules = [
    welcome.WELCOME_CHANNEL_ID,
    automod.AUTOMOD_ANTI_SPAM === 'true' ? '1' : '',
    logging.MOD_LOGS_CHANNEL_ID,
    roles.DEFAULT_MEMBER_ROLE_ID || roles.AUTOROLE_HUMANS_ROLE_ID,
    esports.SS_VERIFY_CHANNEL,
    social.YOUTUBE_URL || social.FACEBOOK_URL || social.INSTAGRAM_URL || social.TIKTOK_URL,
  ].filter(Boolean).length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>

      {/* Subtle background */}
      <div style={{ position: 'fixed', top: '-10%', right: '-5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(80px)', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-10%', left: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(80px)', zIndex: 0 }} />
      <div className="mesh-grid" style={{ position: 'fixed', opacity: 0.3, zIndex: 0 }} />

      {/* ─── TOP NAVBAR ─── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
        background: 'rgba(5,7,15,0.97)',
        backdropFilter: 'blur(40px)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        boxShadow: '0 1px 0 rgba(99,102,241,0.06), 0 4px 32px rgba(0,0,0,0.4)',
      }}>
        {/* Left: Logo + breadcrumbs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="logo-icon" style={{ width: 34, height: 34, borderRadius: 10 }}>
            <Icon.Quotient size={18} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.03em' }}>
            <span className="gradient-text">Quotient</span>
            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> Bot</span>
          </span>
          {selectedGuild && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginLeft: 8 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.12)' }}>/</span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedGuild.name}</span>
              {activeTabConfig && <>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.12)' }}>/</span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: activeTabConfig.color }}>{activeTabConfig.label}</span>
              </>}
            </div>
          )}
        </div>

        {/* Right */}
        {session && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="badge-live" style={{ fontSize: 10.5 }}>
              <span className="badge-live-dot" />
              Online
            </span>
            <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.07)' }} />
            <div style={{ position: 'relative' }}>
              {session.user?.image
                ? <img src={session.user.image} alt="" style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(99,102,241,0.4)', boxShadow: '0 0 14px rgba(99,102,241,0.2)' }} />
                : <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white' }}>{session.user?.name?.charAt(0)}</div>
              }
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 9, height: 9, background: '#34d399', borderRadius: '50%', border: '2px solid var(--bg-primary)', boxShadow: '0 0 6px #34d399' }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{session.user?.name}</span>
            <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.07)' }} />
            <button onClick={() => signOut({ callbackUrl: '/' })} className="btn-ghost" style={{ padding: '6px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 7 }}>
              <Icon.Logout /> Logout
            </button>
          </div>
        )}
      </header>

      {/* ─── MAIN LAYOUT ─── */}
      <div style={{ display: 'flex', flex: 1, paddingTop: 60 }}>

        {/* ─── LEFT SIDEBAR: Server list ─── */}
        <aside style={{
          width: 260, flexShrink: 0,
          position: 'fixed', top: 60, bottom: 0, left: 0,
          overflowY: 'auto',
          padding: '18px 10px',
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
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(99,102,241,0.07)', border: '1px dashed rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 14px' }}>🌐</div>
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
                  onClick={() => { setSelectedGuild(guild); setActiveTab('overview'); }}
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
                  {isActive && <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, background: 'linear-gradient(180deg, #6366f1, #a855f7)', borderRadius: '0 4px 4px 0', boxShadow: '2px 0 12px rgba(99,102,241,0.4)' }} />}
                  {icon
                    ? <img src={icon} alt="" style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, boxShadow: isActive ? '0 0 14px rgba(99,102,241,0.4)' : 'none' }} />
                    : <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: isActive ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: isActive ? 'white' : 'var(--text-muted)', boxShadow: isActive ? '0 0 14px rgba(99,102,241,0.35)' : 'none' }}>{guild.name.charAt(0)}</div>
                  }
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{guild.name}</span>
                  {isActive && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#818cf8', flexShrink: 0, boxShadow: '0 0 8px #818cf8' }} />}
                </button>
              );
            })
          )}

          {session && (
            <div style={{ marginTop: 'auto', padding: '14px 8px 4px', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.1)', borderRadius: 12 }}>
                {session.user?.image
                  ? <img src={session.user.image} alt="" style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(99,102,241,0.35)', flexShrink: 0 }} />
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 60px)', textAlign: 'center', padding: '40px 24px' }} className="animate-fade-in">
              <div style={{ position: 'relative', marginBottom: 40 }}>
                <div style={{ width: 130, height: 130, borderRadius: 36, background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.08))', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, boxShadow: '0 0 100px rgba(99,102,241,0.15), 0 32px 80px rgba(0,0,0,0.4)' }}>
                  <span style={{ animation: 'float 4s ease-in-out infinite' }}>⚡</span>
                </div>
                <div style={{ position: 'absolute', inset: -20, borderRadius: 56, border: '1px dashed rgba(99,102,241,0.12)', animation: 'spin-slow 25s linear infinite' }} />
                <div style={{ position: 'absolute', inset: -44, borderRadius: 74, border: '1px dashed rgba(139,92,246,0.06)', animation: 'spin-slow 40s linear infinite reverse' }} />
              </div>
              <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 12, letterSpacing: '-0.04em' }}>Select a <span className="gradient-text">Server</span></h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: 440, lineHeight: 1.75, fontSize: 15.5, marginBottom: 40 }}>
                Choose one of your admin servers from the sidebar to start managing Jarvis Bot settings.
              </p>
              {guilds.length > 0 && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 580 }}>
                  {guilds.slice(0, 6).map((g) => {
                    const icon = g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null;
                    return (
                      <button key={g.id} onClick={() => { setSelectedGuild(g); setActiveTab('overview'); }} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 18px', fontSize: 13.5, fontWeight: 600, borderRadius: 13 }}>
                        {icon ? <img src={icon} alt="" style={{ width: 22, height: 22, borderRadius: 7 }} /> : <div style={{ width: 22, height: 22, borderRadius: 7, background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#818cf8' }}>{g.name.charAt(0)}</div>}
                        {g.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 60px)' }}>

              {/* ─── SETTINGS NAV (vertical module tabs) ─── */}
              <div style={{ width: 228, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.03)', background: 'rgba(6,9,20,0.8)', display: 'flex', flexDirection: 'column' }}>

                {/* Server header */}
                <div style={{ padding: '18px 14px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    {guildIcon
                      ? <img src={guildIcon} alt="" style={{ width: 42, height: 42, borderRadius: 13, border: '2px solid rgba(99,102,241,0.35)', boxShadow: '0 0 24px rgba(99,102,241,0.2)' }} />
                      : <div style={{ width: 42, height: 42, borderRadius: 13, background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: 'white', boxShadow: '0 0 24px rgba(99,102,241,0.35)' }}>{selectedGuild.name.charAt(0)}</div>
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 800, letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedGuild.name}</div>
                      <span className="badge-live" style={{ fontSize: 9.5, padding: '2px 7px', marginTop: 3, display: 'inline-flex' }}><span className="badge-live-dot" />Active</span>
                    </div>
                  </div>
                  {/* Mini stats */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <div style={{ flex: 1, padding: '8px 10px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 10, textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1 }} className="gradient-text">{permissions.length}</div>
                      <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Perms</div>
                    </div>
                    <div style={{ flex: 1, padding: '8px 10px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 10, textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1, color: '#a78bfa' }}>{configuredModules}</div>
                      <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Active</div>
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
                        {isActive && <div style={{ position: 'absolute', left: 0, top: '25%', bottom: '25%', width: 3, background: tab.color, borderRadius: '0 3px 3px 0', boxShadow: `0 0 10px ${tab.color}` }} />}
                        <span style={{ display: 'flex', alignItems: 'center', fontSize: typeof tab.icon === 'string' ? 16 : 18, flexShrink: 0 }}>{tab.icon}</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{tab.label}</span>
                        {isActive && <Icon.ChevronRight />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ─── TAB CONTENT ─── */}
              <div style={{ flex: 1, padding: '28px 32px', overflowY: 'auto', minWidth: 0, maxWidth: 1000 }}>

                {/* Active tab heading */}
                {activeTabConfig && (
                  <div style={{ marginBottom: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                      <div style={{
                        width: 52, height: 52, borderRadius: 16,
                        background: activeTabConfig.bg,
                        border: `1px solid ${activeTabConfig.color}33`,
                        color: activeTabConfig.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22,
                        boxShadow: `0 0 40px ${activeTabConfig.color}22`,
                      }}>{activeTabConfig.icon}</div>
                      <div>
                        <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>{activeTabConfig.label}</h1>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{activeTabConfig.desc}</p>
                      </div>
                    </div>
                    <div style={{ height: 1, background: `linear-gradient(90deg, ${activeTabConfig.color}30, rgba(99,102,241,0.1), transparent)`, marginTop: 16 }} />
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
                    {/* ─── TAB: OVERVIEW ─── */}
                    {/* ══════════════════════════════════════════ */}
                    {activeTab === 'overview' && (
                      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

                        {/* Welcome banner */}
                        <div style={{
                          padding: '22px 26px',
                          background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.06) 50%, rgba(236,72,153,0.04) 100%)',
                          border: '1px solid rgba(99,102,241,0.18)',
                          borderRadius: 20,
                          display: 'flex', alignItems: 'center', gap: 20,
                          position: 'relative', overflow: 'hidden',
                        }}>
                          <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent)', pointerEvents: 'none' }} />
                          {guildIcon
                            ? <img src={guildIcon} alt="" style={{ width: 56, height: 56, borderRadius: 16, border: '2px solid rgba(99,102,241,0.4)', boxShadow: '0 0 30px rgba(99,102,241,0.25)', flexShrink: 0 }} />
                            : <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: 'white', flexShrink: 0, boxShadow: '0 0 30px rgba(99,102,241,0.35)' }}>{selectedGuild.name.charAt(0)}</div>
                          }
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4 }}>
                              {selectedGuild.name}
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Managing Jarvis Bot for this server · ID: <code style={{ fontFamily: 'monospace', fontSize: 11, color: '#818cf8' }}>{selectedGuild.id}</code></div>
                          </div>
                          <span className="badge-live"><span className="badge-live-dot" />Bot Active</span>
                        </div>

                        {/* Stats grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                          {[
                            { label: 'Permissions', value: permissions.length, icon: '🛡️', color: '#818cf8', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)', tab: 'permissions' },
                            { label: 'Active Modules', value: `${configuredModules}/${TABS.length - 1}`, icon: '⚡', color: '#34d399', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', tab: null },
                            { label: 'Social Feeds', value: [social.YOUTUBE_URL, social.FACEBOOK_URL, social.INSTAGRAM_URL, social.TIKTOK_URL].filter(Boolean).length, icon: '🌐', color: '#38bdf8', bg: 'rgba(56,189,248,0.1)', border: 'rgba(56,189,248,0.2)', tab: 'social' },
                            { label: 'AutoMod', value: automod.AUTOMOD_ANTI_SPAM === 'true' ? 'ON' : 'OFF', icon: '🤖', color: automod.AUTOMOD_ANTI_SPAM === 'true' ? '#34d399' : '#f87171', bg: automod.AUTOMOD_ANTI_SPAM === 'true' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.08)', border: automod.AUTOMOD_ANTI_SPAM === 'true' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.15)', tab: 'automod' },
                          ].map((stat) => (
                            <div key={stat.label}
                              onClick={() => stat.tab && setActiveTab(stat.tab)}
                              style={{
                                padding: '20px 22px', borderRadius: 18,
                                background: stat.bg,
                                border: `1px solid ${stat.border}`,
                                cursor: stat.tab ? 'pointer' : 'default',
                                transition: 'all 0.25s ease',
                                position: 'relative', overflow: 'hidden',
                              }}
                              onMouseEnter={e => { if (stat.tab) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.25)`; }}}
                              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                            >
                              <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: stat.color, opacity: 0.06 }} />
                              <div style={{ fontSize: 24, marginBottom: 10 }}>{stat.icon}</div>
                              <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.04em', color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                              <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginTop: 6 }}>{stat.label}</div>
                            </div>
                          ))}
                        </div>

                        {/* Quick Actions + Module Status */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                          {/* Quick Actions */}
                          <div className="glass-card-static" style={{ padding: '22px 24px' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 16 }}>Quick Actions</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {TABS.filter(t => t.id !== 'overview').slice(0, 5).map(tab => (
                                <button key={tab.id} className="quick-action-card" onClick={() => setActiveTab(tab.id)}>
                                  <div style={{ width: 36, height: 36, borderRadius: 10, background: tab.bg, border: `1px solid ${tab.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, color: tab.color }}>
                                    {tab.icon}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{tab.label}</div>
                                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>{tab.desc}</div>
                                  </div>
                                  <Icon.ChevronRight />
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Module status */}
                          <div className="glass-card-static" style={{ padding: '22px 24px' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 16 }}>Module Status</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                              {[
                                { name: 'Welcome', enabled: !!welcome.WELCOME_CHANNEL_ID, color: '#34d399' },
                                { name: 'AutoMod', enabled: automod.AUTOMOD_ANTI_SPAM === 'true', color: '#f87171' },
                                { name: 'Mod Logs', enabled: !!logging.MOD_LOGS_CHANNEL_ID, color: '#a78bfa' },
                                { name: 'Autoroles', enabled: !!(roles.DEFAULT_MEMBER_ROLE_ID || roles.AUTOROLE_HUMANS_ROLE_ID), color: '#fbbf24' },
                                { name: 'Social Notifier', enabled: !!(social.YOUTUBE_URL || social.FACEBOOK_URL), color: '#38bdf8' },
                                { name: 'SS Verify', enabled: !!esports.SS_VERIFY_CHANNEL, color: '#10b981' },
                              ].map(mod => (
                                <div key={mod.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: mod.enabled ? mod.color : 'var(--text-muted)', boxShadow: mod.enabled ? `0 0 8px ${mod.color}` : 'none' }} />
                                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{mod.name}</span>
                                  </div>
                                  <span className={`module-status ${mod.enabled ? 'enabled' : 'disabled'}`}>
                                    <span className="module-status-dot" />
                                    {mod.enabled ? 'Active' : 'Off'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

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
                              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, margin: '0 auto 14px' }}>🔒</div>
                              <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5, fontSize: 14 }}>No permissions configured</div>
                              <div style={{ fontSize: 13 }}>Only server admins can use bot commands. Add roles or users above.</div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {permissions.map((p, i) => (
                                <div key={p.id} className="permission-item" style={{ animationDelay: `${0.05 * i}s` }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: p.type === 'role' ? 'rgba(139,92,246,0.12)' : 'rgba(6,182,212,0.12)', border: `1px solid ${p.type === 'role' ? 'rgba(139,92,246,0.25)' : 'rgba(6,182,212,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                                      {p.type === 'role' ? '🎭' : '👤'}
                                    </div>
                                    <div>
                                      <div style={{ fontSize: 12, fontWeight: 700, color: p.type === 'role' ? '#c4b5fd' : '#67e8f9', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{p.type}</div>
                                      <code style={{ fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace", fontSize: 12, color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}>{p.target_id}</code>
                                    </div>
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

                          {/* Live preview */}
                          {(welcome.WELCOME_MESSAGE || welcome.WELCOME_CHANNEL_ID) && (
                            <div style={{ marginTop: 20 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 10 }}>Preview</div>
                              <div className="welcome-preview">
                                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#5865f2,#7289da)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>⚡</div>
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                      <span style={{ fontSize: 14, fontWeight: 700, color: '#34d399', fontFamily: 'Inter,sans-serif' }}>Jarvis Bot</span>
                                      <span style={{ fontSize: 9.5, fontWeight: 700, background: '#5865f2', color: 'white', padding: '1px 4px', borderRadius: 3 }}>BOT</span>
                                      <span style={{ fontSize: 10.5, color: '#8e919a', fontFamily: 'Inter,sans-serif' }}>Today at 12:00 PM</span>
                                    </div>
                                    <div style={{ fontSize: 13.5, color: '#dbdee1', fontFamily: 'Inter,sans-serif', lineHeight: 1.5 }}>
                                      {(welcome.WELCOME_MESSAGE || 'Welcome {user} to {server}! 🎉').replace('{user}', '<@NewUser>').replace('{server}', selectedGuild.name)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
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

                        <div style={{ padding: '16px 20px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 14, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🤖</div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#fca5a5', marginBottom: 4 }}>Auto-Moderation System</div>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                              AutoMod automatically monitors all messages. Moderators (MANAGE_MESSAGES) bypass all rules. Toggle features below and save.
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
                          <div style={{ marginTop: 14, padding: '12px 16px', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)', borderRadius: 11, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                            <strong style={{ color: '#a78bfa' }}>Logged events:</strong> Ban · Kick · Mute/Unmute · Warn · AutoMod actions
                          </div>
                        </div>

                        <div className="glass-card-static" style={{ padding: '24px 26px' }}>
                          <SectionHeading icon="📋" iconBg="rgba(99,102,241,0.12)" iconColor="#818cf8" title="Server Logs" subtitle="Where server events are recorded (message edits, deletes, member joins/leaves)" />
                          <Field label="Server Logs Channel ID">
                            <input type="text" value={logging.SERVER_LOGS_CHANNEL_ID} onChange={e => setLogging({ ...logging, SERVER_LOGS_CHANNEL_ID: e.target.value })} placeholder="e.g. 123456789012345678" className="input-field" style={{ padding: '10px 13px', width: '100%', maxWidth: 480 }} />
                          </Field>
                          <div style={{ marginTop: 14, padding: '12px 16px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 11, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
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
                          <div style={{ marginTop: 14, padding: '12px 16px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)', borderRadius: 11, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                            💡 <strong style={{ color: '#fbbf24' }}>Tip:</strong> Right-click a role in Discord → Copy Role ID. Make sure Jarvis Bot's role is above these roles in the hierarchy.
                          </div>
                        </div>

                        <div className="glass-card-static" style={{ padding: '24px 26px' }}>
                          <SectionHeading icon="🎭" iconBg="rgba(245,158,11,0.12)" iconColor="#fbbf24" title="Button Roles" subtitle="Self-assignable roles via buttons (use /setup-roles command in Discord)" />
                          <div style={{ padding: '16px', background: 'rgba(5,7,15,0.5)', border: '1px dashed rgba(245,158,11,0.15)', borderRadius: 12, fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                            <div style={{ marginBottom: 12 }}>Button roles are configured directly in Discord using the <code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 5, fontFamily: 'monospace', fontSize: 12, color: '#fbbf24' }}>/setup-roles</code> command.</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {['Run /setup-roles in a channel', 'Add roles using the interactive menu', 'Members click buttons to self-assign roles'].map((step, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div style={{ width: 24, height: 24, borderRadius: 7, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fbbf24', flexShrink: 0 }}>{i + 1}</div>
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
                              <div style={{ marginTop: 14, padding: '12px 16px', background: 'rgba(255,0,0,0.05)', border: '1px solid rgba(255,0,0,0.1)', borderRadius: 11, fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                                💡 <strong style={{ color: '#fca5a5' }}>YouTube URL:</strong> Go to your channel → View source → Search for <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: 11 }}>channelId</code>. Then use: <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: 11 }}>https://www.youtube.com/feeds/videos.xml?channel_id=YOUR_ID</code>
                              </div>
                            )}
                            {(p.key === 'TIKTOK' || p.key === 'INSTAGRAM') && (
                              <div style={{ marginTop: 14, padding: '12px 16px', background: 'rgba(105,201,208,0.05)', border: '1px solid rgba(105,201,208,0.1)', borderRadius: 11, fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>
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
                          <div style={{ marginTop: 14, padding: '12px 16px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)', borderRadius: 11, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                            💡 <strong style={{ color: '#10b981' }}>How it works:</strong> Users submit screenshot attachments via `/ssverify submit`. The bot will post them to the log channel with <strong>Approve</strong> and <strong>Reject</strong> buttons for staff members.
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

                        {/* Now playing card */}
                        <div className="now-playing-card">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            {/* Album art placeholder */}
                            <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, rgba(236,72,153,0.3), rgba(139,92,246,0.2))', border: '1px solid rgba(236,72,153,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0, position: 'relative' }}>
                              🎵
                              <div style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: 'linear-gradient(135deg, transparent, rgba(236,72,153,0.1))', animation: 'aurora 3s ease infinite', backgroundSize: '200% 200%' }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#f472b6', marginBottom: 4 }}>Music System</div>
                              <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 2 }}>Quotient Music Player</div>
                              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Use slash commands in any voice channel</div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                              <span className="badge-live"><span className="badge-live-dot" />Active</span>
                              {/* Waveform */}
                              <div className="waveform">
                                {[0.6, 1, 0.4, 0.8, 0.5, 1, 0.7, 0.3, 0.9, 0.6].map((h, i) => (
                                  <div key={i} className="waveform-bar" style={{ height: `${h * 100}%`, animationDelay: `${i * 0.1}s` }} />
                                ))}
                              </div>
                            </div>
                          </div>
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
                              { label: 'Default Volume', value: '70%', icon: '🔊', color: '#f472b6' },
                              { label: 'Max Queue Size', value: 'Unlimited', icon: '📋', color: '#a78bfa' },
                              { label: 'Audio Quality', value: 'High', icon: '✨', color: '#34d399' },
                              { label: 'Source', value: 'YouTube', icon: '▶️', color: '#fbbf24' },
                            ].map(stat => (
                              <div key={stat.label} style={{ padding: '18px 20px', background: 'rgba(5,7,15,0.5)', border: `1px solid rgba(236,72,153,0.12)`, borderRadius: 14, position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: -15, right: -15, width: 60, height: 60, borderRadius: '50%', background: stat.color, opacity: 0.06 }} />
                                <div style={{ fontSize: 22, marginBottom: 10 }}>{stat.icon}</div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: stat.color, letterSpacing: '-0.02em', lineHeight: 1 }}>{stat.value}</div>
                                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{stat.label}</div>
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
