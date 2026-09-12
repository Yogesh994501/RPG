import React from 'react';
import { 
  Dumbbell, 
  Brain, 
  Heart, 
  Zap, 
  Sparkles, 
  Shield, 
  Swords, 
  Award, 
  Clock, 
  Flame, 
  User as UserIcon,
  Crown
} from 'lucide-react';
import { User, Character, InventoryItem } from '../types';

interface CharacterPanelProps {
  user: User;
  character: Character;
  equippedItems: InventoryItem[];
  onUnequip: (inventoryId: string) => void;
}

export const CharacterPanel: React.FC<CharacterPanelProps> = ({
  user,
  character,
  equippedItems,
  onUnequip
}) => {
  return (
    <aside className="rpg-panel rpg-panel-gold">
      {/* Hero Header */}
      <div className="flex items-center gap-4 mb-4">
        <div className="avatar-frame">
          <Crown size={36} className="text-amber-400" />
          <div className="avatar-badge">Lv.{character.level}</div>
        </div>

        <div className="overflow-hidden">
          <h2 className="font-rpg text-lg font-bold text-white truncate" title={user.username}>
            {user.username}
          </h2>
          <p className="text-xs text-amber-400 truncate flex items-center gap-1 font-semibold">
            <Award size={13} />
            <span>{user.title || 'Novice Adventurer'}</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            TZ: {user.timezone || 'Local'}
          </p>
        </div>
      </div>

      {/* Health Fantasy Vial */}
      <div className="fantasy-vial-container">
        <div className="vial-label-row text-red-400">
          <span className="flex items-center gap-1">
            <Heart size={14} /> Vitality (HP)
          </span>
          <span>{character.hp} / {character.max_hp}</span>
        </div>
        <div className="fantasy-vial" role="progressbar" aria-valuenow={character.hp} aria-valuemin={0} aria-valuemax={character.max_hp}>
          <div 
            className="vial-fill vial-fill-hp" 
            style={{ width: `${Math.min(100, Math.round((character.hp / character.max_hp) * 100))}%` }} 
          />
        </div>
      </div>

      {/* Experience (XP) Fantasy Vial */}
      <div className="fantasy-vial-container">
        <div className="vial-label-row text-purple-400">
          <span className="flex items-center gap-1">
            <Sparkles size={14} /> Experience (XP)
          </span>
          <span>
            {character.current_xp} / {character.next_level_xp || 623} ({character.xp_progress_percent ?? Math.min(100, Math.round((character.current_xp / (character.next_level_xp || 623)) * 100))}%)
          </span>
        </div>
        <div className="fantasy-vial" role="progressbar" aria-valuenow={character.current_xp} aria-valuemin={0} aria-valuemax={character.next_level_xp || 623}>
          <div 
            className="vial-fill vial-fill-xp" 
            style={{ width: `${character.xp_progress_percent ?? Math.min(100, Math.round((character.current_xp / (character.next_level_xp || 623)) * 100))}%` }} 
          />
        </div>
      </div>

      {/* Core Attributes */}
      <div className="mt-5">
        <h3 className="panel-title text-sm mb-2 text-slate-300">
          <Swords size={16} className="text-amber-400" />
          <span>Core RPG Attributes</span>
        </h3>
        <div className="attr-grid">
          {/* STR */}
          <div className="attr-item" title="Strength: Increases Base Boss Damage">
            <div className="attr-name text-amber-500">
              <Dumbbell size={14} /> STR
            </div>
            <span className="attr-val text-amber-300">{character.str}</span>
          </div>

          {/* INT */}
          <div className="attr-item" title="Intellect: Increases Critical Hit Chance">
            <div className="attr-name text-purple-400">
              <Brain size={14} /> INT
            </div>
            <span className="attr-val text-purple-300">{character.int}</span>
          </div>

          {/* VIT */}
          <div className="attr-item" title="Vitality: Protects Streak and Max HP">
            <div className="attr-name text-red-400">
              <Heart size={14} /> VIT
            </div>
            <span className="attr-val text-red-300">{character.vit}</span>
          </div>

          {/* AGI */}
          <div className="attr-item" title="Agility: Increases Attack Combo Multiplier">
            <div className="attr-name text-emerald-400">
              <Zap size={14} /> AGI
            </div>
            <span className="attr-val text-emerald-300">{character.agi}</span>
          </div>

          {/* CHA */}
          <div className="attr-item col-span-2" title="Charisma: Increases Raid Bonus Gold Drops">
            <div className="attr-name text-pink-400">
              <Sparkles size={14} /> CHA (Leadership & Morale)
            </div>
            <span className="attr-val text-pink-300">{character.cha}</span>
          </div>
        </div>
      </div>

      {/* Streaks & Discipline */}
      <div className="mt-5 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
        <div className="flex items-center justify-between text-xs font-semibold mb-1">
          <span className="text-slate-400 flex items-center gap-1">
            <Flame size={14} className="text-red-400" /> Active Streak
          </span>
          <span className="text-red-400 font-bold">{character.current_streak} Consecutive Days</span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Personal Record</span>
          <span className="text-slate-300 font-semibold">{character.longest_streak} Days</span>
        </div>
      </div>

      {/* Equipped Armory Gear */}
      <div className="mt-5">
        <h3 className="panel-title text-sm mb-2 text-slate-300">
          <Shield size={16} className="text-amber-400" />
          <span>Equipped Armory</span>
        </h3>
        {equippedItems.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No equipment donned. Visit the Armory!</p>
        ) : (
          <div className="space-y-2">
            {equippedItems.map((item) => (
              <div 
                key={item.inventory_id} 
                className="flex items-center justify-between p-2 rounded bg-slate-900/80 border border-slate-800 text-xs"
              >
                <div>
                  <span className="font-semibold text-amber-300">{item.name}</span>
                  <div className="text-[10px] text-slate-400">
                    +{item.bonus_value} {item.bonus_stat} ({item.category})
                  </div>
                </div>
                <button
                  onClick={() => onUnequip(item.inventory_id)}
                  className="text-[11px] text-slate-400 hover:text-red-400 transition"
                  title="Unequip item"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
