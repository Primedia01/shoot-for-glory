# FIFA World Cup 2026 DOOH Campaign

## Overview
Interactive web-based prototypes simulating mobile-to-screen synchronization for stadium/mall activations during the FIFA World Cup 2026. The flagship experience is "Shoot for Glory" — a penalty shootout game where players scan a QR code on a billboard, open their phone controller, register, take 3 penalty shots, and see results live on the big screen.

## Architecture
- **Frontend**: React + Vite + TailwindCSS + Framer Motion + wouter routing
- **Backend**: Express.js with WebSocket (ws) for real-time sync
- **Storage**: PostgreSQL via Drizzle ORM — game scores persisted for global leaderboard
- **Real-time**: WebSocket room-based system for phone-to-billboard sync + global leaderboard broadcasts

## Pages / Routes
| Route | Purpose |
|-------|---------|
| `/` | Billboard display (same as /screen) — FIFA World Cup 2026 themed big screen |
| `/screen` | Billboard display — shows on the big screen, generates QR code |
| `/mobile` | Mobile controller — opened on phone, swipe-to-shoot interface |

## User Journey (Mobile)
1. **Scan** — Shopper scans QR code on billboard screen
2. **Register** — Enter name, mobile number, province (SA dropdown), optional consent opt-in
3. **Play** — 3 swipe attempts; direction + speed determines trajectory; AI goalkeeper responds
4. **Live Screen** — Player name appears on billboard; shot animation synced live; score on leaderboard
5. **Game Over** — Final score, global leaderboard rank, prize messaging
6. **Win** — Highest score in 2-hour prize window wins grand prize; spot prizes during activation

## Database Schema
- `game_scores` — Persisted completed game results: playerName, mobile, province, totalPoints, shotsScored, totalShots, createdAt
- `players` / `shots` — Legacy tables (defined but not actively used)

## WebSocket Protocol
- Billboard sends `create_room` → receives `room_created` with roomCode + globalLeaderboard
- Mobile sends `join_room` with playerName, mobile, province, consent → receives `joined` with maxShots=3 + globalLeaderboard
- Mobile sends `shoot` → receives `shot_result` with shotsRemaining, shotNumber, totalScore
- After 3rd shot: score saved to DB, server sends `game_over` to mobile and `player_finished` to billboard (both include globalLeaderboard)
- `global_leaderboard_update` broadcast to all connected billboards and mobiles after each game completes
- Server enforces MAX_SHOTS=3 per player

## Key Files
- `client/src/pages/MobileController.tsx` — Phone: registration → 3-shot game → game over with global leaderboard
- `client/src/pages/BillboardScreen.tsx` — Billboard with QR code, sponsor branding, global leaderboard, shot tracking
- `client/src/components/GoalCelebration.tsx` — Confetti + ring burst animation
- `client/src/components/Goalie.tsx` — Virtual goalkeeper with diving animations, brandable jersey (jerseyColor, jerseyAccent, jerseyText props)
- `client/src/components/StadiumBackground.tsx` — SVG illustrated stadium with pixel-mosaic crowd, goal with netting, configurable sponsor panels + ad board
- `server/websocket.ts` — WebSocket room manager with 3-shot mechanic + global leaderboard broadcasts
- `server/routes.ts` — REST API endpoints (`/api/leaderboard`) + WebSocket setup
- `server/storage.ts` — DatabaseStorage using Drizzle ORM for game scores + global leaderboard
- `server/db.ts` — PostgreSQL connection pool via Drizzle
- `shared/schema.ts` — Drizzle schema (gameScores, players, shots tables)
- `client/src/index.css` — FIFA World Cup 2026 theme with custom CSS classes

## Stadium Sponsor Zones
The `StadiumBackground` component accepts configurable sponsor props:
- **Left panel** — Large side panel left of goal (`leftPanel: { text, bgColor, textColor }`)
- **Right panel** — Large side panel right of goal (`rightPanel: { text, bgColor, textColor }`)
- **Ad board strip** — Horizontal LED-style board across the pitch with multiple sponsor names (`adBoardSponsors: string[]`)
- **Goalkeeper jersey** — Brandable via `jerseyColor`, `jerseyAccent`, `jerseyText` props on the Goalie component

## Theme: FIFA World Cup 2026
- Dark navy background (#1a0e30), maroon (#56042C), gold (#D4A843)
- Fonts: Bebas Neue (display/headings), Teko, Inter (body)
- CSS classes: `fifa-gradient-text`, `fifa-gradient-bg`
- SVG illustrated stadium background with pixel-mosaic crowd, flat 2D goal with white posts and grid netting

## Dependencies
- framer-motion (swipe gestures + animations)
- qrcode.react (QR code generation on billboard)
- ws (WebSocket server)
- drizzle-orm + pg (PostgreSQL ORM + driver)
- @tanstack/react-query (data fetching)
- wouter (client-side routing)
- lucide-react (icons)
- nanoid (unique player IDs)

## Static Assets
- `client/public/soccer-ball.png` — Soccer ball sprite

## Critical Notes
- Cannot edit `server/vite.ts` — `process.exit(1)` in Vite error logger causes crashes; workflow uses `while true; do npm run dev; done`
- SA provinces: Eastern Cape, Free State, Gauteng, KwaZulu-Natal, Limpopo, Mpumalanga, North West, Northern Cape, Western Cape
- Global leaderboard persists across server restarts (PostgreSQL-backed)
- Billboard idle state shows "3 SHOTS TO WIN" and "PRIZES AWARDED EVERY 2 HOURS" above the goalkeeper
