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

export interface TitanTemplate {
  name: string;
  title: string;
  element: string;
  icon: string;
  lore: string;
  hp: number;
  gold: number;
  xp: number;
}

export const TITAN_BESTIARY: TitanTemplate[] = [
  {
    name: 'Malakor',
    title: 'Titan of Procrastination',
    element: 'Void',
    icon: '🌌',
    lore: 'A behemoth born of postponed dreams and endless delays. His armor hardens whenever you say "tomorrow".',
    hp: 800,
    gold: 200,
    xp: 450
  },
  {
    name: 'Ignis',
    title: 'Drake of Distraction',
    element: 'Fire',
    icon: '🔥',
    lore: 'A restless serpentine drake whose blinding sparks lure your attention away into rabbit holes and feeds.',
    hp: 1200,
    gold: 300,
    xp: 700
  },
  {
    name: 'Umbra',
    title: 'Shadow of Lethargy',
    element: 'Shadow',
    icon: '🌑',
    lore: 'A creeping gloom that saps your vitality, making even the simplest deed feel like dragging iron chains.',
    hp: 1600,
    gold: 450,
    xp: 1000
  },
  {
    name: 'Chronos',
    title: 'Lord of Wasted Hours',
    element: 'Temporal',
    icon: '⏳',
    lore: 'A master of temporal theft. He distorts minutes into hours, consuming productive time in a blink.',
    hp: 2500,
    gold: 800,
    xp: 2000
  },
  {
    name: 'Apathy',
    title: 'Frost Wyrm of Inaction',
    element: 'Frost',
    icon: '❄️',
    lore: 'Her icy breath freezes ambition in place. Those who succumb become frozen statues in the snow plains of regret.',
    hp: 3200,
    gold: 1100,
    xp: 2800
  },
  {
    name: 'Sirena',
    title: 'Phantom of the Infinite Feed',
    element: 'Illusion',
    icon: '📱',
    lore: 'She sings a hypnotic digital melody of endless notifications, autoplay videos, and bottomless algorithmic feeds.',
    hp: 4000,
    gold: 1500,
    xp: 3600
  },
  {
    name: 'Vulcanus',
    title: 'Colossus of Chronic Burnout',
    element: 'Magma',
    icon: '🌋',
    lore: 'The volcanic titan that erupts when discipline turns into manic overwork without recovery or sleep.',
    hp: 5500,
    gold: 2200,
    xp: 5000
  },
  {
    name: "Aethelgard's Bane",
    title: 'Sovereign of Chaos',
    element: 'Cosmic',
    icon: '👑',
    lore: 'The supreme architect of aimless existence. Defeating him restores radiant harmony to your real-world realm.',
    hp: 7500,
    gold: 3500,
    xp: 8000
  }
];

export function getOrCreateBoss(userId: string): BossData {
  let boss = db.prepare(`
    SELECT * FROM boss_raids 
    WHERE user_id = ? AND is_defeated = 0 
    ORDER BY created_at DESC LIMIT 1
  `).get(userId) as BossData | undefined;

  if (!boss) {
    const bossId = crypto.randomUUID();

    const defeatedCount = (db.prepare(`
      SELECT COUNT(*) as count FROM boss_raids WHERE user_id = ? AND is_defeated = 1
    `).get(userId) as { count: number }).count;

    const template = TITAN_BESTIARY[defeatedCount % TITAN_BESTIARY.length];

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

export function getTitanBestiary(userId: string) {
  const defeatedRows = db.prepare(`
    SELECT boss_name, COUNT(*) as count 
    FROM boss_raids 
    WHERE user_id = ? AND is_defeated = 1 
    GROUP BY boss_name
  `).all(userId) as { boss_name: string; count: number }[];

  const defeatedMap = new Map(defeatedRows.map(r => [r.boss_name, r.count]));

  const currentBoss = db.prepare(`
    SELECT * FROM boss_raids 
    WHERE user_id = ? AND is_defeated = 0 
    ORDER BY created_at DESC LIMIT 1
  `).get(userId) as BossData | undefined;

  return TITAN_BESTIARY.map((titan, index) => {
    const timesDefeated = defeatedMap.get(titan.name) || 0;
    const isCurrent = currentBoss?.boss_name === titan.name;
    return {
      ...titan,
      tier: index + 1,
      timesDefeated,
      isCurrent,
      currentHp: isCurrent ? currentBoss?.current_hp : titan.hp
    };
  });
}

export function selectBossTarget(userId: string, bossName: string): BossData {
  const template = TITAN_BESTIARY.find(t => t.name.toLowerCase() === bossName.toLowerCase());
  if (!template) throw new Error('Titan not found in the Bestiary');

  db.prepare(`
    DELETE FROM boss_raids WHERE user_id = ? AND is_defeated = 0
  `).run(userId);

  const bossId = crypto.randomUUID();
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

  return db.prepare('SELECT * FROM boss_raids WHERE id = ?').get(bossId) as BossData;
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
    const updatedChar = db.prepare('SELECT * FROM characters WHERE user_id = ?').get(userId) as any;
    const nextLevelXp = getRequiredXpForLevel(updatedChar.level);
    updatedChar.next_level_xp = nextLevelXp;
    updatedChar.xp_progress_percent = Math.min(100, Math.round((updatedChar.current_xp / nextLevelXp) * 100));
    let sMult = 1.0;
    if (updatedChar.current_streak >= 7) sMult = 1.30;
    else if (updatedChar.current_streak >= 3) sMult = 1.15;
    updatedChar.streak_multiplier = sMult;

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
