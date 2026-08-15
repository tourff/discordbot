// src/events/voiceStateUpdate.js
'use strict';

const { handleTempVoice } = require('../modules/tempVoice');

module.exports = {
  name: 'voiceStateUpdate',

  /**
   * @param {import('discord.js').VoiceState} oldState
   * @param {import('discord.js').VoiceState} newState
   */
  async execute(oldState, newState) {
    await handleTempVoice(oldState, newState).catch(console.error);
  },
};
