'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [guilds, setGuilds] = useState([]);
  const [selectedGuild, setSelectedGuild] = useState(null);
  const [permissions, setPermissions] = useState([]);
  
  const [newType, setNewType] = useState('role');
  const [newId, setNewId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchGuilds() {
      if (session?.accessToken) {
        try {
          const res = await fetch('https://discord.com/api/users/@me/guilds', {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          });
          const data = await res.json();
          // Filter for guilds where user is admin (permission bit 8 = Administrator)
          const adminGuilds = data.filter((g) => (g.permissions & 8) === 8);
          setGuilds(adminGuilds);
        } catch (e) {
          console.error('Failed to fetch guilds:', e);
        }
      }
    }
    fetchGuilds();
  }, [session]);

  useEffect(() => {
    async function fetchPermissions() {
      if (selectedGuild) {
        const { data, error } = await supabase
          .from('bot_permissions')
          .select('*')
          .eq('guild_id', selectedGuild.id);
        
        if (!error && data) {
          setPermissions(data);
        }
      }
    }
    fetchPermissions();
  }, [selectedGuild]);

  const handleAddPermission = async (e) => {
    e.preventDefault();
    if (!selectedGuild || !newId) return;
    setIsSaving(true);
    
    const { data, error } = await supabase
      .from('bot_permissions')
      .insert([{ guild_id: selectedGuild.id, type: newType, target_id: newId }])
      .select();

    if (!error && data) {
      setPermissions([...permissions, ...data]);
      setNewId('');
    }
    setIsSaving(false);
  };

  const handleRemovePermission = async (id) => {
    const { error } = await supabase
      .from('bot_permissions')
      .delete()
      .eq('id', id);

    if (!error) {
      setPermissions(permissions.filter(p => p.id !== id));
    }
  };

  if (status === 'loading') {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-12 border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
              Welcome, {session?.user?.name}
            </h1>
            <p className="text-gray-400 mt-2">Manage your bot's access control</p>
          </div>
          <button 
            onClick={() => signOut()}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm font-semibold"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Server Selection Sidebar */}
          <div className="col-span-1 bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Your Servers</h2>
            {guilds.length === 0 ? (
              <p className="text-gray-500 text-sm">No admin servers found.</p>
            ) : (
              <ul className="space-y-2 max-h-96 overflow-y-auto">
                {guilds.map(guild => (
                  <li key={guild.id}>
                    <button
                      onClick={() => setSelectedGuild(guild)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                        selectedGuild?.id === guild.id 
                          ? 'bg-indigo-600 shadow-lg shadow-indigo-500/20 text-white font-medium' 
                          : 'hover:bg-gray-800 text-gray-300'
                      }`}
                    >
                      {guild.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Permissions Management */}
          <div className="col-span-1 md:col-span-2">
            {!selectedGuild ? (
              <div className="bg-gray-900/50 rounded-2xl p-12 border border-gray-800 flex items-center justify-center text-center h-full">
                <p className="text-gray-400 text-lg">Select a server to manage permissions.</p>
              </div>
            ) : (
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-xl">
                <h2 className="text-2xl font-bold mb-6">{selectedGuild.name} - Permissions</h2>
                
                <form onSubmit={handleAddPermission} className="flex gap-4 mb-8 bg-gray-950 p-4 rounded-xl border border-gray-800">
                  <select 
                    value={newType} 
                    onChange={e => setNewType(e.target.value)}
                    className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="role">Role ID</option>
                    <option value="user">User ID</option>
                  </select>
                  
                  <input 
                    type="text" 
                    value={newId}
                    onChange={e => setNewId(e.target.value)}
                    placeholder="Enter Discord ID"
                    required
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold transition-colors disabled:opacity-50"
                  >
                    {isSaving ? 'Adding...' : 'Add'}
                  </button>
                </form>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-300 mb-4">Authorized Entities</h3>
                  {permissions.length === 0 ? (
                    <p className="text-gray-500 text-sm">No specific permissions set. Only server administrators can use the bot.</p>
                  ) : (
                    permissions.map(p => (
                      <div key={p.id} className="flex items-center justify-between bg-gray-950 p-4 rounded-xl border border-gray-800">
                        <div className="flex items-center gap-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                            p.type === 'role' ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {p.type}
                          </span>
                          <span className="font-mono text-gray-300">{p.target_id}</span>
                        </div>
                        <button 
                          onClick={() => handleRemovePermission(p.id)}
                          className="text-red-400 hover:text-red-300 p-2 rounded hover:bg-red-500/10 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
