'use strict';

/**
 * Example bot: Random Connect 4 player
 * Register at https://botarena.games/register
 */

const { BotArenaClient } = require('../src/client');

const API_KEY = 'bot_your_api_key_here'; // Replace with your bot's API key

const client = new BotArenaClient({ apiKey: API_KEY });

client.onMove((gameState) => {
  const board = gameState.board || [];
  const valid = [];
  for (let c = 0; c < 7; c++) {
    if (!board[0] || board[0][c] === 0) valid.push(c);
  }
  const col = valid[Math.floor(Math.random() * valid.length)] ?? 0;
  return { column: col };
});

client.run();
