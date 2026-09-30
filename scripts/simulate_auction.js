import { io } from 'socket.io-client';
import fs from 'fs';
import path from 'path';

const samplePlayers = JSON.parse(fs.readFileSync('./src/data/samplePlayerPool.json', 'utf-8'));

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:4000';
const ROOM_CODE = 'IPL-SIM1';

console.log('===================================================');
console.log('🤖 STARTING IPL AUCTION MULTI-BOT SIMULATOR');
console.log(`Connecting to Server Engine at ${SERVER_URL}...`);
console.log('===================================================');

const socket = io(SERVER_URL, { transports: ['websocket', 'polling'] });

const BOTS = [
  { id: 'bot-csk', code: 'CSK', name: 'Chennai Super Kings', strategy: 'balanced', maxBidRatio: 0.30 },
  { id: 'bot-mi', code: 'MI', name: 'Mumbai Indians', strategy: 'aggressive', maxBidRatio: 0.40 },
  { id: 'bot-rcb', code: 'RCB', name: 'Royal Challengers Bengaluru', strategy: 'star_focused', maxBidRatio: 0.45 },
  { id: 'bot-kkr', code: 'KKR', name: 'Kolkata Knight Riders', strategy: 'spin_allrounder', maxBidRatio: 0.35 },
  { id: 'bot-rr', code: 'RR', name: 'Rajasthan Royals', strategy: 'young_uncapped', maxBidRatio: 0.25 },
  { id: 'bot-srh', code: 'SRH', name: 'Sunrisers Hyderabad', strategy: 'pace_power', maxBidRatio: 0.35 },
  { id: 'bot-dc', code: 'DC', name: 'Delhi Capitals', strategy: 'balanced', maxBidRatio: 0.30 },
  { id: 'bot-pk', code: 'PBKS', name: 'Punjab Kings', strategy: 'budget_saver', maxBidRatio: 0.25 },
  { id: 'bot-lsg', code: 'LSG', name: 'Lucknow Super Giants', strategy: 'allrounder_heavy', maxBidRatio: 0.35 },
  { id: 'bot-gt', code: 'GT', name: 'Gujarat Titans', strategy: 'balanced', maxBidRatio: 0.30 },
];

let lastState = null;
let bidTimer = null;

socket.on('connect', () => {
  console.log(`✅ Socket Connected as Simulator Client ID: ${socket.id}`);

  // Create initial simulation room
  const initialRoom = {
    id: 'room-sim-1',
    code: ROOM_CODE,
    name: 'IPL 2025 Mega Simulation Room',
    host_id: 'host-sim-1',
    status: 'live',
    current_player_id: samplePlayers[0].id,
    current_bidder_id: null,
    current_bid_amount: 0,
    mode: 'auto',
    lot_ends_at: new Date(Date.now() + 15000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const initialSettings = {
    room_id: 'room-sim-1',
    total_purse_lakhs: 12000, // 120 Cr
    min_squad: 18,
    max_squad: 25,
    max_overseas: 8,
    timer_duration_sec: 15,
    rtm_enabled: true,
    bid_increments: [
      { up_to_lakh: 100, increment_lakh: 5 },
      { up_to_lakh: 500, increment_lakh: 10 },
      { up_to_lakh: 1000, increment_lakh: 25 },
      { up_to_lakh: 100000, increment_lakh: 50 },
    ],
    anti_snipe_enabled: true,
    anti_snipe_extend_sec: 10,
  };

  const initialTeams = BOTS.map((b) => ({
    id: b.id,
    room_id: 'room-sim-1',
    user_id: b.id,
    franchise_code: b.code,
    franchise_name: b.name,
    primary_color: '#FFB800',
    secondary_color: '#000000',
    logo_url: '🏏',
    remaining_purse_lakhs: 12000,
    rtm_cards_remaining: 6,
    is_approved: true,
    is_spectator: false,
  }));

  const initialPlayers = samplePlayers.map((p, idx) => ({
    ...p,
    room_id: 'room-sim-1',
    status: idx === 0 ? 'nominated' : 'pending',
  }));

  const initialChat = [
    {
      id: `msg-${Date.now()}`,
      room_id: 'room-sim-1',
      sender_name: 'AUCTIONEER',
      message: `🚀 SIMULATOR ENGINE INITIALIZED with 10 BOTS & ${initialPlayers.length} PLAYERS!`,
      is_system_msg: true,
      created_at: new Date().toISOString(),
    },
  ];

  console.log(`📢 Emitting CREATE_ROOM for ${ROOM_CODE} (${initialPlayers.length} players pool)...`);
  socket.emit('CREATE_ROOM', {
    room: initialRoom,
    settings: initialSettings,
    players: initialPlayers,
    teams: initialTeams,
    chatMessages: initialChat,
  });
});

socket.on('STATE_SYNC', (bundle) => {
  lastState = bundle;
  const { room, players, teams, bids } = bundle;

  const soldCount = players.filter((p) => p.status === 'sold').length;
  const unsoldCount = players.filter((p) => p.status === 'unsold').length;
  const currentPlayer = players.find((p) => p.id === room.current_player_id);

  console.log(
    `\n[SYNC] Status: ${room.status.toUpperCase()} | Sold: ${soldCount} | Unsold: ${unsoldCount} | Total Bids: ${bids.length}`
  );

  if (room.status === 'completed') {
    console.log('\n🏆 AUCTION SIMULATION COMPLETED SUCCESSFULLY!');
    console.log('===================================================');
    teams.forEach((t) => {
      const bought = players.filter((p) => p.sold_to_team_id === t.id);
      const spent = bought.reduce((acc, p) => acc + (p.sold_price_lakh || 0), 0);
      console.log(
        `• ${t.franchise_name} (${t.franchise_code}): ${bought.length} Players Bought | Spent: ₹${(spent / 100).toFixed(2)} Cr | Purse Left: ₹${(t.remaining_purse_lakhs / 100).toFixed(2)} Cr`
      );
    });
    console.log('===================================================');
    process.exit(0);
  }

  if (room.status === 'live' && currentPlayer) {
    scheduleNextBotBid(bundle);
  }
});

function scheduleNextBotBid(bundle) {
  if (bidTimer) clearTimeout(bidTimer);

  const { room, players, teams } = bundle;
  const currentPlayer = players.find((p) => p.id === room.current_player_id);
  if (!currentPlayer) return;

  // Pick random delay between 500ms and 2000ms
  const delay = Math.floor(Math.random() * 1500) + 500;

  bidTimer = setTimeout(() => {
    // Pick eligible bot
    const eligibleBots = BOTS.filter((bot) => {
      const teamState = teams.find((t) => t.id === bot.id);
      if (!teamState) return false;
      if (room.current_bidder_id === bot.id) return false; // Already leading

      const bought = players.filter((p) => p.sold_to_team_id === bot.id);
      const overseas = bought.filter((p) => p.is_overseas).length;

      if (bought.length >= 25) return false;
      if (currentPlayer.is_overseas && overseas >= 8) return false;

      const currentBid = room.current_bid_amount;
      const nextBid = currentBid === 0 ? currentPlayer.base_price_lakh : currentBid + 25;
      const maxAllowedBid = teamState.remaining_purse_lakhs * bot.maxBidRatio;

      return nextBid <= teamState.remaining_purse_lakhs && nextBid <= maxAllowedBid;
    });

    if (eligibleBots.length > 0) {
      const chosenBot = eligibleBots[Math.floor(Math.random() * eligibleBots.length)];
      const currentBid = room.current_bid_amount;
      const nextBid = currentBid === 0 ? currentPlayer.base_price_lakh : currentBid + 25;

      console.log(`⚡ BOT BID: ${chosenBot.name} bidding ₹${nextBid} Lakhs for ${currentPlayer.name}`);

      socket.emit('PLACE_BID', {
        roomCode: ROOM_CODE,
        teamId: chosenBot.id,
        amountLakh: nextBid,
      });
    }
  }, delay);
}
