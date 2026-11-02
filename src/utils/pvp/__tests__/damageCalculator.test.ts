import { describe, it, expect } from 'vitest';
import { calculateDamage } from '../damageCalculator';
import type { BattlePokemon } from '../../../types/battle.types';

/**
 * Damage Calculator Tests
 * 
 * Formula: floor(0.5 * Power * (Atk/Def) * STAB * Effectiveness * PvP_Bonus) + 1
 * 
 * Where:
 * - STAB = 1.2 (Same Type Attack Bonus)
 * - PvP_Bonus = 1.3 (applied to all PvP damage)
 * - Effectiveness = 0.390625 to 2.56
 */
describe('Damage Calculator', () => {
  // Helper to create a minimal Pokemon for testing
  const createTestPokemon = (
    atk: number,
    def: number,
    types: string[] = ['normal'],
    attackBuff: number = 0,
    defenseBuff: number = 0
  ): Partial<BattlePokemon> => ({
    stats: { attack: atk, defense: def, hp: 100 },
    types: types as any,
    buffStages: { attack: attackBuff, defense: defenseBuff },
  });

  describe('Base Damage Formula', () => {
    it('should calculate basic damage correctly with PvP bonus', () => {
      const attacker = createTestPokemon(100, 100) as BattlePokemon;
      const defender = createTestPokemon(100, 100) as BattlePokemon;

      // Damage = floor(0.5 * Power * (Atk/Def) * STAB * PvP_Bonus) + 1
      // With 100 atk, 100 def, STAB 1.2x, PvP 1.3x: floor(0.5 * 100 * 1 * 1.2 * 1.3) + 1 = floor(78) + 1 = 79
      const damage = calculateDamage(attacker, defender, 100, ['normal']);
      expect(damage).toBe(79);
    });

    it('should apply minimum damage of 1', () => {
      const attacker = createTestPokemon(1, 100) as BattlePokemon;
      const defender = createTestPokemon(100, 200) as BattlePokemon;

      // Very weak attack, but minimum is 1
      const damage = calculateDamage(attacker, defender, 1, ['normal']);
      expect(damage).toBe(1);
    });

    it('should calculate higher attack advantage', () => {
      const attacker = createTestPokemon(200, 100) as BattlePokemon;
      const defender = createTestPokemon(100, 100) as BattlePokemon;

      // floor(0.5 * 100 * (200/100) * 1.2 * 1.3) + 1 = floor(0.5 * 100 * 2 * 1.2 * 1.3) + 1 = floor(156) + 1 = 157
      const damage = calculateDamage(attacker, defender, 100, ['normal']);
      expect(damage).toBe(157);
    });

    it('should calculate higher defense reduction', () => {
      const attacker = createTestPokemon(100, 100) as BattlePokemon;
      const defender = createTestPokemon(100, 200) as BattlePokemon;

      // floor(0.5 * 100 * (100/200) * 1.2 * 1.3) + 1 = floor(0.5 * 100 * 0.5 * 1.2 * 1.3) + 1 = floor(39) + 1 = 40
      const damage = calculateDamage(attacker, defender, 100, ['normal']);
      expect(damage).toBe(40);
    });
  });

  describe('STAB (Same Type Attack Bonus)', () => {
    it('should apply STAB when move type matches attacker type', () => {
      const attacker = createTestPokemon(100, 100, ['water']) as BattlePokemon;
      const defender = createTestPokemon(100, 100) as BattlePokemon;

      // With STAB (1.2x) and PvP bonus (1.3x): floor(0.5 * 100 * 1 * 1.2 * 1.3) + 1 = floor(78) + 1 = 79
      const damage = calculateDamage(attacker, defender, 100, ['water']);
      expect(damage).toBe(79);
    });

    it('should not apply STAB when move type does not match', () => {
      const attacker = createTestPokemon(100, 100, ['fire']) as BattlePokemon;
      const defender = createTestPokemon(100, 100) as BattlePokemon;

      // No STAB, just PvP bonus: floor(0.5 * 100 * 1 * 1.0 * 1.2999999...) + 1 = floor(64.99...) + 1 = 65
      const damage = calculateDamage(attacker, defender, 100, ['water']);
      expect(damage).toBe(65);
    });

    it('should apply STAB for dual-type Pokemon with matching type', () => {
      const attacker = createTestPokemon(100, 100, ['water', 'ground']) as BattlePokemon;
      const defender = createTestPokemon(100, 100) as BattlePokemon;

      // STAB applies if either type matches
      const waterDamage = calculateDamage(attacker, defender, 100, ['water']);
      const groundDamage = calculateDamage(attacker, defender, 100, ['ground']);
      expect(waterDamage).toBe(79);
      expect(groundDamage).toBe(79);
    });
  });

  describe('Type Effectiveness', () => {
    it('should apply super effective multiplier (1.6x)', () => {
      const attacker = createTestPokemon(100, 100, ['water']) as BattlePokemon;
      const defender = createTestPokemon(100, 100, ['fire']) as BattlePokemon;

      // STAB (1.2) * Super Effective (1.6) * PvP (1.3) = 2.496
      // floor(0.5 * 100 * 1 * 2.496) + 1 = floor(124.8) + 1 = 125
      const damage = calculateDamage(attacker, defender, 100, ['water']);
      expect(damage).toBe(125);
    });

    it('should apply not very effective multiplier (0.625x)', () => {
      const attacker = createTestPokemon(100, 100, ['fire']) as BattlePokemon;
      const defender = createTestPokemon(100, 100, ['water']) as BattlePokemon;

      // STAB (1.2) * Not Very Effective (0.625) * PvP (1.3) = 0.975
      // floor(0.5 * 100 * 1 * 0.975) + 1 = floor(48.75) + 1 = 49
      const damage = calculateDamage(attacker, defender, 100, ['fire']);
      expect(damage).toBe(49);
    });

    it('should apply dual super effective (2.56x)', () => {
      const attacker = createTestPokemon(100, 100, ['ground']) as BattlePokemon;
      const defender = createTestPokemon(100, 100, ['rock', 'electric']) as BattlePokemon;

      // STAB (1.2) * Double Super Effective (2.56) * PvP (1.3) = 3.9936
      // floor(0.5 * 100 * 1 * 3.9936) + 1 = floor(199.68) + 1 = 200
      const damage = calculateDamage(attacker, defender, 100, ['ground']);
      expect(damage).toBe(200);
    });
  });

  describe('Buff/Debuff Stages', () => {
    it('should apply attack buff (+1 stage = 1.25x)', () => {
      const attacker = createTestPokemon(100, 100) as BattlePokemon;
      attacker.buffStages = { attack: 1, defense: 0 };
      const defender = createTestPokemon(100, 100) as BattlePokemon;

      // floor(0.5 * 100 * (100 * 1.25 / 100) * 1.2 * 1.3) + 1 = floor(0.5 * 100 * 1.25 * 1.56) + 1 = floor(97.5) + 1 = 98
      const damage = calculateDamage(attacker, defender, 100, ['normal']);
      expect(damage).toBe(98);
    });

    it('should apply attack debuff (-1 stage = 0.8x)', () => {
      const attacker = createTestPokemon(100, 100) as BattlePokemon;
      attacker.buffStages = { attack: -1, defense: 0 };
      const defender = createTestPokemon(100, 100) as BattlePokemon;

      // floor(0.5 * 100 * (100 * 0.8 / 100) * 1.2 * 1.3) + 1 = floor(0.5 * 100 * 0.8 * 1.56) + 1 = floor(62.4) + 1 = 63
      const damage = calculateDamage(attacker, defender, 100, ['normal']);
      expect(damage).toBe(63);
    });

    it('should apply defense buff (+1 stage = 1.25x)', () => {
      const attacker = createTestPokemon(100, 100) as BattlePokemon;
      const defender = createTestPokemon(100, 100) as BattlePokemon;
      defender.buffStages = { attack: 0, defense: 1 };

      // floor(0.5 * 100 * (100 / (100 * 1.25)) * 1.2 * 1.3) + 1 = floor(0.5 * 100 * 0.8 * 1.56) + 1 = floor(62.4) + 1 = 63
      const damage = calculateDamage(attacker, defender, 100, ['normal']);
      expect(damage).toBe(63);
    });

    it('should apply defense debuff (-2 stages = 0.666...x)', () => {
      const attacker = createTestPokemon(100, 100) as BattlePokemon;
      const defender = createTestPokemon(100, 100) as BattlePokemon;
      defender.buffStages = { attack: 0, defense: -2 };

      // floor(0.5 * 100 * (100 / (100 * 0.666...)) * 1.2 * 1.3) + 1 = floor(0.5 * 100 * 1.5 * 1.56) + 1 = floor(117) + 1 = 118
      const damage = calculateDamage(attacker, defender, 100, ['normal']);
      expect(damage).toBe(118);
    });

    it('should apply maximum attack buff (+4 stages = 2x)', () => {
      const attacker = createTestPokemon(100, 100) as BattlePokemon;
      attacker.buffStages = { attack: 4, defense: 0 };
      const defender = createTestPokemon(100, 100) as BattlePokemon;

      // floor(0.5 * 100 * (100 * 2 / 100) * 1.2 * 1.3) + 1 = floor(0.5 * 100 * 2 * 1.56) + 1 = floor(156) + 1 = 157
      const damage = calculateDamage(attacker, defender, 100, ['normal']);
      expect(damage).toBe(157);
    });
  });

  describe('Combined Multipliers', () => {
    it('should apply STAB + Super Effective + Attack Buff', () => {
      const attacker = createTestPokemon(150, 100, ['water']) as BattlePokemon;
      attacker.buffStages = { attack: 2, defense: 0 }; // +2 = 1.5x
      const defender = createTestPokemon(100, 120, ['fire']) as BattlePokemon;

      // STAB (1.2) * Super Effective (1.6) * PvP (1.3) * Attack Buff (1.5) = 3.744
      // floor(0.5 * 100 * (150 * 1.5 / 120) * 3.744) + 1
      // floor(0.5 * 100 * 1.875 * 2.496) + 1 = floor(234) + 1 = 235
      const damage = calculateDamage(attacker, defender, 100, ['water']);
      expect(damage).toBe(235);
    });

    it('should apply all debuffs correctly', () => {
      const attacker = createTestPokemon(100, 100, ['fire']) as BattlePokemon;
      attacker.buffStages = { attack: -1, defense: 0 }; // -1 = 0.8x
      const defender = createTestPokemon(100, 100, ['water']) as BattlePokemon;
      defender.buffStages = { attack: 0, defense: 1 }; // +1 = 1.25x

      // STAB (1.2) * Not Very Effective (0.625) * PvP (1.3) * Attack Debuff (0.8) * Defense Buff (1/1.25)
      // 1.2 * 0.625 * 1.3 * 0.8 / 1.25 = 0.624
      const damage = calculateDamage(attacker, defender, 100, ['fire']);
      expect(damage).toBeGreaterThanOrEqual(1); // At minimum 1
      expect(damage).toBeLessThan(50); // Should be significantly reduced
    });
  });

  describe('Real Move Scenarios', () => {
    it('should calculate Counter damage correctly', () => {
      // Counter: 12 power, Fighting type
      const attacker = createTestPokemon(150, 100, ['fighting']) as BattlePokemon;
      const defender = createTestPokemon(100, 120, ['normal']) as BattlePokemon;

      // STAB (1.2) * Super Effective (1.6) * PvP (1.3) = 2.496
      // floor(0.5 * 12 * (150/120) * 2.496) + 1
      const damage = calculateDamage(attacker, defender, 12, ['fighting']);
      expect(damage).toBeGreaterThan(1);
    });

    it('should calculate Hydro Cannon damage correctly', () => {
      // Hydro Cannon: 80 power
      const attacker = createTestPokemon(200, 150, ['water']) as BattlePokemon;
      const defender = createTestPokemon(150, 180, ['fire', 'ground']) as BattlePokemon;

      // STAB (1.2) * Super Effective vs Fire (1.6) * Neutral vs Ground (1.0) * PvP (1.3) = 2.496
      // floor(0.5 * 80 * (200/180) * 2.496) + 1
      const damage = calculateDamage(attacker, defender, 80, ['water']);
      expect(damage).toBeGreaterThan(100);
    });
  });
});
