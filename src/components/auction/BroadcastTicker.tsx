import React from 'react';
import { Sparkles, Trophy, Wallet, TrendingUp } from 'lucide-react';
import { useRoom } from '../../context/RoomContext';
import { formatLakhs } from '../../lib/rulesEngine';

export const BroadcastTicker: React.FC = () => {
  const { players, teams, room } = useRoom();

  const soldPlayers = players.filter((p) => p.status === 'sold' && p.sold_price_lakh);
  const highestBuy = soldPlayers.reduce((max, p) => (p.sold_price_lakh! > (max?.sold_price_lakh || 0) ? p : max), soldPlayers[0] || null);
  const highestBuyTeam = highestBuy ? teams.find((t) => t.id === highestBuy.sold_to_team_id) : null;
  const purseLeader = [...teams].sort((a, b) => b.remaining_purse_lakhs - a.remaining_purse_lakhs)[0];

  const recentSold = soldPlayers.slice(-3).reverse();

  return (
    <div className="bg-[#050505] border-y border-neutral-800/80 py-2 px-4 overflow-hidden relative shadow-inner">
      <div className="max-w-7xl mx-auto flex items-center gap-4 text-xs font-mono">
        {/* Ticker Badge */}
        <div className="flex items-center gap-1.5 shrink-0 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full font-bold text-[10px] tracking-wider uppercase">
          <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
          BROADCAST TICKER
        </div>

        {/* Marquee Container */}
        <div className="flex items-center gap-8 overflow-x-auto no-scrollbar whitespace-nowrap text-neutral-300 py-0.5">
          {/* Top Buy */}
          {highestBuy && (
            <div className="flex items-center gap-1.5 shrink-0">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-neutral-400">RECORD BUY:</span>
              <span className="font-bold text-white">{highestBuy.name}</span>
              <span className="text-amber-400 font-bold">{formatLakhs(highestBuy.sold_price_lakh!)}</span>
              {highestBuyTeam && (
                <span className="text-neutral-400">({highestBuyTeam.franchise_code})</span>
              )}
            </div>
          )}

          {/* Recent Solds */}
          {recentSold.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-neutral-400">RECENT BUYS:</span>
              {recentSold.map((p) => {
                const team = teams.find((t) => t.id === p.sold_to_team_id);
                return (
                  <span key={p.id} className="inline-flex items-center gap-1 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                    <span className="text-white font-semibold">{p.name}</span>
                    <span className="text-emerald-400 font-bold">{formatLakhs(p.sold_price_lakh!)}</span>
                    <span className="text-neutral-400">[{team?.franchise_code || 'SOLD'}]</span>
                  </span>
                );
              })}
            </div>
          )}

          {/* Purse Leader */}
          {purseLeader && (
            <div className="flex items-center gap-1.5 shrink-0">
              <Wallet className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-neutral-400">HIGHEST REMAINING PURSE:</span>
              <span className="font-bold text-white">{purseLeader.franchise_name}</span>
              <span className="text-blue-400 font-bold">{formatLakhs(purseLeader.remaining_purse_lakhs)}</span>
            </div>
          )}

          {/* Total Auction Progress */}
          {room && (
            <div className="flex items-center gap-1.5 shrink-0 text-neutral-400">
              <span>LOTS COMPLETED:</span>
              <span className="font-bold text-amber-300">
                {soldPlayers.length + players.filter((p) => p.status === 'unsold').length} / {players.length}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
