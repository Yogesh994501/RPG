import React, { useState, useEffect } from 'react';
import { Skull, Flame, Shield, Award, Sparkles, X, Target, Check } from 'lucide-react';
import { api } from '../services/api';
import { soundEngine } from '../services/soundEngine';

interface TitanInfo {
  name: string;
  title: string;
  element: string;
  icon: string;
  lore: string;
  hp: number;
  gold: number;
  xp: number;
  tier: number;
  timesDefeated: number;
  isCurrent: boolean;
  currentHp: number;
}

interface TitanBestiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBoss: (newBoss: any) => void;
}

export const TitanBestiaryModal: React.FC<TitanBestiaryModalProps> = ({
  isOpen,
  onClose,
  onSelectBoss
}) => {
  const [titans, setTitans] = useState<TitanInfo[]>([]);
  const [selectingName, setSelectingName] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.getTitanBestiary().then((res) => {
        if (res.titans) setTitans(res.titans);
      }).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = async (titan: TitanInfo) => {
    if (titan.isCurrent) return;
    setSelectingName(titan.name);
    try {
      const res = await api.selectBoss(titan.name);
      if (res.boss) {
        soundEngine.playSwordSlash();
        onSelectBoss(res.boss);
        onClose();
      }
    } catch (err: any) {
      console.error('Failed to switch boss target:', err);
    } finally {
      setSelectingName(null);
    }
  };

  const getElementColor = (el: string) => {
    switch (el.toLowerCase()) {
      case 'fire': return 'border-orange-500/60 bg-orange-950/40 text-orange-400';
      case 'void': return 'border-purple-500/60 bg-purple-950/40 text-purple-400';
      case 'shadow': return 'border-slate-500/60 bg-slate-900/60 text-slate-300';
      case 'temporal': return 'border-amber-500/60 bg-amber-950/40 text-amber-300';
      case 'frost': return 'border-cyan-500/60 bg-cyan-950/40 text-cyan-300';
      case 'illusion': return 'border-pink-500/60 bg-pink-950/40 text-pink-300';
      case 'magma': return 'border-red-500/60 bg-red-950/40 text-red-400';
      case 'cosmic': return 'border-yellow-400/80 bg-yellow-950/40 text-yellow-300';
      default: return 'border-slate-700 bg-slate-900 text-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="rpg-panel max-w-3xl w-full border-red-900/60 bg-[#0E0B12] max-h-[85vh] flex flex-col p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-red-900/40">
          <div className="flex items-center gap-2.5">
            <Skull size={24} className="text-red-500 animate-pulse" />
            <div>
              <h2 className="font-rpg text-lg font-bold text-white tracking-wide">
                Pantheon of Productivity Titans
              </h2>
              <p className="text-xs text-red-300/80">
                8 Mythic Bosses of Procrastination, Lethargy, and Distraction
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="icon-btn w-8 h-8 rounded-lg hover:text-white"
            title="Close Bestiary"
          >
            <X size={16} />
          </button>
        </div>

        {/* Titans Grid */}
        <div className="overflow-y-auto space-y-3 py-4 pr-1 flex-1">
          {titans.map((titan) => {
            return (
              <div
                key={titan.name}
                className={`p-4 rounded-xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  titan.isCurrent
                    ? 'border-red-500/80 bg-red-950/30 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                }`}
              >
                {/* Titan Avatar & Info */}
                <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                  <div className="w-14 h-14 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center text-3xl flex-shrink-0 shadow-inner">
                    {titan.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-rpg font-bold text-base text-white truncate">
                        {titan.name}
                      </h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getElementColor(titan.element)}`}>
                        {titan.element}
                      </span>
                      <span className="text-[11px] text-amber-400 font-mono">
                        Tier {titan.tier}
                      </span>
                      {titan.timesDefeated > 0 && (
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold">
                          <Award size={12} /> Vanquished x{titan.timesDefeated}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-red-300/90 font-medium">
                      {titan.title}
                    </p>
                    <p className="text-[11px] text-slate-300 mt-1 italic line-clamp-2">
                      "{titan.lore}"
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-300 font-mono">
                      <span className="flex items-center gap-1 text-red-400">
                        <Flame size={12} /> {titan.hp} HP
                      </span>
                      <span className="text-amber-300">
                        +{titan.gold} Gold
                      </span>
                      <span className="text-purple-300">
                        +{titan.xp} XP
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex-shrink-0 self-end sm:self-center">
                  {titan.isCurrent ? (
                    <span className="px-3 py-1.5 rounded-lg bg-red-600/30 border border-red-500 text-red-200 text-xs font-bold flex items-center gap-1.5">
                      <Target size={14} className="text-red-400 animate-spin" />
                      <span>Active Target</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSelect(titan)}
                      disabled={selectingName === titan.name}
                      className="rpg-btn py-1.5 px-3.5 text-xs bg-slate-800 hover:bg-red-700/60 border border-slate-700 hover:border-red-500 text-white font-bold flex items-center gap-1.5"
                    >
                      <Target size={13} />
                      <span>{selectingName === titan.name ? 'Summoning...' : 'Engage Titan'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-red-900/40 text-right">
          <button onClick={onClose} className="rpg-btn border border-slate-700 text-xs py-1.5 px-4 text-slate-300 hover:text-white">
            Return to Arena
          </button>
        </div>
      </div>
    </div>
  );
};
