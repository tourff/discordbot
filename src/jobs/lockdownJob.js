// src/jobs/lockdownJob.js
'use strict';

const cron = require('node-cron');
const supabase = require('../config/supabase');
const { EmbedBuilder } = require('discord.js');

module.exports = function startLockdownCron(client) {
  // Run every 10 seconds
  cron.schedule('*/10 * * * * *', async () => {
    try {
      const now = new Date().toISOString();

      // Fetch expired lockdowns
      const { data: expiredLockdowns, error } = await supabase
        .from('lockdowns')
        .select('*')
        .lte('expire_time', now);

      if (error) {
        console.error('[LockdownCron] Supabase fetch error:', error);
        return;
      }

      if (!expiredLockdowns || expiredLockdowns.length === 0) return;

      for (const lock of expiredLockdowns) {
        try {
          const guild = await client.guilds.fetch(lock.guild_id).catch(() => null);
          if (!guild) {
            // Guild no longer exists, delete from db
            await supabase.from('lockdowns').delete().eq('id', lock.id);
            continue;
          }

          if (lock.type === 'channel') {
            const channel = await guild.channels.fetch(lock.channel_id).catch(() => null);
            if (channel) {
              await channel.permissionOverwrites.edit(guild.roles.everyone, {
                SendMessages: null,
                AddReactions: null,
              }, { reason: 'Lockdown duration expired' }).catch(console.error);

              const embed = new EmbedBuilder()
                .setColor(0x00ff88)
                .setTitle('🔓 Lockdown Lifted')
                .setDescription(`${channel} has been unlocked automatically.`)
                .setTimestamp();

              await channel.send({ embeds: [embed] }).catch(() => null);
            }
          } 
          
          else if (lock.type === 'guild') {
            const contextChannel = await guild.channels.fetch(lock.channel_id).catch(() => null);
            let successCount = 0;

            if (lock.channel_ids && lock.channel_ids.length > 0) {
              for (const chId of lock.channel_ids) {
                const channel = await guild.channels.fetch(chId).catch(() => null);
                if (channel) {
                  try {
                    await channel.permissionOverwrites.edit(guild.roles.everyone, {
                      SendMessages: null,
                      AddReactions: null,
                    }, { reason: 'Server lockdown duration expired' });
                    successCount++;
                  } catch (e) {
                    // Ignore failure for individual channels
                  }
                }
              }
            }

            if (contextChannel) {
              const embed = new EmbedBuilder()
                .setColor(0x00ff88)
                .setTitle('🔓 Server Lockdown Lifted')
                .setDescription(`Server lockdown has expired. Unlocked ${successCount} channel(s).`)
                .setTimestamp();

              await contextChannel.send({ embeds: [embed] }).catch(() => null);
            }
          }

          else if (lock.type === 'maintenance') {
            const contextChannel = await guild.channels.fetch(lock.channel_id).catch(() => null);
            const role = guild.roles.cache.get(lock.role_id) || await guild.roles.fetch(lock.role_id).catch(() => null);
            let successCount = 0;

            if (role && lock.channel_ids && lock.channel_ids.length > 0) {
              for (const chId of lock.channel_ids) {
                const channel = await guild.channels.fetch(chId).catch(() => null);
                if (channel) {
                  try {
                    await channel.permissionOverwrites.edit(role, {
                      ViewChannel: null,
                    }, { reason: 'Maintenance duration expired' });
                    successCount++;
                  } catch (e) {
                    // Ignore individual failures
                  }
                }
              }
            }

            // Cleanup maintenance channels if they exist
            const mtChat = guild.channels.cache.find(c => c.name === 'maintenance-chat');
            const mtVc = guild.channels.cache.find(c => c.name === 'maintenance-vc');
            if (mtChat) await mtChat.delete().catch(() => null);
            if (mtVc) await mtVc.delete().catch(() => null);

            if (contextChannel) {
              const embed = new EmbedBuilder()
                .setColor(0x00ff88)
                .setTitle('🔧 Maintenance Ended')
                .setDescription(`Maintenance mode has ended. Restored access to ${successCount} channel(s) for ${role || 'configured role'}.`)
                .setTimestamp();

              await contextChannel.send({ embeds: [embed] }).catch(() => null);
            }
          }

          // Delete from DB after firing
          await supabase.from('lockdowns').delete().eq('id', lock.id);
        } catch (err) {
          console.error(`[LockdownCron] Error lifting lockdown ${lock.id}:`, err);
        }
      }
    } catch (err) {
      console.error('[LockdownCron] General error:', err);
    }
  });

  console.log('[Cron] Lockdown job started (checks every 10s).');
};
