import React, { useState } from 'react';
import { Package, Sparkles, Coins, Award, Zap, Check } from 'lucide-react';
import { soundEngine } from '../services/soundEngine';
import { triggerLevelUpConfetti } from '../services/particleEngine';

export interface LootReward {
  title: string;
  gold: number;
  xp: number;
  attribute?: string;
  attributeBonus?: number;
  specialItem?: string;
}

interface LootChestModalProps {
  loot: LootReward | null;
  onClose: () => void;
}

export const LootChestModal: React.FC<LootChestModalProps> = ({ loot, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!loot) return null;

  const handleOpenChest = () => {
    if (isOpen) return;
    setIsOpen(true);
    soundEngine.playLevelUp();
    triggerLevelUpConfetti();
  };

  const handleClaim = () => {
    setIsOpen(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClaim}>
      <div 
        className="modal-content text-center max-w-md relative overflow-hidden bg-gradient-to-b from-[#1E1408] via-[#0B0E14] to-[#07080C] border-2 border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.5)] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="loot-burst-ray" />

        {/* Title */}
        <h2 className="font-rpg text-xl font-black text-amber-300 tracking-wider mb-1">
          {loot.title}
        </h2>
        <p className="text-xs text-slate-300 mb-6">
          Your heroic discipline has summoned an ancient celestial treasure!
        </p>

        {/* The Animated Chest Stage */}
        <div className="loot-chest-container my-6 flex flex-col items-center justify-center">
          {!isOpen ? (
            <div 
              onClick={handleOpenChest}
              className="cursor-pointer group flex flex-col items-center"
            >
              <div className="bouncing-chest w-28 h-28 rounded-2xl bg-gradient-to-b from-amber-600 to-amber-900 border-4 border-amber-400 flex items-center justify-center shadow-[0_0_30px_#F59E0B] group-hover:scale-110 transition duration-300">
                <Package size={56} className="text-amber-200" />
              </div>
              <span className="mt-4 px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-rpg font-bold text-xs shadow-md animate-pulse">
                Click to Unseal Treasure!
              </span>
            </div>
          ) : (
            <div className="space-y-3 w-full animate-in zoom-in-90 duration-300">
              {/* Loot Cards Reveal */}
              <div className="grid grid-cols-2 gap-2.5 text-left">
                {/* Gold Card */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/50 shadow-md">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-1">
                    <Coins size={16} />
                    <span>+{loot.gold} Gold</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Added to your treasury</p>
                </div>

                {/* XP Card */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-purple-500/50 shadow-md">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-sm mb-1">
                    <Sparkles size={16} />
                    <span>+{loot.xp} XP</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Character ascension progress</p>
                </div>

                {/* Attribute Gain Card */}
                {loot.attribute && (
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/50 shadow-md col-span-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
                      <Zap size={16} />
                      <span>{loot.attribute} +{loot.attributeBonus || 1} Points</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Heroic attributes surge permanently</p>
                  </div>
                )}
              </div>

              <button
                onClick={handleClaim}
                className="rpg-btn rpg-btn-gold w-full text-xs py-2.5 mt-4 font-bold shadow-xl"
              >
                <Check size={16} />
                <span>Claim Spoils & Continue</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
