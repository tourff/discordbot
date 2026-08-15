'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

// ─── Minimalist Luxury SVG Icons ────────────────────────────────────────────────
const Icon = {
  Jarvis: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Dashboard: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  Shield: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Robot: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8.01" y2="16" strokeWidth="3" /><line x1="16" y1="16" x2="16.01" y2="16" strokeWidth="3" />
    </svg>
  ),
  Sparkles: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  ),
  Logs: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  Users: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Globe: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  Gamepad: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="12" x2="10" y2="12" /><line x1="8" y1="10" x2="8" y2="14" /><line x1="15" y1="13" x2="15.01" y2="13" strokeWidth="3" /><line x1="18" y1="11" x2="18.01" y2="11" strokeWidth="3" /><rect x="2" y="6" width="20" height="12" rx="6" />
    </svg>
  ),
  Music: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    </svg>
  ),
  ChevronRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Plus: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Trash: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  Copy: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  External: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  ),
  Logout: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

// ─── Luxury Toast Notification ──────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 18px',
      background: 'rgba(12, 16, 26, 0.95)',
      border: `1px solid ${type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)'}`,
      borderRadius: 12,
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(99, 102, 241, 0.15)',
      backdropFilter: 'blur(20px)',
      color: '#fff', fontSize: 13.5, fontWeight: 500,
      animation: 'toast-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      <div style={{
        width: 24, height: 24, borderRadius: 6,
        background: type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
        color: type === 'success' ? '#34d399' : '#fb7185',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        {type === 'success' ? <Icon.Check /> : '!'}
      </div>
      <span>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>×</button>
    </div>
  );
}

// ─── Navigation Categories Config ───────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    title: 'CORE PLATFORM',
    items: [
      { id: 'overview', label: 'Overview', icon: <Icon.Dashboard />, desc: 'Server health & system status' },
      { id: 'permissions', label: 'Permissions', icon: <Icon.Shield />, desc: 'Command access control' },
    ]
  },
  {
    title: 'AUTOMATION & SAFETY',
    items: [
      { id: 'automod', label: 'Auto-Moderation', icon: <Icon.Robot />, desc: 'Spam, link & toxicity filter' },
      { id: 'welcome', label: 'Welcome Suite', icon: <Icon.Sparkles />, desc: 'Custom join/leave broadcasts' },
      { id: 'logging', label: 'Audit Logs', icon: <Icon.Logs />, desc: 'Moderation & server audit trail' },
      { id: 'roles', label: 'Role Manager', icon: <Icon.Users />, desc: 'Autoroles & button role assigner' },
    ]
  },
  {
    title: 'ENGAGEMENT & MEDIA',
    items: [
      { id: 'social', label: 'Social Notifier', icon: <Icon.Globe />, desc: 'YouTube, Twitch, TikTok feeds' },
      { id: 'esports', label: 'Esports Verification', icon: <Icon.Gamepad />, desc: 'Screenshot approval workflow' },
      { id: 'music', label: 'Music Engine', icon: <Icon.Music />, desc: 'Audio playback & queue commands' },
    ]
  }
];

const SOCIAL_PLATFORMS = [
  { key: 'YOUTUBE', label: 'YouTube', color: '#ff0000', icon: '▶' },
  { key: 'FACEBOOK', label: 'Facebook', color: '#1877f2', icon: 'f' },
  { key: 'INSTAGRAM', label: 'Instagram', color: '#e1306c', icon: 'IG' },
  { key: 'TIKTOK', label: 'TikTok', color: '#00f2fe', icon: 'TT' },
];

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [guilds, setGuilds] = useState([]);
  const [selectedGuild, setSelectedGuild] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [toast, setToast] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Settings State
  const [permissions, setPermissions] = useState([]);
  const [newType, setNewType] = useState('role');
  const [newId, setNewId] = useState('');
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
  const [activeSocialKey, setActiveSocialKey] = useState('YOUTUBE');

  const showToast = useCallback((msg, type = 'success') => setToast({ message: msg, type }), []);

  // Auth Guard
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/');
  }, [status, router]);

  // Fetch Guilds
  useEffect(() => {
    if (!session?.accessToken) return;
    fetch('https://discord.com/api/users/@me/guilds', {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const adminGuilds = data.filter(g => (g.permissions & 8) === 8);
          setGuilds(adminGuilds);
          if (adminGuilds.length > 0 && !selectedGuild) {
            setSelectedGuild(adminGuilds[0]);
          }
        }
      })
      .catch(console.error);
  }, [session, selectedGuild]);

  // Fetch Guild Settings from Supabase
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
        setWelcome({
          WELCOME_CHANNEL_ID: map.WELCOME_CHANNEL_ID || '',
          WELCOME_MESSAGE: map.WELCOME_MESSAGE || '',
          GOODBYE_CHANNEL_ID: map.GOODBYE_CHANNEL_ID || '',
          GOODBYE_MESSAGE: map.GOODBYE_MESSAGE || ''
        });
        setAutomod({
          AUTOMOD_BAD_WORDS: map.AUTOMOD_BAD_WORDS || '',
          AUTOMOD_ANTI_SPAM: map.AUTOMOD_ANTI_SPAM ?? 'true',
          AUTOMOD_BLOCK_INVITES: map.AUTOMOD_BLOCK_INVITES ?? 'true',
          AUTOMOD_BLOCK_URLS: map.AUTOMOD_BLOCK_URLS ?? 'false'
        });
        setLogging({
          MOD_LOGS_CHANNEL_ID: map.MOD_LOGS_CHANNEL_ID || '',
          SERVER_LOGS_CHANNEL_ID: map.SERVER_LOGS_CHANNEL_ID || ''
        });
        setRoles({
          DEFAULT_MEMBER_ROLE_ID: map.DEFAULT_MEMBER_ROLE_ID || '',
          AUTOROLE_HUMANS_ROLE_ID: map.AUTOROLE_HUMANS_ROLE_ID || '',
          AUTOROLE_BOTS_ROLE_ID: map.AUTOROLE_BOTS_ROLE_ID || ''
        });
        setEsports({
          SS_VERIFY_CHANNEL: map.SS_VERIFY_CHANNEL || '',
          SS_VERIFY_ROLE: map.SS_VERIFY_ROLE || ''
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

  // Save Settings Helper
  const saveSettings = async (data) => {
    if (!selectedGuild) return false;
    const upserts = Object.entries(data).map(([key, value]) => ({
      guild_id: selectedGuild.id,
      key,
      value: String(value)
    }));
    const { error } = await supabase.from('bot_settings').upsert(upserts, { onConflict: 'guild_id,key' });
    return !error;
  };

  // Handlers
  const handleSaveWelcome = async (e) => {
    e?.preventDefault();
    setIsSavingWelcome(true);
    const ok = await saveSettings(welcome);
    showToast(ok ? 'Welcome configuration saved' : 'Failed to save', ok ? 'success' : 'error');
    setIsSavingWelcome(false);
  };

  const handleSaveAutomod = async (e) => {
    e?.preventDefault();
    setIsSavingAutomod(true);
    const ok = await saveSettings(automod);
    showToast(ok ? 'AutoMod security rules updated' : 'Failed to save', ok ? 'success' : 'error');
    setIsSavingAutomod(false);
  };

  const handleSaveLogging = async (e) => {
    e?.preventDefault();
    setIsSavingLogging(true);
    const ok = await saveSettings(logging);
    showToast(ok ? 'Audit log channels updated' : 'Failed to save', ok ? 'success' : 'error');
    setIsSavingLogging(false);
  };

  const handleSaveRoles = async (e) => {
    e?.preventDefault();
    setIsSavingRoles(true);
    const ok = await saveSettings(roles);
    showToast(ok ? 'Autoroles configuration saved' : 'Failed to save', ok ? 'success' : 'error');
    setIsSavingRoles(false);
  };

  const handleSaveEsports = async (e) => {
    e?.preventDefault();
    setIsSavingEsports(true);
    const ok = await saveSettings(esports);
    showToast(ok ? 'Esports verify configuration saved' : 'Failed to save', ok ? 'success' : 'error');
    setIsSavingEsports(false);
  };

  const handleSaveSocial = async (e) => {
    e?.preventDefault();
    setIsSavingSocial(true);
    const ok = await saveSettings(social);
    showToast(ok ? 'Social feed notifier updated' : 'Failed to save', ok ? 'success' : 'error');
    setIsSavingSocial(false);
  };

  const handleAddPermission = async (e) => {
    e.preventDefault();
    if (!selectedGuild || !newId.trim()) return;
    setIsSavingPerm(true);
    const { data, error } = await supabase.from('bot_permissions').insert([{
      guild_id: selectedGuild.id,
      type: newType,
      target_id: newId.trim()
    }]).select();
    if (!error && data) {
      setPermissions(prev => [...prev, ...data]);
      setNewId('');
      showToast('Permission granted');
    } else {
      showToast('Failed to add permission', 'error');
    }
    setIsSavingPerm(false);
  };

  const handleRemovePermission = async (id) => {
    const { error } = await supabase.from('bot_permissions').delete().eq('id', id);
    if (!error) {
      setPermissions(prev => prev.filter(p => p.id !== id));
      showToast('Permission revoked');
    } else {
      showToast('Failed to remove', 'error');
    }
  };

  const copyGuildId = () => {
    if (!selectedGuild) return;
    navigator.clipboard.writeText(selectedGuild.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
    showToast('Server ID copied to clipboard');
  };

  // Compute Active System Count
  const activeSystemsCount = useMemo(() => {
    let count = 0;
    if (automod.AUTOMOD_ANTI_SPAM === 'true' || automod.AUTOMOD_BLOCK_INVITES === 'true') count++;
    if (welcome.WELCOME_CHANNEL_ID) count++;
    if (logging.MOD_LOGS_CHANNEL_ID) count++;
    if (roles.DEFAULT_MEMBER_ROLE_ID || roles.AUTOROLE_HUMANS_ROLE_ID) count++;
    if (social.YOUTUBE_URL || social.FACEBOOK_URL || social.INSTAGRAM_URL || social.TIKTOK_URL) count++;
    if (esports.SS_VERIFY_CHANNEL) count++;
    return count;
  }, [automod, welcome, logging, roles, social, esports]);

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="luxe-spinner" style={{ width: 28, height: 28, borderWidth: 2 }} />
          <div style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>Connecting to Jarvis Core...</div>
        </div>
      </div>
    );
  }

  const guildIconUrl = selectedGuild?.icon
    ? `https://cdn.discordapp.com/icons/${selectedGuild.id}/${selectedGuild.icon}.png`
    : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column', position: 'relative' }} className="bg-grid-mesh">

      {/* Ambient background glows */}
      <div className="ambient-glow-1" style={{ top: '-10%', left: '15%' }} />
      <div className="ambient-glow-2" style={{ bottom: '10%', right: '10%' }} />

      {/* ═══════════════════════════════════════════════════════════════
          TOP NAVIGATION HEADER (Linear / Vercel Ultra-Clean Style)
          ═══════════════════════════════════════════════════════════════ */}
      <header style={{
        height: 60,
        background: 'rgba(8, 10, 15, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        {/* Left: Brand Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)'
            }}>
              <Icon.Jarvis />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.03em', color: '#fff' }}>JARVIS</span>
              <span className="luxe-badge luxe-badge-indigo" style={{ fontSize: 10, padding: '2px 7px' }}>AI BOT</span>
            </div>
          </div>

          <div style={{ width: 1, height: 18, background: 'var(--border-subtle)' }} />

          {/* Server Switcher Pill */}
          {selectedGuild && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: 999, padding: '4px 12px 4px 6px' }}>
              {guildIconUrl ? (
                <img src={guildIconUrl} alt="" style={{ width: 20, height: 20, borderRadius: '50%' }} />
              ) : (
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
                  {selectedGuild.name.charAt(0)}
                </div>
              )}
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedGuild.name}
              </span>
            </div>
          )}
        </div>

        {/* Right: Status & User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Operational Pill */}
          <div className="luxe-badge luxe-badge-emerald" style={{ fontSize: 11 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
            Shard #1 Active • 22ms
          </div>

          <div style={{ width: 1, height: 18, background: 'var(--border-subtle)' }} />

          {/* User Profile */}
          {session?.user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {session.user.image ? (
                <img src={session.user.image} alt="" style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(255, 255, 255, 0.15)' }} />
              ) : (
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                  {session.user.name?.charAt(0)}
                </div>
              )}
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)' }}>{session.user.name}</span>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="btn-luxe-secondary"
                style={{ padding: '6px 12px', fontSize: 12 }}
                title="Sign out"
              >
                <Icon.Logout /> Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════
          MAIN APP LAYOUT (Unified Clean Sidebar + Content Canvas)
          ═══════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 60px)' }}>

        {/* ─── SINGLE UNIFIED MASTER SIDEBAR (250px) ─── */}
        <aside style={{
          width: 250,
          background: 'rgba(9, 11, 17, 0.95)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex', flexDirection: 'column',
          flexShrink: 0,
          padding: '16px 12px',
          justifyContent: 'space-between',
        }}>
          <div>
            {/* Server Selector Card */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', padding: '0 8px 8px' }}>
                SELECT SERVER ({guilds.length})
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {guilds.map(g => {
                  const isCur = selectedGuild?.id === g.id;
                  const icon = g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null;
                  return (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGuild(g)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '7px 10px', borderRadius: 8,
                        background: isCur ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                        border: `1px solid ${isCur ? 'rgba(99, 102, 241, 0.3)' : 'transparent'}`,
                        color: isCur ? '#fff' : 'var(--text-medium)',
                        cursor: 'pointer', fontFamily: 'inherit', width: '100%', textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {icon ? (
                        <img src={icon} alt="" style={{ width: 22, height: 22, borderRadius: 6 }} />
                      ) : (
                        <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
                          {g.name.charAt(0)}
                        </div>
                      )}
                      <span style={{ fontSize: 12.5, fontWeight: isCur ? 600 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {g.name}
                      </span>
                      {isCur && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 8px #6366f1' }} />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ height: 1, background: 'var(--border-subtle)', margin: '0 4px 16px' }} />

            {/* Navigation Category Groups */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {NAV_SECTIONS.map(section => (
                <div key={section.title}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', padding: '0 8px 6px' }}>
                    {section.title}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {section.items.map(item => {
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={`nav-item ${isActive ? 'active' : ''}`}
                        >
                          <span className="nav-icon" style={{ display: 'flex', alignItems: 'center' }}>
                            {item.icon}
                          </span>
                          <span style={{ flex: 1 }}>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Metadata */}
          <div style={{
            padding: '12px 10px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 10,
            fontSize: 11,
            color: 'var(--text-muted)',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>JARVIS CORE</span>
              <span style={{ color: '#818cf8', fontWeight: 600 }}>v2.4.0</span>
            </div>
            <div>Crafted by <strong style={{ color: 'var(--text-high)' }}>trj7</strong></div>
          </div>
        </aside>

        {/* ─── MAIN CONTENT CANVAS ─── */}
        <main style={{ flex: 1, padding: '28px 36px', overflowY: 'auto', maxWidth: 1200 }}>

          {!selectedGuild ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', marginBottom: 16 }}>
                <Icon.Jarvis />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Select a Discord Server</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 400 }}>Choose a server from the left navigation to manage its security, automations, and entertainment modules.</p>
            </div>
          ) : isLoadingData ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: 14 }}>
              <div className="luxe-spinner" style={{ width: 24, height: 24 }} />
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Syncing server configuration...</div>
            </div>
          ) : (
            <div>

              {/* ═══════════════════════════════════════════════════════════════
                  TAB 1: OVERVIEW (The Grand Luxury Control Hub)
                  ═══════════════════════════════════════════════════════════════ */}
              {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                  {/* Server Hero Banner Card */}
                  <div className="luxe-card" style={{ padding: '24px 28px', overflow: 'hidden' }}>
                    <div className="card-top-accent" />

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                        {guildIconUrl ? (
                          <img src={guildIconUrl} alt="" style={{ width: 56, height: 56, borderRadius: 16, border: '2px solid rgba(99, 102, 241, 0.4)', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)' }} />
                        ) : (
                          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: 'white' }}>
                            {selectedGuild.name.charAt(0)}
                          </div>
                        )}

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: 'white' }}>{selectedGuild.name}</h1>
                            <span className="luxe-badge luxe-badge-emerald">
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981' }} />
                              Protected by Jarvis
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                            <button
                              onClick={copyGuildId}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
                              title="Click to copy ID"
                            >
                              <Icon.Copy />
                              <code>ID: {selectedGuild.id}</code>
                              {copiedId && <span style={{ color: '#34d399', fontSize: 11 }}>✓ Copied</span>}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Right Action */}
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button
                          onClick={() => showToast('Jarvis is actively monitoring this guild')}
                          className="btn-luxe-secondary"
                        >
                          Diagnostic Ping
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 4 Minimalist High-End Metric Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                    {[
                      {
                        title: 'AutoMod Protection',
                        value: automod.AUTOMOD_ANTI_SPAM === 'true' ? 'Active' : 'Disabled',
                        sub: 'Anti-Spam & Invites',
                        badge: automod.AUTOMOD_ANTI_SPAM === 'true' ? 'luxe-badge-emerald' : 'luxe-badge-muted',
                        icon: <Icon.Robot />,
                        onClick: () => setActiveTab('automod'),
                      },
                      {
                        title: 'Command Roles',
                        value: `${permissions.length} Configured`,
                        sub: permissions.length === 0 ? 'Admin only' : 'Custom access list',
                        badge: 'luxe-badge-indigo',
                        icon: <Icon.Shield />,
                        onClick: () => setActiveTab('permissions'),
                      },
                      {
                        title: 'Active Modules',
                        value: `${activeSystemsCount} of 6 Enabled`,
                        sub: 'System automation matrix',
                        badge: 'luxe-badge-indigo',
                        icon: <Icon.Sparkles />,
                        onClick: null,
                      },
                      {
                        title: 'Social Broadcasts',
                        value: [social.YOUTUBE_URL, social.FACEBOOK_URL, social.INSTAGRAM_URL, social.TIKTOK_URL].filter(Boolean).length ? 'Connected' : 'None',
                        sub: 'RSS Feed Sync',
                        badge: [social.YOUTUBE_URL, social.FACEBOOK_URL].filter(Boolean).length ? 'luxe-badge-emerald' : 'luxe-badge-muted',
                        icon: <Icon.Globe />,
                        onClick: () => setActiveTab('social'),
                      },
                    ].map((m, i) => (
                      <div
                        key={i}
                        onClick={m.onClick}
                        className={`luxe-card ${m.onClick ? 'luxe-card-interactive' : ''}`}
                        style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.title}</span>
                          <span style={{ color: '#818cf8' }}>{m.icon}</span>
                        </div>
                        <div>
                          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>{m.value}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{m.sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 6 Bento Modules Feature Hub */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 12 }}>
                      SERVER MODULES & AUTOMATIONS
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
                      {[
                        {
                          id: 'automod',
                          title: 'Auto-Moderation',
                          desc: 'Automatically filter spam, blacklisted words, and unauthorized Discord invites.',
                          icon: <Icon.Robot />,
                          enabled: automod.AUTOMOD_ANTI_SPAM === 'true',
                          onToggle: async () => {
                            const n = automod.AUTOMOD_ANTI_SPAM === 'true' ? 'false' : 'true';
                            setAutomod(p => ({ ...p, AUTOMOD_ANTI_SPAM: n }));
                            await saveSettings({ ...automod, AUTOMOD_ANTI_SPAM: n });
                            showToast(`AutoMod ${n === 'true' ? 'enabled' : 'disabled'}`);
                          }
                        },
                        {
                          id: 'welcome',
                          title: 'Welcome & Goodbye',
                          desc: 'Greet joining members with rich formatted messages and send exit notices.',
                          icon: <Icon.Sparkles />,
                          enabled: !!welcome.WELCOME_CHANNEL_ID,
                          onToggle: () => setActiveTab('welcome'),
                        },
                        {
                          id: 'logging',
                          title: 'Audit Logging',
                          desc: 'Record moderation actions (bans, kicks, warns) and server message edits/deletions.',
                          icon: <Icon.Logs />,
                          enabled: !!logging.MOD_LOGS_CHANNEL_ID,
                          onToggle: () => setActiveTab('logging'),
                        },
                        {
                          id: 'roles',
                          title: 'Role Automation',
                          desc: 'Instantly give new humans or bots default roles upon joining.',
                          icon: <Icon.Users />,
                          enabled: !!(roles.DEFAULT_MEMBER_ROLE_ID || roles.AUTOROLE_HUMANS_ROLE_ID),
                          onToggle: () => setActiveTab('roles'),
                        },
                        {
                          id: 'social',
                          title: 'Social Media Notifier',
                          desc: 'Post YouTube videos, TikToks, and Facebook updates directly to announcement channels.',
                          icon: <Icon.Globe />,
                          enabled: !!(social.YOUTUBE_URL || social.FACEBOOK_URL),
                          onToggle: () => setActiveTab('social'),
                        },
                        {
                          id: 'esports',
                          title: 'Esports Verification',
                          desc: 'Staff queue for tournament screenshot verification with one-click role assignment.',
                          icon: <Icon.Gamepad />,
                          enabled: !!esports.SS_VERIFY_CHANNEL,
                          onToggle: () => setActiveTab('esports'),
                        },
                      ].map(mod => (
                        <div key={mod.id} className="luxe-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                            <div style={{ display: 'flex', gap: 12 }}>
                              <div style={{
                                width: 36, height: 36, borderRadius: 10,
                                background: 'rgba(99, 102, 241, 0.1)',
                                color: '#818cf8',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                              }}>
                                {mod.icon}
                              </div>
                              <div>
                                <div style={{ fontSize: 14.5, fontWeight: 700, color: 'white' }}>{mod.title}</div>
                                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.4 }}>{mod.desc}</div>
                              </div>
                            </div>

                            <span className={`luxe-badge ${mod.enabled ? 'luxe-badge-emerald' : 'luxe-badge-muted'}`} style={{ flexShrink: 0 }}>
                              {mod.enabled ? 'Active' : 'Off'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
                            <button
                              onClick={() => setActiveTab(mod.id)}
                              className="btn-luxe-secondary"
                              style={{ padding: '6px 12px', fontSize: 12 }}
                            >
                              Configure <Icon.ChevronRight />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════════
                  TAB 2: PERMISSIONS
                  ═══════════════════════════════════════════════════════════════ */}
              {activeTab === 'permissions' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="luxe-card" style={{ padding: '24px' }}>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: 'white', marginBottom: 4 }}>Command Access Permissions</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                      By default, only Server Administrators can use Jarvis bot commands. Grant access to specific roles or users below.
                    </p>

                    <form onSubmit={handleAddPermission} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ width: 140 }}>
                        <select
                          value={newType}
                          onChange={e => setNewType(e.target.value)}
                          className="luxe-input"
                          style={{ cursor: 'pointer' }}
                        >
                          <option value="role">🎭 Role ID</option>
                          <option value="user">👤 User ID</option>
                        </select>
                      </div>

                      <div style={{ flex: 1, minWidth: 220 }}>
                        <input
                          type="text"
                          value={newId}
                          onChange={e => setNewId(e.target.value)}
                          placeholder="e.g. 123456789012345678"
                          className="luxe-input"
                          required
                        />
                      </div>

                      <button type="submit" disabled={isSavingPerm} className="btn-luxe-primary">
                        <Icon.Plus /> {isSavingPerm ? 'Adding...' : 'Grant Access'}
                      </button>
                    </form>
                  </div>

                  {/* Active List */}
                  <div className="luxe-card" style={{ padding: '24px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                      AUTHORIZED ENTITIES ({permissions.length})
                    </div>

                    {permissions.length === 0 ? (
                      <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(0, 0, 0, 0.2)', borderRadius: 12 }}>
                        No special permissions added. Only server administrators can execute bot commands.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {permissions.map(p => (
                          <div key={p.id} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid var(--border-subtle)', borderRadius: 10,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <span className={`luxe-badge ${p.type === 'role' ? 'luxe-badge-indigo' : 'luxe-badge-emerald'}`}>
                                {p.type === 'role' ? '🎭 Role' : '👤 User'}
                              </span>
                              <span className="luxe-code">{p.target_id}</span>
                            </div>
                            <button
                              onClick={() => handleRemovePermission(p.id)}
                              className="btn-luxe-danger"
                            >
                              <Icon.Trash /> Revoke
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════════
                  TAB 3: AUTOMOD
                  ═══════════════════════════════════════════════════════════════ */}
              {activeTab === 'automod' && (
                <form onSubmit={handleSaveAutomod} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="luxe-card" style={{ padding: '24px' }}>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: 'white', marginBottom: 4 }}>Auto-Moderation Engine</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                      Jarvis automatically shields your server from spam attacks, Discord invite links, and prohibited phrases.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {[
                        {
                          key: 'AUTOMOD_ANTI_SPAM',
                          title: 'Anti-Spam Filter',
                          desc: 'Auto-deletes messages if a user sends 5+ messages in under 3 seconds.',
                        },
                        {
                          key: 'AUTOMOD_BLOCK_INVITES',
                          title: 'Discord Invite Blocker',
                          desc: 'Deletes messages containing discord.gg or discord.com/invite links.',
                        },
                        {
                          key: 'AUTOMOD_BLOCK_URLS',
                          title: 'Strict URL Filter',
                          desc: 'Deletes any message containing links (except by users with Manage Messages permission).',
                        },
                      ].map(t => {
                        const checked = automod[t.key] === 'true';
                        return (
                          <div key={t.key} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '14px 18px', background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid var(--border-subtle)', borderRadius: 12,
                          }}>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{t.title}</div>
                              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{t.desc}</div>
                            </div>
                            <label className="luxe-switch">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={e => setAutomod(p => ({ ...p, [t.key]: String(e.target.checked) }))}
                              />
                              <span className="luxe-slider" />
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="luxe-card" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'white', marginBottom: 6 }}>Prohibited Words Blacklist</h3>
                    <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 14 }}>
                      Separate words or phrases with commas. Any message containing these triggers instant deletion.
                    </p>
                    <textarea
                      value={automod.AUTOMOD_BAD_WORDS}
                      onChange={e => setAutomod(p => ({ ...p, AUTOMOD_BAD_WORDS: e.target.value }))}
                      placeholder="e.g. badword1, offensivephrase, scamlink"
                      rows={4}
                      className="luxe-input"
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" disabled={isSavingAutomod} className="btn-luxe-primary">
                      {isSavingAutomod ? 'Saving...' : 'Save AutoMod Rules'}
                    </button>
                  </div>
                </form>
              )}

              {/* ═══════════════════════════════════════════════════════════════
                  TAB 4: WELCOME SUITE
                  ═══════════════════════════════════════════════════════════════ */}
              {activeTab === 'welcome' && (
                <form onSubmit={handleSaveWelcome} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="luxe-card" style={{ padding: '24px' }}>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: 'white', marginBottom: 4 }}>Member Welcome & Departure</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                      Configure automatic welcome and farewell announcements. Supported tags: <code className="luxe-code">{'{user}'}</code> and <code className="luxe-code">{'{server}'}</code>.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)', marginBottom: 6 }}>Welcome Channel ID</label>
                        <input
                          type="text"
                          value={welcome.WELCOME_CHANNEL_ID}
                          onChange={e => setWelcome(p => ({ ...p, WELCOME_CHANNEL_ID: e.target.value }))}
                          placeholder="e.g. 123456789012345678"
                          className="luxe-input"
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)', marginBottom: 6 }}>Welcome Message Text</label>
                        <textarea
                          value={welcome.WELCOME_MESSAGE}
                          onChange={e => setWelcome(p => ({ ...p, WELCOME_MESSAGE: e.target.value }))}
                          placeholder="Welcome {user} to {server}! 🎉"
                          rows={3}
                          className="luxe-input"
                          style={{ resize: 'none' }}
                        />
                      </div>
                    </div>

                    <div style={{ height: 1, background: 'var(--border-subtle)', margin: '24px 0' }} />

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)', marginBottom: 6 }}>Goodbye Channel ID</label>
                        <input
                          type="text"
                          value={welcome.GOODBYE_CHANNEL_ID}
                          onChange={e => setWelcome(p => ({ ...p, GOODBYE_CHANNEL_ID: e.target.value }))}
                          placeholder="e.g. 123456789012345678"
                          className="luxe-input"
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)', marginBottom: 6 }}>Goodbye Message Text</label>
                        <textarea
                          value={welcome.GOODBYE_MESSAGE}
                          onChange={e => setWelcome(p => ({ ...p, GOODBYE_MESSAGE: e.target.value }))}
                          placeholder="Goodbye {user}, we will miss you! 👋"
                          rows={3}
                          className="luxe-input"
                          style={{ resize: 'none' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" disabled={isSavingWelcome} className="btn-luxe-primary">
                      {isSavingWelcome ? 'Saving...' : 'Save Welcome Settings'}
                    </button>
                  </div>
                </form>
              )}

              {/* ═══════════════════════════════════════════════════════════════
                  TAB 5: LOGGING
                  ═══════════════════════════════════════════════════════════════ */}
              {activeTab === 'logging' && (
                <form onSubmit={handleSaveLogging} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="luxe-card" style={{ padding: '24px' }}>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: 'white', marginBottom: 4 }}>Audit & Security Logs</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                      Assign dedicated Discord text channels where Jarvis posts audit events.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                      <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'white', marginBottom: 2 }}>Moderation Log Channel</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Bans, Kicks, Mutes, Warns, AutoMod actions</div>
                        <input
                          type="text"
                          value={logging.MOD_LOGS_CHANNEL_ID}
                          onChange={e => setLogging(p => ({ ...p, MOD_LOGS_CHANNEL_ID: e.target.value }))}
                          placeholder="Channel ID (e.g. 123456789012345678)"
                          className="luxe-input"
                        />
                      </div>

                      <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'white', marginBottom: 2 }}>Server Events Log Channel</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Message edits, message deletes, role changes</div>
                        <input
                          type="text"
                          value={logging.SERVER_LOGS_CHANNEL_ID}
                          onChange={e => setLogging(p => ({ ...p, SERVER_LOGS_CHANNEL_ID: e.target.value }))}
                          placeholder="Channel ID (e.g. 123456789012345678)"
                          className="luxe-input"
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" disabled={isSavingLogging} className="btn-luxe-primary">
                      {isSavingLogging ? 'Saving...' : 'Save Log Channels'}
                    </button>
                  </div>
                </form>
              )}

              {/* ═══════════════════════════════════════════════════════════════
                  TAB 6: ROLES
                  ═══════════════════════════════════════════════════════════════ */}
              {activeTab === 'roles' && (
                <form onSubmit={handleSaveRoles} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="luxe-card" style={{ padding: '24px' }}>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: 'white', marginBottom: 4 }}>Autoroles & Member Onboarding</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                      Roles automatically granted when new accounts join your Discord server.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)', marginBottom: 6 }}>Human Members Autorole ID</label>
                        <input
                          type="text"
                          value={roles.AUTOROLE_HUMANS_ROLE_ID}
                          onChange={e => setRoles(p => ({ ...p, AUTOROLE_HUMANS_ROLE_ID: e.target.value }))}
                          placeholder="e.g. 123456789012345678"
                          className="luxe-input"
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)', marginBottom: 6 }}>Bot Accounts Autorole ID</label>
                        <input
                          type="text"
                          value={roles.AUTOROLE_BOTS_ROLE_ID}
                          onChange={e => setRoles(p => ({ ...p, AUTOROLE_BOTS_ROLE_ID: e.target.value }))}
                          placeholder="e.g. 123456789012345678"
                          className="luxe-input"
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" disabled={isSavingRoles} className="btn-luxe-primary">
                      {isSavingRoles ? 'Saving...' : 'Save Role Settings'}
                    </button>
                  </div>
                </form>
              )}

              {/* ═══════════════════════════════════════════════════════════════
                  TAB 7: SOCIAL NOTIFIER
                  ═══════════════════════════════════════════════════════════════ */}
              {activeTab === 'social' && (
                <form onSubmit={handleSaveSocial} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="luxe-card" style={{ padding: '24px' }}>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: 'white', marginBottom: 4 }}>Social Media Feeds</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                      Publish instant updates to your Discord channels when new content is posted online.
                    </p>

                    {/* Platform Selector */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                      {SOCIAL_PLATFORMS.map(p => (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => setActiveSocialKey(p.key)}
                          className="btn-luxe-secondary"
                          style={{
                            borderColor: activeSocialKey === p.key ? '#6366f1' : 'var(--border-subtle)',
                            background: activeSocialKey === p.key ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                            color: activeSocialKey === p.key ? '#fff' : 'var(--text-medium)',
                          }}
                        >
                          <span style={{ color: p.color, fontWeight: 800 }}>{p.icon}</span> {p.label}
                        </button>
                      ))}
                    </div>

                    {/* Form Fields for Active Platform */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)', marginBottom: 6 }}>
                          {activeSocialKey} RSS / Feed URL
                        </label>
                        <input
                          type="text"
                          value={social[`${activeSocialKey}_URL`] || ''}
                          onChange={e => setSocial(p => ({ ...p, [`${activeSocialKey}_URL`]: e.target.value }))}
                          placeholder={activeSocialKey === 'YOUTUBE' ? 'https://www.youtube.com/feeds/videos.xml?channel_id=...' : 'RSS feed URL'}
                          className="luxe-input"
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)', marginBottom: 6 }}>
                          Announcement Channel ID
                        </label>
                        <input
                          type="text"
                          value={social[`${activeSocialKey}_CHANNEL_ID`] || ''}
                          onChange={e => setSocial(p => ({ ...p, [`${activeSocialKey}_CHANNEL_ID`]: e.target.value }))}
                          placeholder="e.g. 123456789012345678"
                          className="luxe-input"
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" disabled={isSavingSocial} className="btn-luxe-primary">
                      {isSavingSocial ? 'Saving...' : 'Save Social Configuration'}
                    </button>
                  </div>
                </form>
              )}

              {/* ═══════════════════════════════════════════════════════════════
                  TAB 8: ESPORTS
                  ═══════════════════════════════════════════════════════════════ */}
              {activeTab === 'esports' && (
                <form onSubmit={handleSaveEsports} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="luxe-card" style={{ padding: '24px' }}>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: 'white', marginBottom: 4 }}>Esports Screenshot Verification</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                      Members submit tournament victory screenshots using <code className="luxe-code">/ssverify submit</code>. Staff review and grant roles via interactive Discord buttons.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)', marginBottom: 6 }}>Staff Approval Channel ID</label>
                        <input
                          type="text"
                          value={esports.SS_VERIFY_CHANNEL}
                          onChange={e => setEsports(p => ({ ...p, SS_VERIFY_CHANNEL: e.target.value }))}
                          placeholder="e.g. 123456789012345678"
                          className="luxe-input"
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)', marginBottom: 6 }}>Verified Reward Role ID</label>
                        <input
                          type="text"
                          value={esports.SS_VERIFY_ROLE}
                          onChange={e => setEsports(p => ({ ...p, SS_VERIFY_ROLE: e.target.value }))}
                          placeholder="e.g. 123456789012345678"
                          className="luxe-input"
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" disabled={isSavingEsports} className="btn-luxe-primary">
                      {isSavingEsports ? 'Saving...' : 'Save Esports Settings'}
                    </button>
                  </div>
                </form>
              )}

              {/* ═══════════════════════════════════════════════════════════════
                  TAB 9: MUSIC ENGINE
                  ═══════════════════════════════════════════════════════════════ */}
              {activeTab === 'music' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="luxe-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div>
                        <h2 style={{ fontSize: 17, fontWeight: 700, color: 'white' }}>Jarvis High-Fidelity Music Player</h2>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Lossless YouTube & Spotify voice channel playback.</p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 20 }}>
                        {[0.6, 1, 0.4, 0.9, 0.5, 0.8, 0.3, 1].map((h, idx) => (
                          <div key={idx} className="wave-bar-elem" style={{ height: `${h * 100}%`, animationDelay: `${idx * 0.15}s` }} />
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                      {[
                        { cmd: '/play <query/url>', desc: 'Add track to queue & play' },
                        { cmd: '/pause & /resume', desc: 'Control active stream' },
                        { cmd: '/skip', desc: 'Skip current playing song' },
                        { cmd: '/queue', desc: 'Display upcoming playlist' },
                        { cmd: '/volume <0-100>', desc: 'Adjust master sound volume' },
                        { cmd: '/nowplaying', desc: 'Rich embed of current track' },
                      ].map(c => (
                        <div key={c.cmd} style={{
                          padding: '12px 14px', background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid var(--border-subtle)', borderRadius: 10,
                        }}>
                          <code className="luxe-code" style={{ color: '#ec4899' }}>{c.cmd}</code>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{c.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </main>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
