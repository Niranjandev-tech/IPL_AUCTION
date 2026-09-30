import React from 'react';
import { useRoom } from '../../context/RoomContext';
import { ShieldAlert, CheckCircle, Users } from 'lucide-react';

export const HostApprovalQueue: React.FC = () => {
  const { teams, approveTeam, isHost } = useRoom();

  const pendingTeams = teams.filter((t) => !t.is_approved && !t.is_spectator);
  const approvedTeams = teams.filter((t) => t.is_approved && !t.is_spectator);
  const spectators = teams.filter((t) => t.is_spectator);

  return (
    <div className="glass-panel rounded-2xl p-5 border border-neutral-800 shadow-broadcast bg-[#0a0a0a]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold text-lg text-neutral-100 flex items-center gap-2">
          <Users className="w-5 h-5 text-amber-400" /> ROOM MEMBERS ({teams.length})
        </h3>
        <span className="text-xs font-mono text-neutral-400 bg-black px-2.5 py-1 rounded-md border border-neutral-800">
          {approvedTeams.length} APPROVED / 10 TEAMS
        </span>
      </div>

      {isHost && pendingTeams.length > 0 && (
        <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
          <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5 mb-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" /> PENDING HOST APPROVAL ({pendingTeams.length})
          </div>
          <div className="space-y-2">
            {pendingTeams.map((team) => (
              <div
                key={team.id}
                className="flex items-center justify-between bg-black/80 p-2.5 rounded-lg border border-neutral-800"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{team.logo_url}</span>
                  <div>
                    <div className="font-bold text-xs text-neutral-200">{team.franchise_name}</div>
                    <div className="text-[10px] text-neutral-400 font-mono">
                      Manager: {team.user_profile?.display_name || 'User'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => approveTeam(team.id)}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs rounded-md transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> APPROVE
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {approvedTeams.map((team) => (
          <div
            key={team.id}
            className="flex items-center justify-between p-2.5 rounded-xl bg-black/60 border"
            style={{ borderColor: `${team.primary_color}40` }}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{team.logo_url}</span>
              <div>
                <div className="font-heading font-bold text-xs text-neutral-100 flex items-center gap-1.5">
                  {team.franchise_name}
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-[10px] text-neutral-400 font-mono">
                  {team.user_profile?.display_name || 'Manager'}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono font-bold text-amber-300">
                ₹{(team.remaining_purse_lakhs / 100).toFixed(0)} Cr
              </div>
              <div className="text-[10px] text-neutral-500">Purse</div>
            </div>
          </div>
        ))}
      </div>

      {spectators.length > 0 && (
        <div className="mt-4 pt-3 border-t border-neutral-800 text-xs text-neutral-400 flex items-center justify-between">
          <span>Spectators in room:</span>
          <span className="font-mono text-amber-400">{spectators.length} watching</span>
        </div>
      )}
    </div>
  );
};

