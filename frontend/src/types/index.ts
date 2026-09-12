export type AttributeType = 'STR' | 'INT' | 'VIT' | 'AGI' | 'CHA';
export type DifficultyType = 'Trivial' | 'Easy' | 'Medium' | 'Hard' | 'Legendary';
export type QuestType = 'Daily' | 'Habit' | 'Milestone';
export type ItemCategory = 'Weapon' | 'Armor' | 'Consumable' | 'Relic' | 'Title';
export type ItemRarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar_id: string;
  title: string;
  timezone: string;
}

export interface Character {
  user_id: string;
  level: number;
  current_xp: number;
  next_level_xp: number;
  xp_progress_percent: number;
  gold: number;
  hp: number;
  max_hp: number;
  str: number;
  int: number;
  vit: number;
  agi: number;
  cha: number;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  streak_multiplier: number;
}

export interface Quest {
  id: string;
  user_id: string;
  title: string;
  description: string;
  attribute: AttributeType;
  difficulty: DifficultyType;
  quest_type: QuestType;
  due_date: string | null;
  is_completed: number;
  completed_at: string | null;
  created_at: string;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  rarity: ItemRarity;
  cost: number;
  bonus_stat: string | null;
  bonus_value: number;
  icon: string;
}

export interface InventoryItem extends ShopItem {
  inventory_id: string;
  item_id: string;
  is_equipped: number;
  acquired_at: string;
}

export interface Boss {
  id: string;
  boss_name: string;
  boss_title: string;
  current_hp: number;
  max_hp: number;
  is_defeated: number;
  reward_gold: number;
  reward_xp: number;
}

export interface CombatAttributes {
  baseDamage: number;
  critChance: number;
  comboMultiplier: number;
  vitalityShield: number;
  bonusLootMultiplier: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'QUEST_COMPLETION' | 'SHOP_PURCHASE' | 'ITEM_SELL' | 'BOSS_REWARD' | 'CUSTOM_REWARD' | 'ADMIN_ADJUSTMENT';
  amount_gold: number;
  amount_xp: number;
  description: string;
  reference_id: string | null;
  created_at: string;
}

export interface QuestLog {
  id: string;
  quest_id: string;
  quest_title: string;
  xp_earned: number;
  gold_earned: number;
  attribute_gained: string;
  completed_at: string;
}

export interface CustomReward {
  id: string;
  user_id: string;
  title: string;
  cost: number;
  icon: string;
  created_at: string;
}

export interface LevelUpEvent {
  level: number;
  hpRestored: number;
  attributeGained: string;
  attributeBonus: number;
}
