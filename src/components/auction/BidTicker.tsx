import React from 'react';
import { useRoom } from '../../context/RoomContext';
import { formatLakhs } from '../../lib/rulesEngine';
import { TrendingUp, Clock } from 'lucide-react';

export const BidTicker: React.FC = () => {
  const { bids, teams } = useRoom();

  if (bids.length === 0) {
    return (
      <div className="bg-black border border-neutral-800 rounded-xl p-3 text-center text-xs text-neutral-500 font-mono">
        NO BIDS PLACED YET FOR THIS LOT
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-xl p-3 border border-neutral-800 bg-[#0a0a0a]">
      <div className="text-[10px] uppercase font-mono font-bold text-neutral-400 mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5 text-amber-400" /> LIVE BID HISTORY TICKER
        </span>
        <span className="text-neutral-500">{bids.length} BIDS</span>
      </div>

      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
        {bids.map((bid, idx) => {
          const team = teams.find((t) => t.id === bid.team_id) || bid.team;
          const isTop = idx === 0;

          return (
            <div
              key={bid.id}
              className={`flex items-center justify-between p-2 rounded-lg text-xs font-mono transition-all ${
                isTop
                  ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold'
                  : 'bg-black/70 text-neutral-400 border border-neutral-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{team?.logo_url}</span>
                <span className="font-bold text-neutral-200">{team?.franchise_code || 'TEAM'}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={isTop ? 'text-amber-400 text-sm' : 'text-neutral-300'}>
                  {formatLakhs(bid.amount_lakh)}
                </span>
                <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(bid.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

