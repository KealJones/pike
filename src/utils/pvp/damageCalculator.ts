/**
 * Damage calculation for Pokémon GO PvP
 * Implements the exact damage formula used in GO Battle League
 * 
 * Formula: floor(0.5 * Power * (Attack / Defense) * STAB * Effectiveness * PvP_Bonus) + 1
 * 
 * Multipliers include:
 * - STAB (Same Type Attack Bonus): 1.2x
 * - Type effectiveness: 0.390625x to 2.56x
 * - Buff/debuff stages: 0.5x to 2.0x each for attack and defense
 * - PvP Bonus: 1.3x (applied to all PvP damage)
 * - Shadow Attack Bonus: 1.2x (for shadow Pokémon)
 * - Shadow Defense Penalty: 0.833x (for shadow Pokémon defenders)
 */

import { getTypeEffectiveness } from './typeEffectiveness';
import { getStageMultiplier } from './buffSystem';
import { 
  STAB_MULTIPLIER, 
  PVP_BONUS, 
  SHADOW_MULTIPLIERS 
} from './battleConstants';

const DAMAGE_FLOOR_BONUS = 1;

export interface DamageCalculationParams {
  // Move properties
  movePower: number;
  moveType: string;

  // Attacker properties
  attackerAttack: number; // Battle stat (base + IV) * CPM
  attackerTypes: string[]; // For STAB calculation
  attackerBuffStage: number; // -4 to +4
  attackerShadow?: boolean; // Is attacker a shadow Pokémon?

  // Defender properties
  defenderDefense: number; // Battle stat (base + IV) * CPM
  defenderTypes: string[]; // For type effectiveness
  defenderBuffStage: number; // -4 to +4
  defenderShadow?: boolean; // Is defender a shadow Pokémon?
}

/**
 * Calculate damage dealt by a move in PvP (simplified API for tests)
 * @param attacker - Attacking Pokemon with stats and buffStages
 * @param defender - Defending Pokemon with stats and buffStages  
 * @param movePower - Power of the move
 * @param moveTypes - Type(s) of the move (for STAB check)
 * @returns Damage dealt
 */
export function calculateDamage(
  attacker: any,
  defender: any,
  movePower: number,
  moveTypes: string[]
): number;

/**
 * Calculate damage dealt by a move in PvP (full params API)
 * @param params - Complete damage calculation parameters
 * @returns Damage dealt
 */
export function calculateDamage(params: DamageCalculationParams): number;

/**
 * Implementation of calculateDamage with overloads
 */
export function calculateDamage(
  attackerOrParams: any,
  defender?: any,
  movePower?: number,
  moveTypes?: string[]
): number {
  let params: DamageCalculationParams;

  // Check if using simplified API (attacker, defender, power, types)
  if (defender !== undefined) {
    const attacker = attackerOrParams;
    params = {
      movePower: movePower!,
      moveType: moveTypes![0], // Use first type for damage calculation
      attackerAttack: attacker.stats?.attack ?? 0,
      attackerTypes: attacker.types ?? [],
      attackerBuffStage: attacker.buffStages?.attack ?? attacker.buffs?.attack ?? 0,
      attackerShadow: attacker.shadowType === 'shadow',
      defenderDefense: defender.stats?.defense ?? 0,
      defenderTypes: defender.types ?? [],
      defenderBuffStage: defender.buffStages?.defense ?? defender.buffs?.defense ?? 0,
      defenderShadow: defender.shadowType === 'shadow',
    };
  } else {
    // Using full params API
    params = attackerOrParams;
  }

  const {
    movePower: power,
    moveType,
    attackerAttack,
    attackerTypes,
    attackerBuffStage,
    attackerShadow,
    defenderDefense,
    defenderTypes,
    defenderBuffStage,
    defenderShadow,
  } = params;

  // Check for STAB
  const hasSTAB = attackerTypes.some(
    (type) => String(type).toLowerCase() === String(moveType).toLowerCase()
  );
  const stabMultiplier = hasSTAB ? STAB_MULTIPLIER : 1.0;

  // Get type effectiveness
  const effectivenessMultiplier = getTypeEffectiveness(moveType, defenderTypes);

  // Apply buff stages
  const attackMultiplier = getStageMultiplier(attackerBuffStage);
  const defenseMultiplier = getStageMultiplier(defenderBuffStage);

  // Apply shadow multipliers
  const shadowAtkMultiplier = attackerShadow ? SHADOW_MULTIPLIERS.ATTACK : 1.0;
  const shadowDefMultiplier = defenderShadow ? SHADOW_MULTIPLIERS.DEFENSE : 1.0;

  const effectiveAttack = attackerAttack * attackMultiplier * shadowAtkMultiplier;
  const effectiveDefense = defenderDefense * defenseMultiplier * shadowDefMultiplier;

  // Calculate raw damage with PvP bonus
  // Formula: floor(0.5 * Power * (Atk/Def) * STAB * Effectiveness * PvP_Bonus) + 1
  const rawDamage =
    0.5 *
    power *
    (effectiveAttack / effectiveDefense) *
    stabMultiplier *
    effectivenessMultiplier *
    PVP_BONUS;

  // Floor and add bonus (minimum 1 damage)
  const finalDamage = Math.floor(rawDamage) + DAMAGE_FLOOR_BONUS;

  return finalDamage;
}

/**
 * Calculate damage with all multipliers shown separately (for debugging/UI)
 */
export function calculateDamageDetailed(params: DamageCalculationParams) {
  const {
    movePower,
    moveType,
    attackerAttack,
    attackerTypes,
    attackerBuffStage,
    attackerShadow,
    defenderDefense,
    defenderTypes,
    defenderBuffStage,
    defenderShadow,
  } = params;

  const hasSTAB = attackerTypes.some(
    (type) => type.toLowerCase() === moveType.toLowerCase()
  );
  const stabMultiplier = hasSTAB ? STAB_MULTIPLIER : 1.0;

  const effectivenessMultiplier = getTypeEffectiveness(moveType, defenderTypes);

  const attackMultiplier = getStageMultiplier(attackerBuffStage);
  const defenseMultiplier = getStageMultiplier(defenderBuffStage);

  // Apply shadow multipliers
  const shadowAtkMultiplier = attackerShadow ? SHADOW_MULTIPLIERS.ATTACK : 1.0;
  const shadowDefMultiplier = defenderShadow ? SHADOW_MULTIPLIERS.DEFENSE : 1.0;

  const effectiveAttack = attackerAttack * attackMultiplier * shadowAtkMultiplier;
  const effectiveDefense = defenderDefense * defenseMultiplier * shadowDefMultiplier;

  // Include PvP bonus in calculation
  const rawDamage =
    0.5 *
    movePower *
    (effectiveAttack / effectiveDefense) *
    stabMultiplier *
    effectivenessMultiplier *
    PVP_BONUS;

  const finalDamage = Math.floor(rawDamage) + DAMAGE_FLOOR_BONUS;

  return {
    damage: finalDamage,
    breakdown: {
      movePower,
      effectiveAttack,
      effectiveDefense,
      attackMultiplier,
      defenseMultiplier,
      stabMultiplier,
      effectivenessMultiplier,
      shadowAtkMultiplier,
      shadowDefMultiplier,
      pvpBonus: PVP_BONUS,
      rawDamage,
    },
  };
}

/**
 * Calculate if a charged move would KO the defender
 */
export function wouldKO(damage: number, currentHP: number): boolean {
  return damage >= currentHP;
}

/**
 * Apply damage to HP, returning new HP (minimum 0)
 */
export function applyDamage(currentHP: number, damage: number): number {
  return Math.max(0, currentHP - damage);
}
