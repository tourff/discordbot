// src/modules/economy.js
// ─────────────────────────────────────────────────────────────────────────────
// Virtual Currency & Server Economy Module
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { supabase } = require('../config/supabase');

/**
 * Get user coin balance
 * @param {string} userId
 * @returns {Promise<number>}
 */
async function getBalance(userId) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('money')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    await supabase.from('user_profiles').upsert({ user_id: userId, money: 0 });
    return 0;
  }
  return Number(data.money || 0);
}

/**
 * Add or deduct coins
 * @param {string} userId
 * @param {number} amount (can be negative)
 */
async function modifyBalance(userId, amount) {
  const current = await getBalance(userId);
  const updated = Math.max(0, current + amount);
  await supabase
    .from('user_profiles')
    .upsert({ user_id: userId, money: updated });
  return updated;
}

module.exports = {
  getBalance,
  modifyBalance
};
