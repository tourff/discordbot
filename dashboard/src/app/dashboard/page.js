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
  Brain: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04z" />
    </svg>
  ),
  Level: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-2.34c0-.55.45-1 1-1h2c.55 0 1 .45 1 1Z" /><path d="M18 14.66V17c0 .55-.45 1-1 1h-2c-.55 0-1-.45-1-1v-2.34c0-.55.45-1 1-1h2c.55 0 1 .45 1 1Z" /><path d="M6 4h12v5a6 6 0 0 1-12 0V4Z" />
    </svg>
  ),
  Ticket: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" />
    </svg>
  ),
  Voice: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  ),
  Cake: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" /><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1" /><path d="M2 21h20" /><path d="M7 8v3" /><path d="M12 8v3" /><path d="M17 8v3" />
    </svg>
  ),
  Stats: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  Lock: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Gift: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13" /><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
    </svg>
  ),
  Coin: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
  Logs: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" />
    </svg>
  ),
  Users: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    </svg>
  ),
  Globe: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
    </svg>
  ),
  Gamepad: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="12" x2="10" y2="12" /><rect x="2" y="6" width="20" height="12" rx="6" />
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
  Logout: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

// ─── Toast Notification ────────────────────────────────────────────────────────
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

// ─── 14 Modular Nav Sections ───────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    title: 'CORE PLATFORM',
    items: [
      { id: 'overview', label: 'Overview', icon: <Icon.Dashboard /> },
      { id: 'permissions', label: 'Permissions', icon: <Icon.Shield /> },
      { id: 'ai', label: 'AI Intelligence', icon: <Icon.Brain /> },
    ]
  },
  {
    title: 'SAFETY & MODERATION',
    items: [
      { id: 'automod', label: 'Auto-Moderation', icon: <Icon.Robot /> },
      { id: 'antinuke', label: 'Anti-Nuke Shield', icon: <Icon.Shield /> },
      { id: 'captcha', label: 'Captcha Verification', icon: <Icon.Lock /> },
      { id: 'welcome', label: 'Welcome Suite', icon: <Icon.Sparkles /> },
      { id: 'logging', label: 'Audit Logs', icon: <Icon.Logs /> },
      { id: 'tickets', label: 'Support Tickets', icon: <Icon.Ticket /> },
    ]
  },
  {
    title: 'COMMUNITY & VOICE',
    items: [
      { id: 'tempvoice', label: 'Temp Voice Rooms', icon: <Icon.Voice /> },
      { id: 'stats', label: 'Server Counters', icon: <Icon.Stats /> },
      { id: 'birthdays', label: 'Birthdays', icon: <Icon.Cake /> },
      { id: 'leveling', label: 'Leveling & XP', icon: <Icon.Level /> },
      { id: 'giveaways', label: 'Giveaways', icon: <Icon.Gift /> },
      { id: 'economy', label: 'Economy & Shop', icon: <Icon.Coin /> },
      { id: 'roles', label: 'Role Manager', icon: <Icon.Users /> },
      { id: 'social', label: 'Social Notifier', icon: <Icon.Globe /> },
      { id: 'esports', label: 'Esports Verification', icon: <Icon.Gamepad /> },
      { id: 'music', label: 'Music Engine', icon: <Icon.Music /> },
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

  // States
  const [permissions, setPermissions] = useState([]);
  const [newType, setNewType] = useState('role');
  const [newId, setNewId] = useState('');
  const [isSavingPerm, setIsSavingPerm] = useState(false);

  const [aiSettings, setAiSettings] = useState({ AI_ENABLED: 'true', AI_CHAT_CHANNEL_ID: '', AI_SYSTEM_PROMPT: '' });
  const [isSavingAi, setIsSavingAi] = useState(false);

  const [leveling, setLeveling] = useState({ LEVELING_ENABLED: 'true', LEVEL_UP_CHANNEL_ID: '' });
  const [isSavingLeveling, setIsSavingLeveling] = useState(false);

  const [tickets, setTickets] = useState({ TICKET_CATEGORY_ID: '', TICKET_STAFF_ROLE_ID: '', TICKET_WELCOME_MESSAGE: '' });
  const [isSavingTickets, setIsSavingTickets] = useState(false);

  const [antiNuke, setAntiNuke] = useState({ ANTINUKE_ENABLED: 'true', ANTINUKE_THRESHOLD: '3' });
  const [isSavingAntiNuke, setIsSavingAntiNuke] = useState(false);

  const [tempVoice, setTempVoice] = useState({ TEMP_VOICE_HUB_CHANNEL_ID: '' });
  const [isSavingTempVoice, setIsSavingTempVoice] = useState(false);

  const [birthdays, setBirthdays] = useState({ BIRTHDAY_CHANNEL_ID: '', BIRTHDAY_ROLE_ID: '' });
  const [isSavingBirthdays, setIsSavingBirthdays] = useState(false);

  const [captcha, setCaptcha] = useState({ CAPTCHA_VERIFIED_ROLE_ID: '' });
  const [isSavingCaptcha, setIsSavingCaptcha] = useState(false);

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
    YOUTUBE_URL: '', YOUTUBE_CHANNEL_ID: '',
    FACEBOOK_URL: '', FACEBOOK_CHANNEL_ID: '',
    INSTAGRAM_URL: '', INSTAGRAM_CHANNEL_ID: '',
    TIKTOK_URL: '', TIKTOK_CHANNEL_ID: '',
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

        setAiSettings({
          AI_ENABLED: map.AI_ENABLED ?? 'true',
          AI_CHAT_CHANNEL_ID: map.AI_CHAT_CHANNEL_ID || '',
          AI_SYSTEM_PROMPT: map.AI_SYSTEM_PROMPT || ''
        });
        setLeveling({
          LEVELING_ENABLED: map.LEVELING_ENABLED ?? 'true',
          LEVEL_UP_CHANNEL_ID: map.LEVEL_UP_CHANNEL_ID || ''
        });
        setTickets({
          TICKET_CATEGORY_ID: map.TICKET_CATEGORY_ID || '',
          TICKET_STAFF_ROLE_ID: map.TICKET_STAFF_ROLE_ID || '',
          TICKET_WELCOME_MESSAGE: map.TICKET_WELCOME_MESSAGE || ''
        });
        setAntiNuke({
          ANTINUKE_ENABLED: map.ANTINUKE_ENABLED ?? 'true',
          ANTINUKE_THRESHOLD: map.ANTINUKE_THRESHOLD || '3'
        });
        setTempVoice({
          TEMP_VOICE_HUB_CHANNEL_ID: map.TEMP_VOICE_HUB_CHANNEL_ID || ''
        });
        setBirthdays({
          BIRTHDAY_CHANNEL_ID: map.BIRTHDAY_CHANNEL_ID || '',
          BIRTHDAY_ROLE_ID: map.BIRTHDAY_ROLE_ID || ''
        });
        setCaptcha({
          CAPTCHA_VERIFIED_ROLE_ID: map.CAPTCHA_VERIFIED_ROLE_ID || ''
        });
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
          YOUTUBE_URL: map.YOUTUBE_URL || '', YOUTUBE_CHANNEL_ID: map.YOUTUBE_CHANNEL_ID || '',
          FACEBOOK_URL: map.FACEBOOK_URL || '', FACEBOOK_CHANNEL_ID: map.FACEBOOK_CHANNEL_ID || '',
          INSTAGRAM_URL: map.INSTAGRAM_URL || '', INSTAGRAM_CHANNEL_ID: map.INSTAGRAM_CHANNEL_ID || '',
          TIKTOK_URL: map.TIKTOK_URL || '', TIKTOK_CHANNEL_ID: map.TIKTOK_CHANNEL_ID || '',
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

  const handleSaveAi = async (e) => {
    e?.preventDefault();
    setIsSavingAi(true);
    const ok = await saveSettings(aiSettings);
    showToast(ok ? 'Jarvis AI settings saved' : 'Failed to save', ok ? 'success' : 'error');
    setIsSavingAi(false);
  };

  const handleSaveLeveling = async (e) => {
    e?.preventDefault();
    setIsSavingLeveling(true);
    const ok = await saveSettings(leveling);
    showToast(ok ? 'Leveling & XP settings saved' : 'Failed to save', ok ? 'success' : 'error');
    setIsSavingLeveling(false);
  };

  const handleSaveTickets = async (e) => {
    e?.preventDefault();
    setIsSavingTickets(true);
    const ok = await saveSettings(tickets);
    showToast(ok ? 'Ticket desk configuration saved' : 'Failed to save', ok ? 'success' : 'error');
    setIsSavingTickets(false);
  };

  const handleSaveAntiNuke = async (e) => {
    e?.preventDefault();
    setIsSavingAntiNuke(true);
    const ok = await saveSettings(antiNuke);
    showToast(ok ? 'Anti-Nuke Raid Shield updated' : 'Failed to save', ok ? 'success' : 'error');
    setIsSavingAntiNuke(false);
  };

  const handleSaveTempVoice = async (e) => {
    e?.preventDefault();
    setIsSavingTempVoice(true);
    const ok = await saveSettings(tempVoice);
    showToast(ok ? 'Temp Voice settings saved' : 'Failed to save', ok ? 'success' : 'error');
    setIsSavingTempVoice(false);
  };

  const handleSaveBirthdays = async (e) => {
    e?.preventDefault();
    setIsSavingBirthdays(true);
    const ok = await saveSettings(birthdays);
    showToast(ok ? 'Birthday celebrations saved' : 'Failed to save', ok ? 'success' : 'error');
    setIsSavingBirthdays(false);
  };

  const handleSaveCaptcha = async (e) => {
    e?.preventDefault();
    setIsSavingCaptcha(true);
    const ok = await saveSettings(captcha);
    showToast(ok ? 'Captcha verification role saved' : 'Failed to save', ok ? 'success' : 'error');
    setIsSavingCaptcha(false);
  };

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

  const activeSystemsCount = useMemo(() => {
    let count = 0;
    if (aiSettings.AI_ENABLED === 'true') count++;
    if (leveling.LEVELING_ENABLED === 'true') count++;
    if (antiNuke.ANTINUKE_ENABLED === 'true') count++;
    if (tempVoice.TEMP_VOICE_HUB_CHANNEL_ID) count++;
    if (birthdays.BIRTHDAY_CHANNEL_ID) count++;
    if (captcha.CAPTCHA_VERIFIED_ROLE_ID) count++;
    if (tickets.TICKET_CATEGORY_ID) count++;
    if (automod.AUTOMOD_ANTI_SPAM === 'true') count++;
    if (welcome.WELCOME_CHANNEL_ID) count++;
    if (logging.MOD_LOGS_CHANNEL_ID) count++;
    if (roles.DEFAULT_MEMBER_ROLE_ID || roles.AUTOROLE_HUMANS_ROLE_ID) count++;
    if (social.YOUTUBE_URL || social.FACEBOOK_URL) count++;
    if (esports.SS_VERIFY_CHANNEL) count++;
    return count;
  }, [aiSettings, leveling, antiNuke, tempVoice, birthdays, captcha, tickets, automod, welcome, logging, roles, social, esports]);

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

      <div className="ambient-glow-1" style={{ top: '-10%', left: '15%' }} />
      <div className="ambient-glow-2" style={{ bottom: '10%', right: '10%' }} />

      {/* ─── TOP NAVIGATION HEADER ─── */}
      <header style={{
        height: 60,
        background: 'rgba(8, 10, 15, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
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
              <span className="luxe-badge luxe-badge-indigo" style={{ fontSize: 10, padding: '2px 7px' }}>BY TRJ7</span>
            </div>
          </div>

          <div style={{ width: 1, height: 18, background: 'var(--border-subtle)' }} />

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

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="luxe-badge luxe-badge-emerald" style={{ fontSize: 11 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
            Jarvis Core Active • 18ms
          </div>

          <div style={{ width: 1, height: 18, background: 'var(--border-subtle)' }} />

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

      {/* ─── MAIN APP LAYOUT ─── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 60px)' }}>

        {/* ─── SINGLE UNIFIED MASTER SIDEBAR ─── */}
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
            {/* Server Selector */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', padding: '0 8px 8px' }}>
                SERVERS ({guilds.length})
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

            {/* Navigation Groups */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                  TAB: OVERVIEW
                  ═══════════════════════════════════════════════════════════════ */}
              {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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

                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
                            <button
                              onClick={copyGuildId}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
                              title="Click to copy ID"
                            >
                              <Icon.Copy />
                              <code>ID: {selectedGuild.id}</code>
                              {copiedId && <span style={{ color: '#34d399', fontSize: 11 }}>✓ Copied</span>}
                            </button>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>•</span>
                            <span style={{ fontSize: 12, color: '#a5b4fc', fontWeight: 600 }}>Jarvis Bot • Made by trj7</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => showToast('Jarvis AI Core is synchronized')} className="btn-luxe-secondary">
                          Ping Bot Core
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 4 Metric Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                    {[
                      { title: 'AI Assistant', value: aiSettings.AI_ENABLED === 'true' ? 'Online' : 'Disabled', sub: 'Gemini AI Integration', icon: <Icon.Brain />, onClick: () => setActiveTab('ai') },
                      { title: 'Leveling & XP', value: leveling.LEVELING_ENABLED === 'true' ? 'Active' : 'Disabled', sub: 'Progress Tracker', icon: <Icon.Level />, onClick: () => setActiveTab('leveling') },
                      { title: 'Temp Voice', value: tempVoice.TEMP_VOICE_HUB_CHANNEL_ID ? 'Enabled' : 'Disabled', sub: 'Join-to-Create Hub', icon: <Icon.Voice />, onClick: () => setActiveTab('tempvoice') },
                      { title: 'Active Modules', value: `${activeSystemsCount} of 14 Enabled`, sub: 'Full System Matrix', icon: <Icon.Sparkles />, onClick: null },
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

                  {/* 6 Feature Quick Cards */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 12 }}>
                      SYSTEM EXTENSIONS & AUTOMATIONS
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
                      {[
                        { id: 'ai', title: '🧠 AI Intelligence & /imagine', desc: 'Google Gemini AI chat + AI Image generation in chat.', enabled: aiSettings.AI_ENABLED === 'true' },
                        { id: 'tempvoice', title: '🔊 Dynamic Temp Voice', desc: 'Auto-create private voice rooms on join & auto-cleanup.', enabled: !!tempVoice.TEMP_VOICE_HUB_CHANNEL_ID },
                        { id: 'birthdays', title: '🎂 Birthday Celebrations', desc: 'Announce member birthdays with special roles and greetings.', enabled: !!birthdays.BIRTHDAY_CHANNEL_ID },
                        { id: 'captcha', title: '🛡️ Captcha Verification', desc: 'Protect server with interactive click verification desk.', enabled: !!captcha.CAPTCHA_VERIFIED_ROLE_ID },
                        { id: 'tickets', title: '🎟️ Support Ticket Desk', desc: 'Deploy private support rooms with staff transcripts.', enabled: !!tickets.TICKET_CATEGORY_ID },
                        { id: 'antinuke', title: '🛡️ Anti-Nuke Shield', desc: 'Mitigate mass bans, kicks, or channel deletions.', enabled: antiNuke.ANTINUKE_ENABLED === 'true' },
                      ].map(item => (
                        <div key={item.id} className="luxe-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ fontSize: 14.5, fontWeight: 700, color: '#fff' }}>{item.title}</div>
                              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3 }}>{item.desc}</div>
                            </div>
                            <span className={`luxe-badge ${item.enabled ? 'luxe-badge-emerald' : 'luxe-badge-muted'}`}>
                              {item.enabled ? 'Active' : 'Config'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
                            <button onClick={() => setActiveTab(item.id)} className="btn-luxe-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>
                              Manage <Icon.ChevronRight />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════════
                  TAB: TEMP VOICE
                  ═══════════════════════════════════════════════════════════════ */}
              {activeTab === 'tempvoice' && (
                <form onSubmit={handleSaveTempVoice} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="luxe-card" style={{ padding: '24px' }}>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: 'white', marginBottom: 4 }}>Dynamic Temporary Voice Channels</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                      When a member connects to the Hub Channel, Jarvis creates a private room (e.g. <code className="luxe-code">🔊 User's Lounge</code>), moves them in, and deletes it when empty.
                    </p>

                    <div>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)', marginBottom: 6 }}>"Join to Create" Hub Voice Channel ID</label>
                      <input
                        type="text"
                        value={tempVoice.TEMP_VOICE_HUB_CHANNEL_ID}
                        onChange={e => setTempVoice({ TEMP_VOICE_HUB_CHANNEL_ID: e.target.value })}
                        placeholder="Voice Channel ID (e.g. 123456789012345678)"
                        className="luxe-input"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" disabled={isSavingTempVoice} className="btn-luxe-primary">
                      {isSavingTempVoice ? 'Saving...' : 'Save Temp Voice Config'}
                    </button>
                  </div>
                </form>
              )}

              {/* ═══════════════════════════════════════════════════════════════
                  TAB: SERVER STATS
                  ═══════════════════════════════════════════════════════════════ */}
              {activeTab === 'stats' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="luxe-card" style={{ padding: '24px' }}>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: 'white', marginBottom: 4 }}>Live Server Stats Counters</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                      Create locked voice counters at the top of your server (Total Members, Online Members, Nitro Boosts) updated every 10 minutes.
                    </p>

                    <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Deploy Counters via Discord</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                        Run <code className="luxe-code">/stats-setup</code> in any channel with Administrator permissions to auto-create category & channels.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════════
                  TAB: BIRTHDAYS
                  ═══════════════════════════════════════════════════════════════ */}
              {activeTab === 'birthdays' && (
                <form onSubmit={handleSaveBirthdays} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="luxe-card" style={{ padding: '24px' }}>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: 'white', marginBottom: 4 }}>Birthday Celebration Suite</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                      Members register with <code className="luxe-code">/birthday set &lt;day&gt; &lt;month&gt;</code>. Jarvis sends celebratory wishes and awards a temporary role at midnight.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)', marginBottom: 6 }}>Birthday Announcement Channel ID</label>
                        <input
                          type="text"
                          value={birthdays.BIRTHDAY_CHANNEL_ID}
                          onChange={e => setBirthdays(p => ({ ...p, BIRTHDAY_CHANNEL_ID: e.target.value }))}
                          placeholder="e.g. 123456789012345678"
                          className="luxe-input"
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)', marginBottom: 6 }}>Birthday Star Role ID (Optional)</label>
                        <input
                          type="text"
                          value={birthdays.BIRTHDAY_ROLE_ID}
                          onChange={e => setBirthdays(p => ({ ...p, BIRTHDAY_ROLE_ID: e.target.value }))}
                          placeholder="Role assigned on birthday"
                          className="luxe-input"
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" disabled={isSavingBirthdays} className="btn-luxe-primary">
                      {isSavingBirthdays ? 'Saving...' : 'Save Birthday Settings'}
                    </button>
                  </div>
                </form>
              )}

              {/* ═══════════════════════════════════════════════════════════════
                  TAB: CAPTCHA
                  ═══════════════════════════════════════════════════════════════ */}
              {activeTab === 'captcha' && (
                <form onSubmit={handleSaveCaptcha} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="luxe-card" style={{ padding: '24px' }}>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: 'white', marginBottom: 4 }}>Captcha & Member Verification</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                      Deploy an interactive button verification panel with <code className="luxe-code">/captcha-setup</code>.
                    </p>

                    <div>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)', marginBottom: 6 }}>Verified Member Role ID</label>
                      <input
                        type="text"
                        value={captcha.CAPTCHA_VERIFIED_ROLE_ID}
                        onChange={e => setCaptcha({ CAPTCHA_VERIFIED_ROLE_ID: e.target.value })}
                        placeholder="Role unlocked upon clicking Verify button"
                        className="luxe-input"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" disabled={isSavingCaptcha} className="btn-luxe-primary">
                      {isSavingCaptcha ? 'Saving...' : 'Save Verification Role'}
                    </button>
                  </div>
                </form>
              )}

              {/* ═══════════════════════════════════════════════════════════════
                  TAB: AI INTELLIGENCE
                  ═══════════════════════════════════════════════════════════════ */}
              {activeTab === 'ai' && (
                <form onSubmit={handleSaveAi} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="luxe-card" style={{ padding: '24px' }}>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: 'white', marginBottom: 4 }}>Jarvis AI Assistant & /imagine</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                      Powered by Google Gemini. Use <code className="luxe-code">/ask</code>, <code className="luxe-code">/imagine</code>, or <code className="luxe-code">/summarize</code>.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Enable Jarvis AI Intelligence</div>
                          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>Allow members to query AI and get chat summaries</div>
                        </div>
                        <label className="luxe-switch">
                          <input
                            type="checkbox"
                            checked={aiSettings.AI_ENABLED === 'true'}
                            onChange={e => setAiSettings(p => ({ ...p, AI_ENABLED: String(e.target.checked) }))}
                          />
                          <span className="luxe-slider" />
                        </label>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)', marginBottom: 6 }}>Dedicated AI Channel ID (Optional)</label>
                        <input
                          type="text"
                          value={aiSettings.AI_CHAT_CHANNEL_ID}
                          onChange={e => setAiSettings(p => ({ ...p, AI_CHAT_CHANNEL_ID: e.target.value }))}
                          placeholder="e.g. 123456789012345678"
                          className="luxe-input"
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)', marginBottom: 6 }}>Custom AI Personality & Prompt</label>
                        <textarea
                          value={aiSettings.AI_SYSTEM_PROMPT}
                          onChange={e => setAiSettings(p => ({ ...p, AI_SYSTEM_PROMPT: e.target.value }))}
                          placeholder="You are Jarvis, a smart AI assistant for this Discord server created by trj7..."
                          rows={3}
                          className="luxe-input"
                          style={{ resize: 'none' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" disabled={isSavingAi} className="btn-luxe-primary">
                      {isSavingAi ? 'Saving...' : 'Save AI Settings'}
                    </button>
                  </div>
                </form>
              )}

              {/* ═══════════════════════════════════════════════════════════════
                  TAB: LEVELING
                  ═══════════════════════════════════════════════════════════════ */}
              {activeTab === 'leveling' && (
                <form onSubmit={handleSaveLeveling} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="luxe-card" style={{ padding: '24px' }}>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: 'white', marginBottom: 4 }}>XP Progression & Leveling</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                      Reward active chatter with experience points, custom rank cards (<code className="luxe-code">/rank</code>), and <code className="luxe-code">/leaderboard</code>.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Enable Leveling & XP Tracking</div>
                          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>Members gain 15–25 XP per message with 60s cooldown</div>
                        </div>
                        <label className="luxe-switch">
                          <input
                            type="checkbox"
                            checked={leveling.LEVELING_ENABLED === 'true'}
                            onChange={e => setLeveling(p => ({ ...p, LEVELING_ENABLED: String(e.target.checked) }))}
                          />
                          <span className="luxe-slider" />
                        </label>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)', marginBottom: 6 }}>Level-Up Announcements Channel ID</label>
                        <input
                          type="text"
                          value={leveling.LEVEL_UP_CHANNEL_ID}
                          onChange={e => setLeveling(p => ({ ...p, LEVEL_UP_CHANNEL_ID: e.target.value }))}
                          placeholder="Channel ID (leave blank to post in current chat)"
                          className="luxe-input"
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" disabled={isSavingLeveling} className="btn-luxe-primary">
                      {isSavingLeveling ? 'Saving...' : 'Save Leveling Settings'}
                    </button>
                  </div>
                </form>
              )}

              {/* ═══════════════════════════════════════════════════════════════
                  TAB: TICKETS
                  ═══════════════════════════════════════════════════════════════ */}
              {activeTab === 'tickets' && (
                <form onSubmit={handleSaveTickets} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="luxe-card" style={{ padding: '24px' }}>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: 'white', marginBottom: 4 }}>Support Ticket System</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                      Deploy interactive ticket desks with <code className="luxe-code">/ticket setup</code> in any text channel.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)', marginBottom: 6 }}>Ticket Category ID</label>
                        <input
                          type="text"
                          value={tickets.TICKET_CATEGORY_ID}
                          onChange={e => setTickets(p => ({ ...p, TICKET_CATEGORY_ID: e.target.value }))}
                          placeholder="Discord Category ID"
                          className="luxe-input"
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)', marginBottom: 6 }}>Support Staff Role ID</label>
                        <input
                          type="text"
                          value={tickets.TICKET_STAFF_ROLE_ID}
                          onChange={e => setTickets(p => ({ ...p, TICKET_STAFF_ROLE_ID: e.target.value }))}
                          placeholder="Staff Role ID"
                          className="luxe-input"
                        />
                      </div>

                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)', marginBottom: 6 }}>Ticket Initial Greeting Message</label>
                        <textarea
                          value={tickets.TICKET_WELCOME_MESSAGE}
                          onChange={e => setTickets(p => ({ ...p, TICKET_WELCOME_MESSAGE: e.target.value }))}
                          placeholder="Thank you for opening a ticket. Please describe your inquiry below..."
                          rows={3}
                          className="luxe-input"
                          style={{ resize: 'none' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" disabled={isSavingTickets} className="btn-luxe-primary">
                      {isSavingTickets ? 'Saving...' : 'Save Ticket Settings'}
                    </button>
                  </div>
                </form>
              )}

              {/* ═══════════════════════════════════════════════════════════════
                  TAB: ANTI-NUKE
                  ═══════════════════════════════════════════════════════════════ */}
              {activeTab === 'antinuke' && (
                <form onSubmit={handleSaveAntiNuke} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="luxe-card" style={{ padding: '24px' }}>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: 'white', marginBottom: 4 }}>Anti-Nuke Raid Shield</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                      Automatic fail-safe defense against compromised admin accounts rapidly deleting channels or mass-banning members.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Enable Anti-Nuke Automated Mitigation</div>
                          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>Instantly bans perpetrator and alerts server owner</div>
                        </div>
                        <label className="luxe-switch">
                          <input
                            type="checkbox"
                            checked={antiNuke.ANTINUKE_ENABLED === 'true'}
                            onChange={e => setAntiNuke(p => ({ ...p, ANTINUKE_ENABLED: String(e.target.checked) }))}
                          />
                          <span className="luxe-slider" />
                        </label>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-high)', marginBottom: 6 }}>Action Threshold (Trigger limit in 15 seconds)</label>
                        <input
                          type="number"
                          value={antiNuke.ANTINUKE_THRESHOLD}
                          onChange={e => setAntiNuke(p => ({ ...p, ANTINUKE_THRESHOLD: e.target.value }))}
                          placeholder="e.g. 3"
                          className="luxe-input"
                          min={2}
                          max={10}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" disabled={isSavingAntiNuke} className="btn-luxe-primary">
                      {isSavingAntiNuke ? 'Saving...' : 'Save Anti-Nuke Config'}
                    </button>
                  </div>
                </form>
              )}

              {/* ═══════════════════════════════════════════════════════════════
                  TAB: GIVEAWAYS
                  ═══════════════════════════════════════════════════════════════ */}
              {activeTab === 'giveaways' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="luxe-card" style={{ padding: '24px' }}>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: 'white', marginBottom: 4 }}>Giveaway Engine</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                      Host interactive giveaways with live countdowns directly in Discord using slash commands.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ padding: '14px 18px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Start a Giveaway</div>
                        <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>
                          Use <code className="luxe-code">/giveaway start prize:Discord Nitro duration_minutes:60 winners:1</code>
                        </div>
                      </div>

                      <div style={{ padding: '14px 18px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>End a Giveaway Early</div>
                        <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>
                          Use <code className="luxe-code">/giveaway end message_id:&lt;MESSAGE_ID&gt;</code> to pick winners immediately.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════════
                  TAB: ECONOMY
                  ═══════════════════════════════════════════════════════════════ */}
              {activeTab === 'economy' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="luxe-card" style={{ padding: '24px' }}>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: 'white', marginBottom: 4 }}>Server Economy & Virtual Shop</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                      Virtual wallet and gambling mini-games for server engagement.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                      {[
                        { cmd: '/daily', desc: 'Claim +250 free Jarvis coins every 24 hours' },
                        { cmd: '/balance [user]', desc: 'Check wallet coin balance' },
                        { cmd: '/coinflip <amount> <choice>', desc: 'Gamble coins on heads or tails' },
                        { cmd: '/trivia', desc: 'Answer quiz questions to win +50 coins' },
                        { cmd: '/truthordare', desc: 'Party mini-game for text & voice channels' },
                      ].map(c => (
                        <div key={c.cmd} style={{ padding: '14px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: 10 }}>
                          <code className="luxe-code" style={{ color: '#fbbf24' }}>{c.cmd}</code>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{c.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════════
                  TAB: PERMISSIONS
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
                  TAB: AUTOMOD
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
                  TAB: WELCOME
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
                  TAB: LOGGING
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
                  TAB: ROLES
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
                  TAB: SOCIAL
                  ═══════════════════════════════════════════════════════════════ */}
              {activeTab === 'social' && (
                <form onSubmit={handleSaveSocial} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="luxe-card" style={{ padding: '24px' }}>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: 'white', marginBottom: 4 }}>Social Media Feeds</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                      Publish instant updates to your Discord channels when new content is posted online.
                    </p>

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
                  TAB: ESPORTS
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
                  TAB: MUSIC
                  ═══════════════════════════════════════════════════════════════ */}
              {activeTab === 'music' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="luxe-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div>
                        <h2 style={{ fontSize: 17, fontWeight: 700, color: 'white' }}>Jarvis High-Fidelity Music Player</h2>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Lossless YouTube, SoundCloud & Spotify voice channel playback.</p>
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
