import React, { useRef } from 'react';
import { useRoom } from '../../context/RoomContext';
import { FRANCHISES } from '../../data/franchises';
import type { FranchiseCode } from '../../types/auction.types';
import { formatLakhs } from '../../lib/rulesEngine';
import { Trophy, Download, Award, Users, RefreshCw } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { IPL_SEASON } from '../../config/constants';

export const AuctionResultsView: React.FC = () => {
  const { room, teams, players, leaveRoom } = useRoom();
  const printRef = useRef<HTMLDivElement>(null);

  const soldPlayers = players.filter((p) => p.status === 'sold');
  const unsoldPlayers = players.filter((p) => p.status === 'unsold');
  const totalSpentLakhs = soldPlayers.reduce((acc, p) => acc + (p.sold_price_lakh || 0), 0);

  // Find top buys
  const topBuys = [...soldPlayers]
    .sort((a, b) => (b.sold_price_lakh || 0) - (a.sold_price_lakh || 0))
    .slice(0, 5);

  const exportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Player Name,Role,Country,Status,Bought By,Price (Lakhs),Price (Cr)\n";
    players.forEach((p) => {
      const team = teams.find((t) => t.id === p.sold_to_team_id);
      const teamName = team ? team.franchise_name : (p.status === 'sold' ? 'Sold' : 'Unsold');
      const priceLakh = p.sold_price_lakh || 0;
      const priceCr = (priceLakh / 100).toFixed(2);
      csvContent += `"${p.name}","${p.role}","${p.country}","${p.status}","${teamName}",${priceLakh},${priceCr}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${room?.code || 'IPL'}_Auction_Summary.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = async () => {
    if (!printRef.current) return;
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: '#000000' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${room?.code || 'IPL'}_Auction_Summary.pdf`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 bg-black">
      {/* Top Banner */}
      <div className="glass-panel rounded-3xl p-6 border border-amber-500/40 text-center relative overflow-hidden shadow-broadcast bg-[#0a0a0a]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left space-y-1">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-1 rounded-full text-xs font-mono font-bold">
              <Trophy className="w-4 h-4 text-amber-400" /> {IPL_SEASON} AUCTION COMPLETED
            </div>
            <h1 className="font-heading font-black text-3xl md:text-4xl gold-gradient-text">
              OFFICIAL AUCTION RESULTS
            </h1>
            <p className="text-xs text-neutral-400 font-mono">ROOM CODE: {room?.code}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={exportCSV}
              className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-amber-500/30 font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" /> EXPORT CSV
            </button>

            <button
              onClick={exportPDF}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-neutral-950 font-heading font-black text-xs rounded-xl shadow-gold-glow transition-all flex items-center gap-2 cursor-pointer"
            >
              <Award className="w-4 h-4" /> DOWNLOAD PDF REPORT
            </button>

            <button
              onClick={leaveRoom}
              className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> BACK TO DASHBOARD
            </button>
          </div>
        </div>
      </div>

      <div ref={printRef} className="space-y-8 p-4 bg-black rounded-3xl border border-neutral-900">
        {/* High-level Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="glass-panel p-4 rounded-2xl border border-neutral-800 bg-[#0a0a0a]">
            <div className="text-xs font-mono text-neutral-400 uppercase">TOTAL PLAYERS SOLD</div>
            <div className="font-heading font-black text-2xl text-emerald-400">{soldPlayers.length}</div>
          </div>
          <div className="glass-panel p-4 rounded-2xl border border-neutral-800 bg-[#0a0a0a]">
            <div className="text-xs font-mono text-neutral-400 uppercase">UNSOLD PLAYERS</div>
            <div className="font-heading font-black text-2xl text-rose-400">{unsoldPlayers.length}</div>
          </div>
          <div className="glass-panel p-4 rounded-2xl border border-neutral-800 bg-[#0a0a0a]">
            <div className="text-xs font-mono text-neutral-400 uppercase">TOTAL AUCTION SPEND</div>
            <div className="font-heading font-black text-2xl text-amber-400">{formatLakhs(totalSpentLakhs)}</div>
          </div>
          <div className="glass-panel p-4 rounded-2xl border border-neutral-800 bg-[#0a0a0a]">
            <div className="text-xs font-mono text-neutral-400 uppercase">TEAMS PARTICIPATED</div>
            <div className="font-heading font-black text-2xl text-neutral-200">{teams.length}</div>
          </div>
        </div>

        {/* Top Buys Callout */}
        {topBuys.length > 0 && (
          <div className="glass-panel rounded-2xl p-5 border border-amber-500/30 bg-[#0a0a0a]">
            <h3 className="font-heading font-bold text-lg text-amber-300 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" /> TOP 5 MOST EXPENSIVE BUYS
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {topBuys.map((player, idx) => {
                const team = teams.find((t) => t.id === player.sold_to_team_id);
                return (
                  <div
                    key={player.id}
                    className="bg-black p-3 rounded-xl border border-neutral-800 flex flex-col justify-between"
                  >
                    <div>
                      <div className="text-[10px] font-mono text-amber-400 uppercase font-bold">
                        #{idx + 1} TOP BUY
                      </div>
                      <div className="font-heading font-black text-sm text-neutral-100 mt-1">
                        {player.name}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono">{player.role} • {player.country}</div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-neutral-900 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-neutral-300">{team?.franchise_code}</span>
                      <span className="font-mono font-extrabold text-xs text-amber-400">
                        {formatLakhs(player.sold_price_lakh || 0)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Franchise Squads Breakdown */}
        <div className="space-y-4">
          <h3 className="font-heading font-bold text-xl text-neutral-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" /> FRANCHISE SQUAD BREAKDOWN
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Object.keys(FRANCHISES) as FranchiseCode[]).map((code) => {
              const franchise = FRANCHISES[code];
              const team = teams.find((t) => t.franchise_code === code);
              const teamSquad = players.filter((p) => p.sold_to_team_id === team?.id);

              const spent = teamSquad.reduce((acc, p) => acc + (p.sold_price_lakh || 0), 0);
              const overseas = teamSquad.filter((p) => p.is_overseas).length;

              return (
                <div
                  key={code}
                  className="glass-panel rounded-2xl p-5 border border-neutral-800 bg-[#0a0a0a] space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{franchise.logo}</span>
                      <div>
                        <div className="font-heading font-black text-base text-neutral-100">
                          {franchise.name}
                        </div>
                        <div className="text-[10px] text-neutral-400 font-mono">
                          Manager: {team?.user_profile?.display_name || 'Spectator'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-extrabold text-sm text-amber-300">
                        ₹{(spent / 100).toFixed(2)} Cr Spent
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono">
                        Purse Left: ₹{((team?.remaining_purse_lakhs || 0) / 100).toFixed(2)} Cr
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
                    <span>Squad Size: <strong className="text-neutral-200">{teamSquad.length}/25</strong></span>
                    <span>Overseas: <strong className="text-amber-400">{overseas}/8</strong></span>
                  </div>

                  {/* Player List */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {teamSquad.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-black text-xs font-mono border border-neutral-900"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-200 font-bold">{p.name}</span>
                          <span className="text-[10px] text-neutral-400">({p.role})</span>
                          {p.is_overseas && <span className="text-[9px] text-amber-400">✈️</span>}
                        </div>
                        <span className="font-bold text-amber-300">{formatLakhs(p.sold_price_lakh || 0)}</span>
                      </div>
                    ))}
                    {teamSquad.length === 0 && (
                      <div className="text-xs text-neutral-600 font-mono italic p-2">No players bought yet.</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
