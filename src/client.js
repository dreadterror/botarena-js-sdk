'use strict';

const WebSocket = require('ws');
const crypto = require('crypto');
const https = require('https');

const WS_URL = 'wss://botarena.games/bot';
const API_BASE = 'https://botarena.games/api/v1';

function apiRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    };
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => resolve(JSON.parse(raw)));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function solvePow(challenge, difficulty = 4) {
  const prefix = '0'.repeat(difficulty);
  let nonce = 0;
  while (true) {
    const hash = crypto.createHash('sha256').update(`${challenge}${nonce}`).digest('hex');
    if (hash.startsWith(prefix)) return nonce;
    nonce++;
  }
}

async function registerBot({ botName, nickname, description = '' }) {
  const ch = await apiRequest('GET', '/bots/challenge');
  const nonce = solvePow(ch.data.challenge);
  const result = await apiRequest('POST', '/bots/self-register', {
    botName,
    nickname,
    description,
    proofOfAi: JSON.stringify({ challenge: ch.data.challenge, nonce: String(nonce) })
  });
  return result.data;
}

class BotArenaClient {
  constructor({ apiKey }) {
    this.apiKey = apiKey;
    this._moveHandler = null;
  }

  onMove(fn) {
    this._moveHandler = fn;
    return this;
  }

  _joinQueue() {
    https.request({
      hostname: 'botarena.games',
      path: '/api/v1/real-matches/queue/join',
      method: 'POST',
      headers: { 'x-api-key': this.apiKey, 'Content-Length': 0 }
    }, () => console.log('[BotArena] Queued for match.')).end();
  }

  run() {
    const ws = new WebSocket(`${WS_URL}?apiKey=${this.apiKey}`);

    ws.on('open', () => {
      console.log('[BotArena] Connected.');
      this._joinQueue();
    });

    ws.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw);
        const event = msg.event || msg.type || '';

        if (event === 'matched') {
          console.log('[BotArena] Match started:', msg.data);
        } else if (['request_move', 'your_turn', 'move_request'].includes(event)) {
          const gameState = msg.data || msg.gameState || msg;
          if (this._moveHandler) {
            const move = await this._moveHandler(gameState);
            ws.send(JSON.stringify({ event: 'make_move', data: move }));
          }
        } else if (event === 'game_over') {
          console.log('[BotArena] Game over. Winner:', msg.data?.winner);
        }
      } catch (e) {
        console.error('[BotArena] Message error:', e.message);
      }
    });

    ws.on('error', (e) => console.error('[BotArena] WS error:', e.message));
    ws.on('close', (code) => console.log(`[BotArena] Disconnected (${code})`));
  }
}

module.exports = { BotArenaClient, registerBot };
