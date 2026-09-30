import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { db } from './db.js';
import { getBidIncrement, checkPurseSafety } from './rules.js';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 4000;

// Mutex locks per room code for atomic bid validation
const roomLocks = new Map();

function getRoomLock(code) {
  if (!roomLocks.has(code)) {
    roomLocks.set(code, Promise.resolve());
  }
  return roomLocks.get(code);
}

function setRoomLock(code, promise) {
  roomLocks.set(code, promise);
}

// Server Authoritative Timer Loop (Ticks every 1 second)
setInterval(() => {
  const now = new Date();

  for (const [code, bundle] of db.rooms.entries()) {
    if (!bundle || !bundle.room) continue;
    const { room, settings, players, teams } = bundle;

    if (room.status === 'live' && room.lot_ends_at && room.mode === 'auto') {
      const endsAt = new Date(room.lot_ends_at);
      if (now >= endsAt) {
        // Timer expired on server! Automatically trigger sold or unsold
        const currentPlayer = players.find((p) => p.id === room.current_player_id);
        const winningTeam = teams.find((t) => t.id === room.current_bidder_id);

        if (winningTeam && currentPlayer) {
          // Check RTM eligibility
          const rtmTeam = teams.find(
            (t) => t.franchise_code === currentPlayer.previous_team &&
                   t.id !== winningTeam.id &&
                   t.rtm_cards_remaining > 0
          );

          if (settings.rtm_enabled && rtmTeam) {
            // Initiate RTM State
            room.status = 'rtm';
            room.rtm_state = {
              original_team_id: rtmTeam.id,
              original_team_name: rtmTeam.franchise_name,
              winning_team_id: winningTeam.id,
              winning_bid_lakh: room.current_bid_amount,
              player_id: currentPlayer.id,
              step: 'offered_to_rtm_team',
            };
            bundle.chatMessages.push({
              id: `msg-${Date.now()}`,
              room_id: room.id,
              sender_name: 'AUCTIONEER',
              message: `🚨 RTM OPTION! ${rtmTeam.franchise_name} has option to match bid of ₹${(room.current_bid_amount / 100).toFixed(2)} Cr for ${currentPlayer.name}!`,
              is_system_msg: true,
              created_at: new Date().toISOString(),
            });
          } else {
            // Direct Sold
            executeSoldPlayer(bundle, winningTeam, currentPlayer);
          }
        } else if (currentPlayer) {
          executeUnsoldPlayer(bundle, currentPlayer);
        }

        db.saveRoom(code, bundle);
        io.to(code).emit('STATE_SYNC', bundle);
      }
    }
  }
}, 1000);

function executeSoldPlayer(bundle, winningTeam, currentPlayer) {
  const { room, players, teams, chatMessages, settings } = bundle;
  const winningPrice = room.current_bid_amount;

  // Deduct purse
  const targetTeam = teams.find((t) => t.id === winningTeam.id);
  if (targetTeam) {
    targetTeam.remaining_purse_lakhs -= winningPrice;
  }

  // Mark player sold
  const targetPlayer = players.find((p) => p.id === currentPlayer.id);
  if (targetPlayer) {
    targetPlayer.status = 'sold';
    targetPlayer.sold_to_team_id = winningTeam.id;
    targetPlayer.sold_price_lakh = winningPrice;
  }

  chatMessages.push({
    id: `msg-${Date.now()}`,
    room_id: room.id,
    sender_name: 'AUCTIONEER',
    message: `🔨 SOLD! ${currentPlayer.name} (${currentPlayer.role}) sold to ${winningTeam.franchise_name} for ₹${(winningPrice / 100).toFixed(2)} Cr!`,
    is_system_msg: true,
    created_at: new Date().toISOString(),
  });

  const nextPlayer = players.find((p) => p.status === 'pending');
  if (nextPlayer) {
    nextPlayer.status = 'nominated';
    room.status = 'live';
    room.current_player_id = nextPlayer.id;
    room.current_bidder_id = null;
    room.current_bid_amount = 0;
    room.rtm_state = null;
    room.lot_ends_at = new Date(Date.now() + (settings.timer_duration_sec || 30) * 1000).toISOString();
  } else {
    room.status = 'completed';
    room.current_player_id = null;
    room.current_bidder_id = null;
    room.current_bid_amount = 0;
    room.rtm_state = null;
  }
}

function executeUnsoldPlayer(bundle, currentPlayer) {
  const { room, players, chatMessages, settings } = bundle;

  const targetPlayer = players.find((p) => p.id === currentPlayer.id);
  if (targetPlayer) {
    targetPlayer.status = 'unsold';
  }

  chatMessages.push({
    id: `msg-${Date.now()}`,
    room_id: room.id,
    sender_name: 'AUCTIONEER',
    message: `❌ UNSOLD! ${currentPlayer.name} goes unsold.`,
    is_system_msg: true,
    created_at: new Date().toISOString(),
  });

  const nextPlayer = players.find((p) => p.status === 'pending');
  if (nextPlayer) {
    nextPlayer.status = 'nominated';
    room.status = 'live';
    room.current_player_id = nextPlayer.id;
    room.current_bidder_id = null;
    room.current_bid_amount = 0;
    room.rtm_state = null;
    room.lot_ends_at = new Date(Date.now() + (settings.timer_duration_sec || 30) * 1000).toISOString();
  } else {
    room.status = 'completed';
    room.current_player_id = null;
    room.current_bidder_id = null;
    room.current_bid_amount = 0;
    room.rtm_state = null;
  }
}

// REST API Health Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', active_rooms: db.rooms.size, timestamp: new Date().toISOString() });
});

// Socket.io Real-time Event Handlers
io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // 1. Join Room & Resync State
  socket.on('JOIN_ROOM', ({ code, userId }) => {
    if (!code) return;
    const formattedCode = code.trim().toUpperCase();
    socket.join(formattedCode);

    const bundle = db.getRoom(formattedCode);
    if (bundle) {
      socket.emit('STATE_SYNC', bundle);
      console.log(`[Socket] Client ${socket.id} joined room ${formattedCode}`);
    }
  });

  // 2. CREATE_ROOM
  socket.on('CREATE_ROOM', ({ room, settings, players, teams, chatMessages }, callback) => {
    const code = room.code.trim().toUpperCase();
    const bundle = { room, settings, players, teams, chatMessages, bids: [] };
    db.saveRoom(code, bundle);
    socket.join(code);
    io.to(code).emit('STATE_SYNC', bundle);
    if (callback) callback({ success: true, code });
  });

  // 3. ATOMIC PLACE_BID
  socket.on('PLACE_BID', async ({ roomCode, teamId, amountLakh }, callback) => {
    const code = roomCode.trim().toUpperCase();
    const lock = getRoomLock(code);

    const nextLock = lock.then(async () => {
      const bundle = db.getRoom(code);
      if (!bundle) {
        if (callback) callback({ success: false, error: 'Room not found' });
        return;
      }

      const { room, settings, players, teams, bids } = bundle;
      const currentPlayer = players.find((p) => p.id === room.current_player_id);
      const team = teams.find((t) => t.id === teamId);

      // Validation Checks
      if (room.status !== 'live') {
        if (callback) callback({ success: false, error: 'Auction room is not live' });
        return;
      }
      if (!team || !team.is_approved || team.is_spectator) {
        if (callback) callback({ success: false, error: 'Team not approved to bid' });
        return;
      }
      if (room.current_bidder_id === teamId) {
        if (callback) callback({ success: false, error: 'Your team is already leading' });
        return;
      }

      const squadCount = players.filter((p) => p.sold_to_team_id === teamId).length;
      const overseasCount = players.filter((p) => p.sold_to_team_id === teamId && p.is_overseas).length;

      if (squadCount + 1 > settings.max_squad) {
        if (callback) callback({ success: false, error: `Squad limit of ${settings.max_squad} players reached` });
        return;
      }

      if (currentPlayer && currentPlayer.is_overseas && overseasCount + 1 > settings.max_overseas) {
        if (callback) callback({ success: false, error: `Overseas limit of ${settings.max_overseas} reached` });
        return;
      }

      const purseSafety = checkPurseSafety(
        team.remaining_purse_lakhs,
        amountLakh,
        squadCount,
        settings.min_squad,
        30
      );

      if (!purseSafety.safe) {
        if (callback) callback({ success: false, error: purseSafety.message });
        return;
      }

      // Valid Bid! Update State
      const now = new Date();
      let newEnd = room.lot_ends_at ? new Date(room.lot_ends_at) : new Date(now.getTime() + 30000);
      if (settings.anti_snipe_enabled && newEnd.getTime() - now.getTime() < 5000) {
        newEnd = new Date(now.getTime() + settings.anti_snipe_extend_sec * 1000);
      }

      room.current_bidder_id = teamId;
      room.current_bid_amount = amountLakh;
      room.lot_ends_at = newEnd.toISOString();
      room.updated_at = now.toISOString();

      const newBid = {
        id: `bid-${Date.now()}`,
        room_id: room.id,
        player_id: currentPlayer.id,
        team_id: teamId,
        amount_lakh: amountLakh,
        created_at: now.toISOString(),
        team,
      };

      bundle.bids.unshift(newBid);
      db.saveRoom(code, bundle);

      io.to(code).emit('STATE_SYNC', bundle);
      if (callback) callback({ success: true });
    });

    setRoomLock(code, nextLock);
  });

  // 4. HOST ACTIONS (Pause, Resume, Sold, Unsold, Skip, Undo, Nominate)
  socket.on('HOST_ACTION', async ({ roomCode, action, payload }, callback) => {
    const code = roomCode.trim().toUpperCase();
    const bundle = db.getRoom(code);
    if (!bundle) return;

    const { room, players, teams, bids, chatMessages, settings } = bundle;
    const currentPlayer = players.find((p) => p.id === room.current_player_id);

    if (action === 'TOGGLE_PAUSE') {
      room.status = room.status === 'paused' ? 'live' : 'paused';
    } else if (action === 'SOLD_PLAYER') {
      const winningTeam = teams.find((t) => t.id === room.current_bidder_id);
      if (winningTeam && currentPlayer) {
        executeSoldPlayer(bundle, winningTeam, currentPlayer);
      }
    } else if (action === 'UNSOLD_PLAYER' || action === 'SKIP_PLAYER') {
      if (currentPlayer) {
        executeUnsoldPlayer(bundle, currentPlayer);
      }
    } else if (action === 'UNDO_BID') {
      if (bids.length > 0) {
        bids.shift();
        const prevBid = bids[0];
        room.current_bidder_id = prevBid ? prevBid.team_id : null;
        room.current_bid_amount = prevBid ? prevBid.amount_lakh : 0;
      }
    } else if (action === 'NOMINATE_PLAYER') {
      const targetId = payload.playerId;
      const target = players.find((p) => p.id === targetId);
      if (target) {
        players.forEach((p) => {
          if (p.id === targetId) p.status = 'nominated';
          else if (p.status === 'nominated') p.status = 'pending';
        });

        room.status = 'live';
        room.current_player_id = target.id;
        room.current_bidder_id = null;
        room.current_bid_amount = 0;
        room.rtm_state = null;
        room.lot_ends_at = new Date(Date.now() + (settings.timer_duration_sec || 30) * 1000).toISOString();

        chatMessages.push({
          id: `msg-${Date.now()}`,
          room_id: room.id,
          sender_name: 'AUCTIONEER',
          message: `📢 HOST NOMINATED: ${target.name} (${target.role} • ${target.set_name}) is now live for bidding! Base Price: ₹${target.base_price_lakh} Lakhs`,
          is_system_msg: true,
          created_at: new Date().toISOString(),
        });
      }
    } else if (action === 'RTM_DECISION') {
      // RTM Response: match or decline
      if (room.rtm_state) {
        const { decision } = payload;
        const rtmTeam = teams.find((t) => t.id === room.rtm_state.original_team_id);
        const winningTeam = teams.find((t) => t.id === room.rtm_state.winning_team_id);

        if (decision === 'match' && rtmTeam) {
          rtmTeam.rtm_cards_remaining -= 1;
          executeSoldPlayer(bundle, rtmTeam, currentPlayer);
        } else if (winningTeam) {
          executeSoldPlayer(bundle, winningTeam, currentPlayer);
        }
        room.rtm_state = null;
      }
    }

    db.saveRoom(code, bundle);
    io.to(code).emit('STATE_SYNC', bundle);
    if (callback) callback({ success: true });
  });

  // 5. CHAT MESSAGE
  socket.on('SEND_CHAT', ({ roomCode, message }) => {
    const code = roomCode.trim().toUpperCase();
    const bundle = db.getRoom(code);
    if (bundle) {
      bundle.chatMessages.push(message);
      db.saveRoom(code, bundle);
      io.to(code).emit('STATE_SYNC', bundle);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`🚀 IPL SERVER ENGINE RUNNING ON PORT ${PORT}`);
  console.log(`===================================================`);
});
