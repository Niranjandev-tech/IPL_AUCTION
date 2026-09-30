import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Gavel, CheckCircle, XCircle } from 'lucide-react';
import { formatLakhs } from '../../lib/rulesEngine';
import type { Player, RoomTeam } from '../../types/auction.types';
import { soundEffects } from '../../lib/soundEffects';

interface GavelStrikeOverlayProps {
  type: 'sold' | 'unsold';
  player: Player;
  winningTeam?: RoomTeam | null;
  amountLakh?: number;
  onClose: () => void;
}

export const GavelStrikeOverlay: React.FC<GavelStrikeOverlayProps> = ({
  type,
  player,
  winningTeam,
  amountLakh = 0,
  onClose,
}) => {
  useEffect(() => {
    if (type === 'sold') {
      soundEffects.playGavel();
      setTimeout(() => {
        soundEffects.playSoldFanfare();
      }, 300);

      // Trigger Confetti Explosion
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: winningTeam ? [winningTeam.primary_color, '#FFB800', '#FFFFFF'] : ['#FFB800', '#FFFFFF'],
      });
    } else {
      soundEffects.playWarning();
    }

    // Auto dismiss overlay after 3 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 3200);

    return () => clearTimeout(timer);
  }, [type, winningTeam]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4">
      <div className="relative max-w-lg w-full bg-[#0a0a0a] border border-amber-500/50 rounded-3xl p-8 text-center shadow-2xl overflow-hidden">
        {/* Ambient Glow */}
        <div
          className="absolute -inset-1 opacity-20 blur-xl rounded-3xl"
          style={{
            backgroundColor: type === 'sold' ? winningTeam?.primary_color || '#FFB800' : '#EF4444',
          }}
        />

        {/* Animated Gavel Icon */}
        <div className="relative mb-6 flex justify-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500/20 to-yellow-500/10 border-2 border-amber-500/40 flex items-center justify-center animate-bounce shadow-gold-glow">
            <Gavel className="w-12 h-12 text-amber-400 rotate-[-45deg]" />
          </div>
        </div>

        {/* Event Header */}
        <div className="relative space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-900 border border-neutral-700 text-xs font-mono font-bold tracking-widest uppercase">
            {type === 'sold' ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">LOT COMPLETED • SOLD</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-rose-400" />
                <span className="text-rose-400">LOT COMPLETED • UNSOLD</span>
              </>
            )}
          </div>

          <h2 className="text-3xl font-heading font-black text-white tracking-wide mt-2">
            {player.name}
          </h2>
          <p className="text-xs text-neutral-400 font-mono">
            {player.role} • {player.country} • {player.set_name}
          </p>

          {type === 'sold' && winningTeam ? (
            <div className="mt-6 p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-2">
              <div className="text-xs uppercase font-mono text-neutral-400">SOLD TO FRANCHISE</div>
              <div
                className="text-2xl font-black font-heading flex items-center justify-center gap-2"
                style={{ color: winningTeam.primary_color }}
              >
                <span>{winningTeam.logo_url}</span>
                <span>{winningTeam.franchise_name}</span>
              </div>
              <div className="text-3xl font-black font-mono gold-gradient-text mt-1">
                {formatLakhs(amountLakh)}
              </div>
            </div>
          ) : (
            <div className="mt-6 p-4 rounded-2xl bg-rose-950/20 border border-rose-900/50 text-rose-300 font-mono text-sm">
              No bids placed. Player enters unsold pool.
            </div>
          )}

          <button
            onClick={onClose}
            className="mt-6 text-xs text-neutral-400 hover:text-neutral-200 underline font-mono cursor-pointer"
          >
            Click to dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
