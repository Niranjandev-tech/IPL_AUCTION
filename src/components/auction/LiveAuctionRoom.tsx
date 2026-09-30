import React, { useState, useEffect, useRef } from 'react';
import { useRoom } from '../../context/RoomContext';
import { PlayerCard } from './PlayerCard';
import { CountdownTimer } from './CountdownTimer';
import { BidButton } from './BidButton';
import { BidTicker } from './BidTicker';
import { FranchiseStrip } from './FranchiseStrip';
import { HostActionBar } from './HostActionBar';
import { ChatPanel } from '../chat/ChatPanel';
import { HostApprovalQueue } from '../lobby/HostApprovalQueue';
import { FranchisePicker } from '../lobby/FranchisePicker';
import { RTMBanner } from './RTMBanner';
import { AuctionResultsView } from './AuctionResultsView';
import { BroadcastTicker } from './BroadcastTicker';
import { GavelStrikeOverlay } from './GavelStrikeOverlay';
import { TacticalSquadPlannerModal } from './TacticalSquadPlannerModal';
import { Gavel, MessageSquare, Users, Flame } from 'lucide-react';
import type { Player, RoomTeam } from '../../types/auction.types';

export const LiveAuctionRoom: React.FC = () => {
  const { room, currentTeam, currentPlayer, isHost, joinRoom, teams, players } = useRoom();
  const [activeMobileTab, setActiveMobileTab] = useState<'auction' | 'teams' | 'chat'>('auction');
  const [showPlannerModal, setShowPlannerModal] = useState(false);

  // Overlay state for Gavel Strike
  const [overlayData, setOverlayData] = useState<{
    type: 'sold' | 'unsold';
    player: Player;
    winningTeam?: RoomTeam | null;
    amountLakh?: number;
  } | null>(null);

  const prevPlayerRef = useRef<Player | null>(null);

  // Detect when player lot changes from nominated -> sold/unsold
  useEffect(() => {
    if (!currentPlayer && prevPlayerRef.current) {
      const prevId = prevPlayerRef.current.id;
      const updatedPrev = players.find((p) => p.id === prevId);

      if (updatedPrev && updatedPrev.status === 'sold') {
        const winningTeam = teams.find((t) => t.id === updatedPrev.sold_to_team_id);
        setOverlayData({
          type: 'sold',
          player: updatedPrev,
          winningTeam,
          amountLakh: updatedPrev.sold_price_lakh || 0,
        });
      } else if (updatedPrev && updatedPrev.status === 'unsold') {
        setOverlayData({
          type: 'unsold',
          player: updatedPrev,
        });
      }
    }
    prevPlayerRef.current = currentPlayer;
  }, [currentPlayer?.id, players]);

  if (room?.status === 'completed') {
    return <AuctionResultsView />;
  }

  if (!currentTeam && !isHost) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <FranchisePicker
          onSelectFranchise={(code, isSpectator) => joinRoom(room?.code || 'IPL-7892', code, isSpectator)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
      {/* Broadcast Ticker Bar */}
      <BroadcastTicker />

      {/* Host Controls Header (Visible only to Host) */}
      <HostActionBar />

      {/* RTM Banner (Shown when RTM is active) */}
      <RTMBanner />

      {/* Top Bar for Franchise Managers */}
      <div className="flex items-center justify-between bg-neutral-950 p-2.5 rounded-2xl border border-neutral-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPlannerModal(true)}
            className="px-3.5 py-1.5 rounded-xl font-mono font-bold text-xs bg-gradient-to-r from-amber-500/20 to-yellow-500/10 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Flame className="w-4 h-4 text-amber-400" /> SQUAD PLANNER & 677 PLAYERS DATABASE
          </button>
        </div>

        {currentTeam && (
          <div className="text-right text-xs font-mono">
            <span className="text-neutral-400">YOUR PURSE: </span>
            <span className="text-emerald-400 font-bold">
              ₹{(currentTeam.remaining_purse_lakhs / 100).toFixed(2)} Cr
            </span>
          </div>
        )}
      </div>

      {/* Mobile Tab Navigation */}
      <div className="flex md:hidden bg-neutral-900 p-1 rounded-xl border border-neutral-800">
        <button
          onClick={() => setActiveMobileTab('auction')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            activeMobileTab === 'auction' ? 'bg-amber-400 text-neutral-950 shadow-sm' : 'text-neutral-400'
          }`}
        >
          <Gavel className="w-4 h-4" /> AUCTION
        </button>
        <button
          onClick={() => setActiveMobileTab('teams')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            activeMobileTab === 'teams' ? 'bg-amber-400 text-neutral-950 shadow-sm' : 'text-neutral-400'
          }`}
        >
          <Users className="w-4 h-4" /> TEAMS
        </button>
        <button
          onClick={() => setActiveMobileTab('chat')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            activeMobileTab === 'chat' ? 'bg-amber-400 text-neutral-950 shadow-sm' : 'text-neutral-400'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> CHAT
        </button>
      </div>

      {/* Main Broadcast Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Left / Main Section (8 Cols on Desktop) */}
        <div
          className={`md:col-span-8 space-y-5 ${
            activeMobileTab === 'auction' ? 'block' : 'hidden md:block'
          }`}
        >
          {/* Current Player Card */}
          <PlayerCard player={currentPlayer} />

          {/* Timer & Bid CTA */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            <div className="sm:col-span-4">
              <CountdownTimer />
            </div>
            <div className="sm:col-span-8">
              <BidButton />
            </div>
          </div>

          {/* Bid History Ticker */}
          <BidTicker />
        </div>

        {/* Right / Sidebar Section (4 Cols on Desktop) */}
        <div
          className={`md:col-span-4 space-y-5 ${
            activeMobileTab === 'teams' || activeMobileTab === 'chat' ? 'block' : 'hidden md:block'
          }`}
        >
          {/* Room Approvals Queue */}
          <HostApprovalQueue />

          {/* Live Chat Panel */}
          <ChatPanel />
        </div>
      </div>

      {/* Bottom Franchise Strip (Visible everywhere) */}
      <FranchiseStrip />

      {/* Gavel Strike Overlay */}
      {overlayData && (
        <GavelStrikeOverlay
          type={overlayData.type}
          player={overlayData.player}
          winningTeam={overlayData.winningTeam}
          amountLakh={overlayData.amountLakh}
          onClose={() => setOverlayData(null)}
        />
      )}

      {/* Tactical Squad Planner Modal */}
      {showPlannerModal && (
        <TacticalSquadPlannerModal onClose={() => setShowPlannerModal(false)} />
      )}
    </div>
  );
};
