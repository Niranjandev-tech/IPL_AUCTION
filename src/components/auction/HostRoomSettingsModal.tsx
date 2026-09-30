import React, { useState } from 'react';
import { Settings, Shield, Plus, Trash2, Check, X } from 'lucide-react';
import { useRoom } from '../../context/RoomContext';
import type { BidIncrementSlab, RoomSettings } from '../../types/auction.types';
import { formatLakhs } from '../../lib/rulesEngine';

interface HostRoomSettingsModalProps {
  onClose: () => void;
}

export const HostRoomSettingsModal: React.FC<HostRoomSettingsModalProps> = ({ onClose }) => {
  const { settings, updateSettings, isHost } = useRoom();

  const [purseCr, setPurseCr] = useState<number>(settings.total_purse_lakhs / 100);
  const [timerSec, setTimerSec] = useState<number>(settings.timer_duration_sec);
  const [antiSnipe, setAntiSnipe] = useState<boolean>(settings.anti_snipe_enabled);
  const [antiSnipeExtSec, setAntiSnipeExtSec] = useState<number>(settings.anti_snipe_extend_sec);
  const [minSquad, setMinSquad] = useState<number>(settings.min_squad);
  const [maxSquad, setMaxSquad] = useState<number>(settings.max_squad);
  const [maxOverseas, setMaxOverseas] = useState<number>(settings.max_overseas);
  const [rtmEnabled, setRtmEnabled] = useState<boolean>(settings.rtm_enabled);

  const [increments, setIncrements] = useState<BidIncrementSlab[]>(
    settings.bid_increments && settings.bid_increments.length > 0
      ? settings.bid_increments
      : [
          { min_lakhs: 0, max_lakhs: 100, increment_lakhs: 5 },
          { min_lakhs: 100, max_lakhs: 200, increment_lakhs: 10 },
          { min_lakhs: 200, max_lakhs: 500, increment_lakhs: 20 },
          { min_lakhs: 500, max_lakhs: 999999, increment_lakhs: 50 },
        ]
  );

  const handleAddSlab = () => {
    const last = increments[increments.length - 1];
    const newMin = last ? last.max_lakhs : 0;
    setIncrements([
      ...increments,
      { min_lakhs: newMin, max_lakhs: newMin + 500, increment_lakhs: 25 },
    ]);
  };

  const handleRemoveSlab = (index: number) => {
    setIncrements(increments.filter((_, idx) => idx !== index));
  };

  const handleUpdateSlab = (index: number, field: keyof BidIncrementSlab, val: number) => {
    const updated = [...increments];
    updated[index] = { ...updated[index], [field]: val };
    setIncrements(updated);
  };

  const handleSave = () => {
    const newSettingsPayload: Partial<RoomSettings> = {
      total_purse_lakhs: purseCr * 100,
      timer_duration_sec: timerSec,
      anti_snipe_enabled: antiSnipe,
      anti_snipe_extend_sec: antiSnipeExtSec,
      min_squad: minSquad,
      max_squad: maxSquad,
      max_overseas: maxOverseas,
      rtm_enabled: rtmEnabled,
      bid_increments: increments,
    };

    updateSettings(newSettingsPayload);
    onClose();
  };

  if (!isHost) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#0a0a0a] border border-neutral-800 rounded-3xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-black text-white flex items-center gap-2">
                CUSTOM HOUSE RULES & CONFIG <Shield className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-xs text-neutral-400 font-mono">
                Configure purse limits, timer durations, anti-snipe rules, and bid increment slabs.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg bg-neutral-900 border border-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Purse & Squad Limits */}
        <div className="space-y-4">
          <h3 className="text-xs font-mono font-bold uppercase text-amber-400 tracking-wider">
            1. Franchise Purse & Squad Parameters
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                Franchise Starting Purse (₹ Crores)
              </label>
              <input
                type="number"
                value={purseCr}
                onChange={(e) => setPurseCr(Number(e.target.value))}
                min={50}
                max={200}
                step={5}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-amber-500 outline-none"
              />
              <span className="text-[10px] text-neutral-400">Default IPL 2025: ₹120 Cr</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                Lot Timer Duration (Seconds)
              </label>
              <select
                value={timerSec}
                onChange={(e) => setTimerSec(Number(e.target.value))}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-amber-500 outline-none"
              >
                <option value={10}>10 Seconds (Fast)</option>
                <option value={15}>15 Seconds</option>
                <option value={20}>20 Seconds</option>
                <option value={30}>30 Seconds (Standard)</option>
                <option value={45}>45 Seconds</option>
                <option value={60}>60 Seconds</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                Min / Max Squad Size
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={minSquad}
                  onChange={(e) => setMinSquad(Number(e.target.value))}
                  min={15}
                  max={25}
                  className="w-1/2 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white font-mono outline-none"
                  placeholder="Min (18)"
                />
                <input
                  type="number"
                  value={maxSquad}
                  onChange={(e) => setMaxSquad(Number(e.target.value))}
                  min={18}
                  max={30}
                  className="w-1/2 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white font-mono outline-none"
                  placeholder="Max (25)"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                Max Overseas Players Limit
              </label>
              <input
                type="number"
                value={maxOverseas}
                onChange={(e) => setMaxOverseas(Number(e.target.value))}
                min={4}
                max={10}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white font-mono outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Anti-Snipe & RTM Rules */}
        <div className="space-y-3 pt-2 border-t border-neutral-800">
          <h3 className="text-xs font-mono font-bold uppercase text-amber-400 tracking-wider">
            2. Anti-Snipe & RTM Configuration
          </h3>

          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
            <div>
              <div className="text-xs font-semibold text-white">Anti-Snipe Window Extension</div>
              <div className="text-[10px] text-neutral-400">Extends timer if a bid is placed in the last 5 seconds</div>
            </div>
            <input
              type="checkbox"
              checked={antiSnipe}
              onChange={(e) => setAntiSnipe(e.target.checked)}
              className="w-5 h-5 accent-amber-500 cursor-pointer"
            />
          </div>

          {antiSnipe && (
            <div className="flex items-center gap-3 pl-4">
              <label className="text-xs text-neutral-300 font-mono">Extend window by:</label>
              <input
                type="number"
                value={antiSnipeExtSec}
                onChange={(e) => setAntiSnipeExtSec(Number(e.target.value))}
                min={3}
                max={20}
                className="w-20 bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-xs text-white font-mono outline-none"
              />
              <span className="text-xs text-neutral-400">seconds</span>
            </div>
          )}

          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
            <div>
              <div className="text-xs font-semibold text-white">RTM (Right to Match) Cards Enabled</div>
              <div className="text-[10px] text-neutral-400">Allows previous IPL franchises to exercise RTM matching options</div>
            </div>
            <input
              type="checkbox"
              checked={rtmEnabled}
              onChange={(e) => setRtmEnabled(e.target.checked)}
              className="w-5 h-5 accent-amber-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Section 3: Bid Increments Slabs */}
        <div className="space-y-3 pt-2 border-t border-neutral-800">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase text-amber-400 tracking-wider">
              3. Dynamic Bid Increment Slabs
            </h3>
            <button
              onClick={handleAddSlab}
              className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-semibold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30"
            >
              <Plus className="w-3.5 h-3.5" /> Add Slab
            </button>
          </div>

          <div className="space-y-2">
            {increments.map((slab, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-neutral-900/90 border border-neutral-800 p-2.5 rounded-xl text-xs font-mono">
                <span className="text-neutral-400 w-12">Slab #{idx + 1}</span>
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[9px] text-neutral-500 block">Min ({formatLakhs(slab.min_lakhs)})</span>
                    <input
                      type="number"
                      value={slab.min_lakhs}
                      onChange={(e) => handleUpdateSlab(idx, 'min_lakhs', Number(e.target.value))}
                      className="w-full bg-black border border-neutral-800 rounded px-2 py-1 text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] text-neutral-500 block">Max ({formatLakhs(slab.max_lakhs)})</span>
                    <input
                      type="number"
                      value={slab.max_lakhs}
                      onChange={(e) => handleUpdateSlab(idx, 'max_lakhs', Number(e.target.value))}
                      className="w-full bg-black border border-neutral-800 rounded px-2 py-1 text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] text-amber-400 block">Increment (+{formatLakhs(slab.increment_lakhs)})</span>
                    <input
                      type="number"
                      value={slab.increment_lakhs}
                      onChange={(e) => handleUpdateSlab(idx, 'increment_lakhs', Number(e.target.value))}
                      className="w-full bg-black border border-amber-500/40 rounded px-2 py-1 text-amber-300 font-bold"
                    />
                  </div>
                </div>
                {increments.length > 1 && (
                  <button
                    onClick={() => handleRemoveSlab(idx)}
                    className="p-1.5 text-neutral-500 hover:text-rose-400"
                    title="Remove Slab"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-neutral-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:brightness-110 flex items-center gap-2 shadow-gold-glow cursor-pointer"
          >
            <Check className="w-4 h-4" /> Save Rules & Settings
          </button>
        </div>
      </div>
    </div>
  );
};
