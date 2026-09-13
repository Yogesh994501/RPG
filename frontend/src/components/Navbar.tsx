import React from 'react';
import { Shield, Coins, Flame, Volume2, VolumeX, LogOut, User as UserIcon, Plus } from 'lucide-react';
import { User, Character } from '../types';
import { soundEngine } from '../services/soundEngine';

import { NumberCounter } from './NumberCounter';

interface NavbarProps {
  user: User | null;
  character: Character | null;
  onOpenNewQuest: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  isMuted: boolean;
  onToggleSound: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  character,
  onOpenNewQuest,
  onOpenAuth,
  onLogout,
  isMuted,
  onToggleSound
}) => {
  return (
    <header className="rpg-navbar">
      <div className="logo-container" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <div className="logo-crest">
          <Shield size={22} />
        </div>
        <div>
          <span className="logo-title">CHRONOSLAYER</span>
          <span className="logo-subtitle">THE STUDY GUILD LIFE RPG</span>
        </div>
      </div>

      {user && character ? (
        <div className="nav-stats">
          {/* Gold Pill with Digit-Ticking Counter */}
          <div className="stat-pill stat-pill-gold" title="Total In-Game Gold">
            <Coins size={16} />
            <span><NumberCounter value={character.gold} /> Gold</span>
          </div>

          {/* Combo / Streak Pill */}
          <div className="stat-pill stat-pill-streak" title={`${character.current_streak} Consecutive Quest Days! (${character.streak_multiplier}x Multiplier)`}>
            <Flame size={16} className="flame-icon" />
            <span>{character.current_streak} Combo</span>
            {character.streak_multiplier > 1.0 && (
              <span className="badge-tag badge-legendary text-[10px]">
                {character.streak_multiplier}x
              </span>
            )}
          </div>
        </div>
      ) : null}

      <div className="nav-actions">
        {/* Sound Toggle */}
        <button
          onClick={onToggleSound}
          className={`icon-btn ${!isMuted ? 'icon-btn-active' : ''}`}
          title={isMuted ? 'Unmute Sound Effects (Hotkey: M)' : 'Mute Sound Effects (Hotkey: M)'}
          aria-label="Toggle Sound"
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>

        {user ? (
          <>
            <button
              onClick={onOpenNewQuest}
              className="rpg-btn rpg-btn-gold"
              title="Create New Quest (Hotkey: N or Q)"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">New Quest</span>
            </button>

            <button
              onClick={onLogout}
              className="icon-btn"
              title="Logout session"
              aria-label="Logout"
            >
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <button onClick={onOpenAuth} className="rpg-btn rpg-btn-gold">
            <UserIcon size={16} />
            <span>Sign In / Demo</span>
          </button>
        )}
      </div>
    </header>
  );
};
