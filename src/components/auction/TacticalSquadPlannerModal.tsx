import React, { useState, useMemo } from 'react';
import { Search, Star, Play, Flame, X } from 'lucide-react';
import { useRoom } from '../../context/RoomContext';
import { formatLakhs } from '../../lib/rulesEngine';

interface TacticalSquadPlannerModalProps {
  onClose: () => void;
}

export const TacticalSquadPlannerModal: React.FC<TacticalSquadPlannerModalProps> = ({ onClose }) => {
  const { players, teams, currentTeam, myWatchlist, toggleWatchlist, isHost, nominatePlayer } = useRoom();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [overseasFilter, setOverseasFilter] = useState<string>('all');
  const [capFilter, setCapFilter] = useState<string>('all');
  const [showWishlistOnly, setShowWishlistOnly] = useState(false);

  // Filtered Players Calculation
  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      // Search query
      if (
        searchQuery &&
        !player.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !player.set_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(player.previous_team && player.previous_team.toLowerCase().includes(searchQuery.toLowerCase()))
      ) {
        return false;
      }

      // Role
      if (roleFilter !== 'all' && player.role !== roleFilter) return false;

      // Status
      if (statusFilter !== 'all' && player.status !== statusFilter) return false;

      // Overseas
      if (overseasFilter === 'overseas' && !player.is_overseas) return false;
      if (overseasFilter === 'indian' && player.is_overseas) return false;

      // Cap Status
      if (capFilter !== 'all' && player.cap_status !== capFilter) return false;

      // Wishlist filter
      if (showWishlistOnly && !myWatchlist.includes(player.id)) return false;

      return true;
    });
  }, [players, searchQuery, roleFilter, statusFilter, overseasFilter, capFilter, showWishlistOnly, myWatchlist]);

  // Wishlist calculations
  const wishlistedPlayers = useMemo(() => {
    return players.filter((p) => myWatchlist.includes(p.id));
  }, [players, myWatchlist]);

  const totalWishlistBasePrice = useMemo(() => {
    return wishlistedPlayers.reduce((sum, p) => sum + p.base_price_lakh, 0);
  }, [wishlistedPlayers]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 md:p-6 overflow-hidden">
      <div className="bg-[#0a0a0a] border border-neutral-800 rounded-3xl max-w-5xl w-full flex flex-col h-[90vh] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-neutral-950 font-black shadow-gold-glow">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-heading font-black text-white tracking-wide flex items-center gap-2">
                TACTICAL SQUAD PLANNER & DATABASE
              </h2>
              <p className="text-xs text-neutral-400 font-mono">
                Search, analyze career stats, & bookmark target players across all 677 auction lots.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl bg-neutral-900 border border-neutral-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wishlist Summary Bar */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 text-amber-300 font-semibold">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>MY TARGET WISHLIST: {wishlistedPlayers.length} PLAYERS BOOKMARKED</span>
          </div>

          <div className="flex items-center gap-4 text-neutral-300">
            <span>
              TOTAL EST. BASE PURSE: <strong className="text-amber-400 font-bold">{formatLakhs(totalWishlistBasePrice)}</strong>
            </span>
            {currentTeam && (
              <span>
                REMAINING PURSE: <strong className="text-emerald-400 font-bold">{formatLakhs(currentTeam.remaining_purse_lakhs)}</strong>
              </span>
            )}

            <button
              onClick={() => setShowWishlistOnly(!showWishlistOnly)}
              className={`px-3 py-1 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                showWishlistOnly
                  ? 'bg-amber-500 text-neutral-950 border-amber-400 font-bold'
                  : 'bg-neutral-900 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
              }`}
            >
              {showWishlistOnly ? 'Show All Players' : 'Show Wishlist Only'}
            </button>
          </div>
        </div>

        {/* Controls & Filter Bar */}
        <div className="p-4 bg-neutral-900/60 border-b border-neutral-800 flex flex-wrap gap-3 items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search player name, set, or team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 font-mono outline-none focus:border-amber-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-xl px-2.5 py-1.5 outline-none focus:border-amber-500"
            >
              <option value="all">Role: All</option>
              <option value="Batter">Batter</option>
              <option value="Bowler">Bowler</option>
              <option value="All-rounder">All-rounder</option>
              <option value="Wicketkeeper">Wicketkeeper</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-xl px-2.5 py-1.5 outline-none focus:border-amber-500"
            >
              <option value="all">Status: All</option>
              <option value="pending">Pending</option>
              <option value="nominated">Nominated</option>
              <option value="sold">Sold</option>
              <option value="unsold">Unsold</option>
            </select>

            {/* Overseas Filter */}
            <select
              value={overseasFilter}
              onChange={(e) => setOverseasFilter(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-xl px-2.5 py-1.5 outline-none focus:border-amber-500"
            >
              <option value="all">Origin: All</option>
              <option value="indian">Indian Only</option>
              <option value="overseas">Overseas Only</option>
            </select>

            {/* Cap Filter */}
            <select
              value={capFilter}
              onChange={(e) => setCapFilter(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-xl px-2.5 py-1.5 outline-none focus:border-amber-500"
            >
              <option value="all">Type: All</option>
              <option value="Capped">Capped</option>
              <option value="Uncapped">Uncapped</option>
            </select>
          </div>
        </div>

        {/* Player List Table */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredPlayers.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 font-mono text-sm">
              No players found matching current filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredPlayers.map((player) => {
                const isWishlisted = myWatchlist.includes(player.id);
                const soldTeam = player.sold_to_team_id
                  ? teams.find((t) => t.id === player.sold_to_team_id)
                  : null;

                return (
                  <div
                    key={player.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      player.status === 'nominated'
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-gold-glow'
                        : player.status === 'sold'
                        ? 'bg-neutral-950 border-neutral-800/80 opacity-80'
                        : 'bg-neutral-900/60 hover:bg-neutral-900 border-neutral-800'
                    }`}
                  >
                    {/* Left: Avatar & Info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-950 border border-neutral-700 flex items-center justify-center text-white font-black text-sm shadow-inner">
                          {player.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)}
                        </div>
                        {player.is_overseas && (
                          <span className="absolute -top-1 -right-1 text-xs" title="Overseas Player">
                            ✈️
                          </span>
                        )}
                      </div>

                      {/* Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-heading font-bold text-sm text-white truncate">
                            {player.name}
                          </h4>
                          {player.status === 'sold' && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.5 rounded font-mono font-bold">
                              SOLD
                            </span>
                          )}
                          {player.status === 'unsold' && (
                            <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/40 px-1.5 py-0.5 rounded font-mono font-bold">
                              UNSOLD
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-neutral-400 font-mono truncate">
                          {player.role} • {player.country} • {player.set_name}
                        </div>

                        {/* Career Stats Mini Pill */}
                        {player.stats && (
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-400 font-mono">
                            <span>M: {player.stats.matches || 0}</span>
                            <span>R: {player.stats.runs || 0}</span>
                            <span>W: {player.stats.wickets || 0}</span>
                            {player.stats.strike_rate && <span>SR: {player.stats.strike_rate}</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Pricing & Actions */}
                    <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                      {player.status === 'sold' && player.sold_price_lakh ? (
                        <div>
                          <div className="text-xs font-mono font-bold text-emerald-400">
                            {formatLakhs(player.sold_price_lakh)}
                          </div>
                          <div className="text-[10px] font-mono text-neutral-400">
                            {soldTeam?.franchise_code || 'SOLD'}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-[10px] uppercase font-mono text-neutral-400">BASE PRICE</div>
                          <div className="text-xs font-mono font-bold text-amber-300">
                            {formatLakhs(player.base_price_lakh)}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5">
                        {/* Wishlist Button */}
                        <button
                          onClick={() => toggleWatchlist(player.id)}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            isWishlisted
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                              : 'bg-neutral-900 text-neutral-500 border-neutral-800 hover:text-amber-400'
                          }`}
                          title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                        >
                          <Star className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-amber-400' : ''}`} />
                        </button>

                        {/* Host Nominate Direct Action */}
                        {isHost && player.status === 'pending' && (
                          <button
                            onClick={() => {
                              nominatePlayer(player.id);
                              onClose();
                            }}
                            className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 cursor-pointer"
                            title="Nominate for bidding now"
                          >
                            <Play className="w-3 h-3 fill-amber-300" /> Nominate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
