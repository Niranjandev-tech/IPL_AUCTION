import React, { useEffect, useState } from 'react';
import { useRoom } from '../../context/RoomContext';
import { Clock } from 'lucide-react';
import { soundEffects } from '../../lib/soundEffects';

export const CountdownTimer: React.FC = () => {
  const { room, soldPlayer, unsoldPlayer, isHost } = useRoom();
  const [timeLeft, setTimeLeft] = useState<number>(30);

  useEffect(() => {
    if (!room || !room.lot_ends_at || room.status === 'paused' || room.status === 'completed') {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const target = new Date(room.lot_ends_at!).getTime();
      const diff = Math.max(0, Math.ceil((target - now) / 1000));

      setTimeLeft(diff);

      if (diff <= 5 && diff > 0) {
        soundEffects.playTimerTick();
      }

      if (diff === 0 && room.mode === 'auto' && isHost) {
        clearInterval(interval);
        if (room.current_bidder_id) {
          soldPlayer();
        } else {
          unsoldPlayer();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [room?.lot_ends_at, room?.status, room?.mode, isHost]);

  if (!room) return null;

  const isLow = timeLeft <= 5;
  const isPaused = room.status === 'paused';

  return (
    <div
      className={`glass-panel rounded-2xl p-4 border text-center transition-all bg-[#0a0a0a] ${
        isLow && !isPaused
          ? 'border-rose-500/80 bg-rose-950/20 shadow-gold-glow animate-pulse'
          : 'border-neutral-800'
      }`}
    >
      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 mb-1 flex items-center justify-center gap-1.5">
        <Clock className={`w-3.5 h-3.5 ${isLow ? 'text-rose-400' : 'text-amber-400'}`} />
        {isPaused ? 'LOT TIMER PAUSED' : 'LOT TIMER'}
      </div>

      <div className={`font-heading font-black text-4xl md:text-5xl font-mono tracking-tight ${
        isPaused
          ? 'text-neutral-500'
          : isLow
          ? 'text-rose-400'
          : 'gold-gradient-text'
      }`}>
        {isPaused ? 'PAUSED' : `${timeLeft}s`}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-black h-2 rounded-full mt-3 overflow-hidden border border-neutral-800">
        <div
          className={`h-full transition-all duration-1000 ${
            isLow ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-400 to-yellow-400'
          }`}
          style={{ width: `${Math.min(100, (timeLeft / 30) * 100)}%` }}
        />
      </div>
    </div>
  );
};

