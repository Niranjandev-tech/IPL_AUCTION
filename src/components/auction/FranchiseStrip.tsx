import React from 'react';
import { useRoom } from '../../context/RoomContext';
import { FRANCHISES } from '../../data/franchises';
import type { FranchiseCode } from '../../types/auction.types';
import { Users, Globe } from 'lucide-react';

export const FranchiseStrip: React.FC = () => {
  const { teams, players, room } = useRoom();

  return (
    <div className="glass-panel rounded-2xl p-4 border border-neutral-800 shadow-broadcast bg-[#0a0a0a]">
      <div className="text-xs uppercase font-mono font-bold text-neutral-400 mb-3 flex items-center justify-between">
        <span>FRANCHISE PURSE & SQUAD STATUS</span>
        <span className="text-neutral-500">MAX 25 SQUAD / MAX 8 OVERSEAS</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
        {(Object.keys(FRANCHISES) as FranchiseCode[]).map((code) => {
          const franchise = FRANCHISES[code];
          const team = teams.find((t) => t.franchise_code === code);
          const isLeading = room?.current_bidder_id === team?.id;

          const squadCount = team
            ? players.filter((p) => p.sold_to_team_id === team.id).length
            : 0;
          const overseasCount = team
            ? players.filter((p) => p.sold_to_team_id === team.id && p.is_overseas).length
            : 0;

          return (
            <div
              key={code}
              className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                isLeading
                  ? 'bg-amber-500/15 border-amber-400 shadow-gold-glow'
                  : team
                  ? 'bg-neutral-900/90 border-neutral-800'
                  : 'bg-black/40 border-neutral-900 opacity-40'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">{franchise.logo}</span>
                  <span className="font-heading font-black text-xs text-neutral-200">
                    {franchise.shortName}
                  </span>
                </div>
                {isLeading && (
                  <span className="text-[9px] bg-amber-400 text-neutral-950 font-bold px-1.5 py-0.5 rounded">
                    BID
                  </span>
                )}
              </div>

              {team ? (
                <div className="space-y-1">
                  <div className="font-mono font-extrabold text-xs text-amber-300">
                    ₹{(team.remaining_purse_lakhs / 100).toFixed(0)} Cr
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-neutral-500" /> {squadCount}/25
                    </span>
                    <span className="flex items-center gap-1 text-amber-400">
                      <Globe className="w-3 h-3" /> {overseasCount}/8
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-[10px] text-neutral-600 font-mono italic">UNCLAIMED</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

