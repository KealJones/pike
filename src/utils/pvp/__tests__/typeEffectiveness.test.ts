import { describe, it, expect } from 'vitest';
import { getTypeEffectiveness } from '../typeEffectiveness';
import type { PokemonType } from '../../../types/battle.types';

describe('Type Effectiveness', () => {
  describe('Super Effective (1.6x)', () => {
    it('should calculate Water vs Fire as super effective', () => {
      expect(getTypeEffectiveness(['water'], ['fire'])).toBeCloseTo(1.6, 5);
    });

    it('should calculate Electric vs Water as super effective', () => {
      expect(getTypeEffectiveness(['electric'], ['water'])).toBeCloseTo(1.6, 5);
    });

    it('should calculate Fighting vs Normal as super effective', () => {
      expect(getTypeEffectiveness(['fighting'], ['normal'])).toBeCloseTo(1.6, 5);
    });

    it('should calculate dual super effective (2.56x)', () => {
      // Ground is super effective vs both Rock and Electric
      expect(getTypeEffectiveness(['ground'], ['rock', 'electric'])).toBeCloseTo(2.56); // 1.6 * 1.6
    });
  });

  describe('Not Very Effective (0.625x)', () => {
    it('should calculate Fire vs Water as not very effective', () => {
      expect(getTypeEffectiveness(['fire'], ['water'])).toBe(0.625);
    });

    it('should calculate Electric vs Grass as not very effective', () => {
      expect(getTypeEffectiveness(['electric'], ['grass'])).toBe(0.625);
    });

    it('should calculate dual resistance (0.390625x)', () => {
      // Grass resists both Water and Grass
      expect(getTypeEffectiveness(['water'], ['grass', 'water'])).toBeCloseTo(0.390625);
    });
  });

  describe('No Effect (0.390625x in GO)', () => {
    it('should calculate Ghost vs Normal as no effect', () => {
      // In GO, immunities are 0.390625x instead of 0x
      expect(getTypeEffectiveness(['ghost'], ['normal'])).toBe(0.390625);
    });

    it('should calculate Normal vs Ghost as no effect', () => {
      expect(getTypeEffectiveness(['normal'], ['ghost'])).toBe(0.390625);
    });

    it('should calculate Ground vs Flying as no effect', () => {
      expect(getTypeEffectiveness(['ground'], ['flying'])).toBe(0.390625);
    });
  });

  describe('Neutral (1.0x)', () => {
    it('should calculate Normal vs Normal as neutral', () => {
      expect(getTypeEffectiveness(['normal'], ['normal'])).toBe(1.0);
    });

    it('should calculate Fire vs Psychic as neutral', () => {
      expect(getTypeEffectiveness(['fire'], ['psychic'])).toBe(1.0);
    });

    it('should calculate balanced dual types as neutral', () => {
      // Water is super effective vs Fire, but resisted by Dragon
      // 1.6 * 0.625 = 1.0
      expect(getTypeEffectiveness(['water'], ['fire', 'dragon'])).toBeCloseTo(1.0, 5);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty attacker types', () => {
      expect(getTypeEffectiveness([], ['fire'])).toBe(1.0);
    });

    it('should handle empty defender types', () => {
      expect(getTypeEffectiveness(['water'], [])).toBe(1.0);
    });

    it('should handle both empty', () => {
      expect(getTypeEffectiveness([], [])).toBe(1.0);
    });

    it('should handle multi-type attackers (uses first type)', () => {
      // Multi-type attackers shouldn't exist in GO, but test behavior
      expect(getTypeEffectiveness(['water', 'ice'], ['fire'])).toBeCloseTo(1.6, 5);
    });
  });

  describe('Complex Dual-Type Interactions', () => {
    it('should calculate Grass vs Water/Ground correctly', () => {
      // Grass is super effective vs both Water and Ground
      // 1.6 * 1.6 = 2.56
      expect(getTypeEffectiveness(['grass'], ['water', 'ground'])).toBeCloseTo(2.56);
    });

    it('should calculate Ice vs Grass/Flying correctly', () => {
      // Ice is super effective vs both Grass and Flying
      expect(getTypeEffectiveness(['ice'], ['grass', 'flying'])).toBeCloseTo(2.56);
    });

    it('should calculate Bug vs Psychic/Dark correctly', () => {
      // Bug is super effective vs Psychic but not very effective vs Dark
      // 1.6 * 0.625 = 1.0
      expect(getTypeEffectiveness(['bug'], ['psychic', 'dark'])).toBeCloseTo(1.0, 5);
    });
  });
});
