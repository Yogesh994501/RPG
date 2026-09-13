import { describe, it, expect } from 'vitest';
import { TITAN_BESTIARY } from '../bossEngine.js';

describe('Boss Engine: Titan Bestiary & Encounters', () => {
  it('should register 8 distinct Titans in the Bestiary', () => {
    expect(TITAN_BESTIARY).toHaveLength(8);
  });

  it('should have unique names and elemental alignments for every Titan', () => {
    const names = new Set(TITAN_BESTIARY.map(t => t.name));
    const elements = new Set(TITAN_BESTIARY.map(t => t.element));

    expect(names.size).toBe(8);
    expect(elements.size).toBeGreaterThanOrEqual(7);
  });

  it('should scale HP, Gold, and XP across progressive tiers', () => {
    const malakor = TITAN_BESTIARY.find(t => t.name === 'Malakor')!;
    const bane = TITAN_BESTIARY.find(t => t.name === "Aethelgard's Bane")!;

    expect(malakor.hp).toBe(800);
    expect(bane.hp).toBe(7500);

    expect(bane.xp).toBeGreaterThan(malakor.xp);
    expect(bane.gold).toBeGreaterThan(malakor.gold);
  });

  it('should provide rich thematic lore and icons for all Titans', () => {
    for (const titan of TITAN_BESTIARY) {
      expect(titan.lore.length).toBeGreaterThan(20);
      expect(titan.icon).toBeTruthy();
      expect(titan.title).toContain('of');
    }
  });
});
