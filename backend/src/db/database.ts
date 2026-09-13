import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../chronoslayer.db');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);

// Enable WAL mode for high concurrency and performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_id TEXT DEFAULT 'warrior_1',
      title TEXT DEFAULT 'Novice Adventurer',
      timezone TEXT DEFAULT 'UTC',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS characters (
      user_id TEXT PRIMARY KEY,
      level INTEGER DEFAULT 1,
      current_xp INTEGER DEFAULT 0,
      gold INTEGER DEFAULT 50,
      hp INTEGER DEFAULT 100,
      max_hp INTEGER DEFAULT 100,
      str INTEGER DEFAULT 10,
      int INTEGER DEFAULT 10,
      vit INTEGER DEFAULT 10,
      agi INTEGER DEFAULT 10,
      cha INTEGER DEFAULT 10,
      current_streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      last_active_date TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      attribute TEXT NOT NULL CHECK(attribute IN ('STR','INT','VIT','AGI','CHA')),
      difficulty TEXT NOT NULL CHECK(difficulty IN ('Trivial','Easy','Medium','Hard','Legendary')),
      quest_type TEXT NOT NULL CHECK(quest_type IN ('Daily','Habit','Milestone')),
      due_date TEXT,
      is_completed INTEGER DEFAULT 0,
      completed_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quest_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      quest_id TEXT,
      quest_title TEXT NOT NULL,
      xp_earned INTEGER NOT NULL,
      gold_earned INTEGER NOT NULL,
      attribute_gained TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS shop_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('Weapon','Armor','Consumable','Relic','Title')),
      rarity TEXT NOT NULL CHECK(rarity IN ('Common','Uncommon','Rare','Epic','Legendary','Mythic')),
      cost INTEGER NOT NULL,
      bonus_stat TEXT,
      bonus_value INTEGER DEFAULT 0,
      icon TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      is_equipped INTEGER DEFAULT 0,
      acquired_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES shop_items(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS boss_raids (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      boss_name TEXT NOT NULL,
      boss_title TEXT NOT NULL,
      current_hp INTEGER NOT NULL,
      max_hp INTEGER NOT NULL,
      is_defeated INTEGER DEFAULT 0,
      reward_gold INTEGER NOT NULL,
      reward_xp INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('QUEST_COMPLETION','SHOP_PURCHASE','ITEM_SELL','BOSS_REWARD','CUSTOM_REWARD','ADMIN_ADJUSTMENT')),
      amount_gold INTEGER DEFAULT 0,
      amount_xp INTEGER DEFAULT 0,
      description TEXT NOT NULL,
      reference_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS custom_rewards (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      cost INTEGER NOT NULL,
      icon TEXT DEFAULT 'gift',
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS titles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      criteria TEXT NOT NULL,
      unlocked_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_quests_user ON quests(user_id, is_completed);
    CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_quest_logs_user ON quest_logs(user_id, completed_at DESC);
  `);

  try {
    db.prepare('ALTER TABLE quests ADD COLUMN category TEXT DEFAULT "mind"').run();
  } catch {}
  try {
    db.prepare('ALTER TABLE quests ADD COLUMN recurrence TEXT DEFAULT "daily"').run();
  } catch {}
  try {
    db.prepare('ALTER TABLE quests ADD COLUMN is_active INTEGER DEFAULT 1').run();
  } catch {}

  seedShopItems();
}

function seedShopItems() {
  const count = db.prepare('SELECT COUNT(*) as count FROM shop_items').get() as { count: number };
  if (count.count > 0) return;

  const insert = db.prepare(`
    INSERT INTO shop_items (id, name, description, category, rarity, cost, bonus_stat, bonus_value, icon)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialItems = [
    // Weapons
    { id: 'wpn_iron_sword', name: 'Blade of Diligence', description: 'Tempered in the fires of discipline. Grants +15% INT gains on study sessions.', category: 'Weapon', rarity: 'Common', cost: 75, bonus_stat: 'INT', bonus_value: 2, icon: 'sword' },
    { id: 'wpn_titan_hammer', name: "Titan's Dumbbell", description: 'Forged from dense celestial iron. Boosts physical quest efficiency.', category: 'Weapon', rarity: 'Uncommon', cost: 150, bonus_stat: 'STR', bonus_value: 3, icon: 'hammer' },
    { id: 'wpn_shadow_daggers', name: 'Daggers of Swiftness', description: 'Silent blades for rushing through high-priority chores and errands.', category: 'Weapon', rarity: 'Rare', cost: 220, bonus_stat: 'AGI', bonus_value: 4, icon: 'zap' },
    { id: 'wpn_archmage_staff', name: 'Staff of the Deep Focus', description: 'Radiates a quiet aura that banishes procrastination thoughts.', category: 'Weapon', rarity: 'Epic', cost: 450, bonus_stat: 'INT', bonus_value: 6, icon: 'sparkles' },
    { id: 'wpn_excalibur', name: 'Dawnbreaker of Willpower', description: 'Legendary holy blade that cuts through self-doubt and lethargy.', category: 'Weapon', rarity: 'Legendary', cost: 950, bonus_stat: 'STR', bonus_value: 10, icon: 'sun' },

    // Armor
    { id: 'arm_leather_tunic', name: 'Tunic of the Novice', description: 'Lightweight linen tunic that keeps you nimble throughout the day.', category: 'Armor', rarity: 'Common', cost: 60, bonus_stat: 'AGI', bonus_value: 1, icon: 'shield' },
    { id: 'arm_cloak_focus', name: 'Cloak of Undivided Focus', description: 'Blocks out noisy notifications and digital temptations.', category: 'Armor', rarity: 'Rare', cost: 240, bonus_stat: 'VIT', bonus_value: 4, icon: 'eye-off' },
    { id: 'arm_runic_plate', name: 'Aegis of the Steadfast', description: 'Heavy battle armor that provides a fortress of habit consistency.', category: 'Armor', rarity: 'Epic', cost: 500, bonus_stat: 'VIT', bonus_value: 7, icon: 'shield-alert' },
    { id: 'arm_celestial_mail', name: 'Celestial Astral Raiment', description: 'Woven with starlight. Grants a radiant aura of prestige.', category: 'Armor', rarity: 'Mythic', cost: 1200, bonus_stat: 'CHA', bonus_value: 12, icon: 'crown' },

    // Relics & Accessories
    { id: 'rel_chronos_ring', name: 'Ring of Chronos', description: 'Distorts perceived time, helping you enter a deep flow state effortlessly.', category: 'Relic', rarity: 'Rare', cost: 300, bonus_stat: 'INT', bonus_value: 4, icon: 'clock' },
    { id: 'rel_phoenix_feather', name: 'Phoenix Talisman', description: 'Emits a warm light that rejuvenates stamina and energy.', category: 'Relic', rarity: 'Epic', cost: 600, bonus_stat: 'VIT', bonus_value: 8, icon: 'flame' },
    { id: 'rel_kings_amulet', name: 'Medallion of Oratory', description: 'Bestows magnetic charisma and unshakeable confidence in meetings.', category: 'Relic', rarity: 'Rare', cost: 320, bonus_stat: 'CHA', bonus_value: 5, icon: 'mic' },

    // Consumables
    { id: 'con_elixir_clarity', name: 'Elixir of Mental Clarity', description: 'Instant surge of inspiration! Grants +100 bonus XP immediately.', category: 'Consumable', rarity: 'Uncommon', cost: 80, bonus_stat: 'XP', bonus_value: 100, icon: 'flask-conical' },
    { id: 'con_streak_shield', name: 'Aegis Streak Shield', description: 'Magical barrier that protects your active streak if you miss a day.', category: 'Consumable', rarity: 'Rare', cost: 180, bonus_stat: 'SHIELD', bonus_value: 1, icon: 'shield-check' },
    { id: 'con_draught_vitality', name: 'Draught of Restoration', description: 'Restores player HP to 100% and cures fatigue.', category: 'Consumable', rarity: 'Common', cost: 40, bonus_stat: 'HP', bonus_value: 100, icon: 'heart' },

    // Titles
    { id: 'ttl_slayer_sloth', name: 'Title: Slayer of Sloth', description: 'An honorary title proclaimed in taverns across Aetheria.', category: 'Title', rarity: 'Uncommon', cost: 120, bonus_stat: 'CHA', bonus_value: 2, icon: 'award' },
    { id: 'ttl_code_archmage', name: 'Title: Grand Archmage of Code', description: 'Reserved for practitioners of the sacred algorithmic arts.', category: 'Title', rarity: 'Epic', cost: 550, bonus_stat: 'INT', bonus_value: 5, icon: 'book-open' }
  ];

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      insert.run(item.id, item.name, item.description, item.category, item.rarity, item.cost, item.bonus_stat, item.bonus_value, item.icon);
    }
  });

  insertMany(initialItems);
}
