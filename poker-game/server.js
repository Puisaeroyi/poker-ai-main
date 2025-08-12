import { WebSocketServer } from 'ws';
import GameState from './src/game/GameState.js';
import { GAME_PHASES } from './src/utils/constants.js';

const wss = new WebSocketServer({ port: 8080 });
const game = new GameState();
const players = [];

function broadcast(message) {
  const data = JSON.stringify(message);
  players.forEach(ws => {
    if (ws.readyState === ws.OPEN) {
      ws.send(data);
    }
  });
}

wss.on('connection', (ws) => {
  if (players.length >= 2) {
    ws.send(JSON.stringify({ type: 'error', message: 'Game full' }));
    ws.close();
    return;
  }

  const playerIndex = players.length;
  players.push(ws);
  ws.send(JSON.stringify({ type: 'joined', playerIndex }));

  if (players.length === 2) {
    game.startNewHand();
    broadcast({ type: 'state', state: game.getState() });
  }

  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch {
      return;
    }

    if (data.type === 'action') {
      if (playerIndex !== game.currentPlayerIndex) return;
      const success = game.handlePlayerAction(data.action, data.amount || 0);
      if (success) {
        broadcast({ type: 'state', state: game.getState() });
      }
    } else if (data.type === 'start') {
      if (players.length === 2 && game.phase === GAME_PHASES.WAITING) {
        game.startNewHand();
        broadcast({ type: 'state', state: game.getState() });
      }
    } else if (data.type === 'reset') {
      game.reset();
      broadcast({ type: 'state', state: game.getState() });
    }
  });

  ws.on('close', () => {
    const index = players.indexOf(ws);
    if (index !== -1) {
      players.splice(index, 1);
    }
    game.reset();
    broadcast({ type: 'state', state: game.getState() });
  });
});

console.log('Poker server running on ws://localhost:8080');
