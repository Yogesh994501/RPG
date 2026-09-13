import React, { useState } from 'react';
import { 
  Dumbbell, 
  Brain, 
  Heart, 
  Zap, 
  Sparkles, 
  Shield, 
  Sword,
  FlaskConical, 
  Award, 
  Flame, 
  Camera,
  Plus,
  RefreshCw
} from 'lucide-react';
import { User, Character, InventoryItem } from '../types';

interface CharacterPanelProps {
  user: User;
  character: Character;
  equippedItems: InventoryItem[];
  onUnequip: (inventoryId: string) => void;
  onUpdateAvatar?: (avatarId: string) => void;
  onOpenArmorySlot?: (category: string) => void;
}

export const CharacterPanel: React.FC<CharacterPanelProps> = ({
  user,
  character,
  equippedItems,
  onUnequip,
  onUpdateAvatar,
  onOpenArmorySlot
}) => {
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const heroClasses = [
    { id: 'paladin_1', name: 'Paladin of Willpower', image: '/assets/hero_paladin.jpg', role: 'STR & VIT' },
    { id: 'mage_1', name: 'Archmage of Focus', image: '/assets/hero_mage.jpg', role: 'INT & WIS' },
    { id: 'rogue_1', name: 'Shadow Assassin', image: '/assets/hero_rogue.jpg', role: 'AGI & CHA' }
  ];

  const currentAvatar = heroClasses.find(c => c.id === user.avatar_id)?.image || '/assets/hero_paladin.jpg';

  const equippedWeapon = equippedItems.find(i => i.category === 'Weapon');
  const equippedArmor = equippedItems.find(i => i.category === 'Armor');
  const equippedRelic = equippedItems.find(i => i.category === 'Relic');
  const equippedPotion = equippedItems.find(i => i.category === 'Consumable');

  const getRarityBorder = (rarity?: string) => {
    switch (rarity) {
      case 'Mythic': return 'border-pink-500 shadow-[0_0_12px_#EC4899]';
      case 'Legendary': return 'border-amber-400 shadow-[0_0_12px_#F59E0B]';
      case 'Epic': return 'border-purple-500 shadow-[0_0_10px_#8B5CF6]';
      case 'Rare': return 'border-blue-500 shadow-[0_0_8px_#3B82F6]';
      case 'Uncommon': return 'border-emerald-500';
      default: return 'border-slate-700';
    }
  };

  return (
    <aside className="rpg-panel rpg-panel-gold w-full overflow-hidden">
      {/* Hero Header with Constrained Artwork */}
      <div className="flex items-center gap-3.5 mb-4">
        {/* Avatar Frame with fixed dimensions */}
        <div 
          className="relative group cursor-pointer flex-shrink-0"
          onClick={() => setShowAvatarPicker(!showAvatarPicker)}
          title="Click to Switch Hero Class & Portrait"
        >
          <div className="hero-avatar-frame" style={{ width: 76, height: 76, minWidth: 76, minHeight: 76 }}>
            <img 
              src={currentAvatar} 
              alt={user.username} 
              className="hero-avatar-img"
              style={{ width: 76, height: 76, objectFit: 'cover', objectPosition: 'top' }}
            />
          </div>
          <div className="avatar-badge font-rpg font-black text-[10px]">
            Lv.{character.level}
          </div>
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-2xl transition" style={{ width: 76, height: 76 }}>
            <RefreshCw size={18} className="text-amber-300" />
          </div>
        </div>

        <div className="overflow-hidden flex-1 min-w-0">
          <h2 className="font-rpg text-base font-bold text-white truncate" title={user.username}>
            {user.username}
          </h2>
          <p className="text-xs text-amber-400 truncate flex items-center gap-1 font-semibold">
            <Award size={13} className="flex-shrink-0" />
            <span className="truncate">{user.title || 'Novice Adventurer'}</span>
          </p>
          <p className="text-[10px] text-slate-200 mt-0.5 font-mono truncate font-medium">
            TZ: {user.timezone || 'Local'}
          </p>
        </div>
      </div>

      {/* Avatar Class Selector */}
      {showAvatarPicker && (
        <div className="mb-4 p-2.5 rounded-xl bg-slate-950 border border-amber-500/40 space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between text-xs font-bold text-amber-300 mb-1.5">
            <span>Select Hero Archetype</span>
            <button 
              onClick={() => setShowAvatarPicker(false)} 
              className="text-slate-400 hover:text-white text-[10px] px-1"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {heroClasses.map((hero) => (
              <button
                key={hero.id}
                onClick={() => {
                  if (onUpdateAvatar) onUpdateAvatar(hero.id);
                  setShowAvatarPicker(false);
                }}
                className={`flex flex-col items-center p-1 rounded-lg border text-center transition ${
                  user.avatar_id === hero.id
                    ? 'border-amber-400 bg-amber-500/20'
                    : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                }`}
              >
                <img 
                  src={hero.image} 
                  alt={hero.name} 
                  className="archetype-thumb-img" 
                  style={{ width: 44, height: 44, objectFit: 'cover', objectPosition: 'top', borderRadius: 6, display: 'block', margin: '0 auto 4px' }}
                />
                <span className="text-[9px] font-bold text-white truncate w-full">{hero.name.split(' ')[0]}</span>
                <span className="text-[7px] text-slate-400 truncate w-full">{hero.role}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Health Fantasy Vial */}
      <div className="fantasy-vial-container">
        <div className="vial-label-row text-red-400 text-xs">
          <span className="flex items-center gap-1">
            <Heart size={13} /> Vitality (HP)
          </span>
          <span className="font-mono">{character.hp} / {character.max_hp}</span>
        </div>
        <div className="fantasy-vial h-3.5" role="progressbar" aria-valuenow={character.hp} aria-valuemin={0} aria-valuemax={character.max_hp}>
          <div 
            className="vial-fill vial-fill-hp" 
            style={{ width: `${Math.min(100, Math.round((character.hp / character.max_hp) * 100))}%` }} 
          />
        </div>
      </div>

      {/* Experience (XP) Fantasy Vial */}
      <div className="fantasy-vial-container">
        <div className="vial-label-row text-purple-400 text-xs">
          <span className="flex items-center gap-1">
            <Sparkles size={13} /> Experience (XP)
          </span>
          <span className="font-mono">
            {character.current_xp} / {character.next_level_xp || 623} ({character.xp_progress_percent ?? Math.min(100, Math.round((character.current_xp / (character.next_level_xp || 623)) * 100))}%)
          </span>
        </div>
        <div className="fantasy-vial h-3.5" role="progressbar" aria-valuenow={character.current_xp} aria-valuemin={0} aria-valuemax={character.next_level_xp || 623}>
          <div 
            className="vial-fill vial-fill-xp" 
            style={{ width: `${character.xp_progress_percent ?? Math.min(100, Math.round((character.current_xp / (character.next_level_xp || 623)) * 100))}%` }} 
          />
        </div>
      </div>

      {/* Core Attributes */}
      <div className="mt-4">
        <h3 className="panel-title text-xs mb-2 text-slate-300">
          <Sword size={14} className="text-amber-400" />
          <span>Core RPG Attributes</span>
        </h3>
        <div className="attr-grid">
          {/* STR */}
          <div className="attr-item" title="Strength: Base Physical Strike Damage">
            <div className="attr-name text-amber-500">
              <Dumbbell size={13} /> STR
            </div>
            <span className="attr-val text-amber-300 text-xs">{character.str}</span>
          </div>

          {/* INT */}
          <div className="attr-item" title="Intellect: Critical Strike Chance & Magnitude">
            <div className="attr-name text-purple-400">
              <Brain size={13} /> INT
            </div>
            <span className="attr-val text-purple-300 text-xs">{character.int}</span>
          </div>

          {/* VIT */}
          <div className="attr-item" title="Vitality: Streak Resilience & Max HP">
            <div className="attr-name text-red-400">
              <Heart size={13} /> VIT
            </div>
            <span className="attr-val text-red-300 text-xs">{character.vit}</span>
          </div>

          {/* AGI */}
          <div className="attr-item" title="Agility: Speed Combo Multiplier">
            <div className="attr-name text-emerald-400">
              <Zap size={13} /> AGI
            </div>
            <span className="attr-val text-emerald-300 text-xs">{character.agi}</span>
          </div>

          {/* CHA */}
          <div className="attr-item col-span-2" title="Charisma: Gold Bounty Multiplier">
            <div className="attr-name text-pink-400">
              <Sparkles size={13} /> CHA (Leadership & Morale)
            </div>
            <span className="attr-val text-pink-300 text-xs">{character.cha}</span>
          </div>
        </div>
      </div>

      {/* ============================================================
          PAPER-DOLL EQUIPMENT RIG (Diablo / Habitica style slots)
          ============================================================ */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="panel-title text-xs mb-0 text-slate-200">
            <Shield size={14} className="text-amber-400" />
            <span>Equipment Paper-Doll</span>
          </h3>
          <span className="text-[10px] text-amber-300 font-bold font-mono">
            {equippedItems.length}/4 Slots
          </span>
        </div>

        <div className="paperdoll-grid">
          {/* Slot 1: Weapon */}
          <div 
            onClick={() => {
              if (equippedWeapon) onUnequip(equippedWeapon.inventory_id);
              else if (onOpenArmorySlot) onOpenArmorySlot('Weapon');
            }}
            className={`paperdoll-slot ${equippedWeapon ? `paperdoll-slot-filled ${getRarityBorder(equippedWeapon.rarity)}` : ''}`}
            title={equippedWeapon ? `${equippedWeapon.name} (+${equippedWeapon.bonus_value} ${equippedWeapon.bonus_stat}) - Click to Unequip` : 'Main Hand Weapon - Click to Equip'}
          >
            <Sword size={16} className={equippedWeapon ? 'text-amber-300' : 'text-slate-600'} />
            <span className="text-[8px] font-bold mt-1 text-slate-300 truncate w-full text-center">
              {equippedWeapon ? equippedWeapon.name.split(' ')[0] : 'Weapon'}
            </span>
            {equippedWeapon && (
              <span className="text-[7px] text-amber-400 font-mono">
                +{equippedWeapon.bonus_value} {equippedWeapon.bonus_stat}
              </span>
            )}
          </div>

          {/* Slot 2: Armor */}
          <div 
            onClick={() => {
              if (equippedArmor) onUnequip(equippedArmor.inventory_id);
              else if (onOpenArmorySlot) onOpenArmorySlot('Armor');
            }}
            className={`paperdoll-slot ${equippedArmor ? `paperdoll-slot-filled ${getRarityBorder(equippedArmor.rarity)}` : ''}`}
            title={equippedArmor ? `${equippedArmor.name} (+${equippedArmor.bonus_value} ${equippedArmor.bonus_stat}) - Click to Unequip` : 'Body Armor - Click to Equip'}
          >
            <Shield size={16} className={equippedArmor ? 'text-blue-300' : 'text-slate-600'} />
            <span className="text-[8px] font-bold mt-1 text-slate-300 truncate w-full text-center">
              {equippedArmor ? equippedArmor.name.split(' ')[0] : 'Armor'}
            </span>
            {equippedArmor && (
              <span className="text-[7px] text-blue-400 font-mono">
                +{equippedArmor.bonus_value} {equippedArmor.bonus_stat}
              </span>
            )}
          </div>

          {/* Slot 3: Relic */}
          <div 
            onClick={() => {
              if (equippedRelic) onUnequip(equippedRelic.inventory_id);
              else if (onOpenArmorySlot) onOpenArmorySlot('Relic');
            }}
            className={`paperdoll-slot ${equippedRelic ? `paperdoll-slot-filled ${getRarityBorder(equippedRelic.rarity)}` : ''}`}
            title={equippedRelic ? `${equippedRelic.name} (+${equippedRelic.bonus_value} ${equippedRelic.bonus_stat}) - Click to Unequip` : 'Arcane Relic - Click to Equip'}
          >
            <Sparkles size={16} className={equippedRelic ? 'text-purple-300' : 'text-slate-600'} />
            <span className="text-[8px] font-bold mt-1 text-slate-300 truncate w-full text-center">
              {equippedRelic ? equippedRelic.name.split(' ')[0] : 'Relic'}
            </span>
            {equippedRelic && (
              <span className="text-[7px] text-purple-400 font-mono">
                +{equippedRelic.bonus_value} {equippedRelic.bonus_stat}
              </span>
            )}
          </div>

          {/* Slot 4: Potion Belt */}
          <div 
            onClick={() => {
              if (equippedPotion) onUnequip(equippedPotion.inventory_id);
              else if (onOpenArmorySlot) onOpenArmorySlot('Consumable');
            }}
            className={`paperdoll-slot ${equippedPotion ? `paperdoll-slot-filled ${getRarityBorder(equippedPotion.rarity)}` : ''}`}
            title={equippedPotion ? `${equippedPotion.name} - Click to Unequip` : 'Potion Belt - Click to Equip'}
          >
            <FlaskConical size={16} className={equippedPotion ? 'text-emerald-300' : 'text-slate-600'} />
            <span className="text-[8px] font-bold mt-1 text-slate-300 truncate w-full text-center">
              {equippedPotion ? equippedPotion.name.split(' ')[0] : 'Potion'}
            </span>
            {equippedPotion && (
              <span className="text-[7px] text-emerald-400 font-mono">
                +{equippedPotion.bonus_value} {equippedPotion.bonus_stat}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Streaks & Discipline */}
      <div className="mt-4 p-2.5 rounded-lg bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between text-xs font-semibold mb-1">
          <span className="text-slate-200 flex items-center gap-1">
            <Flame size={13} className="text-red-400" /> Active Streak
          </span>
          <span className="text-red-400 font-bold">{character.current_streak} Days</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-300">
          <span>Personal Record</span>
          <span className="text-white font-bold">{character.longest_streak} Days</span>
        </div>
      </div>
    </aside>
  );
};
