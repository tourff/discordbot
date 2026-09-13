'use client';

import { useState, useMemo } from 'react';
import { BOT_COMMANDS, COMMAND_CATEGORIES } from '@/data/commands';

export default function CommandsDirectory({ setActiveTab, showToast }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [permFilter, setPermFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('categories'); // 'categories' | 'alphabetical'
  const [sortOrder, setSortOrder] = useState('A-Z'); // 'A-Z' | 'Z-A'
  const [copiedCmd, setCopiedCmd] = useState(null);
  const [collapsedCategories, setCollapsedCategories] = useState({});

  // Copy command to clipboard
  const handleCopy = (text, name) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedCmd(name);
      if (showToast) showToast(`Copied ${text} to clipboard!`, 'success');
      setTimeout(() => setCopiedCmd(null), 2000);
    }
  };

  // Toggle category collapse
  const toggleCollapse = (catKey) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [catKey]: !prev[catKey]
    }));
  };

  const expandAll = () => setCollapsedCategories({});
  const collapseAll = () => {
    const all = {};
    COMMAND_CATEGORIES.forEach(c => { all[c.key] = true; });
    setCollapsedCategories(all);
  };

  // Filter commands
  const filteredCommands = useMemo(() => {
    let list = [...(BOT_COMMANDS || [])];

    // Category filter
    if (selectedCategory !== 'ALL') {
      list = list.filter(c => c.category === selectedCategory);
    }

    // Permission filter
    if (permFilter === 'Everyone') {
      list = list.filter(c => c.permission === 'Everyone');
    } else if (permFilter === 'Admins') {
      list = list.filter(c => c.permission !== 'Everyone');
    }

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(c => {
        const nameMatch = c.name.toLowerCase().includes(q);
        const descMatch = (c.description || '').toLowerCase().includes(q);
        const purposeMatch = (c.purposeBn || '').toLowerCase().includes(q);
        const catMatch = (c.categoryLabel || '').toLowerCase().includes(q);
        const usageMatch = (c.usage || '').toLowerCase().includes(q);
        const optionMatch = c.options?.some(o => 
          o.name.toLowerCase().includes(q) || (o.description || '').toLowerCase().includes(q)
        );
        return nameMatch || descMatch || purposeMatch || catMatch || usageMatch || optionMatch;
      });
    }

    // Sort
    list.sort((a, b) => {
      if (sortOrder === 'A-Z') return a.name.localeCompare(b.name);
      return b.name.localeCompare(a.name);
    });

    return list;
  }, [search, selectedCategory, permFilter, sortOrder]);

  // Group by category for 'categories' view
  const categorizedGroups = useMemo(() => {
    const groups = [];
    COMMAND_CATEGORIES.forEach(cat => {
      const cmds = filteredCommands.filter(c => c.category === cat.key);
      if (cmds.length > 0) {
        groups.push({
          ...cat,
          commands: cmds
        });
      }
    });
    return groups;
  }, [filteredCommands]);

  // Group by first letter for 'alphabetical' view
  const alphabeticalGroups = useMemo(() => {
    const groups = {};
    filteredCommands.forEach(c => {
      const letter = c.name.charAt(0).toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(c);
    });
    return Object.keys(groups).sort().map(letter => ({
      letter,
      commands: groups[letter]
    }));
  }, [filteredCommands]);

  const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const activeLetters = new Set(filteredCommands.map(c => c.name.charAt(0).toUpperCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ─── Hero Banner: Commands Directory ───────────────────────────────────── */}
      <div className="luxe-card" style={{
        padding: '28px 30px',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 27, 75, 0.4) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.35)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 40px rgba(99, 102, 241, 0.12)',
      }}>
        {/* Glowing top line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899, #10b981)'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: 8,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
              }}>
                <span>⚡</span> BOT COMMAND CENTER
              </span>
              <span style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontSize: 12,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 20
              }}>
                73 Commands Available (A to Z)
              </span>
            </div>

            <h1 style={{
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#fff',
              margin: '12px 0 6px 0',
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              বটের সম্পূর্ণ কমান্ড ডিরেক্টরি ও ইউজার ম্যানুয়াল
            </h1>

            <p style={{ fontSize: 13.5, color: '#cbd5e1', margin: 0, maxWidth: 820, lineHeight: 1.6 }}>
              প্রতিটি কমান্ডের কাজ কী (<strong style={{ color: '#818cf8' }}>kontar kaj ki</strong>), কীভাবে ব্যবহার করতে হবে (<strong style={{ color: '#a855f7' }}>usage</strong>), কোন কোন অপশন দিতে হবে এবং কারা ব্যবহার করতে পারবে — সবকিছু ক্যাটাগরি ও A-Z অনুযায়ী বিস্তারিত সাজানো রয়েছে।
            </p>
          </div>

          {/* Quick Metrics Badge Strip */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 12,
              padding: '10px 16px',
              textAlign: 'center',
              minWidth: 95
            }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#818cf8' }}>73</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Commands</div>
            </div>

            <div style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 12,
              padding: '10px 16px',
              textAlign: 'center',
              minWidth: 95
            }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#ec4899' }}>13</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Categories</div>
            </div>

            <div style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 12,
              padding: '10px 16px',
              textAlign: 'center',
              minWidth: 95
            }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#34d399' }}>38</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Everyone</div>
            </div>

            <div style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 12,
              padding: '10px 16px',
              textAlign: 'center',
              minWidth: 95
            }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fbbf24' }}>35</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Staff Only</div>
            </div>
          </div>
        </div>

        {/* ─── Search & Controls Bar ─────────────────────────────────────────── */}
        <div style={{
          marginTop: 22,
          paddingTop: 20,
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}>
          {/* Top row: Search input + View Switcher + Perm filter */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="🔍 কমান্ডের নাম, কাজের বিবরণ বা অপশন খুঁজুন (e.g. ban, ask, ticket, music, play, purge, imagine)..."
                className="luxe-input"
                style={{
                  padding: '12px 18px',
                  paddingRight: 40,
                  fontSize: 13.5,
                  background: 'rgba(11, 15, 25, 0.85)',
                  borderColor: search ? '#6366f1' : 'rgba(255, 255, 255, 0.12)',
                  borderRadius: 10,
                  boxShadow: search ? '0 0 20px rgba(99, 102, 241, 0.25)' : 'none'
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'transparent', border: 'none', color: 'var(--text-muted)',
                    cursor: 'pointer', fontSize: 15, padding: 4
                  }}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* View Mode Toggle: Categories vs Alphabetical */}
            <div style={{
              display: 'inline-flex',
              background: 'rgba(11, 15, 25, 0.9)',
              padding: 3,
              borderRadius: 10,
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <button
                type="button"
                onClick={() => setViewMode('categories')}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: 'none',
                  fontSize: 12.5,
                  fontWeight: viewMode === 'categories' ? 700 : 500,
                  background: viewMode === 'categories' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
                  color: viewMode === 'categories' ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease'
                }}
              >
                <span>🗂️</span> ক্যাটাগরি ভিউ (Categorized)
              </button>

              <button
                type="button"
                onClick={() => setViewMode('alphabetical')}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: 'none',
                  fontSize: 12.5,
                  fontWeight: viewMode === 'alphabetical' ? 700 : 500,
                  background: viewMode === 'alphabetical' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
                  color: viewMode === 'alphabetical' ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease'
                }}
              >
                <span>🔤</span> সবগুলো A-Z (Alphabetical)
              </button>
            </div>

            {/* Permission Filter */}
            <select
              value={permFilter}
              onChange={e => setPermFilter(e.target.value)}
              className="luxe-input"
              style={{
                padding: '9px 14px',
                fontSize: 12.5,
                width: 'auto',
                background: 'rgba(11, 15, 25, 0.9)',
                borderColor: 'rgba(255, 255, 255, 0.12)',
                cursor: 'pointer',
                borderRadius: 10
              }}
            >
              <option value="ALL">👥 সব পারমিশন (All Permissions)</option>
              <option value="Everyone">🟢 সাধারণ মেম্বার (Everyone Only)</option>
              <option value="Admins">🛡️ স্টাফ ও অ্যাডমিন (Staff / Admins Only)</option>
            </select>

            {/* Sort Toggle */}
            <button
              type="button"
              onClick={() => setSortOrder(prev => prev === 'A-Z' ? 'Z-A' : 'A-Z')}
              className="btn-luxe-secondary"
              style={{
                padding: '9px 14px',
                fontSize: 12.5,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 10
              }}
              title="Toggle Sort Order"
            >
              <span>↕️</span> ক্রমানুসারে: <strong>{sortOrder}</strong>
            </button>
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: selectedCategory === 'ALL' ? 700 : 500,
                background: selectedCategory === 'ALL' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                color: selectedCategory === 'ALL' ? '#a5b4fc' : 'var(--text-muted)',
                border: `1px solid ${selectedCategory === 'ALL' ? '#6366f1' : 'rgba(255, 255, 255, 0.08)'}`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span>🌐</span> All Categories ({BOT_COMMANDS.length})
            </button>

            {COMMAND_CATEGORIES.map(cat => {
              const isSel = selectedCategory === cat.key;
              const count = BOT_COMMANDS.filter(c => c.category === cat.key).length;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(isSel ? 'ALL' : cat.key)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: isSel ? 700 : 500,
                    background: isSel ? `${cat.color}25` : 'rgba(255, 255, 255, 0.03)',
                    color: isSel ? '#fff' : 'var(--text-muted)',
                    border: `1px solid ${isSel ? cat.color : 'rgba(255, 255, 255, 0.06)'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{cat.icon}</span> {cat.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Active filter count + Expand/Collapse shortcuts */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
            <span>
              দেখাচ্ছে <strong>{filteredCommands.length}</strong> / {BOT_COMMANDS.length} টি কমান্ড • সর্ট: {sortOrder}
            </span>

            {viewMode === 'categories' && (
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={expandAll}
                  style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: 12, cursor: 'pointer', padding: 0 }}
                >
                  সবগুলো খুলুন (Expand All)
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={collapseAll}
                  style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: 12, cursor: 'pointer', padding: 0 }}
                >
                  সবগুলো বন্ধ করুন (Collapse All)
                </button>
                {(search || selectedCategory !== 'ALL' || permFilter !== 'ALL') && (
                  <>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => { setSearch(''); setSelectedCategory('ALL'); setPermFilter('ALL'); }}
                      style={{ background: 'none', border: 'none', color: '#fb7185', fontSize: 12, cursor: 'pointer', padding: 0 }}
                    >
                      ফিল্টার রিসেট (Reset Filters)
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Alphabetical View Jump Letters (Only visible in A-Z mode) ─────────── */}
      {viewMode === 'alphabetical' && (
        <div className="luxe-card" style={{
          padding: '12px 18px',
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(15, 23, 42, 0.6)'
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginRight: 6 }}>
            QUICK LETTER JUMP:
          </span>
          {allLetters.map(letter => {
            const hasCmds = activeLetters.has(letter);
            return (
              <a
                key={letter}
                href={hasCmds ? `#letter-${letter}` : undefined}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  textDecoration: 'none',
                  background: hasCmds ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                  color: hasCmds ? '#a5b4fc' : 'rgba(255, 255, 255, 0.2)',
                  border: `1px solid ${hasCmds ? 'rgba(99, 102, 241, 0.4)' : 'transparent'}`,
                  cursor: hasCmds ? 'pointer' : 'default',
                  transition: 'all 0.15s ease'
                }}
              >
                {letter}
              </a>
            );
          })}
        </div>
      )}

      {/* ─── Content: No commands found state ─────────────────────────────────── */}
      {filteredCommands.length === 0 && (
        <div className="luxe-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🔍</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: '0 0 6px 0' }}>
            কোনো কমান্ড খুঁজে পাওয়া যায়নি
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            আপনার সার্চ কি-ওয়ার্ড পরিবর্তন করুন অথবা ফিল্টারগুলো রিসেট করুন।
          </p>
          <button
            type="button"
            onClick={() => { setSearch(''); setSelectedCategory('ALL'); setPermFilter('ALL'); }}
            className="btn-luxe-primary"
            style={{ marginTop: 16, padding: '8px 18px', fontSize: 13 }}
          >
            সব কমান্ড আবার দেখুন
          </button>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════
          MODE 1: CATEGORIZED VIEW (Grouped by Category with headers)
          ═════════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'categories' && categorizedGroups.map(group => {
        const isCollapsed = collapsedCategories[group.key];
        return (
          <div
            key={group.key}
            className="luxe-card"
            style={{
              padding: 0,
              overflow: 'hidden',
              background: 'rgba(15, 23, 42, 0.75)',
              border: `1px solid ${group.color}40`,
              boxShadow: `0 10px 30px rgba(0, 0, 0, 0.4), 0 0 25px ${group.color}15`,
            }}
          >
            {/* Category Section Header Banner */}
            <div
              onClick={() => toggleCollapse(group.key)}
              style={{
                padding: '20px 24px',
                background: `linear-gradient(135deg, ${group.color}15 0%, rgba(15, 23, 42, 0.95) 100%)`,
                borderBottom: isCollapsed ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 14,
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              {/* Category accent bar */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: group.color }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: `${group.color}22`,
                  border: `1px solid ${group.color}60`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  boxShadow: `0 4px 16px ${group.color}30`
                }}>
                  {group.icon}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>
                      {group.label}
                    </h2>
                    <span style={{
                      background: `${group.color}20`,
                      color: group.color,
                      border: `1px solid ${group.color}45`,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 14
                    }}>
                      {group.commands.length} Commands
                    </span>
                  </div>

                  <div style={{ fontSize: 13, color: '#cbd5e1', marginTop: 3 }}>
                    <strong style={{ color: group.color }}>{group.labelBn}</strong> — {group.descBn}
                  </div>
                </div>
              </div>

              {/* Right action: Dashboard Tab link + Collapse Arrow */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} onClick={e => e.stopPropagation()}>
                {group.dashboardTab && (
                  <button
                    type="button"
                    onClick={() => setActiveTab && setActiveTab(group.dashboardTab)}
                    className="btn-luxe-secondary"
                    style={{
                      padding: '6px 12px',
                      fontSize: 12,
                      borderColor: `${group.color}60`,
                      color: group.color,
                      background: `${group.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                    title={`Go to ${group.label} configuration`}
                  >
                    <span>⚙️</span> ড্যাশবোর্ডে সেটআপ করুন ➔
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => toggleCollapse(group.key)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 8,
                    color: '#fff',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: 14,
                    transition: 'transform 0.2s ease',
                    transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)'
                  }}
                  title={isCollapsed ? 'Expand Category' : 'Collapse Category'}
                >
                  ▼
                </button>
              </div>
            </div>

            {/* Category Commands Grid */}
            {!isCollapsed && (
              <div style={{
                padding: 20,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                gap: 16
              }}>
                {group.commands.map(cmd => (
                  <CommandCard
                    key={cmd.name}
                    cmd={cmd}
                    copiedCmd={copiedCmd}
                    handleCopy={handleCopy}
                    setActiveTab={setActiveTab}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* ═════════════════════════════════════════════════════════════════════════
          MODE 2: ALPHABETICAL MASTER A-Z VIEW
          ═════════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'alphabetical' && alphabeticalGroups.map(group => (
        <div key={group.letter} id={`letter-${group.letter}`} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Letter Section Title */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '8px 14px',
            background: 'rgba(99, 102, 241, 0.12)',
            borderRadius: 8,
            borderLeft: '4px solid #6366f1'
          }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#818cf8', fontFamily: 'monospace' }}>
              [{group.letter}]
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
              Letter {group.letter} Commands ({group.commands.length})
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: 16
          }}>
            {group.commands.map(cmd => (
              <CommandCard
                key={cmd.name}
                cmd={cmd}
                copiedCmd={copiedCmd}
                handleCopy={handleCopy}
                setActiveTab={setActiveTab}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Reusable Command Card Component ──────────────────────────────────────────
function CommandCard({ cmd, copiedCmd, handleCopy, setActiveTab }) {
  const isCopied = copiedCmd === cmd.name;

  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.65)',
        borderRadius: 14,
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 14,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = cmd.color || 'rgba(99, 102, 241, 0.5)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 12px 28px rgba(0, 0, 0, 0.45), 0 0 20px ${cmd.color || '#6366f1'}20`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.3)';
      }}
    >
      {/* Top Accent Bar */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 3,
        background: cmd.color || '#6366f1'
      }} />

      <div>
        {/* Row 1: Command trigger & Permission Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontFamily: 'monospace',
              fontSize: 15,
              fontWeight: 800,
              color: '#fff',
              background: 'rgba(99, 102, 241, 0.2)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              padding: '3px 10px',
              borderRadius: 8,
              letterSpacing: '0.02em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}>
              /{cmd.name}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Category Tag */}
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 6,
              background: `${cmd.color || '#6366f1'}15`,
              color: cmd.color || '#818cf8',
              border: `1px solid ${cmd.color || '#6366f1'}35`,
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}>
              <span>{cmd.emoji}</span> {cmd.categoryLabel}
            </span>

            {/* Permission Badge */}
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 6,
              background: cmd.permission === 'Everyone' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: cmd.permission === 'Everyone' ? '#34d399' : '#fbbf24',
              border: `1px solid ${cmd.permission === 'Everyone' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}>
              <span>{cmd.permission === 'Everyone' ? '👥' : '🛡️'}</span> {cmd.permission}
            </span>
          </div>
        </div>

        {/* Row 2: Bengali Purpose ("kontar kaj ki") */}
        <div style={{
          background: 'rgba(99, 102, 241, 0.08)',
          borderLeft: `3px solid ${cmd.color || '#6366f1'}`,
          padding: '8px 12px',
          borderRadius: '0 8px 8px 0',
          marginBottom: 10
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: cmd.color || '#818cf8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>
            🎯 কাজের বিবরণ (Purpose):
          </div>
          <div style={{ fontSize: 13, color: '#f1f5f9', fontWeight: 600, lineHeight: 1.45 }}>
            {cmd.purposeBn || cmd.description}
          </div>
        </div>

        {/* Row 3: English Description */}
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px 0', lineHeight: 1.45 }}>
          {cmd.description}
        </p>

        {/* Row 4: Parameters / Options ("কী কী লাগবে") */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>⚙️</span> প্যারামিটার (Parameters):
          </div>

          {cmd.options && cmd.options.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {cmd.options.map(opt => (
                <span
                  key={opt.name}
                  title={opt.description}
                  style={{
                    fontSize: 11,
                    fontFamily: 'monospace',
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: opt.required ? 'rgba(99, 102, 241, 0.22)' : 'rgba(255, 255, 255, 0.05)',
                    color: opt.required ? '#c7d2fe' : 'var(--text-muted)',
                    border: `1px solid ${opt.required ? 'rgba(99, 102, 241, 0.45)' : 'rgba(255, 255, 255, 0.08)'}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <strong style={{ color: opt.required ? '#a5b4fc' : '#94a3b8' }}>
                    {opt.required ? `<${opt.name}>` : `[${opt.name}]`}
                  </strong>
                  <span style={{ fontSize: 10, opacity: 0.8 }}>
                    ({opt.required ? 'অবশ্যই লাগবে' : 'ঐচ্ছিক'})
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: 11.5, color: '#64748b', fontStyle: 'italic' }}>
              ✨ কোনো অতিরিক্ত অপশন লাগবে না (No parameters needed)
            </span>
          )}
        </div>

        {/* Row 5: Usage Example */}
        {cmd.usage && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 8,
            padding: '7px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
              <span style={{ fontSize: 11, color: '#818cf8', fontWeight: 700, flexShrink: 0 }}>ব্যবহার:</span>
              <code style={{
                fontSize: 12,
                color: '#e2e8f0',
                fontFamily: 'monospace',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {cmd.usage}
              </code>
            </div>

            <button
              type="button"
              onClick={() => handleCopy(cmd.usage, cmd.name)}
              style={{
                background: 'transparent',
                border: 'none',
                color: isCopied ? '#34d399' : '#94a3b8',
                cursor: 'pointer',
                fontSize: 11.5,
                fontWeight: 600,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
              title="Copy usage command"
            >
              {isCopied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        )}
      </div>

      {/* Card Footer Actions */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTop: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        {cmd.dashboardTab ? (
          <button
            type="button"
            onClick={() => setActiveTab && setActiveTab(cmd.dashboardTab)}
            className="btn-luxe-secondary"
            style={{
              padding: '5px 12px',
              fontSize: 11.5,
              color: '#818cf8',
              borderColor: 'rgba(99, 102, 241, 0.35)',
              background: 'rgba(99, 102, 241, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: 5
            }}
            title={`Configure in ${cmd.categoryLabel} dashboard tab`}
          >
            <span>⚙️</span> ড্যাশবোর্ডে নিয়ন্ত্রণ করুন ➔
          </button>
        ) : (
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            Slash Command Only
          </span>
        )}

        <button
          type="button"
          onClick={() => handleCopy(`/${cmd.name}`, cmd.name)}
          className="btn-luxe-secondary"
          style={{
            padding: '5px 12px',
            fontSize: 11.5,
            color: isCopied ? '#34d399' : '#fff',
            borderColor: isCopied ? '#34d399' : 'rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: 5
          }}
          title="Copy /command"
        >
          <span>{isCopied ? '✓' : '📋'}</span> {isCopied ? 'কপি হয়েছে!' : 'কমান্ড কপি'}
        </button>
      </div>
    </div>
  );
}
