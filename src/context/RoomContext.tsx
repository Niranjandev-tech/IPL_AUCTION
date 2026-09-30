import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Room, RoomSettings, RoomTeam, Player, Bid, ChatMessage, FranchiseCode, RoomStatus } from '../types/auction.types';
import { FRANCHISES } from '../data/franchises';
import samplePlayers from '../data/samplePlayerPool.json';
import { DEFAULT_ROOM_SETTINGS, getBidIncrement, checkPurseSafety } from '../lib/rulesEngine';
import { useAuth } from './AuthContext';
import { socket } from '../lib/socketClient';

interface RoomContextType {
  room: Room | null;
  settings: RoomSettings;
  teams: RoomTeam[];
  currentTeam: RoomTeam | null;
  currentPlayer: Player | null;
  players: Player[];
  bids: Bid[];
  chatMessages: ChatMessage[];
  myWatchlist: string[]; // player IDs
  isHost: boolean;
  loading: boolean;
  createRoom: (name: string) => Promise<string>;
  joinRoom: (code: string, franchiseCode: FranchiseCode, isSpectator?: boolean) => Promise<void>;
  findRoomByCode: (code: string) => Room | null;
  nominatePlayer: (playerId: string) => Promise<void>;
  selectCategorySet: (setName: string) => Promise<void>;
  approveTeam: (teamId: string) => Promise<void>;
  placeBid: () => Promise<void>;
  soldPlayer: () => Promise<void>;
  unsoldPlayer: () => Promise<void>;
  skipPlayer: () => Promise<void>;
  togglePause: () => Promise<void>;
  undoLastBid: () => Promise<void>;
  toggleMode: (mode: 'manual' | 'auto') => Promise<void>;
  updateSettings: (newSettings: Partial<RoomSettings>) => Promise<void>;
  sendChatMessage: (msg: string) => Promise<void>;
  toggleWatchlist: (playerId: string) => void;
  loadSamplePlayers: () => void;
  leaveRoom: () => void;
}

const ROOM_STORAGE_KEY_PREFIX = 'ipl_auction_room_';
const ACTIVE_ROOMS_KEY = 'ipl_auction_active_rooms';

// Save room state to localStorage
const saveRoomToStorage = (roomData: {
  room: Room;
  settings: RoomSettings;
  teams: RoomTeam[];
  players: Player[];
  bids: Bid[];
  chatMessages: ChatMessage[];
}) => {
  try {
    const key = `${ROOM_STORAGE_KEY_PREFIX}${roomData.room.code.toUpperCase()}`;
    localStorage.setItem(key, JSON.stringify(roomData));

    // Update active rooms index
    const activeRaw = localStorage.getItem(ACTIVE_ROOMS_KEY);
    const activeList: { code: string; name: string; updated_at: string }[] = activeRaw ? JSON.parse(activeRaw) : [];
    const filtered = activeList.filter((r) => r.code !== roomData.room.code);
    filtered.unshift({
      code: roomData.room.code,
      name: roomData.room.name,
      updated_at: new Date().toISOString(),
    });
    localStorage.setItem(ACTIVE_ROOMS_KEY, JSON.stringify(filtered.slice(0, 15)));
  } catch (err) {
    console.error('Failed to save room to localStorage:', err);
  }
};

// Load room state from localStorage
const loadRoomFromStorage = (code: string) => {
  try {
    const key = `${ROOM_STORAGE_KEY_PREFIX}${code.trim().toUpperCase()}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load room from storage:', err);
  }
  return null;
};

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [settings, setSettings] = useState<RoomSettings>({
    room_id: '',
    ...DEFAULT_ROOM_SETTINGS,
  });
  const [teams, setTeams] = useState<RoomTeam[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [myWatchlist, setMyWatchlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const isHost = Boolean(user && room && room.host_id === user.id);
  const currentTeam = teams.find((t) => t.user_id === user?.id) || null;
  const currentPlayer = players.find((p) => p.id === room?.current_player_id) || null;

  // Socket.io, Multi-tab Broadcast & LocalStorage listener
  useEffect(() => {
    if (!room) return;

    // Join Socket room if connected
    if (socket && socket.connected) {
      socket.emit('JOIN_ROOM', { code: room.code, userId: user?.id });
    }

    const handleSyncPayload = (payload: any) => {
      if (payload.room) setRoom(payload.room);
      if (payload.teams) setTeams(payload.teams);
      if (payload.players) setPlayers(payload.players);
      if (payload.bids) setBids(payload.bids);
      if (payload.chat) setChatMessages(payload.chat);
      if (payload.chatMessages) setChatMessages(payload.chatMessages);
      if (payload.settings) setSettings(payload.settings);
    };

    socket.on('STATE_SYNC', handleSyncPayload);

    const channel = new BroadcastChannel(`ipl_room_${room.id}`);

    channel.onmessage = (event) => {
      if (event.data?.type === 'STATE_SYNC') {
        handleSyncPayload(event.data.payload);
      }
    };

    // Cross-tab window storage listener
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `${ROOM_STORAGE_KEY_PREFIX}${room.code.toUpperCase()}` && e.newValue) {
        try {
          const updatedData = JSON.parse(e.newValue);
          handleSyncPayload(updatedData);
        } catch (err) {
          console.error('Error handling storage update:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      socket.off('STATE_SYNC', handleSyncPayload);
      channel.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [room?.id, room?.code, user?.id]);

  const syncAndBroadcast = (
    updatedRoom?: Room | null,
    updatedTeams?: RoomTeam[],
    updatedPlayers?: Player[],
    updatedBids?: Bid[],
    updatedChat?: ChatMessage[],
    updatedSettings?: RoomSettings
  ) => {
    const targetRoom = updatedRoom !== undefined ? updatedRoom : room;
    if (!targetRoom) return;

    const bundle = {
      room: targetRoom,
      settings: updatedSettings || settings,
      teams: updatedTeams || teams,
      players: updatedPlayers || players,
      bids: updatedBids || bids,
      chatMessages: updatedChat || chatMessages,
    };

    // Save to localStorage for instant tab sync
    saveRoomToStorage(bundle);

    // Broadcast via channel
    const channel = new BroadcastChannel(`ipl_room_${targetRoom.id}`);
    channel.postMessage({
      type: 'STATE_SYNC',
      payload: {
        room: targetRoom,
        teams: updatedTeams || teams,
        players: updatedPlayers || players,
        bids: updatedBids || bids,
        chat: updatedChat || chatMessages,
        settings: updatedSettings || settings,
      },
    });
  };

  // Helper: Find room by code
  const findRoomByCode = (code: string): Room | null => {
    const formattedCode = code.trim().toUpperCase();
    if (room && room.code.toUpperCase() === formattedCode) {
      return room;
    }
    const stored = loadRoomFromStorage(formattedCode);
    if (stored && stored.room) {
      return stored.room;
    }
    return null;
  };

  // 1. Create Room
  const createRoom = async (name: string): Promise<string> => {
    if (!user) throw new Error('Must be signed in to create a room');
    setLoading(true);
    const roomCode = `IPL-${Math.floor(1000 + Math.random() * 9000)}`;
    const roomId = `room-${Math.random().toString(36).substring(2, 9)}`;

    const newRoom: Room = {
      id: roomId,
      code: roomCode,
      name,
      host_id: user.id,
      status: 'lobby',
      current_bid_amount: 0,
      mode: 'auto',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const initialSettings: RoomSettings = {
      room_id: roomId,
      ...DEFAULT_ROOM_SETTINGS,
    };

    const initialPlayers: Player[] = (samplePlayers as any[]).map((p, idx) => ({
      ...p,
      room_id: roomId,
      status: idx === 0 ? 'nominated' : 'pending',
    }));
    newRoom.current_player_id = initialPlayers[0].id;

    const initialChat: ChatMessage[] = [
      {
        id: `msg-${Date.now()}`,
        room_id: roomId,
        sender_name: 'AUCTIONEER',
        message: `Welcome to ${name}! Room Code: ${roomCode} (${initialPlayers.length} Players Pool Ready)`,
        is_system_msg: true,
        created_at: new Date().toISOString(),
      },
    ];

    setRoom(newRoom);
    setSettings(initialSettings);
    setPlayers(initialPlayers);
    setTeams([]);
    setBids([]);
    setChatMessages(initialChat);

    syncAndBroadcast(newRoom, [], initialPlayers, [], initialChat, initialSettings);

    setLoading(false);
    return roomCode;
  };

  // 2. Join Room
  const joinRoom = async (code: string, franchiseCode: FranchiseCode, isSpectator = false) => {
    if (!user) throw new Error('Must be signed in to join');
    setLoading(true);

    const formattedCode = code.trim().toUpperCase();
    let targetRoom = room;
    let currentTeams = teams;
    let currentPlayers = players;
    let currentBids = bids;
    let currentChat = chatMessages;
    let currentSettings = settings;

    // Load from storage if state is empty or different code
    if (!targetRoom || targetRoom.code.toUpperCase() !== formattedCode) {
      const stored = loadRoomFromStorage(formattedCode);
      if (stored && stored.room) {
        targetRoom = stored.room;
        currentTeams = stored.teams || [];
        currentPlayers = stored.players || [];
        currentBids = stored.bids || [];
        currentChat = stored.chatMessages || [];
        currentSettings = stored.settings || DEFAULT_ROOM_SETTINGS;

        setRoom(targetRoom);
        setTeams(currentTeams);
        setPlayers(currentPlayers);
        setBids(currentBids);
        setChatMessages(currentChat);
        setSettings(currentSettings);
      } else if (!targetRoom) {
        setLoading(false);
        throw new Error(`Room with code "${formattedCode}" not found.`);
      }
    }

    if (!franchiseCode) {
      setLoading(false);
      return;
    }

    if (!isSpectator) {
      const isTaken = currentTeams.some(
        (t) => !t.is_spectator && t.franchise_code === franchiseCode && t.user_id !== user.id
      );
      if (isTaken) {
        setLoading(false);
        throw new Error(`The franchise "${franchiseCode}" is already claimed by another manager in this room.`);
      }
    }

    const isHostUser = targetRoom ? targetRoom.host_id === user.id : false;
    const franchise = FRANCHISES[franchiseCode] || FRANCHISES['CSK'];

    const newTeam: RoomTeam = {
      id: `team-${user.id.slice(0, 5)}-${franchiseCode}`,
      room_id: targetRoom?.id || 'default-room',
      user_id: user.id,
      franchise_code: franchiseCode,
      franchise_name: franchise.name,
      primary_color: franchise.primaryColor,
      secondary_color: franchise.secondaryColor,
      logo_url: franchise.logo,
      remaining_purse_lakhs: currentSettings.total_purse_lakhs,
      rtm_cards_remaining: 6,
      is_approved: isHostUser ? true : isSpectator ? true : false,
      is_spectator: isSpectator,
      user_profile: user,
    };

    const updatedTeams = [...currentTeams.filter((t) => t.user_id !== user.id), newTeam];
    setTeams(updatedTeams);

    const systemMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      room_id: targetRoom?.id || '',
      sender_name: 'AUCTIONEER',
      message: `${user.display_name} joined as ${franchise.name} (${isSpectator ? 'Spectator' : isHostUser ? 'Host/Approved' : 'Pending Approval'})`,
      is_system_msg: true,
      created_at: new Date().toISOString(),
    };
    const updatedChat = [...currentChat, systemMsg];
    setChatMessages(updatedChat);

    syncAndBroadcast(targetRoom, updatedTeams, currentPlayers, currentBids, updatedChat, currentSettings);
    setLoading(false);
  };

  // 3. Approve Team
  const approveTeam = async (teamId: string) => {
    const updated = teams.map((t) => (t.id === teamId ? { ...t, is_approved: true } : t));
    setTeams(updated);
    syncAndBroadcast(room, updated);
  };

  // 4. Host Nominate Specific Player
  const nominatePlayer = async (playerId: string) => {
    if (!room) return;
    const target = players.find((p) => p.id === playerId);
    if (!target) return;

    const updatedPlayers = players.map((p) => {
      if (p.id === playerId) {
        return { ...p, status: 'nominated' as const };
      }
      if (p.status === 'nominated' && p.id !== playerId) {
        return { ...p, status: 'pending' as const };
      }
      return p;
    });

    const sysMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      room_id: room.id,
      sender_name: 'AUCTIONEER',
      message: `📢 HOST NOMINATED: ${target.name} (${target.role} • ${target.set_name}) is now live for bidding! Base Price: ₹${target.base_price_lakh} Lakhs`,
      is_system_msg: true,
      created_at: new Date().toISOString(),
    };

    const updatedRoom: Room = {
      ...room,
      status: 'live',
      current_player_id: target.id,
      current_bidder_id: null,
      current_bid_amount: 0,
      lot_ends_at: new Date(Date.now() + settings.timer_duration_sec * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    };

    setRoom(updatedRoom);
    setPlayers(updatedPlayers);
    const updatedChat = [...chatMessages, sysMsg];
    setChatMessages(updatedChat);
    syncAndBroadcast(updatedRoom, teams, updatedPlayers, bids, updatedChat);
  };

  // 5. Host Select Category / Set
  const selectCategorySet = async (setName: string) => {
    if (!room) return;
    const firstPendingInSet = players.find((p) => p.set_name === setName && p.status === 'pending');
    if (!firstPendingInSet) {
      alert(`No pending players left in category "${setName}".`);
      return;
    }
    await nominatePlayer(firstPendingInSet.id);
  };

  // 6. Place Bid
  const placeBid = async () => {
    if (!room || !currentTeam || !currentPlayer) return;
    if (!currentTeam.is_approved || currentTeam.is_spectator) {
      alert('Only approved franchise managers can place bids.');
      return;
    }
    if (room.current_bidder_id === currentTeam.id) {
      alert('Your team is already the highest bidder!');
      return;
    }

    const currentBid = room.current_bid_amount;
    const increment = currentBid === 0 ? 0 : getBidIncrement(currentBid, settings.bid_increments);
    const nextBid = currentBid === 0 ? currentPlayer.base_price_lakh : currentBid + increment;

    const squadCount = players.filter((p) => p.sold_to_team_id === currentTeam.id).length;
    const overseasCount = players.filter((p) => p.sold_to_team_id === currentTeam.id && p.is_overseas).length;

    if (squadCount + 1 > settings.max_squad) {
      alert(`Cannot bid: Squad limit of ${settings.max_squad} players reached.`);
      return;
    }
    if (currentPlayer.is_overseas && overseasCount + 1 > settings.max_overseas) {
      alert(`Cannot bid: Overseas limit of ${settings.max_overseas} players reached.`);
      return;
    }

    const purseCheck = checkPurseSafety(
      currentTeam.remaining_purse_lakhs,
      nextBid,
      squadCount,
      settings.min_squad,
      30
    );
    if (!purseCheck.safe) {
      alert(purseCheck.message);
      return;
    }

    const now = new Date();
    const currentEnd = room.lot_ends_at ? new Date(room.lot_ends_at) : new Date(now.getTime() + 30000);
    let newEnd = currentEnd;
    if (settings.anti_snipe_enabled && currentEnd.getTime() - now.getTime() < 5000) {
      newEnd = new Date(now.getTime() + settings.anti_snipe_extend_sec * 1000);
    }

    const updatedRoom: Room = {
      ...room,
      status: 'live',
      current_bidder_id: currentTeam.id,
      current_bid_amount: nextBid,
      lot_ends_at: newEnd.toISOString(),
      updated_at: now.toISOString(),
    };

    const newBid: Bid = {
      id: `bid-${Date.now()}`,
      room_id: room.id,
      player_id: currentPlayer.id,
      team_id: currentTeam.id,
      amount_lakh: nextBid,
      created_at: now.toISOString(),
      team: currentTeam,
    };

    const updatedBids = [newBid, ...bids];
    setRoom(updatedRoom);
    setBids(updatedBids);

    if (socket && socket.connected) {
      socket.emit(
        'PLACE_BID',
        { roomCode: room.code, teamId: currentTeam.id, amountLakh: nextBid },
        (res: any) => {
          if (res && !res.success) {
            alert(res.error || 'Bid rejected by server engine.');
          }
        }
      );
    }

    syncAndBroadcast(updatedRoom, teams, players, updatedBids);
  };

  // 7. Sold Player
  const soldPlayer = async () => {
    if (!room || !currentPlayer || !room.current_bidder_id) return;

    const winningTeam = teams.find((t) => t.id === room.current_bidder_id);
    if (!winningTeam) return;

    const winningPrice = room.current_bid_amount;

    const updatedTeams = teams.map((t) =>
      t.id === winningTeam.id
        ? { ...t, remaining_purse_lakhs: t.remaining_purse_lakhs - winningPrice }
        : t
    );

    const updatedPlayers = players.map((p) =>
      p.id === currentPlayer.id
        ? { ...p, status: 'sold' as const, sold_to_team_id: winningTeam.id, sold_price_lakh: winningPrice }
        : p
    );

    const sysMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      room_id: room.id,
      sender_name: 'AUCTIONEER',
      message: `🔨 SOLD! ${currentPlayer.name} (${currentPlayer.role}) sold to ${winningTeam.franchise_name} for ₹${(winningPrice / 100).toFixed(2)} Cr!`,
      is_system_msg: true,
      created_at: new Date().toISOString(),
    };

    const nextPlayer = updatedPlayers.find((p) => p.status === 'pending');
    let updatedRoom: Room;

    if (nextPlayer) {
      const finalPlayers = updatedPlayers.map((p) =>
        p.id === nextPlayer.id ? { ...p, status: 'nominated' as const } : p
      );
      updatedRoom = {
        ...room,
        current_player_id: nextPlayer.id,
        current_bidder_id: null,
        current_bid_amount: 0,
        lot_ends_at: new Date(Date.now() + settings.timer_duration_sec * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      };
      setPlayers(finalPlayers);
    } else {
      updatedRoom = {
        ...room,
        status: 'completed',
        current_player_id: null,
        current_bidder_id: null,
        current_bid_amount: 0,
        updated_at: new Date().toISOString(),
      };
      setPlayers(updatedPlayers);
    }

    setRoom(updatedRoom);
    setTeams(updatedTeams);
    const updatedChat = [...chatMessages, sysMsg];
    setChatMessages(updatedChat);

    syncAndBroadcast(updatedRoom, updatedTeams, updatedPlayers, bids, updatedChat);
  };

  // 8. Unsold Player
  const unsoldPlayer = async () => {
    if (!room || !currentPlayer) return;

    const updatedPlayers = players.map((p) =>
      p.id === currentPlayer.id ? { ...p, status: 'unsold' as const } : p
    );

    const sysMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      room_id: room.id,
      sender_name: 'AUCTIONEER',
      message: `❌ UNSOLD! ${currentPlayer.name} goes unsold.`,
      is_system_msg: true,
      created_at: new Date().toISOString(),
    };

    const nextPlayer = updatedPlayers.find((p) => p.status === 'pending');
    let updatedRoom: Room;

    if (nextPlayer) {
      const finalPlayers = updatedPlayers.map((p) =>
        p.id === nextPlayer.id ? { ...p, status: 'nominated' as const } : p
      );
      updatedRoom = {
        ...room,
        current_player_id: nextPlayer.id,
        current_bidder_id: null,
        current_bid_amount: 0,
        lot_ends_at: new Date(Date.now() + settings.timer_duration_sec * 1000).toISOString(),
      };
      setPlayers(finalPlayers);
    } else {
      updatedRoom = {
        ...room,
        status: 'completed',
        current_player_id: null,
        current_bidder_id: null,
        current_bid_amount: 0,
      };
      setPlayers(updatedPlayers);
    }

    setRoom(updatedRoom);
    const updatedChat = [...chatMessages, sysMsg];
    setChatMessages(updatedChat);

    syncAndBroadcast(updatedRoom, teams, updatedPlayers, bids, updatedChat);
  };

  // 9. Skip Player
  const skipPlayer = async () => {
    await unsoldPlayer();
  };

  // 10. Toggle Pause
  const togglePause = async () => {
    if (!room) return;
    const nextStatus = room.status === 'paused' ? 'live' : 'paused';
    const updated = { ...room, status: nextStatus as RoomStatus };
    setRoom(updated);
    syncAndBroadcast(updated);
  };

  // 11. Undo Last Bid
  const undoLastBid = async () => {
    if (!room || bids.length === 0) return;
    const remainingBids = bids.slice(1);
    const prevBid = remainingBids[0];

    const updatedRoom: Room = {
      ...room,
      current_bidder_id: prevBid ? prevBid.team_id : null,
      current_bid_amount: prevBid ? prevBid.amount_lakh : 0,
    };

    setBids(remainingBids);
    setRoom(updatedRoom);
    syncAndBroadcast(updatedRoom, teams, players, remainingBids);
  };

  // 12. Toggle Mode
  const toggleMode = async (mode: 'manual' | 'auto') => {
    if (!room) return;
    const updated = { ...room, mode };
    setRoom(updated);
    syncAndBroadcast(updated);
  };

  // 13. Update Settings
  const updateSettings = async (newSettings: Partial<RoomSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    syncAndBroadcast(room, teams, players, bids, chatMessages, updated);
  };

  // 14. Send Chat Message
  const sendChatMessage = async (msg: string) => {
    if (!room || !msg.trim()) return;
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      room_id: room.id,
      sender_team_id: currentTeam?.id || null,
      sender_name: currentTeam ? currentTeam.franchise_name : user?.display_name || 'Spectator',
      message: msg.trim(),
      is_system_msg: false,
      created_at: new Date().toISOString(),
      sender_team: currentTeam || undefined,
    };

    const updated = [...chatMessages, newMsg];
    setChatMessages(updated);
    syncAndBroadcast(room, teams, players, bids, updated);
  };

  // 15. Watchlist
  const toggleWatchlist = (playerId: string) => {
    setMyWatchlist((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    );
  };

  // 16. Load sample players
  const loadSamplePlayers = () => {
    if (!room) return;
    const loaded: Player[] = (samplePlayers as any[]).map((p, idx) => ({
      ...p,
      room_id: room.id,
      status: idx === 0 ? 'nominated' : 'pending',
    }));
    setPlayers(loaded);
    setRoom({ ...room, current_player_id: loaded[0].id, current_bid_amount: 0, current_bidder_id: null });
    syncAndBroadcast(room, teams, loaded);
  };

  // 17. Leave Room
  const leaveRoom = () => {
    setRoom(null);
  };

  return (
    <RoomContext.Provider
      value={{
        room,
        settings,
        teams,
        currentTeam,
        currentPlayer,
        players,
        bids,
        chatMessages,
        myWatchlist,
        isHost,
        loading,
        createRoom,
        joinRoom,
        findRoomByCode,
        nominatePlayer,
        selectCategorySet,
        approveTeam,
        placeBid,
        soldPlayer,
        unsoldPlayer,
        skipPlayer,
        togglePause,
        undoLastBid,
        toggleMode,
        updateSettings,
        sendChatMessage,
        toggleWatchlist,
        loadSamplePlayers,
        leaveRoom,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) throw new Error('useRoom must be used within RoomProvider');
  return context;
};

