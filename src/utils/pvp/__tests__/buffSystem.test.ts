import { describe, it, expect } from 'vitest';
import { getBuffMultiplier, applyBuff, type BuffStages } from '../buffSystem';

describe('Buff System', () => {
  describe('getBuffMultiplier', () => {
    it('should return correct multipliers for all stages', () => {
      expect(getBuffMultiplier(-4)).toBe(0.5);
      expect(getBuffMultiplier(-3)).toBe(0.5714285714285714);
      expect(getBuffMultiplier(-2)).toBe(0.6666666666666666);
      expect(getBuffMultiplier(-1)).toBe(0.8);
      expect(getBuffMultiplier(0)).toBe(1.0);
      expect(getBuffMultiplier(1)).toBe(1.25);
      expect(getBuffMultiplier(2)).toBe(1.5);
      expect(getBuffMultiplier(3)).toBe(1.75);
      expect(getBuffMultiplier(4)).toBe(2.0);
    });

    it('should clamp values below -4 to -4', () => {
      expect(getBuffMultiplier(-5)).toBe(0.5);
      expect(getBuffMultiplier(-10)).toBe(0.5);
    });

    it('should clamp values above 4 to 4', () => {
      expect(getBuffMultiplier(5)).toBe(2.0);
      expect(getBuffMultiplier(10)).toBe(2.0);
    });
  });

  describe('applyBuff', () => {
    const initialBuffs: BuffStages = { attack: 0, defense: 0 };

    it('should apply positive attack buff correctly', () => {
      const result = applyBuff(initialBuffs, 'attack', 2);
      expect(result.attack).toBe(2);
      expect(result.defense).toBe(0);
    });

    it('should apply negative defense buff correctly', () => {
      const result = applyBuff(initialBuffs, 'defense', -1);
      expect(result.attack).toBe(0);
      expect(result.defense).toBe(-1);
    });

    it('should stack buffs correctly', () => {
      const buffed1 = applyBuff(initialBuffs, 'attack', 1);
      const buffed2 = applyBuff(buffed1, 'attack', 1);
      expect(buffed2.attack).toBe(2);
    });

    it('should not exceed maximum buff stage', () => {
      const buffed1 = applyBuff(initialBuffs, 'attack', 3);
      const buffed2 = applyBuff(buffed1, 'attack', 2);
      expect(buffed2.attack).toBe(4); // Capped at 4
    });

    it('should not exceed minimum buff stage', () => {
      const buffed1 = applyBuff(initialBuffs, 'defense', -3);
      const buffed2 = applyBuff(buffed1, 'defense', -2);
      expect(buffed2.defense).toBe(-4); // Capped at -4
    });

    it('should handle mixed positive and negative buffs', () => {
      const buffed1 = applyBuff(initialBuffs, 'attack', 2);
      const buffed2 = applyBuff(buffed1, 'attack', -3);
      expect(buffed2.attack).toBe(-1);
    });

    it('should not mutate original buffs object', () => {
      const original: BuffStages = { attack: 1, defense: -1 };
      const result = applyBuff(original, 'attack', 1);
      expect(original.attack).toBe(1); // Original unchanged
      expect(result.attack).toBe(2); // New value
    });
  });

  describe('Buff Stage Formulas', () => {
    it('should match GO formula: multiplier = (4 + stage) / 4 for positive', () => {
      expect(getBuffMultiplier(1)).toBe(5 / 4); // 1.25
      expect(getBuffMultiplier(2)).toBe(6 / 4); // 1.5
      expect(getBuffMultiplier(3)).toBe(7 / 4); // 1.75
      expect(getBuffMultiplier(4)).toBe(8 / 4); // 2.0
    });

    it('should match GO formula: multiplier = 4 / (4 - stage) for negative', () => {
      expect(getBuffMultiplier(-1)).toBe(4 / 5); // 0.8
      expect(getBuffMultiplier(-2)).toBe(4 / 6); // 0.666...
      expect(getBuffMultiplier(-3)).toBe(4 / 7); // 0.571...
      expect(getBuffMultiplier(-4)).toBe(4 / 8); // 0.5
    });
  });

  describe('Real Battle Scenarios', () => {
    it('should handle Power-Up Punch (+1 attack)', () => {
      const buffs = applyBuff({ attack: 0, defense: 0 }, 'attack', 1);
      expect(getBuffMultiplier(buffs.attack)).toBe(1.25);
    });

    it('should handle Ancient Power (+2 attack, +2 defense)', () => {
      let buffs: BuffStages = { attack: 0, defense: 0 };
      buffs = applyBuff(buffs, 'attack', 2);
      buffs = applyBuff(buffs, 'defense', 2);
      expect(getBuffMultiplier(buffs.attack)).toBe(1.5);
      expect(getBuffMultiplier(buffs.defense)).toBe(1.5);
    });

    it('should handle Acid Spray (-2 defense)', () => {
      const buffs = applyBuff({ attack: 0, defense: 0 }, 'defense', -2);
      expect(getBuffMultiplier(buffs.defense)).toBeCloseTo(0.6666666666666666);
    });
  });
});
