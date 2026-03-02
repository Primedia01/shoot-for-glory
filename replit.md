# FIFA World Cup 2026 DOOH Campaign

## Overview
Interactive web-based prototypes simulating mobile-to-screen synchronization for stadium/mall activations during the FIFA World Cup 2026. The flagship experience is "Shoot for Glory" — a penalty shootout game.

## Architecture
- **Frontend**: React + Vite + TailwindCSS + Framer Motion + wouter routing
- **Backend**: Express.js with WebSocket (ws) for real-time sync
- **Storage**: In-memory (MemStorage) for prototype speed; PostgreSQL schema defined but not active
- **Real-time**: WebSocket room-based system for phone-to-billboard sync

## Pages / Routes
| Route | Purpose |
|-------|---------|
| `/` | Billboard display (same as /screen) — FIFA World Cup 2026 themed big screen |
| `/screen` | Billboard display — shows on the big screen, generates QR code |
| `/mobile` | Mobile controller — opened on phone, swipe-to-shoot interface |

## User Journey (Mobile)
1. **Scan** — Shopper scans QR code on billboard screen
2. **Register** — Enter name, mobile number, province (dropdown), optional consent opt-in
3. **Play** — 3 swipe attempts; direction + speed determines trajectory; AI goalkeeper responds
4. **Live Screen** — Player name appears on billboard; shot animation synced live; score on leaderboard
5. **Game Over** — Final score, leaderboard rank, prize messaging
6. **Win** — Highest score in 2-hour prize window wins grand prize; spot prizes during activation

## WebSocket Protocol
- Billboard sends `create_room` → receives `room_created` with roomCode
- Mobile sends `join_room` with playerName, mobile, province, consent → receives `joined` with maxShots=3
- Mobile sends `shoot` → receives `shot_result` with shotsRemaining, shotNumber, totalScore
- After 3rd shot, server sends `game_over` to mobile and `player_finished` to billboard
- Server enforces MAX_SHOTS=3 per player

## Key Files
- `client/src/pages/ShootForGlory.tsx` — Original split-screen prototype
- `client/src/pages/MobileController.tsx` — Phone: registration → 3-shot game → game over
- `client/src/pages/BillboardScreen.tsx` — Billboard with QR code, branding zones, shot tracking
- `client/src/components/GoalCelebration.tsx` — Confetti + ring burst animation
- `client/src/components/Goalie.tsx` — Virtual goalkeeper with diving animations
- `server/websocket.ts` — WebSocket room manager with 3-shot mechanic
- `server/routes.ts` — REST API endpoints + WebSocket setup
- `server/storage.ts` — In-memory storage for players/shots/leaderboard
- `shared/schema.ts` — Drizzle schema (players, shots tables)
- `client/src/index.css` — Neon Arena theme (dark + green neon accents)

## Billboard Branding Zones
- Top-left: Sponsor logo placeholder ("YOUR LOGO")
- Bottom bar: Sponsored by placeholder ("YOUR BRAND")
- Prize messaging: 2-hour window, grand prize, spot prizes

## Theme: Neon Arena
- Dark stadium background with neon green (#00ff66) accents
- Fonts: Teko (display/headings), Inter (body)
- Colors defined as CSS custom properties in index.css

## Dependencies
- framer-motion (swipe gestures + animations)
- qrcode.react (QR code generation on billboard)
- ws (WebSocket server)
- @tanstack/react-query (data fetching)
- wouter (client-side routing)
- lucide-react (icons)

## Static Assets
- `client/public/stadium-bg.jpg` — Stadium background image
- `client/public/soccer-ball.png` — Soccer ball sprite
