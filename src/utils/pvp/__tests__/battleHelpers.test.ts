import { describe, it, expect } from 'vitest';
import {
  calculateBattleStats,
  createBattlePokemon,
  canUseFastMove,
  canUseChargedMove,
} from '../battleHelpers';
import type { GameMasterPokemon, GameMasterMove } from '../../../types/battle.types';

describe('Battle Helpers', () => {
  const createTestSpecies = (
    name: string,
    atk: number,
    def: number,
    hp: number
  ): GameMasterPokemon => ({
    speciesId: name.toLowerCase(),
    speciesName: name,
    dex: 1,
    types: ['normal'] as any,
    baseStats: { atk, def, hp },
    fastMoves: ['FAST_TEST'],
    chargedMoves: ['CHARGED_TEST'],
  });

  const createTestFastMove = (): GameMasterMove => ({
    moveId: 'FAST_TEST',
    name: 'Fast Test',
    type: 'normal' as any,
    power: 10,
    energy: 3,
    duration: 1,
    damageWindowStart: 0,
    damageWindowEnd: 1,
  });

  const createTestChargedMove = (): GameMasterMove => ({
    moveId: 'CHARGED_TEST',
    name: 'Charged Test',
    type: 'normal' as any,
    power: 80,
    energy: 50,
    duration: 1,
    damageWindowStart: 0,
    damageWindowEnd: 1,
  });

  describe('calculateBattleStats', () => {
    it('should calculate stats correctly at level 20', () => {
      const baseAtk = 200;
      const baseDef = 150;
      const baseHP = 180;
      const ivAtk = 15;
      const ivDef = 15;
      const ivHP = 15;
      const level = 20;

      const stats = calculateBattleStats(
        baseAtk,
        baseDef,
        baseHP,
        ivAtk,
        ivDef,
        ivHP,
        level
      );

      expect(stats.attack).toBeGreaterThan(0);
      expect(stats.defense).toBeGreaterThan(0);
      expect(stats.hp).toBeGreaterThan(0);
      expect(stats.attack).toBeGreaterThan(stats.defense); // Base atk > base def
    });

    it('should scale stats with level', () => {
      const species = { atk: 200, def: 150, hp: 180 };
      const ivs = { atk: 15, def: 15, hp: 15 };

      const statsLevel20 = calculateBattleStats(
        species.atk,
        species.def,
        species.hp,
        ivs.atk,
        ivs.def,
        ivs.hp,
        20
      );

      const statsLevel40 = calculateBattleStats(
        species.atk,
        species.def,
        species.hp,
        ivs.atk,
        ivs.def,
        ivs.hp,
        40
      );

      expect(statsLevel40.attack).toBeGreaterThan(statsLevel20.attack);
      expect(statsLevel40.defense).toBeGreaterThan(statsLevel20.defense);
      expect(statsLevel40.hp).toBeGreaterThan(statsLevel20.hp);
    });

    it('should factor in IVs correctly', () => {
      const species = { atk: 200, def: 150, hp: 180 };
      const level = 20;

      const statsPerfect = calculateBattleStats(
        species.atk,
        species.def,
        species.hp,
        15,
        15,
        15,
        level
      );

      const statsMinimal = calculateBattleStats(
        species.atk,
        species.def,
        species.hp,
        0,
        0,
        0,
        level
      );

      expect(statsPerfect.attack).toBeGreaterThan(statsMinimal.attack);
      expect(statsPerfect.defense).toBeGreaterThan(statsMinimal.defense);
      expect(statsPerfect.hp).toBeGreaterThan(statsMinimal.hp);
    });

    it('should have minimum HP of 10', () => {
      // Test with very low HP base and IVs
      const stats = calculateBattleStats(100, 100, 1, 0, 0, 0, 1);
      expect(stats.hp).toBeGreaterThanOrEqual(10);
    });
  });

  describe('createBattlePokemon', () => {
    it('should create a valid battle Pokemon', () => {
      const species = createTestSpecies('Pikachu', 112, 96, 111);
      const ivs = { atk: 15, def: 15, hp: 15 };
      const level = 20;
      const fastMove = createTestFastMove();
      const chargedMove = createTestChargedMove();

      const pokemon = createBattlePokemon(
        species,
        ivs,
        level,
        fastMove,
        chargedMove,
        null
      );

      expect(pokemon.speciesId).toBe('pikachu');
      expect(pokemon.speciesName).toBe('Pikachu');
      expect(pokemon.level).toBe(20);
      expect(pokemon.ivs).toEqual(ivs);
      expect(pokemon.stats.attack).toBeGreaterThan(0);
      expect(pokemon.currentHP).toBe(pokemon.maxHP);
      expect(pokemon.energy).toBe(0);
      expect(pokemon.isFainted).toBe(false);
      expect(pokemon.fastMove).toBe(fastMove);
      expect(pokemon.chargedMoves).toHaveLength(2);
      expect(pokemon.chargedMoves[0]).toBe(chargedMove);
      expect(pokemon.chargedMoves[1]).toBeNull();
    });

    it('should handle two charged moves', () => {
      const species = createTestSpecies('Charizard', 223, 173, 186);
      const ivs = { atk: 0, def: 15, hp: 14 }; // PvP IVs
      const level = 20;
      const fastMove = createTestFastMove();
      const chargedMove1 = createTestChargedMove();
      const chargedMove2 = { ...createTestChargedMove(), moveId: 'CHARGED_TEST_2' };

      const pokemon = createBattlePokemon(
        species,
        ivs,
        level,
        fastMove,
        chargedMove1,
        chargedMove2
      );

      expect(pokemon.chargedMoves).toHaveLength(2);
      expect(pokemon.chargedMoves[0]).toBe(chargedMove1);
      expect(pokemon.chargedMoves[1]).toBe(chargedMove2);
    });

    it('should calculate CP correctly', () => {
      const species = createTestSpecies('Medicham', 121, 152, 155);
      const ivs = { atk: 15, def: 15, hp: 15 };
      const level = 50;
      const fastMove = createTestFastMove();
      const chargedMove = createTestChargedMove();

      const pokemon = createBattlePokemon(
        species,
        ivs,
        level,
        fastMove,
        chargedMove,
        null
      );

      expect(pokemon.cp).toBeGreaterThan(0);
      expect(pokemon.cp).toBeLessThan(10000); // Reasonable upper bound
    });

    it('should initialize buff stages to 0', () => {
      const species = createTestSpecies('Azumarill', 112, 152, 225);
      const pokemon = createBattlePokemon(
        species,
        { atk: 8, def: 15, hp: 15 },
        40,
        createTestFastMove(),
        createTestChargedMove(),
        null
      );

      expect(pokemon.buffStages.attack).toBe(0);
      expect(pokemon.buffStages.defense).toBe(0);
    });

    it('should initialize move locks to 0', () => {
      const species = createTestSpecies('Registeel', 143, 285, 190);
      const pokemon = createBattlePokemon(
        species,
        { atk: 1, def: 15, hp: 14 },
        20,
        createTestFastMove(),
        createTestChargedMove(),
        null
      );

      expect(pokemon.fastMoveLockedUntil).toBe(0);
      expect(pokemon.chargedMoveLockedUntil).toBe(0);
    });
  });

  describe('canUseFastMove', () => {
    it('should return true when move is not locked', () => {
      const species = createTestSpecies('Test', 100, 100, 100);
      const pokemon = createBattlePokemon(
        species,
        { atk: 15, def: 15, hp: 15 },
        20,
        createTestFastMove(),
        createTestChargedMove(),
        null
      );
      pokemon.fastMoveLockedUntil = 0;

      expect(canUseFastMove(pokemon, 10)).toBe(true);
    });

    it('should return false when move is locked', () => {
      const species = createTestSpecies('Test', 100, 100, 100);
      const pokemon = createBattlePokemon(
        species,
        { atk: 15, def: 15, hp: 15 },
        20,
        createTestFastMove(),
        createTestChargedMove(),
        null
      );
      pokemon.fastMoveLockedUntil = 15;

      expect(canUseFastMove(pokemon, 10)).toBe(false);
    });

    it('should return true when lock expires', () => {
      const species = createTestSpecies('Test', 100, 100, 100);
      const pokemon = createBattlePokemon(
        species,
        { atk: 15, def: 15, hp: 15 },
        20,
        createTestFastMove(),
        createTestChargedMove(),
        null
      );
      pokemon.fastMoveLockedUntil = 10;

      expect(canUseFastMove(pokemon, 10)).toBe(true); // Equal means unlocked
      expect(canUseFastMove(pokemon, 11)).toBe(true); // After lock
    });
  });

  describe('canUseChargedMove', () => {
    it('should return true when enough energy and not locked', () => {
      const species = createTestSpecies('Test', 100, 100, 100);
      const pokemon = createBattlePokemon(
        species,
        { atk: 15, def: 15, hp: 15 },
        20,
        createTestFastMove(),
        createTestChargedMove(),
        null
      );
      pokemon.energy = 50;
      pokemon.chargedMoveLockedUntil = 0;
      const move = pokemon.chargedMoves[0];

      expect(canUseChargedMove(pokemon, move, 10)).toBe(true);
    });

    it('should return false when not enough energy', () => {
      const species = createTestSpecies('Test', 100, 100, 100);
      const pokemon = createBattlePokemon(
        species,
        { atk: 15, def: 15, hp: 15 },
        20,
        createTestFastMove(),
        createTestChargedMove(),
        null
      );
      pokemon.energy = 30;
      const move = pokemon.chargedMoves[0]; // Costs 50

      expect(canUseChargedMove(pokemon, move, 10)).toBe(false);
    });

    it('should return false when move is locked', () => {
      const species = createTestSpecies('Test', 100, 100, 100);
      const pokemon = createBattlePokemon(
        species,
        { atk: 15, def: 15, hp: 15 },
        20,
        createTestFastMove(),
        createTestChargedMove(),
        null
      );
      pokemon.energy = 100;
      pokemon.chargedMoveLockedUntil = 15;
      const move = pokemon.chargedMoves[0];

      expect(canUseChargedMove(pokemon, move, 10)).toBe(false);
    });

    it('should return true when lock expires', () => {
      const species = createTestSpecies('Test', 100, 100, 100);
      const pokemon = createBattlePokemon(
        species,
        { atk: 15, def: 15, hp: 15 },
        20,
        createTestFastMove(),
        createTestChargedMove(),
        null
      );
      pokemon.energy = 100;
      pokemon.chargedMoveLockedUntil = 10;
      const move = pokemon.chargedMoves[0];

      expect(canUseChargedMove(pokemon, move, 10)).toBe(true);
      expect(canUseChargedMove(pokemon, move, 11)).toBe(true);
    });
  });

  describe('Real Pokemon Scenarios', () => {
    it('should create Medicham correctly for Great League', () => {
      const medicham = createTestSpecies('Medicham', 121, 152, 155);
      const pokemon = createBattlePokemon(
        medicham,
        { atk: 12, def: 15, hp: 15 },
        50,
        createTestFastMove(),
        createTestChargedMove(),
        null
      );

      // Medicham XL can reach ~1500 CP at level 50
      expect(pokemon.cp).toBeGreaterThan(1400);
      expect(pokemon.cp).toBeLessThan(1600);
    });

    it('should create Azumarill correctly for Great League', () => {
      const azumarill = createTestSpecies('Azumarill', 112, 152, 225);
      const pokemon = createBattlePokemon(
        azumarill,
        { atk: 8, def: 15, hp: 15 },
        40,
        createTestFastMove(),
        createTestChargedMove(),
        null
      );

      // Azumarill reaches ~1500 CP around level 40
      expect(pokemon.cp).toBeGreaterThan(1400);
      expect(pokemon.cp).toBeLessThan(1600);
      // Should have high bulk
      expect(pokemon.stats.hp).toBeGreaterThan(150);
    });
  });
});
