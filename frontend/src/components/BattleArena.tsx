import React from 'react';
import { Swords, Skull, Zap, Shield, Sparkles, Flame, Clock } from 'lucide-react';
import { User, Character, Boss, CombatAttributes, InventoryItem } from '../types';

interface BattleArenaProps {
  user: User;
  character: Character;
  boss: Boss | null;
  combatAttributes: CombatAttributes | null;
  equippedItems: InventoryItem[];
  onAttackBoss: () => Promise<any>;
  onOpenBestiary?: () => void;
  isLunging: boolean;
  isRecoiling: boolean;
  combatNumber: { amount: number; isCrit: boolean } | null;
}

export const BattleArena: React.FC<BattleArenaProps> = ({
  user,
  character,
  boss,
  combatAttributes,
  equippedItems,
  onAttackBoss,
  onOpenBestiary,
  isLunging,
  isRecoiling,
  combatNumber
}) => {
  if (!boss) return null;

  const heroClasses = [
    { id: 'paladin_1', image: '/assets/hero_paladin.jpg', title: 'Paladin of Willpower' },
    { id: 'mage_1', image: '/assets/hero_mage.jpg', title: 'Archmage of Focus' },
    { id: 'rogue_1', image: '/assets/hero_rogue.jpg', title: 'Shadow Assassin' }
  ];

  const currentHeroAvatar = heroClasses.find(c => c.id === user.avatar_id)?.image || '/assets/hero_paladin.jpg';
  const equippedWeapon = equippedItems.find(i => i.category === 'Weapon');

  const bossHpPercent = Math.max(0, Math.min(100, Math.round((boss.current_hp / boss.max_hp) * 100)));
  const heroHpPercent = Math.max(0, Math.min(100, Math.round((character.hp / character.max_hp) * 100)));

  return (
    <div className="battle-arena-stage mb-6">
      {/* Stage Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-amber-500/20 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <span className="font-rpg font-bold tracking-wider text-amber-300 uppercase">
            Battle Arena: The Abyssal Confrontation
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onOpenBestiary && (
            <button
              onClick={onOpenBestiary}
              className="rpg-btn border-red-700/60 bg-red-950/60 text-red-300 hover:bg-red-900/80 text-[11px] flex items-center gap-1.5 px-2.5 py-0.5 rounded transition"
              title="Browse all 8 Titans & switch targets"
            >
              <Skull size={12} className="text-red-400" />
              <span>Switch Titan</span>
            </button>
          )}
          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
            <Clock size={12} className="text-amber-400" />
            <span>Daily Reset in 16h 18m</span>
          </div>
        </div>
      </div>

      {/* Floating Combat Text if active */}
      {combatNumber && (
        <div 
          className="combat-number text-center drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]"
          style={{ left: '55%', top: '35%' }}
        >
          {combatNumber.isCrit ? (
            <span className="text-amber-300 drop-shadow-[0_0_15px_#F59E0B]">
              ⚡ CRITICAL STRIKE -{combatNumber.amount}!
            </span>
          ) : (
            <span className="text-red-400 drop-shadow-[0_0_10px_#EF4444]">
              💥 -{combatNumber.amount} DMG!
            </span>
          )}
        </div>
      )}

      {/* 1v1 Battle Grid */}
      <div className="battle-arena-grid">
        
        {/* LEFT FIGHTER: THE HERO */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <div className={`arena-hero-fighter relative ${isLunging ? 'hero-lunging' : ''}`}>
            {/* Hero Portrait Frame */}
            <div 
              className="arena-hero-portrait" 
              style={{ width: 110, height: 110, minWidth: 110, minHeight: 110, maxWidth: 110, maxHeight: 110 }}
            >
              <img
                src={currentHeroAvatar}
                alt={user.username}
                style={{ width: 110, height: 110, objectFit: 'cover', objectPosition: 'top', display: 'block' }}
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-rpg font-black text-xs px-2.5 py-0.5 rounded-full shadow-md border border-amber-300">
              Lv.{character.level}
            </div>
          </div>

          <div className="mt-3 w-full max-w-[200px]">
            <h3 className="font-rpg text-sm font-bold text-white truncate" title={user.username}>
              {user.username}
            </h3>
            <p className="text-[11px] text-amber-400 truncate mb-1">
              {equippedWeapon ? `Wielding: ${equippedWeapon.name}` : 'Novice Adventurer'}
            </p>

            {/* Hero HP Bar */}
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-700 shadow-inner">
              <div
                className="bg-gradient-to-r from-red-600 to-red-400 h-full transition-all duration-300"
                style={{ width: `${heroHpPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5 font-mono">
              <span>HP</span>
              <span>{character.hp}/{character.max_hp}</span>
            </div>
          </div>
        </div>

        {/* CENTER: CLASH SPARKS & DIRECT ATTACK ACTION */}
        <div className="flex flex-col items-center justify-center my-2 md:my-0 text-center">
          <div className="p-3 rounded-full bg-slate-950/80 border border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.2)] mb-2">
            <Swords size={28} className="text-amber-400 animate-pulse" />
          </div>

          <span className="font-rpg text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">
            Clash of Will
          </span>

          <button
            onClick={onAttackBoss}
            disabled={Boolean(boss.is_defeated) || isLunging}
            className="rpg-btn rpg-btn-gold text-xs py-2 px-4 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-105 active:scale-95 transition"
          >
            <Zap size={14} />
            <span>{isLunging ? 'Striking...' : 'Channel & Attack!'}</span>
          </button>

          <p className="text-[10px] text-slate-400 mt-2 italic max-w-[170px]">
            Completing quests on your board delivers bonus strikes!
          </p>
        </div>

        {/* RIGHT FIGHTER: WORLD BOSS */}
        <div className="flex flex-col items-center md:items-end text-center md:text-right">
          <div className={`relative ${isRecoiling ? 'boss-recoiling' : ''}`}>
            {/* Boss Portrait Frame */}
            <div 
              className="arena-boss-portrait" 
              style={{ width: 110, height: 110, minWidth: 110, minHeight: 110, maxWidth: 110, maxHeight: 110 }}
            >
              {boss.boss_name.includes('Chronos') ? (
                <img
                  src="/assets/boss_chronos.jpg"
                  alt={boss.boss_name}
                  style={{ width: 110, height: 110, objectFit: 'cover', objectPosition: 'top', display: 'block' }}
                />
              ) : boss.boss_name.includes('Malakor') ? (
                <img
                  src="/assets/boss_malakor.jpg"
                  alt={boss.boss_name}
                  style={{ width: 110, height: 110, objectFit: 'cover', objectPosition: 'top', display: 'block' }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-red-950/80 to-slate-950 text-4xl">
                  <span>{boss.boss_name.includes('Ignis') ? '🔥' : boss.boss_name.includes('Umbra') ? '👥' : boss.boss_name.includes('Apathy') ? '❄️' : boss.boss_name.includes('Sirena') ? '🌊' : boss.boss_name.includes('Vulcanus') ? '🌋' : '🌌'}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
            </div>

            <div className="absolute -bottom-2 -left-2 bg-gradient-to-r from-red-600 to-red-800 text-white font-rpg font-black text-xs px-2.5 py-0.5 rounded-full shadow-md border border-red-400">
              TITAN
            </div>
          </div>

          <div className="mt-3 w-full max-w-[200px]">
            <h3 className="font-rpg text-sm font-bold text-white truncate" title={boss.boss_name}>
              {boss.boss_name}
            </h3>
            <p className="text-[11px] text-red-400 truncate mb-1">
              {boss.boss_title}
            </p>

            {/* Boss HP Bar */}
            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-red-900/60 shadow-inner">
              <div
                className="vial-fill vial-fill-boss transition-all duration-300"
                style={{ width: `${bossHpPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-red-300 mt-0.5 font-mono">
              <span>TITAN HP</span>
              <span>{boss.current_hp}/{boss.max_hp} ({bossHpPercent}%)</span>
            </div>
          </div>
        </div>

      </div>

      {/* Attribute Combat Modifiers Bar */}
      {combatAttributes && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
          <div className="flex items-center justify-between p-1.5 rounded bg-slate-950/70 border border-slate-800 text-amber-300 font-mono">
            <span className="flex items-center gap-1"><Swords size={12} /> STR Strike:</span>
            <span className="font-bold">+{combatAttributes.baseDamage} DMG</span>
          </div>
          <div className="flex items-center justify-between p-1.5 rounded bg-slate-950/70 border border-slate-800 text-purple-300 font-mono">
            <span className="flex items-center gap-1"><Zap size={12} /> INT Crit:</span>
            <span className="font-bold">{combatAttributes.critChance}%</span>
          </div>
          <div className="flex items-center justify-between p-1.5 rounded bg-slate-950/70 border border-slate-800 text-emerald-300 font-mono">
            <span className="flex items-center gap-1"><Zap size={12} /> AGI Combo:</span>
            <span className="font-bold">{combatAttributes.comboMultiplier}x</span>
          </div>
          <div className="flex items-center justify-between p-1.5 rounded bg-slate-950/70 border border-slate-800 text-pink-300 font-mono">
            <span className="flex items-center gap-1"><Sparkles size={12} /> CHA Bounty:</span>
            <span className="font-bold">+{combatAttributes.bonusLootMultiplier}x</span>
          </div>
        </div>
      )}
    </div>
  );
};
