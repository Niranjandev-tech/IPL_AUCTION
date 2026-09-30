import React from 'react';
import { useRoom } from '../../context/RoomContext';
import { formatLakhs, getBidIncrement, checkPurseSafety } from '../../lib/rulesEngine';
import { Gavel, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';
import { soundEffects } from '../../lib/soundEffects';

export const BidButton: React.FC = () => {
  const { room, currentTeam, currentPlayer, settings, placeBid } = useRoom();

  if (!room || !currentPlayer) return null;

  const handleBid = () => {
    soundEffects.playBidChime();
    placeBid();
  };

  const currentBid = room.current_bid_amount;
  const isLeading = Boolean(currentTeam && room.current_bidder_id === currentTeam.id);
  const isSpectator = currentTeam?.is_spectator || !currentTeam;
  const isApproved = currentTeam?.is_approved;

  const increment = currentBid === 0 ? 0 : getBidIncrement(currentBid, settings.bid_increments);
  const nextBidAmount = currentBid === 0 ? currentPlayer.base_price_lakh : currentBid + increment;

  const squadCount = currentTeam ? currentTeam.squad_count || 0 : 0;
  const purseSafety = currentTeam
    ? checkPurseSafety(currentTeam.remaining_purse_lakhs, nextBidAmount, squadCount, settings.min_squad, 30)
    : { safe: true };

  const isDisabled =
    isLeading ||
    isSpectator ||
    !isApproved ||
    room.status === 'paused' ||
    room.status === 'completed' ||
    !purseSafety.safe;

  return (
    <div className="w-full space-y-2">
      {/* Leading Status Indicator */}
      {isLeading && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 py-2 px-4 rounded-xl text-center font-heading font-black text-sm tracking-wider flex items-center justify-center gap-2 animate-pulse">
          <ShieldCheck className="w-5 h-5 text-emerald-400" /> YOUR FRANCHISE IS LEADING AT {formatLakhs(currentBid)}
        </div>
      )}

      {/* Warning Alert if Purse Safety Failing */}
      {!purseSafety.safe && purseSafety.message && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-2.5 rounded-xl text-xs flex items-center gap-2 font-mono">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{purseSafety.message}</span>
        </div>
      )}

      {/* Main BID CTA Button */}
      <button
        disabled={isDisabled}
        onClick={handleBid}
        className={`w-full py-4 md:py-5 px-6 rounded-2xl font-heading font-black text-lg md:text-2xl transition-all duration-200 transform active:scale-95 shadow-broadcast flex flex-col items-center justify-center relative overflow-hidden group ${
          isLeading
            ? 'bg-neutral-900 text-neutral-500 border border-neutral-800 cursor-not-allowed'
            : !isApproved || isSpectator
            ? 'bg-black text-neutral-500 border border-neutral-900 cursor-not-allowed'
            : !purseSafety.safe
            ? 'bg-rose-950/40 text-rose-400 border border-rose-800 cursor-not-allowed'
            : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-neutral-950 border border-amber-300 shadow-gold-glow cursor-pointer'
        }`}
      >
        <div className="flex items-center gap-3">
          <Gavel className={`w-6 h-6 md:w-8 md:h-8 ${isLeading ? 'text-neutral-600' : 'text-neutral-950 group-hover:rotate-12 transition-transform'}`} />
          <span>
            {isLeading
              ? 'YOU HAVE HIGHEST BID'
              : !isApproved
              ? 'WAITING HOST APPROVAL'
              : isSpectator
              ? 'SPECTATOR MODE'
              : `BID ${formatLakhs(nextBidAmount)}`}
          </span>
        </div>

        {!isDisabled && (
          <span className="text-xs font-mono font-bold text-neutral-900/80 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            {currentBid === 0
              ? `BASE PRICE: ${formatLakhs(currentPlayer.base_price_lakh)}`
              : `INCREMENT: +${formatLakhs(increment)}`}
          </span>
        )}
      </button>
    </div>
  );
};

