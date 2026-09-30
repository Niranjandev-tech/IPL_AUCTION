import React, { useState } from 'react';
import { useRoom } from '../../context/RoomContext';
import { Pause, Play, CheckCircle, XCircle, SkipForward, Undo2, Sliders, Shield, Layers, Settings, Flame } from 'lucide-react';
import { HostCategoryManager } from './HostCategoryManager';
import { HostRoomSettingsModal } from './HostRoomSettingsModal';
import { TacticalSquadPlannerModal } from './TacticalSquadPlannerModal';

export const HostActionBar: React.FC = () => {
  const {
    room,
    isHost,
    soldPlayer,
    unsoldPlayer,
    skipPlayer,
    togglePause,
    undoLastBid,
    toggleMode,
  } = useRoom();

  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPlannerModal, setShowPlannerModal] = useState(false);

  if (!isHost || !room) return null;

  const hasBidder = Boolean(room.current_bidder_id);
  const isPaused = room.status === 'paused';

  return (
    <>
      <div className="bg-[#0a0a0a] border border-amber-500/40 p-3 rounded-2xl shadow-broadcast">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Host Label & Category Selector */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30">
              <Shield className="w-3.5 h-3.5" /> HOST CONTROL BAR
            </div>

            <button
              onClick={() => setShowCategoryManager(true)}
              className="px-3 py-1.5 rounded-xl font-heading font-black text-xs bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-neutral-950 shadow-gold-glow transition-all flex items-center gap-1.5 transform active:scale-95 cursor-pointer"
            >
              <Layers className="w-4 h-4 text-neutral-950" /> NOMINATE / CATEGORY
            </button>

            <button
              onClick={() => setShowPlannerModal(true)}
              className="px-3 py-1.5 rounded-xl font-mono font-bold text-xs bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" /> SQUAD PLANNER & DB
            </button>

            <button
              onClick={() => setShowSettingsModal(true)}
              className="px-3 py-1.5 rounded-xl font-mono font-bold text-xs bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-neutral-400" /> ROOM CONFIG
            </button>

            <button
              onClick={() => toggleMode(room.mode === 'auto' ? 'manual' : 'auto')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                room.mode === 'auto'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-neutral-800 text-neutral-300 border-neutral-700'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" /> MODE: {room.mode.toUpperCase()}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Pause / Resume */}
            <button
              onClick={togglePause}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-colors flex items-center gap-1.5 cursor-pointer ${
                isPaused
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
              }`}
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {isPaused ? 'RESUME' : 'PAUSE'}
            </button>

            {/* Undo Last Bid */}
            <button
              onClick={undoLastBid}
              disabled={room.current_bid_amount === 0}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-bold text-xs border border-neutral-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Undo last bid"
            >
              <Undo2 className="w-4 h-4 text-amber-400" /> UNDO BID
            </button>

            {/* Skip Player */}
            <button
              onClick={skipPlayer}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-xl font-bold text-xs border border-neutral-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <SkipForward className="w-4 h-4 text-neutral-400" /> SKIP
            </button>

            {/* Unsold */}
            <button
              onClick={unsoldPlayer}
              disabled={hasBidder}
              className="px-3 py-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <XCircle className="w-4 h-4 text-rose-400" /> UNSOLD
            </button>

            {/* Sold */}
            <button
              onClick={soldPlayer}
              disabled={!hasBidder}
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black rounded-xl text-xs shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" /> MARK SOLD 🔨
            </button>
          </div>
        </div>
      </div>

      {showCategoryManager && (
        <HostCategoryManager onClose={() => setShowCategoryManager(false)} />
      )}

      {showSettingsModal && (
        <HostRoomSettingsModal onClose={() => setShowSettingsModal(false)} />
      )}

      {showPlannerModal && (
        <TacticalSquadPlannerModal onClose={() => setShowPlannerModal(false)} />
      )}
    </>
  );
};


