# Texas Hold'em Poker Game

A simple Texas Hold'em poker game built with React, Tailwind CSS v3, and Canvas. Challenge a friend over a local network using a lightweight WebSocket server.

## Features

### ✅ Completed
- **Full Game Engine**: Complete Texas Hold'em rules and gameplay
- **Canvas Rendering**: Visual poker table with card animations
- **LAN Multiplayer**: Two players can battle head to head over a LAN connection
- **Betting System**: Full betting rounds (pre-flop, flop, turn, river)
- **Hand Evaluation**: Accurate poker hand ranking and comparison
- **Game State Management**: Proper game flow and state transitions
- **Responsive UI**: Clean interface with Tailwind CSS styling

## How to Play

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Start the WebSocket server**:
   ```bash
   npm run server
   ```
3. **Start the development server**:
   ```bash
   npm run dev
   ```
4. **Connect**: From another machine on the same LAN, open `http://<host-ip>:5173` in a browser. The client will automatically connect to the host's IP on port `8080`.
5. **Play**: Click "Deal New Hand" to begin. Use the controls to Fold, Check, Call, Raise, or go All In.

## Poker Hand Rankings (from highest to lowest)
1. Royal Flush
2. Straight Flush
3. Four of a Kind
4. Full House
5. Flush
6. Straight
7. Three of a Kind
8. Two Pair
9. Pair
10. High Card

## Game Controls
- **Fold**: Give up your hand and lose any bets
- **Check**: Pass the action (when no bet is required)
- **Call**: Match the current bet
- **Raise**: Increase the current bet
- **All In**: Bet all your remaining chips

## Technical Stack
- **React**: UI components and state management
- **Vite**: Build tool and development server
- **Tailwind CSS v3**: Styling and responsive design
- **Canvas API**: Card rendering and table visualization
- **JavaScript Classes**: Game logic implementation
- **ws**: WebSocket server for multiplayer

## Project Structure
```
src/
├── components/       # React components
│   ├── Game.jsx      # Main game controller
│   ├── PokerTable.jsx # Canvas table rendering
│   └── GameControls.jsx # Player action buttons
├── game/             # Game logic
│   ├── Card.js       # Card class with rendering
│   ├── Deck.js       # Deck management
│   ├── HandEvaluator.js # Hand strength evaluation
│   └── GameState.js  # Game state management
└── utils/            # Constants and helpers
    └── constants.js  # Game constants
```

## Game Rules
- Each player receives 2 hole cards
- 5 community cards are dealt (3 on flop, 1 on turn, 1 on river)
- Best 5-card hand from 7 available cards wins
- Small blind: $10, Big blind: $20
- Starting chips: $1000

Enjoy playing Texas Hold'em Poker with your friends!
