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
| `/` | Split-screen demo (phone simulator + billboard in one view) |
| `/screen` | Billboard display — shows on the big screen, generates QR code |
| `/mobile` | Mobile controller — opened on phone, swipe-to-shoot interface |

## Two-Device Sync Flow
1. Open `/screen` on the billboard display — it creates a WebSocket room and shows a QR code
2. Scan QR code (or open `/mobile?room=XXXX`) on your phone
3. Enter your name and join the game
4. Swipe up on the phone to shoot — the ball animates on the billboard in real-time
5. Leaderboard updates live on both screens

## Key Files
- `client/src/pages/ShootForGlory.tsx` — Original split-screen prototype
- `client/src/pages/MobileController.tsx` — Phone swipe interface
- `client/src/pages/BillboardScreen.tsx` — Billboard with QR code + goal animations
- `server/websocket.ts` — WebSocket room manager (create/join/shoot protocol)
- `server/routes.ts` — REST API endpoints + WebSocket setup
- `server/storage.ts` — In-memory storage for players/shots/leaderboard
- `shared/schema.ts` — Drizzle schema (players, shots tables)
- `client/src/index.css` — Neon Arena theme (dark + green neon accents)

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
