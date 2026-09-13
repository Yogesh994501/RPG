import { db } from '../db/database.js';
import crypto from 'crypto';

export interface CharacterData {
  user_id: string;
  level: number;
  current_xp: number;
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
}

export interface QuestRewardResult {
  xpGained: number;
  goldGained: number;
  attributeGained: string;
  attributeBonus: number;
  leveledUp: boolean;
  newLevel: number;
  streakChanged: boolean;
  currentStreak: number;
  streakMultiplier: number;
  character: CharacterData;
  quest?: any;
  // Backwards compatibility
  xpEarned: number;
  goldEarned: number;
  streakUpdated: boolean;
}

/**
 * Non-linear XP formula: XP_req(L) = floor(120 * L^1.5)
 * Level 1: 120 XP
 * Level 2: 339 XP
 * Level 3: 623 XP
 * Level 4: 960 XP
 * Level 5: 1341 XP
 */
export function getRequiredXpForLevel(level: number): number {
  return Math.floor(120 * Math.pow(level, 1.5));
}

/**
 * Returns formatted YYYY-MM-DD in the user's specific timezone
 */
export function getLocalDateString(timezone: string = 'UTC', date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(date);
  } catch {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC' }).format(date);
  }
}

/**
 * Returns the yesterday date string (YYYY-MM-DD) in the user's timezone
 */
export function getYesterdayDateString(timezone: string = 'UTC'): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getLocalDateString(timezone, yesterday);
}

/**
 * Calculates difficulty rewards matching server-side specification
 */
export function getDifficultyBaseRewards(difficulty: string): { xp: number; gold: number; statGain: number } {
  const norm = (difficulty || 'medium').toLowerCase();
  switch (norm) {
    case 'trivial':
      return { xp: 15, gold: 5, statGain: 1 };
    case 'easy':
      return { xp: 30, gold: 10, statGain: 1 };
    case 'medium':
      return { xp: 60, gold: 20, statGain: 2 };
    case 'hard':
      return { xp: 120, gold: 45, statGain: 3 };
    case 'legendary':
      return { xp: 250, gold: 100, statGain: 5 };
    default:
      return { xp: 30, gold: 10, statGain: 1 };
  }
}

/**
 * Authoritative Server-Side Quest Completion Transaction
 */
export function processQuestCompletion(
  userId: string,
  questId: string,
  userTimezone: string = 'UTC'
): QuestRewardResult {
  const completeTransaction = db.transaction(() => {
    // 1. Fetch quest
    const quest = db.prepare('SELECT * FROM quests WHERE id = ? AND user_id = ?').get(questId, userId) as any;
    if (!quest) {
      throw new Error('Quest not found');
    }

    const today = getLocalDateString(userTimezone);
    const recurrence = (quest.recurrence || (quest.quest_type === 'Daily' ? 'daily' : quest.quest_type === 'Habit' ? 'daily' : 'none')).toLowerCase();

    // Anti-Cheat Recurrence Validation: check QuestLog for an existing completion this period
    if (recurrence === 'daily') {
      const existingLog = db.prepare(`
        SELECT id, completed_at FROM quest_logs 
        WHERE user_id = ? AND quest_id = ? AND completed_at >= ?
        ORDER BY completed_at DESC LIMIT 1
      `).get(userId, questId, today) as any;

      if (existingLog || quest.is_completed) {
        throw new Error('Quest already fulfilled today. Resets tomorrow.');
      }
    } else if (recurrence === 'weekly') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const existingLog = db.prepare(`
        SELECT id, completed_at FROM quest_logs 
        WHERE user_id = ? AND quest_id = ? AND completed_at >= ?
        ORDER BY completed_at DESC LIMIT 1
      `).get(userId, questId, sevenDaysAgo) as any;

      if (existingLog || quest.is_completed) {
        throw new Error('Weekly quest already fulfilled for this period.');
      }
    } else {
      if (quest.is_completed) {
        throw new Error('One-time quest has already been fulfilled.');
      }
    }

    // 2. Fetch current character
    const char = db.prepare('SELECT * FROM characters WHERE user_id = ?').get(userId) as CharacterData;
    if (!char) {
      throw new Error('Character profile not found');
    }

    // 3. Fetch equipped gear bonuses
    const equippedItems = db.prepare(`
      SELECT s.bonus_stat, s.bonus_value 
      FROM inventory i 
      JOIN shop_items s ON i.item_id = s.id 
      WHERE i.user_id = ? AND i.is_equipped = 1
    `).all(userId) as Array<{ bonus_stat: string; bonus_value: number }>;

    let gearStatBonus = 0;
    for (const item of equippedItems) {
      if (item.bonus_stat === quest.attribute) {
        gearStatBonus += item.bonus_value;
      }
    }

    // 4. Calculate Timezone-aware streak
    const yesterday = getYesterdayDateString(userTimezone);
    let newStreak = char.current_streak;
    let streakUpdated = false;

    if (char.last_active_date === today) {
      // Already active today, streak remains ongoing
      streakUpdated = false;
    } else if (char.last_active_date === yesterday) {
      // Consecutive active day
      newStreak += 1;
      streakUpdated = true;
    } else {
      // Streak broken or first day
      newStreak = 1;
      streakUpdated = true;
    }

    const newLongestStreak = Math.max(char.longest_streak, newStreak);

    // Multiplier from streak
    let streakMultiplier = 1.0;
    if (newStreak >= 7) {
      streakMultiplier = 1.30;
    } else if (newStreak >= 3) {
      streakMultiplier = 1.15;
    }

    // 5. Calculate base rewards & apply streak multiplier
    const base = getDifficultyBaseRewards(quest.difficulty);
    const xpEarned = Math.round(base.xp * streakMultiplier);
    const goldEarned = Math.round(base.gold * streakMultiplier);
    const attributeBonus = base.statGain + (gearStatBonus > 0 ? 1 : 0);

    // 6. Level Up calculations
    let currentXp = char.current_xp + xpEarned;
    let currentLevel = char.level;
    let leveledUp = false;
    let maxHp = char.max_hp;
    let hp = char.hp;

    while (true) {
      const requiredXp = getRequiredXpForLevel(currentLevel);
      if (currentXp >= requiredXp) {
        currentXp -= requiredXp;
        currentLevel += 1;
        leveledUp = true;
        maxHp += 10;
        hp = maxHp; // full restoration on level up!
      } else {
        break;
      }
    }

    // Update Attribute value
    const attrKey = quest.attribute.toLowerCase() as 'str' | 'int' | 'vit' | 'agi' | 'cha';
    const newAttrValue = (char[attrKey] || 10) + attributeBonus;

    // 7. Update character in DB
    db.prepare(`
      UPDATE characters 
      SET level = ?, current_xp = ?, gold = gold + ?, hp = ?, max_hp = ?,
          ${attrKey} = ?, current_streak = ?, longest_streak = ?, last_active_date = ?
      WHERE user_id = ?
    `).run(
      currentLevel,
      currentXp,
      goldEarned,
      hp,
      maxHp,
      newAttrValue,
      newStreak,
      newLongestStreak,
      today,
      userId
    );

    // 8. Mark quest as completed
    const completedAt = new Date().toISOString();
    db.prepare(`
      UPDATE quests 
      SET is_completed = 1, completed_at = ? 
      WHERE id = ?
    `).run(completedAt, questId);

    // 9. Write immutable record to quest_logs
    const logId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO quest_logs (id, user_id, quest_id, quest_title, xp_earned, gold_earned, attribute_gained, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(logId, userId, questId, quest.title, xpEarned, goldEarned, `${quest.attribute} +${attributeBonus}`, completedAt);

    // 10. Write immutable entry to transactions (Anti-Cheat Audit Ledger)
    const txId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO transactions (id, user_id, type, amount_gold, amount_xp, description, reference_id, created_at)
      VALUES (?, ?, 'QUEST_COMPLETION', ?, ?, ?, ?, ?)
    `).run(
      txId,
      userId,
      goldEarned,
      xpEarned,
      `Completed ${quest.difficulty} Quest: "${quest.title}" (${quest.attribute} +${attributeBonus})`,
      questId,
      completedAt
    );

    if (leveledUp) {
      const levelTxId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO transactions (id, user_id, type, amount_gold, amount_xp, description, reference_id, created_at)
        VALUES (?, ?, 'ADMIN_ADJUSTMENT', 0, 0, ?, ?, ?)
      `).run(levelTxId, userId, `Leveled up to Level ${currentLevel}! Hero attributes surged!`, questId, completedAt);
    }

    const updatedChar = db.prepare('SELECT * FROM characters WHERE user_id = ?').get(userId) as any;
    const nextLevelXp = getRequiredXpForLevel(updatedChar.level);
    const xpProgressPercent = Math.min(100, Math.round((updatedChar.current_xp / nextLevelXp) * 100));
    updatedChar.next_level_xp = nextLevelXp;
    updatedChar.xp_progress_percent = xpProgressPercent;
    updatedChar.streak_multiplier = streakMultiplier;

    const updatedQuest = db.prepare('SELECT * FROM quests WHERE id = ?').get(questId) as any;

    return {
      xpGained: xpEarned,
      goldGained: goldEarned,
      attributeGained: quest.category || quest.attribute,
      attributeBonus,
      leveledUp,
      newLevel: currentLevel,
      streakChanged: streakUpdated,
      currentStreak: newStreak,
      streakMultiplier,
      character: updatedChar,
      quest: updatedQuest,
      // Backwards compatibility
      xpEarned,
      goldEarned,
      streakUpdated
    };
  });

  return completeTransaction();
}
