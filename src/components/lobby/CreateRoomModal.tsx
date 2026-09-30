import React, { useState } from 'react';
import { useRoom } from '../../context/RoomContext';
import { Trophy, ArrowRight, ShieldCheck } from 'lucide-react';
import { IPL_SEASON } from '../../config/constants';

interface CreateRoomModalProps {
  onCreated: (code: string) => void;
  onCancel: () => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ onCreated, onCancel }) => {
  const { createRoom } = useRoom();
  const [roomName, setRoomName] = useState(`Friends Mega Auction ${IPL_SEASON}`);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    setSubmitting(true);
    try {
      const code = await createRoom(roomName.trim());
      onCreated(code);
    } catch (err: any) {
      alert(err.message || 'Failed to create room');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel rounded-2xl border border-amber-500/30 p-6 max-w-md w-full shadow-broadcast relative bg-[#0a0a0a]">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 mx-auto mb-3 shadow-gold-glow">
            <Trophy className="w-6 h-6" />
          </div>
          <h2 className="font-heading text-2xl font-extrabold gold-gradient-text">CREATE AUCTION ROOM</h2>
          <p className="text-xs text-neutral-400 mt-1">
            Host a live IPL-style auction room for up to 15 friends.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold text-neutral-300 uppercase mb-1.5">
              ROOM NAME
            </label>
            <input
              type="text"
              required
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder={`e.g. Friends Mega Auction ${IPL_SEASON}`}
              className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-100 focus:outline-none focus:border-amber-400 font-sans"
            />
          </div>

          <div className="bg-neutral-900/80 p-3 rounded-xl border border-neutral-800 text-xs text-neutral-400 space-y-1">
            <div className="font-bold text-amber-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> HOST PRESETS INCLUDED:
            </div>
            <div>• ₹120 Crore Purse per Franchise</div>
            <div>• Min 18 / Max 25 Squad Limits</div>
            <div>• Atomic Bidding & Anti-Snipe Protection</div>
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
              disabled={submitting}
              className="w-1/2 py-3 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-neutral-950 font-heading font-black rounded-xl text-xs shadow-gold-glow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{submitting ? 'CREATING...' : 'CREATE ROOM'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

