import React from 'react';
import type { PlayerRole } from '../../types/auction.types';
import { FRANCHISES } from '../../data/franchises';
import type { FranchiseCode } from '../../types/auction.types';

interface PlayerAvatarProps {
  name: string;
  role: PlayerRole;
  country: string;
  isOverseas: boolean;
  previousTeam?: string | null;
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  name,
  role,
  country: _country,
  isOverseas,
  previousTeam,
  imageUrl,
  size = 'md',
  className = '',
}) => {
  // Get initials (e.g. "Virat Kohli" -> "VK")
  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Role icon helper
  const getRoleBadge = (r: PlayerRole) => {
    switch (r) {
      case 'Batter': return '🏏';
      case 'Bowler': return '⚡';
      case 'All-rounder': return '🌟';
      case 'Wicketkeeper': return '🧤';
      default: return '🏏';
    }
  };

  // Team gradient background
  const getTeamGradient = (teamCode?: string | null) => {
    if (teamCode && teamCode in FRANCHISES) {
      const f = FRANCHISES[teamCode as FranchiseCode];
      return `linear-gradient(135deg, ${f.primaryColor}dd 0%, ${f.secondaryColor || '#171717'} 100%)`;
    }
    return 'linear-gradient(135deg, #d4af37 0%, #171717 100%)';
  };

  const sizeClasses = {
    sm: 'w-10 h-10 text-xs',
    md: 'w-14 h-14 text-base',
    lg: 'w-24 h-24 text-2xl',
    xl: 'w-36 h-36 md:w-44 md:h-44 text-4xl',
  }[size];

  const initials = getInitials(name);
  const backgroundStyle = { background: getTeamGradient(previousTeam) };

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border-2 border-amber-400/40 shadow-gold-glow flex items-center justify-center font-heading font-black select-none ${sizeClasses} ${className}`}
      style={backgroundStyle}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover object-top"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-white drop-shadow-md">
          <span className="tracking-tighter text-white font-extrabold">{initials}</span>
          <span className="text-[10px] font-normal opacity-95">{getRoleBadge(role)}</span>
        </div>
      )}

      {/* Role / Flag Badge Overlay */}
      <div className="absolute bottom-1 right-1 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-mono text-amber-300 border border-neutral-800 flex items-center gap-0.5">
        <span>{isOverseas ? '✈️' : '🇮🇳'}</span>
      </div>
    </div>
  );
};
