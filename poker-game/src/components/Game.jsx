import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PokerTable from './PokerTable';
import GameControls from './GameControls';
import MoveHistory from './MoveHistory';
import Card from '../game/Card';
import { GAME_PHASES, BIG_BLIND } from '../utils/constants';

function reviveCard(c) {
  if (!c) return c;
  const card = new Card(c.suit, c.rank);
  card.isRevealed = c.isRevealed;
  return card;
}

function deserializeState(state) {
  const revive = (cards) => cards.map(reviveCard);
  return {
    ...state,
    communityCards: revive(state.communityCards || []),
    player: { ...state.player, hand: revive(state.player.hand || []) },
    opponent: { ...state.opponent, hand: revive(state.opponent.hand || []) }
  };
}

const Game = () => {
  const [socket, setSocket] = useState(null);
  const [playerIndex, setPlayerIndex] = useState(null);
  const [rawState, setRawState] = useState(null);
  const [message, setMessage] = useState('Waiting for players...');

  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.hostname}:8080`);
    setSocket(ws);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'joined') {
        setPlayerIndex(data.playerIndex);
      } else if (data.type === 'state') {
        setRawState(deserializeState(data.state));
      }
    };

    ws.onclose = () => {
      setMessage('Connection lost');
    };

    return () => ws.close();
  }, []);

  const gameState = useMemo(() => {
    if (!rawState) return null;
    if (playerIndex === 0) {
      return { ...rawState, isPlayerTurn: rawState.currentPlayerIndex === 0 };
    } else if (playerIndex === 1) {
      return {
        ...rawState,
        player: rawState.opponent,
        opponent: rawState.player,
        isPlayerTurn: rawState.currentPlayerIndex === 1
      };
    }
    return rawState;
  }, [rawState, playerIndex]);

  const handlePlayerAction = useCallback((action, amount) => {
    if (!socket) return;
    socket.send(JSON.stringify({ type: 'action', action, amount }));
  }, [socket]);

  const startNewHand = useCallback(() => {
    socket?.send(JSON.stringify({ type: 'start' }));
  }, [socket]);

  const resetGame = useCallback(() => {
    socket?.send(JSON.stringify({ type: 'reset' }));
  }, [socket]);

  useEffect(() => {
    if (!gameState) return;
    if (gameState.phase === GAME_PHASES.SHOWDOWN) {
      const isFold = gameState.winnerHand?.name?.includes('folded');
      if (gameState.winner === 'player') {
        setMessage(
          isFold
            ? `You win! Opponent folded. +$${gameState.lastPot}`
            : `You win with ${gameState.winnerHand?.name}! +$${gameState.lastPot}`
        );
      } else if (gameState.winner === 'opponent') {
        setMessage(
          isFold
            ? `Opponent wins - you folded. -$${gameState.lastPot}`
            : `Opponent wins with ${gameState.winnerHand?.name}. -$${gameState.lastPot}`
        );
      } else {
        setMessage(`Split pot with ${gameState.winnerHand?.name}.`);
      }
    } else if (gameState.phase === GAME_PHASES.WAITING) {
      setMessage('Waiting for new hand...');
    } else {
      setMessage('Game in progress');
    }
  }, [gameState]);

  if (!gameState) {
    return <div className="text-white p-4">{message}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="bg-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Texas Hold'em Poker</h1>
          <div className="flex gap-4">
            <div className="text-white">
              <span className="text-gray-400">{gameState.player.name}: </span>
              <span className="font-bold">${gameState.player.chips}</span>
            </div>
            <div className="text-white">
              <span className="text-gray-400">{gameState.opponent.name}: </span>
              <span className="font-bold">${gameState.opponent.chips}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-7xl flex gap-4">
          <div className="flex-1">
            <div className="bg-gray-800 rounded-lg p-2 mb-4 text-center">
              <p className="text-white text-lg">{message}</p>
              {gameState.phase !== GAME_PHASES.WAITING && (
                <p className="text-gray-400 text-sm mt-1">
                  Phase: {gameState.phase} | Pot: ${gameState.pot}
                </p>
              )}
            </div>

            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <PokerTable gameState={gameState} />
            </div>

            <div className="flex flex-col gap-4">
              {gameState.phase === GAME_PHASES.WAITING || gameState.phase === GAME_PHASES.SHOWDOWN ? (
                <div className="flex justify-center gap-4">
                  <button
                    onClick={startNewHand}
                    disabled={gameState.isGameOver}
                    className="btn-primary disabled:opacity-50"
                  >
                    Deal New Hand
                  </button>
                  {gameState.isGameOver && (
                    <button
                      onClick={resetGame}
                      className="btn-secondary"
                    >
                      Reset Game
                    </button>
                  )}
                </div>
              ) : (
                <GameControls
                  gameState={gameState}
                  onAction={handlePlayerAction}
                  disabled={!gameState.isPlayerTurn}
                  currentBet={gameState.currentBet}
                  playerChips={gameState.player.chips}
                  minRaise={gameState.currentBet + BIG_BLIND}
                />
              )}

              {gameState.phase === GAME_PHASES.SHOWDOWN && gameState.winnerHand && (
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-white">
                      Showdown Results
                    </h3>
                    {gameState.winnerHand.name?.includes('folded') ? (
                      <p className="text-yellow-400 text-lg mt-2">
                        {gameState.winner === 'player' ? `${gameState.opponent.name} folded` : `${gameState.player.name} folded`}
                      </p>
                    ) : gameState.winner === 'tie' ? (
                      <p className="text-yellow-400 text-lg mt-2">
                        Split Pot - Both have {gameState.winnerHand.name}
                      </p>
                    ) : (
                      <p className="text-yellow-400 text-lg mt-2">
                        {gameState.winner === 'player' ? `${gameState.player.name} wins` : `${gameState.opponent.name} wins`} with {gameState.winnerHand.name}!
                      </p>
                    )}
                  </div>

                  {!gameState.player.hasFolded && !gameState.opponent.hasFolded && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <h4 className="font-bold text-white mb-2">{gameState.player.name}'s Hand</h4>
                        <div className="flex justify-center gap-2">
                          {gameState.player.hand.map((card, idx) => (
                            <div key={idx} className="text-white bg-gray-600 px-2 py-1 rounded">
                              {card.toString()}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="text-center">
                        <h4 className="font-bold text-white mb-2">{gameState.opponent.name}'s Hand</h4>
                        <div className="flex justify-center gap-2">
                          {gameState.opponent.hand.map((card, idx) => (
                            <div key={idx} className="text-white bg-gray-600 px-2 py-1 rounded">
                              {card.toString()}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="w-80">
            <MoveHistory moves={gameState.moveHistory} />
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 p-4 text-center text-gray-400">
        <p>♠️ ♥️ ♣️ ♦️ Texas Hold'em Poker - Player vs Player ♦️ ♣️ ♥️ ♠️</p>
      </footer>
    </div>
  );
};

export default Game;
