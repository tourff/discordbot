// src/modules/roleRevertCache.js
'use strict';

// In-memory cache for recent role operations to support Revert buttons
// Map<txnId, { roleId, memberIds, actionType }>
const revertCache = new Map();

// Automatically clean up cache entries after 1 hour to prevent memory leaks
const TTL = 60 * 60 * 1000; 

function saveTransaction(txnId, roleId, memberIds, actionType) {
  revertCache.set(txnId, { roleId, memberIds, actionType, timestamp: Date.now() });
  
  setTimeout(() => {
    revertCache.delete(txnId);
  }, TTL);
}

function getTransaction(txnId) {
  return revertCache.get(txnId);
}

function deleteTransaction(txnId) {
  revertCache.delete(txnId);
}

module.exports = {
  saveTransaction,
  getTransaction,
  deleteTransaction,
};
