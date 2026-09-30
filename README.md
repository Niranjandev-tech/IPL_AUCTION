# 🏏 IPL Live Multiplayer Auction Room Web Application

An enterprise-grade, broadcast-style **IPL Live Multiplayer Auction Room** built with **React 19, TypeScript, Vite, Tailwind CSS, Express, and Socket.io**.

Designed for high-concurrency multiplayer cricket auctions with real player career statistics, atomic server-side mutex bidding, RTM (Right-to-Match) flows, Purse safety validation, host controls, and summary exports (PDF & CSV).

---

## 🌟 Key Features

### 1. 🎨 Broadcast Visual Aesthetics
- **True Black Dark Mode**: Core page background `#000000`, studio card surfaces `#0A0A0A`, neutral borders `#262626`, and polished gold/yellow accents (`#FFB800` / `#EAB308`).
- **Zero Navy/Slate/Cyan Remnants**: Completely clean contrast with high-legibility broadcast typography.
- **Custom Player Avatars**: High-contrast initials, role indicators, overseas flags, and previous franchise colors (zero generic stadium placeholders).

### 2. 📊 Real 677-Player Open-Source Data Pipeline
- Built using **1,243 Cricsheet IPL matches** (ball-by-ball open-source dataset).
- **Exact Career Statistics**: Real matches, runs, batting average, strike rate, wickets, economy rate, highest score, and best bowling figures.
- **Dynamic Auction Sets**: Categorized into Marquee 1, Marquee 2, Capped Batter/Bowler/All-rounder/Wicketkeeper, and Uncapped sets.
- **Single Season Configuration**: Centralized `IPL_SEASON = 'IPL 2025'` constant across all views.

### 3. ⚡ Server-Authoritative Real-Time Bidding Engine
- **Socket.io + Express Server**: Atomic mutex bid processing (`server/server.js`) on port 4000 to eliminate race conditions.
- **Purse & Squad Safety Enforcement**:
  - Minimum 18 & Maximum 25 players per squad.
  - Maximum 8 overseas players.
  - Automatic purse reservation lock for mandatory minimum remaining squad slots (₹30 Lakhs per unfilled slot).
- **Anti-Snipe Timer**: Extends bidding window automatically when bids occur within the final 5 seconds.
- **Authoritative Server Timer Loop**: Ticks every 1 second; automatically handles Sold/Unsold/RTM triggers.

### 4. 🎛️ Host & Manager Controls
- **Spectator / Auctioneer Host Mode**: Host can run the auction room without being forced to claim a franchise.
- **Host Action Bar**: Pause/Resume lot, Nominate specific player or category, Undo last bid, Force Sold/Unsold/Skip, and Approve pending managers.

### 5. 🔁 Interactive RTM (Right to Match) Flow
- Triggers automatically when a player lot ends if their previous IPL franchise has RTM cards remaining and wasn't the highest bidder.

### 6. 📄 Official Summary & Export System
- **Detailed Results View**: Breakdown of top 5 buys, spent purse per franchise, and full squad rosters.
- **One-Click Exports**: Instant PDF report generation (`jspdf` + `html2canvas`) and CSV squad export.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **Python**: 3.9+ (only if refreshing player statistics from raw Cricsheet data)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Socket.io Backend Server Engine
```bash
node server/server.js
```
*Server will start on http://localhost:4000*

### 3. Start the Vite Frontend Server
In a separate terminal tab:
```bash
npm run dev
```
*Frontend will open on http://localhost:5173*

---

## 🤖 Running the 10-Bot Auction Simulator

Test high-concurrency real-time bidding across 10 automated team managers (CSK, MI, RCB, KKR, RR, SRH, DC, PBKS, LSG, GT):

```bash
node scripts/simulate_auction.js
```
The bots connect via Socket.io to `http://localhost:4000`, place real-time atomic bids on the 677-player pool, handle budget limits, and output live auction statistics.

---

## 🔄 Refreshing Player Data Pipeline

To re-process raw ball-by-ball Cricsheet IPL matches and regenerate `src/data/samplePlayerPool.json`:

```bash
python scripts/generate_players_pool.py
```

---

## 🛠️ Project Architecture

```
ipl-auction/
├── src/
│   ├── components/
│   │   ├── auction/           # Live Auction Room, PlayerCard, HostActionBar, RTMBanner, AuctionResultsView
│   │   ├── auth/              # Guest & Email Auth Modal
│   │   ├── chat/              # Live Room Chat Panel
│   │   ├── common/            # Header, PlayerAvatar
│   │   ├── dashboard/         # Active Rooms & Room Creation Modal
│   │   └── lobby/             # Host Approval Queue & Franchise Picker
│   ├── config/                # Central IPL_SEASON constant
│   ├── context/               # AuthContext & RoomContext (Socket + Local state)
│   ├── data/                  # franchises.ts & samplePlayerPool.json (677 Players)
│   ├── lib/                   # socketClient.ts & rulesEngine.ts
│   └── types/                 # TypeScript type definitions for Auction domain
├── server/
│   ├── server.js              # Express + Socket.io Server Engine
│   ├── db.js                  # Persistent in-memory room store
│   └── rules.js               # Server-side purse & bid increment validation
├── scripts/
│   ├── generate_players_pool.py # Cricsheet open-source data parsing pipeline
│   └── simulate_auction.js    # Multi-bot stress testing script
```

---

## 📜 Build Verification

To verify TypeScript types and build the production bundle:

```bash
npx tsc --noEmit
npm run build
```
Production output will be generated in `dist/`.
