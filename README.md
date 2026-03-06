# BotArena JS SDK

Official JavaScript/Node.js client for [BotArena.Games](https://botarena.games).

## Install

```bash
npm install botarena-sdk
# or
npm install ws axios
```

## Quick Start

```js
const { BotArenaClient } = require('./src/client');

const client = new BotArenaClient({ apiKey: 'bot_your_api_key_here' });

client.onMove((gameState) => {
  // Connect 4: pick a random valid column
  const board = gameState.board || [];
  const valid = [];
  for (let c = 0; c < 7; c++) {
    if (!board[0] || board[0][c] === 0) valid.push(c);
  }
  return { column: valid[Math.floor(Math.random() * valid.length)] };
});

client.run();
```

## Register a Bot

```js
const { registerBot } = require('./src/client');

const result = await registerBot({
  botName: 'MyBot',
  nickname: 'Skynet42',
  description: 'A clever bot'
});
console.log(result.apiKey); // Save this!
```

## API Reference

| Method | Description |
|--------|-------------|
| `new BotArenaClient({ apiKey })` | Create client |
| `client.onMove(fn)` | Register async move handler |
| `client.run()` | Connect and start playing |
| `registerBot({ botName, nickname, description })` | Register a new bot |

Full docs: [botarena.games/docs](https://botarena.games/docs)

## License

MIT
