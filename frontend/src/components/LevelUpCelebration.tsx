import React, { useEffect } from 'react';
import { Crown, Sparkles, Heart, Shield, Award } from 'lucide-react';
import { LevelUpEvent } from '../types';
import { triggerLevelUpConfetti } from '../services/particleEngine';
import { soundEngine } from '../services/soundEngine';

interface LevelUpCelebrationProps {
  event: LevelUpEvent | null;
  onClose: () => void;
}

export const LevelUpCelebration: React.FC<LevelUpCelebrationProps> = ({ event, onClose }) => {
  useEffect(() => {
    if (event) {
      soundEngine.playLevelUp();
      triggerLevelUpConfetti();
    }
  }, [event]);

  if (!event) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content text-center max-w-sm border-2 border-amber-400 bg-gradient-to-b from-[#1C1408] via-[#0B0E14] to-[#07080C] shadow-[0_0_50px_rgba(245,158,11,0.5)] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glowing Crown Avatar */}
        <div className="inline-flex p-4 rounded-full bg-amber-400/20 border-2 border-amber-400 shadow-[0_0_30px_#F59E0B] mb-3 animate-bounce">
          <Crown size={52} className="text-amber-400" />
        </div>

        <h2 className="font-rpg text-2xl font-black text-amber-300 tracking-wider">
          HEROIC ASCENSION!
        </h2>
        <p className="font-rpg text-base font-bold text-white mt-1">
          Level {event.level} Attained
        </p>

        <p className="text-xs text-slate-300 my-3 leading-relaxed">
          The stars align as your real-world discipline fuels your virtual ascendancy!
        </p>

        {/* Level Up Perks */}
        <div className="space-y-2 my-4 bg-slate-900/80 p-3 rounded-lg border border-amber-500/30 text-xs text-left">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <Heart size={15} />
            <span>Vitality Fully Restored (+10 Max HP)</span>
          </div>
          <div className="flex items-center gap-2 text-purple-400 font-semibold">
            <Sparkles size={15} />
            <span>{event.attributeGained} +{event.attributeBonus} Points Surged</span>
          </div>
          <div className="flex items-center gap-2 text-amber-300 font-semibold">
            <Award size={15} />
            <span>Increased Boss Raid Attack Potency</span>
          </div>
        </div>

        <button onClick={onClose} className="rpg-btn rpg-btn-gold w-full py-2.5 text-sm font-bold shadow-xl">
          Claim Glory & Continue
        </button>
      </div>
    </div>
  );
};
