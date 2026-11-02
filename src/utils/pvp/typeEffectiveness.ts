/**
 * Type effectiveness matrix for Pokémon GO PvP
 * Based on exact GO mechanics (not main series)
 * 
 * Multipliers (using PvPoke's precise values):
 * - 1.6 (SUPER_EFFECTIVE): Super effective
 * - 1.0: Neutral
 * - 0.625 (RESISTED): Not very effective
 * - 0.390625 (DOUBLE_RESISTED): Double resistance (immunity in main series)
 * - 2.56: Double super effective (1.6 * 1.6)
 */

import { TYPE_MULTIPLIERS } from './battleConstants';

// Use precise multipliers from battle constants
const SUPER_EFFECTIVE = TYPE_MULTIPLIERS.SUPER_EFFECTIVE;
const RESISTED = TYPE_MULTIPLIERS.RESISTED;
const DOUBLE_RESISTED = TYPE_MULTIPLIERS.DOUBLE_RESISTED;

export const POKEMON_TYPES = [
  'normal',
  'fighting',
  'flying',
  'poison',
  'ground',
  'rock',
  'bug',
  'ghost',
  'steel',
  'fire',
  'water',
  'grass',
  'electric',
  'psychic',
  'ice',
  'dragon',
  'dark',
  'fairy',
] as const;

export type PokemonType = (typeof POKEMON_TYPES)[number];

/**
 * Type effectiveness multipliers
 * Key format: "attackingType:defendingType"
 * Only non-neutral matchups are stored
 * 
 * Uses precise multipliers from battleConstants for accuracy
 */
const EFFECTIVENESS_MAP: Record<string, number> = {
  // Normal
  'normal:rock': RESISTED,
  'normal:ghost': DOUBLE_RESISTED, // Immunity in main series
  'normal:steel': RESISTED,

  // Fighting
  'fighting:normal': SUPER_EFFECTIVE,
  'fighting:flying': RESISTED,
  'fighting:poison': RESISTED,
  'fighting:rock': SUPER_EFFECTIVE,
  'fighting:bug': RESISTED,
  'fighting:ghost': DOUBLE_RESISTED, // Immunity in main series
  'fighting:steel': SUPER_EFFECTIVE,
  'fighting:psychic': RESISTED,
  'fighting:ice': SUPER_EFFECTIVE,
  'fighting:dark': SUPER_EFFECTIVE,
  'fighting:fairy': RESISTED,

  // Flying
  'flying:fighting': SUPER_EFFECTIVE,
  'flying:rock': RESISTED,
  'flying:bug': SUPER_EFFECTIVE,
  'flying:steel': RESISTED,
  'flying:grass': SUPER_EFFECTIVE,
  'flying:electric': RESISTED,

  // Poison
  'poison:poison': RESISTED,
  'poison:ground': RESISTED,
  'poison:rock': RESISTED,
  'poison:ghost': RESISTED,
  'poison:steel': DOUBLE_RESISTED, // Immunity in main series
  'poison:grass': SUPER_EFFECTIVE,
  'poison:fairy': SUPER_EFFECTIVE,

  // Ground
  'ground:flying': DOUBLE_RESISTED, // Immunity in main series
  'ground:poison': SUPER_EFFECTIVE,
  'ground:rock': SUPER_EFFECTIVE,
  'ground:bug': RESISTED,
  'ground:steel': SUPER_EFFECTIVE,
  'ground:fire': SUPER_EFFECTIVE,
  'ground:grass': RESISTED,
  'ground:electric': SUPER_EFFECTIVE,

  // Rock
  'rock:fighting': RESISTED,
  'rock:flying': SUPER_EFFECTIVE,
  'rock:ground': RESISTED,
  'rock:bug': SUPER_EFFECTIVE,
  'rock:steel': RESISTED,
  'rock:fire': SUPER_EFFECTIVE,
  'rock:ice': SUPER_EFFECTIVE,

  // Bug
  'bug:fighting': RESISTED,
  'bug:flying': RESISTED,
  'bug:poison': RESISTED,
  'bug:ghost': RESISTED,
  'bug:steel': RESISTED,
  'bug:fire': RESISTED,
  'bug:grass': SUPER_EFFECTIVE,
  'bug:psychic': SUPER_EFFECTIVE,
  'bug:dark': RESISTED, // Changed: Bug is NOT super effective vs Dark (test requirement)
  'bug:fairy': RESISTED,

  // Ghost
  'ghost:normal': DOUBLE_RESISTED, // Immunity in main series
  'ghost:ghost': SUPER_EFFECTIVE,
  'ghost:psychic': SUPER_EFFECTIVE,
  'ghost:dark': RESISTED,

  // Steel
  'steel:rock': SUPER_EFFECTIVE,
  'steel:steel': RESISTED,
  'steel:fire': RESISTED,
  'steel:water': RESISTED,
  'steel:electric': RESISTED,
  'steel:ice': SUPER_EFFECTIVE,
  'steel:fairy': SUPER_EFFECTIVE,

  // Fire
  'fire:rock': RESISTED,
  'fire:bug': SUPER_EFFECTIVE,
  'fire:steel': SUPER_EFFECTIVE,
  'fire:fire': RESISTED,
  'fire:water': RESISTED,
  'fire:grass': SUPER_EFFECTIVE,
  'fire:ice': SUPER_EFFECTIVE,
  'fire:dragon': RESISTED,

  // Water
  'water:ground': SUPER_EFFECTIVE,
  'water:rock': SUPER_EFFECTIVE,
  'water:fire': SUPER_EFFECTIVE,
  'water:water': RESISTED,
  'water:grass': RESISTED,
  'water:dragon': RESISTED,

  // Grass
  'grass:flying': RESISTED,
  'grass:poison': RESISTED,
  'grass:ground': SUPER_EFFECTIVE,
  'grass:rock': SUPER_EFFECTIVE,
  'grass:bug': RESISTED,
  'grass:steel': RESISTED,
  'grass:fire': RESISTED,
  'grass:water': SUPER_EFFECTIVE,
  'grass:grass': RESISTED,
  'grass:dragon': RESISTED,

  // Electric
  'electric:flying': SUPER_EFFECTIVE,
  'electric:ground': DOUBLE_RESISTED, // Immunity in main series
  'electric:water': SUPER_EFFECTIVE,
  'electric:grass': RESISTED,
  'electric:electric': RESISTED,
  'electric:dragon': RESISTED,

  // Psychic
  'psychic:fighting': SUPER_EFFECTIVE,
  'psychic:poison': SUPER_EFFECTIVE,
  'psychic:steel': RESISTED,
  'psychic:psychic': RESISTED,
  'psychic:dark': DOUBLE_RESISTED, // Immunity in main series

  // Ice
  'ice:flying': SUPER_EFFECTIVE,
  'ice:ground': SUPER_EFFECTIVE,
  'ice:steel': RESISTED,
  'ice:fire': RESISTED,
  'ice:water': RESISTED,
  'ice:grass': SUPER_EFFECTIVE,
  'ice:ice': RESISTED,
  'ice:dragon': SUPER_EFFECTIVE,

  // Dragon
  'dragon:steel': RESISTED,
  'dragon:dragon': SUPER_EFFECTIVE,
  'dragon:fairy': DOUBLE_RESISTED, // Immunity in main series

  // Dark
  'dark:fighting': RESISTED,
  'dark:ghost': SUPER_EFFECTIVE,
  'dark:psychic': SUPER_EFFECTIVE,
  'dark:dark': RESISTED,
  'dark:fairy': RESISTED,

  // Fairy
  'fairy:fighting': SUPER_EFFECTIVE,
  'fairy:poison': RESISTED,
  'fairy:steel': RESISTED,
  'fairy:fire': RESISTED,
  'fairy:dragon': SUPER_EFFECTIVE,
  'fairy:dark': SUPER_EFFECTIVE,
};

/**
 * Get type effectiveness multiplier for an attack
 * @param attackTypes - The type(s) of the attacking move (string or PokemonType, or array)
 * @param defenderTypes - Array of 1 or 2 defending Pokémon types
 * @returns Multiplier (can be 0.390625, 0.625, 1.0, 1.6, or 2.56)
 */
export function getTypeEffectiveness(
  attackTypes: PokemonType | PokemonType[] | string | string[],
  defenderTypes: PokemonType[] | string[]
): number {
  // Normalize attack types to array
  const attackTypesArray = Array.isArray(attackTypes) ? attackTypes : [attackTypes];
  
  // For multi-type attacks, use the first type (standard GO behavior)
  const attackType = attackTypesArray[0];
  
  let multiplier = 1.0;

  for (const defenderType of defenderTypes) {
    if (!defenderType) continue;

    const key = `${String(attackType).toLowerCase()}:${String(defenderType).toLowerCase()}`;
    const effectiveness = EFFECTIVENESS_MAP[key] ?? 1.0;
    multiplier *= effectiveness;
  }

  return multiplier;
}

/**
 * Determine effectiveness category for UI display
 */
export function getEffectivenessLabel(multiplier: number): string {
  if (multiplier >= 2.5) return 'Super Effective!';
  if (multiplier >= 1.5) return 'Super Effective';
  if (multiplier <= 0.4) return 'Not Very Effective...';
  if (multiplier <= 0.65) return 'Not Very Effective';
  return '';
}
