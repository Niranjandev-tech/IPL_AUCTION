import React, { useState, useMemo } from 'react';
import { useRoom } from '../../context/RoomContext';
import type { Player, PlayerRole } from '../../types/auction.types';
import {
  Sliders,
  Search,
  CheckCircle2,
  XCircle,
  Play,
  UserCheck,
  X,
  Layers,
  Sparkles,
  Users
} from 'lucide-react';

interface HostCategoryManagerProps {
  onClose: () => void;
}

export const HostCategoryManager: React.FC<HostCategoryManagerProps> = ({ onClose }) => {
  const { players, currentPlayer, nominatePlayer, selectCategorySet } = useRoom();
  const [activeTab, setActiveTab] = useState<'categories' | 'players'>('categories');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<PlayerRole | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'pending' | 'sold' | 'unsold'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Compute stats across 500 players pool
  const poolStats = useMemo(() => {
    const total = players.length;
    const pending = players.filter((p) => p.status === 'pending').length;
    const nominated = players.filter((p) => p.status === 'nominated').length;
    const sold = players.filter((p) => p.status === 'sold').length;
    const unsold = players.filter((p) => p.status === 'unsold').length;
    return { total, pending, nominated, sold, unsold };
  }, [players]);

  // Group players by set_name
  const categoryGroups = useMemo(() => {
    const groups: { [setName: string]: { name: string; order: number; players: Player[] } } = {};

    players.forEach((p) => {
      const setKey = p.set_name || 'Other Pool';
      if (!groups[setKey]) {
        groups[setKey] = {
          name: setKey,
          order: p.set_order || 99,
          players: [],
        };
      }
      groups[setKey].players.push(p);
    });

    return Object.values(groups).sort((a, b) => a.order - b.order);
  }, [players]);

  // Filter players list
  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.previous_team && p.previous_team.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.sub_role && p.sub_role.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesRole = selectedRole === 'ALL' || p.role === selectedRole;
      const matchesStatus = selectedStatus === 'ALL' || p.status === selectedStatus;
      const matchesCategory = selectedCategory === 'ALL' || p.set_name === selectedCategory;

      return matchesSearch && matchesRole && matchesStatus && matchesCategory;
    });
  }, [players, searchTerm, selectedRole, selectedStatus, selectedCategory]);

  const handleNominate = async (playerId: string) => {
    await nominatePlayer(playerId);
    onClose();
  };

  const handleSelectSet = async (setName: string) => {
    await selectCategorySet(setName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="glass-panel border border-amber-500/40 rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-broadcast overflow-hidden bg-[#0a0a0a]">
        {/* Header */}
        <div className="bg-[#111111] border-b border-amber-500/30 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-gold-glow">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-amber-500/30 uppercase">
                  HOST AUCTIONEER CENTER
                </span>
                <span className="text-xs font-mono font-bold text-neutral-400">
                  {poolStats.total} PLAYERS POOL
                </span>
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-black text-neutral-100 gold-gradient-text">
                MANAGE CATEGORIES & NOMINATE PLAYERS
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-black hover:bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pool Summary Stats */}
        <div className="bg-black/60 border-b border-neutral-800 px-5 py-3 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="bg-neutral-900/80 p-2 rounded-xl border border-neutral-800">
            <div className="text-[10px] font-mono text-neutral-400 uppercase">TOTAL POOL</div>
            <div className="font-heading font-black text-lg text-neutral-200">{poolStats.total}</div>
          </div>
          <div className="bg-amber-500/10 p-2 rounded-xl border border-amber-500/30">
            <div className="text-[10px] font-mono text-amber-300 uppercase">PENDING</div>
            <div className="font-heading font-black text-lg text-amber-400">{poolStats.pending}</div>
          </div>
          <div className="bg-amber-500/15 p-2 rounded-xl border border-amber-500/40">
            <div className="text-[10px] font-mono text-amber-200 uppercase">NOMINATED</div>
            <div className="font-heading font-black text-lg text-amber-300">{poolStats.nominated}</div>
          </div>
          <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/30">
            <div className="text-[10px] font-mono text-emerald-300 uppercase">SOLD</div>
            <div className="font-heading font-black text-lg text-emerald-400">{poolStats.sold}</div>
          </div>
          <div className="bg-rose-500/10 p-2 rounded-xl border border-rose-500/30">
            <div className="text-[10px] font-mono text-rose-300 uppercase">UNSOLD</div>
            <div className="font-heading font-black text-lg text-rose-400">{poolStats.unsold}</div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-neutral-800 bg-black/40 px-5 pt-3 gap-3">
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-5 py-2.5 rounded-t-xl font-heading font-bold text-xs transition-colors flex items-center gap-2 border-t border-x cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-neutral-900 border-amber-500/40 text-amber-300 shadow-sm'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers className="w-4 h-4" /> CATEGORY SETS ({categoryGroups.length})
          </button>
          <button
            onClick={() => setActiveTab('players')}
            className={`px-5 py-2.5 rounded-t-xl font-heading font-bold text-xs transition-colors flex items-center gap-2 border-t border-x cursor-pointer ${
              activeTab === 'players'
                ? 'bg-neutral-900 border-amber-500/40 text-amber-300 shadow-sm'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Users className="w-4 h-4" /> ALL 500 PLAYERS SEARCH ({filteredPlayers.length})
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {activeTab === 'categories' ? (
            /* Category Sets View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryGroups.map((group) => {
                const totalInGroup = group.players.length;
                const pendingInGroup = group.players.filter((p) => p.status === 'pending').length;
                const soldInGroup = group.players.filter((p) => p.status === 'sold').length;
                const unsoldInGroup = group.players.filter((p) => p.status === 'unsold').length;

                return (
                  <div
                    key={group.name}
                    className="glass-panel rounded-2xl p-4 border border-neutral-800 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-4 group bg-black/60"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold bg-neutral-900 text-amber-300 px-2 py-0.5 rounded border border-neutral-800">
                          SET #{group.order}
                        </span>
                        <span className="text-xs font-mono font-bold text-neutral-400">
                          {totalInGroup} Players
                        </span>
                      </div>

                      <h3 className="font-heading font-black text-lg text-neutral-100 group-hover:text-amber-300 transition-colors">
                        {group.name}
                      </h3>

                      {/* Progress Bar */}
                      <div className="w-full bg-black h-2 rounded-full overflow-hidden flex my-3 border border-neutral-800">
                        <div
                          className="bg-emerald-500 h-full transition-all"
                          style={{ width: `${(soldInGroup / totalInGroup) * 100}%` }}
                          title={`Sold: ${soldInGroup}`}
                        />
                        <div
                          className="bg-rose-500 h-full transition-all"
                          style={{ width: `${(unsoldInGroup / totalInGroup) * 100}%` }}
                          title={`Unsold: ${unsoldInGroup}`}
                        />
                        <div
                          className="bg-amber-400 h-full transition-all"
                          style={{ width: `${(pendingInGroup / totalInGroup) * 100}%` }}
                          title={`Pending: ${pendingInGroup}`}
                        />
                      </div>

                      {/* Status Counts Pill */}
                      <div className="flex items-center gap-3 text-xs font-mono">
                        <span className="text-amber-300">{pendingInGroup} Pending</span>
                        <span className="text-neutral-600">•</span>
                        <span className="text-emerald-400">{soldInGroup} Sold</span>
                        <span className="text-neutral-600">•</span>
                        <span className="text-rose-400">{unsoldInGroup} Unsold</span>
                      </div>
                    </div>

                    <button
                      disabled={pendingInGroup === 0}
                      onClick={() => handleSelectSet(group.name)}
                      className="w-full py-2.5 rounded-xl font-heading font-bold text-xs bg-amber-400 hover:bg-amber-300 text-neutral-950 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-neutral-950" />
                      {pendingInGroup > 0 ? `START "${group.name.toUpperCase()}"` : 'SET COMPLETED'}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Players List & Search View */
            <div className="space-y-4">
              {/* Filters Control Bar */}
              <div className="glass-panel p-4 rounded-2xl border border-neutral-800 space-y-3 bg-black/60">
                <div className="flex flex-col md:flex-row items-center gap-3">
                  {/* Search Input */}
                  <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search player name, country, role, team..."
                      className="w-full bg-black border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-400 font-sans"
                    />
                  </div>

                  {/* Category Dropdown */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-black border border-neutral-800 text-xs font-mono text-neutral-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-400 w-full md:w-auto cursor-pointer"
                  >
                    <option value="ALL">All Categories / Sets</option>
                    {categoryGroups.map((g) => (
                      <option key={g.name} value={g.name}>
                        {g.name} ({g.players.length})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-neutral-800/80">
                  {/* Role Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-mono text-neutral-400 uppercase mr-1">ROLE:</span>
                    {(['ALL', 'Batter', 'Bowler', 'All-rounder', 'Wicketkeeper'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setSelectedRole(r)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                          selectedRole === r
                            ? 'bg-amber-400 text-neutral-950 font-bold'
                            : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>

                  {/* Status Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-mono text-neutral-400 uppercase mr-1">STATUS:</span>
                    {(['ALL', 'pending', 'sold', 'unsold'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedStatus(s)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono uppercase transition-colors cursor-pointer ${
                          selectedStatus === s
                            ? 'bg-amber-400 text-neutral-950 font-bold'
                            : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Player Cards List Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredPlayers.slice(0, 100).map((player) => {
                  const isCurrent = currentPlayer?.id === player.id;

                  return (
                    <div
                      key={player.id}
                      className={`glass-panel rounded-2xl p-4 border transition-all flex items-center justify-between gap-4 bg-black/70 ${
                        isCurrent
                          ? 'border-amber-400 bg-amber-500/10 shadow-gold-glow'
                          : player.status === 'sold'
                          ? 'border-emerald-500/30 opacity-70 bg-neutral-950/40'
                          : player.status === 'unsold'
                          ? 'border-rose-500/30 bg-black/40'
                          : 'border-neutral-800 hover:border-amber-500/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={player.image_url}
                          alt={player.name}
                          className="w-12 h-12 rounded-xl object-cover border border-neutral-800"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-heading font-black text-sm text-neutral-100">
                              {player.name}
                            </span>
                            {player.is_overseas && (
                              <span className="text-[10px] bg-amber-500/15 text-amber-300 px-1.5 py-0.5 rounded font-mono border border-amber-500/30">
                                ✈️ OVERSEAS
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-neutral-400 font-mono mt-0.5 flex flex-wrap items-center gap-2">
                            <span>{player.country}</span>
                            <span>•</span>
                            <span className="text-amber-300">{player.role}</span>
                            <span>•</span>
                            <span className="text-amber-400">{player.set_name}</span>
                          </div>

                          <div className="text-[11px] font-mono text-neutral-400 mt-1">
                            Base: <span className="text-amber-300 font-bold">₹{player.base_price_lakh} Lakhs</span>
                            {player.previous_team && (
                              <span className="ml-2 text-neutral-500">Ex-{player.previous_team}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Action / Status */}
                      <div>
                        {player.status === 'sold' ? (
                          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> SOLD
                          </span>
                        ) : player.status === 'unsold' ? (
                          <div className="flex flex-col items-end gap-1">
                            <span className="px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> UNSOLD
                            </span>
                            <button
                              onClick={() => handleNominate(player.id)}
                              className="px-2.5 py-1 rounded-lg bg-amber-400 text-neutral-950 font-heading font-black text-[10px] hover:bg-amber-300 transition-colors cursor-pointer"
                            >
                              RE-AUCTION
                            </button>
                          </div>
                        ) : isCurrent ? (
                          <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold flex items-center gap-1 animate-pulse">
                            <UserCheck className="w-3.5 h-3.5" /> LIVE NOW
                          </span>
                        ) : (
                          <button
                            onClick={() => handleNominate(player.id)}
                            className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-heading font-black text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" /> NOMINATE
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredPlayers.length > 100 && (
                <div className="text-center text-xs font-mono text-neutral-500 py-2">
                  Showing top 100 matching results of {filteredPlayers.length} players. Refine search for specific players.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

