import React, { useState } from 'react';
import { Shield, LogOut, Trophy, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRoom } from '../../context/RoomContext';
import { IPL_SEASON } from '../../config/constants';
import { soundEffects } from '../../lib/soundEffects';

export const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const { room, isHost, currentTeam, leaveRoom } = useRoom();
  const [isMuted, setIsMuted] = useState(soundEffects.isMuted());

  const handleToggleMute = () => {
    const nextMute = soundEffects.toggleMute();
    setIsMuted(nextMute);
  };

  return (
    <header className="bg-[#0a0a0a]/95 border-b border-neutral-800 px-4 py-3 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-neutral-950 font-black text-xl shadow-gold-glow">
            IPL
          </div>
          <div>
            <h1 className="font-heading font-black text-lg md:text-xl tracking-wide gold-gradient-text flex items-center gap-2">
              AUCTION ROOM <Sparkles className="w-4 h-4 text-amber-400 inline" />
            </h1>
            <p className="text-xs text-neutral-400 font-mono hidden sm:block">{IPL_SEASON} LIVE MULTIPLAYER BROADCAST</p>
          </div>
        </div>

        {/* Room Code Pill & Status */}
        {room && (
          <div className="flex items-center gap-2 md:gap-4">
            <div className="bg-neutral-900 border border-amber-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <div className="text-left">
                <div className="text-[10px] uppercase text-neutral-400 font-semibold tracking-wider">ROOM CODE</div>
                <div className="font-mono text-sm font-bold text-amber-300">{room.code}</div>
              </div>
            </div>

            {isHost && (
              <span className="hidden md:flex items-center gap-1 text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-full font-semibold">
                <Shield className="w-3.5 h-3.5" /> HOST
              </span>
            )}
          </div>
        )}

        {/* User Info & Actions */}
        <div className="flex items-center gap-3">
          {/* Audio Mute Toggle */}
          <button
            onClick={handleToggleMute}
            className={`p-2 rounded-lg transition-colors border ${
              isMuted
                ? 'bg-neutral-900 text-neutral-500 border-neutral-800 hover:text-neutral-300'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
            }`}
            title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              {currentTeam ? (
                <div
                  className="px-3 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 shadow-sm"
                  style={{
                    backgroundColor: `${currentTeam.primary_color}20`,
                    borderColor: currentTeam.primary_color,
                    color: currentTeam.primary_color,
                  }}
                >
                  <span>{currentTeam.logo_url}</span>
                  <span className="hidden sm:inline">{currentTeam.franchise_code}</span>
                </div>
              ) : null}

              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-neutral-200">{user.display_name}</div>
                <div className="text-[10px] text-neutral-400 font-mono truncate max-w-[120px]">{user.email}</div>
              </div>

              {room ? (
                <button
                  onClick={leaveRoom}
                  className="p-2 text-neutral-400 hover:text-neutral-200 bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors border border-neutral-800"
                  title="Leave Room"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={signOut}
                  className="p-2 text-neutral-400 hover:text-rose-400 bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors border border-neutral-800"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};

