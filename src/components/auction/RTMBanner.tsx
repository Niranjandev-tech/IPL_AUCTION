import React from 'react';
import { useRoom } from '../../context/RoomContext';
import { formatLakhs } from '../../lib/rulesEngine';
import { ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { socket } from '../../lib/socketClient';

export const RTMBanner: React.FC = () => {
  const { room, currentTeam, currentPlayer } = useRoom();

  if (!room || room.status !== 'rtm' || !room.rtm_state || !currentPlayer) {
    return null;
  }

  const rtmState = room.rtm_state;
  const isRtmEligibleTeam = Boolean(currentTeam && currentTeam.id === rtmState.original_team_id);
  const isWinningTeam = Boolean(currentTeam && currentTeam.id === rtmState.winning_team_id);

  const handleMatch = () => {
    if (socket.connected) {
      socket.emit('HOST_ACTION', {
        roomCode: room.code,
        action: 'RTM_DECISION',
        payload: { decision: 'match' },
      });
    }
  };

  const handleDecline = () => {
    if (socket.connected) {
      socket.emit('HOST_ACTION', {
        roomCode: room.code,
        action: 'RTM_DECISION',
        payload: { decision: 'decline' },
      });
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border-2 border-amber-400 p-4 rounded-2xl shadow-gold-glow animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-amber-300 font-heading font-black text-base md:text-lg">
          <ShieldAlert className="w-6 h-6 text-amber-400" />
          <span>RIGHT TO MATCH (RTM) OPTION ACTIVE</span>
        </div>
        <span className="text-xs font-mono font-bold text-neutral-900 bg-amber-400 px-2.5 py-1 rounded-full uppercase">
          RTM CARD
        </span>
      </div>

      <p className="text-xs text-neutral-200 leading-relaxed font-sans">
        <strong className="text-amber-300">{rtmState.original_team_name}</strong> has previous rights for{' '}
        <strong className="text-white">{currentPlayer.name}</strong>. Winning bid stands at{' '}
        <strong className="text-amber-400">{formatLakhs(rtmState.winning_bid_lakh)}</strong>.
      </p>

      {isRtmEligibleTeam ? (
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleMatch}
            className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-heading font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <CheckCircle className="w-5 h-5" /> MATCH BID & CLAIM PLAYER
          </button>
          <button
            onClick={handleDecline}
            className="flex-1 py-3 bg-neutral-900 hover:bg-neutral-800 text-rose-400 font-bold rounded-xl text-sm border border-neutral-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <XCircle className="w-5 h-5" /> DECLINE RTM
          </button>
        </div>
      ) : isWinningTeam ? (
        <div className="text-xs font-mono text-amber-300 bg-black/60 p-2.5 rounded-xl border border-neutral-800 text-center">
          ⏳ Waiting for {rtmState.original_team_name} to decide RTM match option...
        </div>
      ) : (
        <div className="text-xs font-mono text-neutral-400 bg-black/60 p-2.5 rounded-xl border border-neutral-800 text-center">
          RTM option offered to {rtmState.original_team_name} for {currentPlayer.name}.
        </div>
      )}
    </div>
  );
};
