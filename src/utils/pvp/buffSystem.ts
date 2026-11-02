/**
 * Buff and debuff system for Pokémon GO PvP
 * Implements exact stage-based stat modifications matching GO mechanics
 * 
 * Stage range: -4 to +4
 * Multiplier formula: 4/(4-stage) for negative, (4+stage)/4 for positive
 * This matches GO's exact multipliers
 */

export const MIN_STAGE = -4;
export const MAX_STAGE = 4;

/**
 * Stat stage modifiers
 * Each stage changes stats by approximately 25%
 */
export interface BuffStages {
  attack: number; // -4 to +4
  defense: number; // -4 to +4
}

/**
 * Get the multiplier for a given stat stage
 * Matches Pokémon GO exactly:
 * - Stage -4: 0.5x (4/8)
 * - Stage -3: 0.571x (4/7)
 * - Stage -2: 0.667x (4/6)
 * - Stage -1: 0.8x (4/5)
 * - Stage 0: 1.0x (4/4)
 * - Stage +1: 1.25x (5/4)
 * - Stage +2: 1.5x (6/4)
 * - Stage +3: 1.75x (7/4)
 * - Stage +4: 2.0x (8/4)
 */
export function getStageMultiplier(stage: number): number {
  const clampedStage = Math.max(MIN_STAGE, Math.min(MAX_STAGE, stage));
  if (clampedStage >= 0) {
    // Positive stages: (4 + stage) / 4
    return (4 + clampedStage) / 4;
  } else {
    // Negative stages: 4 / (4 - stage)
    // This makes stage -4 = 4/(4-(-4)) = 4/8 = 0.5
    return 4 / (4 - clampedStage);
  }
}

/**
 * Apply a buff/debuff change to current stages
 * @param currentStage - Current stage value
 * @param change - Stage change (positive for buff, negative for debuff)
 * @returns New stage value, clamped to valid range
 */
export function applyStageChange(currentStage: number, change: number): number {
  const newStage = currentStage + change;
  return Math.max(MIN_STAGE, Math.min(MAX_STAGE, newStage));
}

/**
 * Create initial buff stages (neutral)
 */
export function createInitialBuffStages(): BuffStages {
  return {
    attack: 0,
    defense: 0,
  };
}

/**
 * Apply buff/debuff from a move
 * @param currentBuffs - Current buff stages
 * @param attackChange - Attack stage change
 * @param defenseChange - Defense stage change
 * @returns New buff stages
 */
export function applyBuffChanges(
  currentBuffs: BuffStages,
  attackChange: number,
  defenseChange: number
): BuffStages {
  return {
    attack: applyStageChange(currentBuffs.attack, attackChange),
    defense: applyStageChange(currentBuffs.defense, defenseChange),
  };
}

/**
 * Convenience alias for getStageMultiplier (for test compatibility)
 */
export const getBuffMultiplier = getStageMultiplier;

/**
 * Apply a buff to a specific stat (convenience function for test compatibility)
 * @param currentBuffs - Current buff stages
 * @param stat - Which stat to buff ('attack' or 'defense')
 * @param change - Stage change value
 * @returns New buff stages
 */
export function applyBuff(
  currentBuffs: BuffStages,
  stat: 'attack' | 'defense',
  change: number
): BuffStages {
  if (stat === 'attack') {
    return applyBuffChanges(currentBuffs, change, 0);
  } else {
    return applyBuffChanges(currentBuffs, 0, change);
  }
}

/**
 * Reset buffs (when Pokémon faints)
 */
export function resetBuffStages(): BuffStages {
  return createInitialBuffStages();
}

/**
 * Calculate effective attack stat with buffs
 */
export function getEffectiveAttack(baseAttack: number, stage: number): number {
  return baseAttack * getStageMultiplier(stage);
}

/**
 * Calculate effective defense stat with buffs
 */
export function getEffectiveDefense(baseDefense: number, stage: number): number {
  return baseDefense * getStageMultiplier(stage);
}

/**
 * Get UI-friendly description of stage
 */
export function getStageDescription(stage: number): string {
  if (stage === 0) return 'Normal';
  if (stage > 0) return `+${stage}`;
  return `${stage}`;
}

/**
 * Get stage arrows for UI (e.g., "↑↑" for +2)
 */
export function getStageArrows(stage: number): string {
  if (stage === 0) return '';
  if (stage > 0) return '↑'.repeat(stage);
  return '↓'.repeat(Math.abs(stage));
}
