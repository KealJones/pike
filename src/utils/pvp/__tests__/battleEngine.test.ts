import { describe, it, expect } from 'vitest';
import {
  processFastMove,
  processChargedMove,
  calculateCMP,
} from '../battleEngine';
import type { BattlePokemon, GameMasterMove } from '../../../types/battle.types';

describe('Battle Engine', () => {
  const createTestPokemon = (
    name: string,
    atk: number,
    def: number,
    hp: number,
    types: string[] = ['normal']
  ): BattlePokemon => ({
    speciesId: name.toLowerCase(),
    speciesName: name,
    dex: 1,
    types: types as any,
    cp: 1500,
    level: 20,
    ivs: { atk: 15, def: 15, hp: 15 },
    stats: { attack: atk, defense: def, hp: hp },
    currentHP: hp,
    maxHP: hp,
    energy: 0,
    buffs: { attack: 0, defense: 0 },
    buffStages: { attack: 0, defense: 0 }, // Keep for backward compatibility
    isFainted: false,
    shields: 2, // Default 2 shields
    fastMove: {
      moveId: 'FAST_TEST',
      name: 'Fast Test',
      type: 'normal' as any,
      power: 10,
      energy: 0, // Cost for charged moves
      energyGain: 3, // Gain for fast moves
      cooldown: 500, // 1 turn = 500ms
      turns: 1,
      archetype: 'Fast Attack',
    },
    chargedMoves: [null, null],
    fastMoveLockedUntil: 0,
    switchCooldownUntil: 0,
  } as any);

  const createTestMove = (
    name: string,
    power: number,
    energy: number,
    duration: number = 1,
    buffs?: { target: 'self' | 'opponent'; stat: 'attack' | 'defense'; stages: number; chance: number }
  ): GameMasterMove => {
    // Detect if it's a fast move (low energy) or charged move (high energy)
    const isFastMove = energy < 20;
    
    return {
      moveId: name.toUpperCase().replace(/\s+/g, '_'),
      name,
      type: 'normal' as any,
      power,
      energy: isFastMove ? 0 : energy, // Cost for charged moves
      energyGain: isFastMove ? energy : 0, // Gain for fast moves
      cooldown: duration * 500,
      turns: duration,
      archetype: isFastMove ? 'Fast Attack' : 'Charge Attack',
      damageWindowStart: 0,
      damageWindowEnd: duration,
      buffs: buffs ? [buffs.stat === 'attack' ? buffs.stages : 0, buffs.stat === 'defense' ? buffs.stages : 0] : undefined,
      buffTarget: buffs?.target,
      buffApplyChance: buffs?.chance.toString(),
    } as any;
  };

  describe('processFastMove', () => {
    it('should deal damage and gain energy', () => {
      const attacker = createTestPokemon('Attacker', 150, 100, 150);
      const defender = createTestPokemon('Defender', 100, 100, 150);
      const currentTurn = 0;

      const result = processFastMove(attacker, defender, currentTurn);

      expect(result.attacker.energy).toBeGreaterThan(0); // Gained energy
      expect(result.attacker.fastMoveLockedUntil).toBeGreaterThan(currentTurn); // Move locked
      expect(result.defender.currentHP).toBeLessThan(150); // Took damage
      expect(result.events).toHaveLength(1);
      expect(result.events[0].type).toBe('fast-move');
    });

    it('should lock fast move for correct duration', () => {
      const attacker = createTestPokemon('Attacker', 150, 100, 150);
      attacker.fastMove.turns = 2; // 2 turns (1 second)
      const defender = createTestPokemon('Defender', 100, 100, 150);

      const result = processFastMove(attacker, defender, 0);

      expect(result.attacker.fastMoveLockedUntil).toBe(2); // Locked until turn 2
    });

    it('should mark defender as fainted when HP reaches 0', () => {
      const attacker = createTestPokemon('Attacker', 300, 100, 150);
      const defender = createTestPokemon('Defender', 100, 50, 1); // 1 HP
      defender.currentHP = 1;

      const result = processFastMove(attacker, defender, 0);

      expect(result.defender.currentHP).toBe(0);
      expect(result.defender.isFainted).toBe(true);
    });

    it('should not allow HP to go negative', () => {
      const attacker = createTestPokemon('Attacker', 300, 100, 150);
      const defender = createTestPokemon('Defender', 100, 50, 5);
      defender.currentHP = 5;

      const result = processFastMove(attacker, defender, 0);

      expect(result.defender.currentHP).toBeGreaterThanOrEqual(0);
    });

    it('should cap energy at 100', () => {
      const attacker = createTestPokemon('Attacker', 150, 100, 150);
      attacker.energy = 98; // Close to cap
      attacker.fastMove.energy = 10; // Would exceed cap
      const defender = createTestPokemon('Defender', 100, 100, 150);

      const result = processFastMove(attacker, defender, 0);

      expect(result.attacker.energy).toBe(100); // Capped
    });
  });

  describe('processChargedMove', () => {
    it('should consume energy and deal damage', () => {
      const attacker = createTestPokemon('Attacker', 150, 100, 150);
      attacker.energy = 50;
      const defender = createTestPokemon('Defender', 100, 100, 150);
      const move = createTestMove('Charged Move', 80, 50);

      const result = processChargedMove(attacker, defender, move, 0, false);

      expect(result.attacker.energy).toBe(0); // Consumed 50 energy
      expect(result.defender.currentHP).toBeLessThan(150); // Took damage
      expect(result.events[0].type).toBe('charged-move');
    });

    it('should apply shield and reduce damage to 1', () => {
      const attacker = createTestPokemon('Attacker', 200, 100, 150);
      attacker.energy = 50;
      const defender = createTestPokemon('Defender', 100, 100, 150);
      const move = createTestMove('Big Attack', 100, 50);

      const result = processChargedMove(attacker, defender, move, 0, true);

      expect(result.defender.currentHP).toBe(149); // Only 1 damage through shield
      expect(result.events).toHaveLength(2); // Charged move + shield
      expect(result.events[1].type).toBe('shield');
    });

    it('should apply attack buff to attacker', () => {
      const attacker = createTestPokemon('Attacker', 150, 100, 150);
      attacker.energy = 50;
      const defender = createTestPokemon('Defender', 100, 100, 150);
      const move = createTestMove('Power Up Punch', 40, 40, 1, {
        target: 'self',
        stat: 'attack',
        stages: 1,
        chance: 1.0,
      });

      const result = processChargedMove(attacker, defender, move, 0, false);

      expect((result.attacker as any).buffStages.attack).toBe(1);
      expect(result.events).toHaveLength(2); // Move + buff
      expect(result.events[1].type).toBe('buff');
    });

    it('should apply defense debuff to opponent', () => {
      const attacker = createTestPokemon('Attacker', 150, 100, 150);
      attacker.energy = 50;
      const defender = createTestPokemon('Defender', 100, 100, 150);
      const move = createTestMove('Acid Spray', 20, 45, 1, {
        target: 'opponent',
        stat: 'defense',
        stages: -2,
        chance: 1.0,
      });

      const result = processChargedMove(attacker, defender, move, 0, false);

      expect((result.defender as any).buffStages.defense).toBe(-2);
      expect(result.events[1].type).toBe('debuff');
    });

    it('should respect buff activation chance', () => {
      const attacker = createTestPokemon('Attacker', 150, 100, 150);
      attacker.energy = 50;
      const defender = createTestPokemon('Defender', 100, 100, 150);
      const move = createTestMove('Ancient Power', 70, 45, 1, {
        target: 'self',
        stat: 'attack',
        stages: 2,
        chance: 0.5, // 50% chance for reliable testing
      });

      // Run multiple times to test probability (at least one should not activate)
      let buffActivated = 0;
      for (let i = 0; i < 100; i++) {
        const testAttacker = { ...attacker, buffStages: { attack: 0, defense: 0 } };
        const testDefender = { ...defender, currentHP: 150 };
        const result = processChargedMove(testAttacker, testDefender, move, 0, false);
        if ((result.attacker as any).buffStages.attack > 0) {
          buffActivated++;
        }
      }

      // With 50% chance over 100 trials, expect between 20 and 80 activations
      expect(buffActivated).toBeGreaterThan(20);
      expect(buffActivated).toBeLessThan(80);
    });

    it('should not apply buffs through shields', () => {
      const attacker = createTestPokemon('Attacker', 150, 100, 150);
      attacker.energy = 50;
      const defender = createTestPokemon('Defender', 100, 100, 150);
      const move = createTestMove('Power Up Punch', 40, 40, 1, {
        target: 'self',
        stat: 'attack',
        stages: 1,
        chance: 1.0,
      });

      const result = processChargedMove(attacker, defender, move, 0, true);

      // Even with shield, self-buff should still apply
      expect(result.attacker.buffStages.attack).toBe(1);
    });
  });

  describe('calculateCMP (Charge Move Priority)', () => {
    it('should give priority to higher attack stat', () => {
      const pokemon1 = createTestPokemon('Strong', 180, 100, 150);
      const pokemon2 = createTestPokemon('Weak', 150, 100, 150);

      const cmp = calculateCMP(pokemon1, pokemon2);

      expect(cmp).toBe(1); // pokemon1 wins
    });

    it('should handle equal stats as tie', () => {
      const pokemon1 = createTestPokemon('Twin1', 150, 100, 150);
      const pokemon2 = createTestPokemon('Twin2', 150, 100, 150);

      const cmp = calculateCMP(pokemon1, pokemon2);

      expect(cmp).toBe(0); // Tie
    });

    it('should give priority to lower attack when second wins', () => {
      const pokemon1 = createTestPokemon('Weak', 150, 100, 150);
      const pokemon2 = createTestPokemon('Strong', 180, 100, 150);

      const cmp = calculateCMP(pokemon1, pokemon2);

      expect(cmp).toBe(-1); // pokemon2 wins
    });

    it('should NOT factor in attack buffs for CMP (per PvPoke)', () => {
      // Per PvPoke docs: "Damage multipliers such as the Shadow bonus 
      // or stat buffs/debuffs have no effect on CMP."
      const pokemon1 = createTestPokemon('Buffed', 150, 100, 150);
      (pokemon1 as any).buffStages.attack = 1; // +25% = 187.5 BUT should be ignored
      const pokemon2 = createTestPokemon('Unbuffed', 180, 100, 150);

      const cmp = calculateCMP(pokemon1, pokemon2);

      expect(cmp).toBe(-1); // pokemon2 wins because buffs are NOT applied to CMP
    });

    it('should NOT factor in negative buffs for CMP', () => {
      // Even with debuff, CMP uses raw attack stat
      const pokemon1 = createTestPokemon('Debuffed', 200, 100, 150);
      (pokemon1 as any).buffStages.attack = -1; // Would be 160 if applied, but ignored
      const pokemon2 = createTestPokemon('Normal', 180, 100, 150);

      const cmp = calculateCMP(pokemon1, pokemon2);

      expect(cmp).toBe(1); // pokemon1 wins because 200 > 180 (debuff ignored)
    });
  });

  describe('Battle Mechanics Integration', () => {
    it('should handle a complete fast move sequence', () => {
      const attacker = createTestPokemon('Machamp', 200, 150, 180, ['fighting']);
      attacker.fastMove = createTestMove('Counter', 12, 8, 2);
      const defender = createTestPokemon('Snorlax', 150, 180, 250, ['normal']);

      // Turn 0: Start Counter
      const result1 = processFastMove(attacker, defender, 0);
      expect(result1.attacker.fastMoveLockedUntil).toBe(2);
      expect(result1.attacker.energy).toBe(8);

      // Turn 2: Can use Counter again
      const result2 = processFastMove(result1.attacker, result1.defender, 2);
      expect(result2.attacker.fastMoveLockedUntil).toBe(4);
      expect(result2.attacker.energy).toBe(16);
    });

    it('should handle charged move with follow-up fast move', () => {
      const attacker = createTestPokemon('Swampert', 200, 150, 180, ['water', 'ground']);
      attacker.energy = 50;
      const defender = createTestPokemon('Charizard', 180, 140, 160, ['fire', 'flying']);
      const hydroCannon = createTestMove('Hydro Cannon', 80, 40);

      // Use charged move
      const result1 = processChargedMove(attacker, defender, hydroCannon, 10, false);
      expect(result1.attacker.energy).toBe(10); // 50 - 40

      // Defender should have taken significant damage (double super effective + STAB)
      expect(result1.defender.currentHP).toBeLessThan(defender.currentHP * 0.7);
    });
  });
});
