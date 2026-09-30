import React, { useState } from 'react';
import { CreateRoomModal } from '../lobby/CreateRoomModal';
import { JoinRoomModal } from '../lobby/JoinRoomModal';
import { Plus, LogIn, Shield, Zap, Award, Sparkles } from 'lucide-react';
import { useRoom } from '../../context/RoomContext';
import { IPL_SEASON } from '../../config/constants';

export const Dashboard: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const { findRoomByCode, joinRoom } = useRoom();

  const handleJoinCode = async (code: string) => {
    try {
      const roomObj = findRoomByCode(code);
      if (!roomObj) {
        alert(`Room with code "${code}" was not found. Please verify the code or create a new auction room.`);
        return;
      }
      setShowJoinModal(false);
      // Load room state into context; player will be prompted to pick an available team via FranchisePicker
      await joinRoom(code, '' as any, false);
    } catch (err: any) {
      alert(err.message || 'Failed to join room');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10 bg-black">
      {/* Hero Banner */}
      <div className="glass-panel rounded-3xl p-8 md:p-12 border border-amber-500/30 text-center relative overflow-hidden shadow-broadcast">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/05 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/05 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-4 py-1.5 rounded-full text-xs font-mono font-bold tracking-wider uppercase">
            <Sparkles className="w-4 h-4 text-amber-400" /> {IPL_SEASON} MEGA AUCTION ENGINE
          </div>

          <h1 className="font-heading font-black text-4xl md:text-6xl gold-gradient-text tracking-tight leading-none">
            LIVE MULTIPLAYER IPL AUCTION ROOM
          </h1>

          <p className="text-neutral-300 text-sm md:text-base max-w-2xl mx-auto font-sans leading-relaxed">
            Host private live auctions for your friend group (up to 15 teams). Bid in real-time on 500+ players with TV-broadcast visuals, atomic server validation, RTM cards, and Purse Safety rules.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-neutral-950 font-heading font-black text-base rounded-2xl shadow-gold-glow transition-all flex items-center justify-center gap-2 transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-5 h-5" /> CREATE NEW AUCTION ROOM
            </button>

            <button
              onClick={() => setShowJoinModal(true)}
              className="w-full sm:w-auto px-8 py-4 bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-amber-500/40 font-heading font-bold text-base rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-5 h-5 text-amber-400" /> JOIN ROOM WITH CODE
            </button>
          </div>
        </div>
      </div>

      {/* Key Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-neutral-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-bold text-lg text-neutral-100">Real IPL Rules Presets</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            ₹120 Cr team purse, 18-25 squad limits, 8 overseas caps, retention slots, RTM cards, and dynamic bid increment slabs.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-neutral-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-bold text-lg text-neutral-100">Atomic Bidding & Purse Safety</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Server-side RPC validation prevents double bids or over-bidding. Smart safety checks reserve minimum squad purse automatically.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-neutral-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-bold text-lg text-neutral-100">True Black Broadcast Theme</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            TV lower-third player cards, dynamic franchise accent tints, gavel SOLD celebration sound effects, and live bid ticker.
          </p>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateRoomModal
          onCreated={() => setShowCreateModal(false)}
          onCancel={() => setShowCreateModal(false)}
        />
      )}

      {showJoinModal && (
        <JoinRoomModal
          onJoinCode={handleJoinCode}
          onCancel={() => setShowJoinModal(false)}
        />
      )}
    </div>
  );
};

