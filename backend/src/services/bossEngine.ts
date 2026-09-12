import { db } from '../db/database.js';
import crypto from 'crypto';
import { CharacterData, getRequiredXpForLevel } from './rpgEngine.js';

export interface BossData {
  id: string;
  user_id: string;
  boss_name: string;
  boss_title: string;
  current_hp: number;
  max_hp: number;
  is_defeated: number;
  reward_gold: number;
  reward_xp: number;
  created_at: string;
}

export interface AttackResult {
  damageDealt: number;
  isCritical: boolean;
  comboMultiplier: number;
  bossDefeated: boolean;
  boss: BossData;
  character: CharacterData;
  combatLog: string;
}

export function getOrCreateBoss(userId: string): BossData {
  let boss = db.prepare(`
    SELECT * FROM boss_raids 
    WHERE user_id = ? AND is_defeated = 0 
    ORDER BY created_at DESC LIMIT 1
  `).get(userId) as BossData | undefined;

  if (!boss) {
    const bossId = crypto.randomUUID();
    const bosses = [
      { name: 'Malakor', title: 'Titan of Procrastination', hp: 800, gold: 200, xp: 450 },
      { name: 'Ignis', title: 'Drake of Distraction', hp: 1200, gold: 300, xp: 700 },
      { name: 'Umbra', title: 'Shadow of Lethargy', hp: 1600, gold: 450, xp: 1000 },
      { name: 'Chronos', title: 'Lord of Wasted Hours', hp: 2500, gold: 800, xp: 2000 }
    ];

    const defeatedCount = (db.prepare(`
      SELECT COUNT(*) as count FROM boss_raids WHERE user_id = ? AND is_defeated = 1
    `).get(userId) as { count: number }).count;

    const template = bosses[defeatedCount % bosses.length];

    db.prepare(`
      INSERT INTO boss_raids (id, user_id, boss_name, boss_title, current_hp, max_hp, is_defeated, reward_gold, reward_xp, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
    `).run(
      bossId,
      userId,
      template.name,
      template.title,
      template.hp,
      template.hp,
      template.gold,
      template.xp,
      new Date().toISOString()
    );

    boss = db.prepare('SELECT * FROM boss_raids WHERE id = ?').get(bossId) as BossData;
  }

  return boss;
}

/**
 * Executes an attribute-weighted combat turn against the boss
 */
export function executeBossAttack(userId: string): AttackResult {
  const attackTx = db.transaction(() => {
    const boss = getOrCreateBoss(userId);
    const char = db.prepare('SELECT * FROM characters WHERE user_id = ?').get(userId) as CharacterData;
    if (!char) throw new Error('Character not found');

    // 1. STR determines Base Physical Damage
    const baseDamage = 15 + Math.floor(char.str * 1.3);

    // 2. AGI determines Combo Speed Multiplier
    const comboMultiplier = Number((1.0 + (char.agi * 0.015)).toFixed(2));

    // 3. INT determines Critical Strike Chance & Power
    const critChance = Math.min(60, 5 + Math.floor(char.int * 0.5));
    const roll = Math.random() * 100;
    const isCritical = roll < critChance;
    const critBonus = isCritical ? 1.75 : 1.0;

    // Total Damage calculation
    const totalDamage = Math.max(10, Math.floor(baseDamage * comboMultiplier * critBonus));

    const newHp = Math.max(0, boss.current_hp - totalDamage);
    const bossDefeated = newHp <= 0;

    db.prepare(`
      UPDATE boss_raids 
      SET current_hp = ?, is_defeated = ? 
      WHERE id = ?
    `).run(newHp, bossDefeated ? 1 : 0, boss.id);

    let combatLog = `You struck ${boss.boss_name} for ${totalDamage} damage!`;
    if (isCritical) {
      combatLog = `⚡ CRITICAL HIT! Your intellect pierced the armor for ${totalDamage} damage!`;
    }

    if (bossDefeated) {
      // 4. CHA grants bonus Gold on victory
      const charismaBonusGold = Math.floor(boss.reward_gold * (char.cha * 0.01));
      const totalRewardGold = boss.reward_gold + charismaBonusGold;
      const totalRewardXp = boss.reward_xp;

      // Update character with boss victory rewards
      let currentXp = char.current_xp + totalRewardXp;
      let currentLevel = char.level;
      let maxHp = char.max_hp;
      let hp = char.hp;

      while (true) {
        const req = getRequiredXpForLevel(currentLevel);
        if (currentXp >= req) {
          currentXp -= req;
          currentLevel += 1;
          maxHp += 10;
          hp = maxHp;
        } else {
          break;
        }
      }

      db.prepare(`
        UPDATE characters 
        SET current_xp = ?, level = ?, gold = gold + ?, hp = ?, max_hp = ?
        WHERE user_id = ?
      `).run(currentXp, currentLevel, totalRewardGold, hp, maxHp, userId);

      // Add to transactions ledger
      const txId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO transactions (id, user_id, type, amount_gold, amount_xp, description, reference_id, created_at)
        VALUES (?, ?, 'BOSS_REWARD', ?, ?, ?, ?, ?)
      `).run(
        txId,
        userId,
        totalRewardGold,
        totalRewardXp,
        `Vanquished World Boss: ${boss.boss_name}, ${boss.boss_title}! Earned ${totalRewardGold} Gold & ${totalRewardXp} XP.`,
        boss.id,
        new Date().toISOString()
      );

      combatLog += ` 🏆 VICTORY! ${boss.boss_name} has been vanquished! Collected ${totalRewardGold} Gold & ${totalRewardXp} XP!`;
    }

    const updatedBoss = db.prepare('SELECT * FROM boss_raids WHERE id = ?').get(boss.id) as BossData;
    const updatedChar = db.prepare('SELECT * FROM characters WHERE user_id = ?').get(userId) as CharacterData;

    return {
      damageDealt: totalDamage,
      isCritical,
      comboMultiplier,
      bossDefeated,
      boss: updatedBoss,
      character: updatedChar,
      combatLog
    };
  });

  return attackTx();
}
