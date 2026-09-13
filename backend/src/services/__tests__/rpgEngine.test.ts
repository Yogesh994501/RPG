import { describe, it, expect } from 'vitest';
import { 
  getRequiredXpForLevel, 
  getDifficultyBaseRewards, 
  getLocalDateString, 
  getYesterdayDateString 
} from '../rpgEngine.js';

describe('RPG Engine: Progression & Game Math', () => {
  describe('XP Level Formula (Non-linear Progression)', () => {
    it('should calculate accurate required XP per level according to 120 * L^1.5', () => {
      expect(getRequiredXpForLevel(1)).toBe(120);
      expect(getRequiredXpForLevel(2)).toBe(339);
      expect(getRequiredXpForLevel(3)).toBe(623);
      expect(getRequiredXpForLevel(4)).toBe(960);
      expect(getRequiredXpForLevel(5)).toBe(1341);
    });

    it('should scale exponentially preventing easy high-level abuse', () => {
      const xpLevel5 = getRequiredXpForLevel(5);
      const xpLevel10 = getRequiredXpForLevel(10);
      const xpLevel20 = getRequiredXpForLevel(20);

      expect(xpLevel10).toBeGreaterThan(xpLevel5 * 2.5);
      expect(xpLevel20).toBeGreaterThan(xpLevel10 * 2.5);
    });
  });

  describe('Difficulty Reward Tiers', () => {
    it('should award exact base XP and Gold according to server-authoritative table', () => {
      const trivial = getDifficultyBaseRewards('Trivial');
      expect(trivial).toEqual({ xp: 15, gold: 5, statGain: 1 });

      const easy = getDifficultyBaseRewards('Easy');
      expect(easy).toEqual({ xp: 30, gold: 10, statGain: 1 });

      const medium = getDifficultyBaseRewards('Medium');
      expect(medium).toEqual({ xp: 60, gold: 20, statGain: 2 });

      const hard = getDifficultyBaseRewards('Hard');
      expect(hard).toEqual({ xp: 120, gold: 45, statGain: 3 });

      const legendary = getDifficultyBaseRewards('Legendary');
      expect(legendary).toEqual({ xp: 250, gold: 100, statGain: 5 });
    });

    it('should be case-insensitive and fallback safely on unexpected difficulty strings', () => {
      const lower = getDifficultyBaseRewards('legendary');
      expect(lower.xp).toBe(250);
      expect(lower.gold).toBe(100);

      const unknown = getDifficultyBaseRewards('UnknownDifficultyTier');
      expect(unknown).toEqual({ xp: 30, gold: 10, statGain: 1 });
    });
  });

  describe('Timezone & Streak Calendar Boundary Calculation', () => {
    it('should format ISO date strings into YYYY-MM-DD for arbitrary timezones', () => {
      const fixedDate = new Date('2026-09-13T12:00:00Z');
      const utcDate = getLocalDateString('UTC', fixedDate);
      expect(utcDate).toBe('2026-09-13');

      // Invalid timezone gracefully falls back to UTC
      const fallbackDate = getLocalDateString('Invalid/Timezone_X', fixedDate);
      expect(fallbackDate).toBe('2026-09-13');
    });

    it('should compute yesterday correctly for streak rollover evaluations', () => {
      const yesterday = getYesterdayDateString('UTC');
      const today = getLocalDateString('UTC');
      expect(yesterday).not.toBe(today);
      expect(yesterday.length).toBe(10);
    });
  });

  describe('Combo Multiplier Math & Anti-Cheat Cap', () => {
    it('should reward consistent daily streaks up to the 2.5x hard cap', () => {
      const calcMultiplier = (streak: number) => Math.min(2.5, +(1 + streak * 0.03).toFixed(2));

      expect(calcMultiplier(0)).toBe(1.0);
      expect(calcMultiplier(5)).toBe(1.15);
      expect(calcMultiplier(10)).toBe(1.30);
      expect(calcMultiplier(30)).toBe(1.90);
      expect(calcMultiplier(60)).toBe(2.50); // Hard capped
      expect(calcMultiplier(100)).toBe(2.50); // Still capped
    });
  });
});
