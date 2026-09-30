import React from 'react';
import type { Player } from '../../types/auction.types';
import { formatLakhs } from '../../lib/rulesEngine';
import { Star } from 'lucide-react';
import { useRoom } from '../../context/RoomContext';
import { PlayerAvatar } from '../common/PlayerAvatar';

interface PlayerCardProps {
  player: Player | null;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player }) => {
  const { myWatchlist, toggleWatchlist } = useRoom();

  if (!player) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center border border-neutral-800 flex flex-col items-center justify-center min-h-[380px] bg-[#0a0a0a]">
        <div className="w-12 h-12 rounded-full bg-black border border-neutral-800 flex items-center justify-center text-neutral-500 animate-pulse mb-3">
          🏏
        </div>
        <h3 className="font-heading text-xl font-bold text-neutral-400">WAITING FOR NEXT PLAYER LOT</h3>
        <p className="text-xs text-neutral-500 max-w-sm mt-1">
          The host will present the next player on the auction block shortly.
        </p>
      </div>
    );
  }

  const isStarred = myWatchlist.includes(player.id);

  return (
    <div className="glass-panel rounded-2xl border border-amber-500/30 overflow-hidden shadow-broadcast relative group bg-[#0a0a0a]">
      {/* Set Badge Header Bar */}
      <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-transparent px-5 py-2.5 border-b border-amber-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
            {player.set_name}
          </span>
        </div>
        <button
          onClick={() => toggleWatchlist(player.id)}
          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
            isStarred
              ? 'bg-amber-500/20 text-amber-400 border-amber-400/50'
              : 'bg-black/60 text-neutral-400 border-neutral-800 hover:text-amber-300'
          }`}
          title={isStarred ? 'Remove from Watchlist' : 'Add to Watchlist'}
        >
          <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400' : ''}`} />
        </button>
      </div>

      <div className="p-5 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Player Avatar */}
        <div className="md:col-span-4 flex flex-col items-center">
          <PlayerAvatar
            name={player.name}
            role={player.role}
            country={player.country}
            isOverseas={player.is_overseas}
            previousTeam={player.previous_team}
            imageUrl={player.image_url}
            size="xl"
          />
        </div>

        {/* Player Meta */}
        <div className="md:col-span-8 space-y-4 text-left">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="bg-amber-400/10 text-amber-300 border border-amber-400/30 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                {player.role}
              </span>
              {player.sub_role && (
                <span className="bg-neutral-900 text-neutral-300 text-xs px-2.5 py-0.5 rounded-full font-medium border border-neutral-800">
                  {player.sub_role}
                </span>
              )}
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                  player.cap_status === 'Capped'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/15 text-amber-200 border border-amber-500/30'
                }`}
              >
                {player.cap_status}
              </span>
            </div>

            <h2 className="font-heading text-2xl md:text-3xl font-black text-neutral-100 tracking-tight">
              {player.name}
            </h2>
            <div className="text-xs text-neutral-400 flex items-center gap-3 mt-1 font-mono">
              <span>AGE: <strong className="text-neutral-200">{player.age}</strong></span>
              {player.previous_team && (
                <span>PREV TEAM: <strong className="text-amber-300">{player.previous_team}</strong></span>
              )}
            </div>
          </div>

          {/* Stats Bar Grid */}
          {player.stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-black/80 p-3 rounded-xl border border-neutral-800 text-center">
              {player.stats.matches !== undefined && (
                <div>
                  <div className="text-[10px] text-neutral-500 uppercase font-mono">MATCHES</div>
                  <div className="text-sm font-bold text-neutral-200">{player.stats.matches}</div>
                </div>
              )}
              {player.stats.runs !== undefined && (
                <div>
                  <div className="text-[10px] text-neutral-500 uppercase font-mono">RUNS</div>
                  <div className="text-sm font-bold text-amber-300">{player.stats.runs}</div>
                </div>
              )}
              {player.stats.batting_avg !== undefined && (
                <div>
                  <div className="text-[10px] text-neutral-500 uppercase font-mono">AVG</div>
                  <div className="text-sm font-bold text-neutral-200">{player.stats.batting_avg}</div>
                </div>
              )}
              {player.stats.strike_rate !== undefined && (
                <div>
                  <div className="text-[10px] text-neutral-500 uppercase font-mono">STRIKE RATE</div>
                  <div className="text-sm font-bold text-amber-300">{player.stats.strike_rate}</div>
                </div>
              )}
              {player.stats.wickets !== undefined && (
                <div>
                  <div className="text-[10px] text-neutral-500 uppercase font-mono">WICKETS</div>
                  <div className="text-sm font-bold text-emerald-300">{player.stats.wickets}</div>
                </div>
              )}
              {player.stats.economy !== undefined && (
                <div>
                  <div className="text-[10px] text-neutral-500 uppercase font-mono">ECONOMY</div>
                  <div className="text-sm font-bold text-rose-300">{player.stats.economy}</div>
                </div>
              )}
            </div>
          )}

          {/* Base Price Callout Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
            <span className="text-xs text-neutral-400 font-mono uppercase">BASE PRICE</span>
            <span className="font-heading font-black text-xl text-amber-400">
              {formatLakhs(player.base_price_lakh)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

