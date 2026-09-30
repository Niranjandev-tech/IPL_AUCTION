import React, { useState, useEffect } from 'react';
import { LogIn, ArrowRight, Radio } from 'lucide-react';

interface JoinRoomModalProps {
  onJoinCode: (code: string) => void;
  onCancel: () => void;
}

interface ActiveRoomItem {
  code: string;
  name: string;
  updated_at: string;
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({ onJoinCode, onCancel }) => {
  const [code, setCode] = useState('');
  const [activeRooms, setActiveRooms] = useState<ActiveRoomItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ipl_auction_active_rooms');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setActiveRooms(parsed);
        }
      }
    } catch (err) {
      console.error('Failed to load active rooms list:', err);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    onJoinCode(code.trim().toUpperCase());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel rounded-2xl border border-amber-500/30 p-6 max-w-md w-full shadow-broadcast space-y-5 bg-[#0a0a0a]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-3 shadow-gold-glow">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="font-heading text-2xl font-extrabold text-neutral-100 gold-gradient-text">JOIN AUCTION ROOM</h2>
          <p className="text-xs text-neutral-400 mt-1">
            Enter room code or select an active room created on this system.
          </p>
        </div>

        {activeRooms.length > 0 && (
          <div className="space-y-2">
            <label className="block text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 animate-pulse text-amber-400" /> ACTIVE ROOMS ON LOCAL NETWORK
            </label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {activeRooms.map((r) => (
                <button
                  key={r.code}
                  type="button"
                  onClick={() => onJoinCode(r.code)}
                  className="w-full text-left p-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div>
                    <div className="font-heading font-bold text-sm text-neutral-200 group-hover:text-amber-300">
                      {r.name}
                    </div>
                    <div className="text-[10px] font-mono text-amber-400">CODE: {r.code}</div>
                  </div>
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/30 flex items-center gap-1">
                    JOIN <ArrowRight className="w-3 h-3" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold text-neutral-300 uppercase mb-1.5">
              MANUAL ROOM CODE
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. IPL-7892"
              className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 text-center text-lg font-mono font-bold tracking-widest text-amber-300 focus:outline-none focus:border-amber-400 uppercase"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="w-1/2 py-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 font-bold rounded-xl text-xs transition-colors border border-neutral-800 cursor-pointer"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="w-1/2 py-3 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-neutral-950 font-heading font-black rounded-xl text-xs shadow-gold-glow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>JOIN ROOM</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


