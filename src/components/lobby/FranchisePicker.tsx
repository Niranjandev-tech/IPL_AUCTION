import React, { useState } from 'react';
import { FRANCHISES } from '../../data/franchises';
import type { FranchiseCode } from '../../types/auction.types';
import { useRoom } from '../../context/RoomContext';
import { ShieldCheck, Eye, CheckCircle2 } from 'lucide-react';

interface FranchisePickerProps {
  onSelectFranchise: (code: FranchiseCode, isSpectator: boolean) => void;
}

export const FranchisePicker: React.FC<FranchisePickerProps> = ({ onSelectFranchise }) => {
  const { teams } = useRoom();
  const [selectedCode, setSelectedCode] = useState<FranchiseCode | null>(null);
  const [isSpectatorMode, setIsSpectatorMode] = useState(false);

  // List of team codes already claimed by registered managers in this room
  const takenFranchises = teams
    .filter((t) => !t.is_spectator)
    .map((t) => t.franchise_code);

  // Filter out chosen teams so ONLY unchosen teams are shown to new players entering
  const availableFranchises = (Object.keys(FRANCHISES) as FranchiseCode[]).filter(
    (code) => !takenFranchises.includes(code)
  );

  const handleConfirm = () => {
    if (isSpectatorMode) {
      onSelectFranchise(availableFranchises[0] || 'CSK', true);
    } else if (selectedCode) {
      onSelectFranchise(selectedCode, false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-neutral-800 max-w-4xl mx-auto shadow-broadcast bg-[#0a0a0a]">
      <div className="text-center mb-6">
        <h2 className="font-heading text-2xl font-extrabold gold-gradient-text">
          CHOOSE YOUR IPL FRANCHISE
        </h2>
        <p className="text-neutral-400 text-sm mt-1">
          Select an available franchise to enter as manager. Claimed teams are hidden.
        </p>
      </div>

      {availableFranchises.length === 0 ? (
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl text-center font-mono text-sm text-amber-300 mb-6">
          🔒 All 10 IPL Franchises have been claimed by managers in this room! You can join as a spectator.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
          {availableFranchises.map((code) => {
            const franchise = FRANCHISES[code];
            const isSelected = selectedCode === code && !isSpectatorMode;

            return (
              <button
                key={code}
                onClick={() => {
                  setSelectedCode(code);
                  setIsSpectatorMode(false);
                }}
                className={`relative rounded-xl p-4 flex flex-col items-center justify-between border-2 transition-all duration-200 group text-left min-h-[140px] cursor-pointer ${
                  isSelected
                    ? 'border-amber-400 bg-neutral-900 shadow-gold-glow scale-105 z-10'
                    : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700 hover:bg-neutral-900'
                }`}
              >
                <div
                  className="w-full h-1.5 rounded-full mb-2"
                  style={{ backgroundColor: franchise.primaryColor }}
                />

                <div className="text-3xl my-1 group-hover:scale-110 transition-transform">
                  {franchise.logo}
                </div>

                <div className="text-center w-full">
                  <div className="font-heading font-black text-sm text-neutral-100">
                    {franchise.shortName}
                  </div>
                  <div className="text-[10px] text-neutral-400 truncate">{franchise.city}</div>
                </div>

                {isSelected && (
                  <div className="absolute top-2 right-2 text-amber-400">
                    <CheckCircle2 className="w-4 h-4 fill-amber-400 text-neutral-950" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-3 my-4">
        <div className="h-px bg-neutral-800 flex-1" />
        <span className="text-xs text-neutral-500 uppercase font-mono tracking-wider">OR</span>
        <div className="h-px bg-neutral-800 flex-1" />
      </div>

      <button
        onClick={() => {
          setIsSpectatorMode(true);
          setSelectedCode(null);
        }}
        className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
          isSpectatorMode
            ? 'border-amber-400 bg-amber-500/10 text-amber-300 shadow-gold-glow'
            : 'border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Eye className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="font-heading font-bold text-sm text-neutral-200">Join as Spectator</div>
            <div className="text-xs text-neutral-400">Watch the live auction, follow bids, and join room chat.</div>
          </div>
        </div>
        {isSpectatorMode && <CheckCircle2 className="w-5 h-5 text-amber-400" />}
      </button>

      <button
        disabled={!selectedCode && !isSpectatorMode}
        onClick={handleConfirm}
        className="w-full mt-6 py-3.5 rounded-xl font-heading font-black text-neutral-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed shadow-gold-glow transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <ShieldCheck className="w-5 h-5" />
        {isSpectatorMode
          ? 'CONFIRM SPECTATOR JOIN'
          : selectedCode
          ? `CONFIRM SELECTION: ${FRANCHISES[selectedCode].name}`
          : 'SELECT A FRANCHISE TO CONTINUE'}
      </button>
    </div>
  );
};
