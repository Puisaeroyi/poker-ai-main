import { WebSocketServer } from 'ws';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import GameState from './src/game/GameState.js';
import { GAME_PHASES } from './src/utils/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function requestHandler(req, res) {
  if (req.method === 'GET' && req.url === '/') {
    const indexPath = path.join(__dirname, 'index.html');
    fs.readFile(indexPath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading page');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else {
    const filePath = path.join(__dirname, req.url);
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.html': 'text/html',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
      };
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(data);
    });
  }
}

const server = http.createServer(requestHandler);
const wss = new WebSocketServer({ server });
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

server.listen(8080, () => console.log('Poker server running on http://localhost:8080'));
