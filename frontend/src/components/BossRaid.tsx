import React, { useState } from 'react';
import { Skull, Swords, Zap, Shield, Sparkles, Award, Flame } from 'lucide-react';
import { Boss, CombatAttributes } from '../types';
import { soundEngine } from '../services/soundEngine';
import { triggerCriticalHitParticles } from '../services/particleEngine';

interface BossRaidProps {
  boss: Boss | null;
  combatAttributes: CombatAttributes | null;
  onAttackBoss: () => Promise<{
    damageDealt: number;
    isCritical: boolean;
    bossDefeated: boolean;
    combatLog: string;
  }>;
}

export const BossRaid: React.FC<BossRaidProps> = ({
  boss,
  combatAttributes,
  onAttackBoss
}) => {
  const [isAttacking, setIsAttacking] = useState(false);
  const [combatLogs, setCombatLogs] = useState<string[]>([]);
  const [lastDamage, setLastDamage] = useState<{ amount: number; isCrit: boolean } | null>(null);

  if (!boss) {
    return (
      <div className="rpg-panel text-center py-8">
        <Skull size={36} className="mx-auto text-slate-600 mb-2" />
        <p className="text-slate-400 text-sm">Searching for realm invaders...</p>
      </div>
    );
  }

  const hpPercent = Math.max(0, Math.min(100, Math.round((boss.current_hp / boss.max_hp) * 100)));

  const handleAttack = async () => {
    if (isAttacking || boss.is_defeated) return;
    setIsAttacking(true);

    try {
      soundEngine.playSwordSlash();
      const res = await onAttackBoss();

      if (res.isCritical) {
        soundEngine.playCriticalHit();
        triggerCriticalHitParticles();
      } else {
        soundEngine.playCoinClink();
      }

      if (res.bossDefeated) {
        soundEngine.playBossVictory();
      }

      setLastDamage({ amount: res.damageDealt, isCrit: res.isCritical });
      setCombatLogs((prev) => [res.combatLog, ...prev.slice(0, 4)]);
    } catch (err: any) {
      setCombatLogs((prev) => [`⚠️ Strike failed: ${err.message}`, ...prev]);
    } finally {
      setIsAttacking(false);
    }
  };

  return (
    <div className="rpg-panel border-red-950/60 bg-gradient-to-b from-[#140A0F] to-[#0B0E14]">
      {/* Panel Header */}
      <div className="panel-header border-red-900/30">
        <div className="flex items-center gap-2">
          <Skull size={20} className="text-red-500 animate-pulse" />
          <h2 className="panel-title text-base text-red-100 font-bold">World Boss Raid</h2>
        </div>
        <span className="badge-tag bg-red-950 border border-red-700/60 text-red-300 font-bold">
          Weekly Encounter
        </span>
      </div>

      {/* Boss Avatar & Identity */}
      <div className="text-center my-3 relative">
        {lastDamage && (
          <div className="absolute top-0 right-1/4 floating-badge font-rpg font-bold text-base z-10">
            {lastDamage.isCrit ? (
              <span className="text-yellow-300 drop-shadow-[0_0_8px_#F59E0B]">
                ⚡ CRIT -{lastDamage.amount}!
              </span>
            ) : (
              <span className="text-red-400 drop-shadow-[0_0_6px_#EF4444]">
                -{lastDamage.amount} DMG
              </span>
            )}
          </div>
        )}

        <div 
          className={`boss-widget-portrait transition-all duration-200 ${
            isAttacking 
              ? 'scale-95 border-red-500 shadow-[0_0_30px_#EF4444] brightness-125' 
              : 'border-red-800/80 shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:border-red-600'
          }`}
          style={{ width: 130, height: 130, minWidth: 130, minHeight: 130, maxWidth: 130, maxHeight: 130 }}
        >
          <img
            src="/assets/boss_malakor.jpg"
            alt={boss.boss_name}
            style={{ width: 130, height: 130, objectFit: 'cover', objectPosition: 'top', display: 'block' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
          <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[10px] font-rpg tracking-widest text-red-300 font-bold uppercase bg-black/60 px-2 py-0.5 rounded border border-red-900/60">
            {boss.boss_name}
          </span>
        </div>
        <h3 className="font-rpg text-lg font-bold text-white tracking-wide">
          {boss.boss_name}
        </h3>
        <p className="text-xs text-red-300 font-medium">
          {boss.boss_title}
        </p>
      </div>

      {/* Boss Health Fantasy Bar */}
      <div className="fantasy-vial-container mt-4">
        <div className="vial-label-row text-red-300 text-xs">
          <span className="flex items-center gap-1 font-semibold">
            <Flame size={13} className="text-red-400" /> Boss Vitality
          </span>
          <span className="font-mono">
            {boss.current_hp} / {boss.max_hp} ({hpPercent}%)
          </span>
        </div>
        <div className="fantasy-vial h-5 border-red-900/50">
          <div
            className="vial-fill vial-fill-boss"
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      {/* Attribute Combat Contributions */}
      {combatAttributes && (
        <div className="grid grid-cols-2 gap-2 my-4 text-[11px] bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between text-amber-300">
            <span className="flex items-center gap-1"><Swords size={12} /> Base Strike (STR):</span>
            <span className="font-bold">{combatAttributes.baseDamage}</span>
          </div>
          <div className="flex items-center justify-between text-purple-300">
            <span className="flex items-center gap-1"><Zap size={12} /> Crit Chance (INT):</span>
            <span className="font-bold">{combatAttributes.critChance}%</span>
          </div>
          <div className="flex items-center justify-between text-emerald-300">
            <span className="flex items-center gap-1"><Zap size={12} /> Speed Combo (AGI):</span>
            <span className="font-bold">{combatAttributes.comboMultiplier}x</span>
          </div>
          <div className="flex items-center justify-between text-pink-300">
            <span className="flex items-center gap-1"><Sparkles size={12} /> Raid Bounty (CHA):</span>
            <span className="font-bold">{combatAttributes.bonusLootMultiplier}x</span>
          </div>
        </div>
      )}

      {/* Attack Button */}
      <div className="mt-4 text-center">
        {boss.is_defeated ? (
          <div className="p-3 bg-emerald-950/60 border border-emerald-700/60 rounded-lg text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
            <Award size={18} />
            <span>Titan Vanquished! Loot Distributed!</span>
          </div>
        ) : (
          <button
            onClick={handleAttack}
            disabled={isAttacking}
            className="rpg-btn rpg-btn-gold w-full text-xs py-2.5 shadow-lg relative overflow-hidden"
          >
            <Swords size={15} />
            <span>{isAttacking ? 'Striking Titan...' : 'Channel Attributes & Attack!'}</span>
          </button>
        )}
        <p className="text-[10px] text-slate-400 mt-1.5">
          💡 Completing daily quests also directly inflicts devastating damage on the boss!
        </p>
      </div>

      {/* Real-time Combat Log */}
      {combatLogs.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex items-center gap-1">
            <span>Combat Chronology</span>
          </div>
          <div className="space-y-1">
            {combatLogs.map((log, idx) => (
              <div
                key={idx}
                className="text-[11px] font-mono p-1.5 rounded bg-slate-950/80 border border-slate-800 text-slate-300 leading-snug"
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
