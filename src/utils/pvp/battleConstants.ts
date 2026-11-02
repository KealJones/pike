/**
 * Battle Constants - Exact values from Pokémon GO PvP mechanics
 * These match PvPoke's DamageMultiplier class for accuracy
 * 
 * Note: These precise floating-point values come from the game's data files
 * and are used to ensure damage calculations match the actual game exactly.
 */

// ============================================================================
// DAMAGE MULTIPLIERS
// ============================================================================

/**
 * PvP Bonus - Applied to all damage calculations in GO Battle League
 * This is the "1.3" multiplier that makes PvP damage different from PvE
 */
export const PVP_BONUS = 1.2999999523162841796875;

/**
 * Same Type Attack Bonus - 20% damage boost when move type matches attacker type
 */
export const STAB_MULTIPLIER = 1.2000000476837158203125;

/**
 * Type effectiveness multipliers
 */
export const TYPE_MULTIPLIERS = {
  /** Super effective: 1.6x damage */
  SUPER_EFFECTIVE: 1.60000002384185791015625,
  /** Neutral: 1.0x damage */
  NEUTRAL: 1.0,
  /** Not very effective: 0.625x damage */
  RESISTED: 0.625,
  /** Double resistance (immune in main series): 0.390625x damage */
  DOUBLE_RESISTED: 0.390625,
  /** Double super effective: 2.56x damage */
  DOUBLE_SUPER_EFFECTIVE: 2.56, // 1.6 * 1.6
} as const;

/**
 * Shadow Pokémon multipliers
 */
export const SHADOW_MULTIPLIERS = {
  /** Shadow attack bonus: 20% more damage dealt */
  ATTACK: 1.2,
  /** Shadow defense penalty: ~17% more damage taken (1/1.2) */
  DEFENSE: 0.83333331,
} as const;

// ============================================================================
// BATTLE TIMING
// ============================================================================

/**
 * Turn duration in milliseconds (0.5 seconds per turn)
 */
export const TURN_DURATION_MS = 500;

/**
 * Switch cooldown in turns (45 seconds = 90 turns at 0.5s each)
 */
export const SWITCH_COOLDOWN_TURNS = 90;

/**
 * Battle timer in seconds (4 minutes)
 */
export const BATTLE_TIMER_SECONDS = 240;

/**
 * Maximum energy a Pokémon can store
 */
export const MAX_ENERGY = 100;

/**
 * Starting shields per Pokémon
 */
export const STARTING_SHIELDS = 2;

// ============================================================================
// BUFF/DEBUFF SYSTEM
// ============================================================================

/**
 * Maximum buff/debuff stages (-4 to +4)
 */
export const MAX_BUFF_STAGES = 4;

/**
 * Buff divisor used in stage multiplier calculation
 * Formula: positive = (4 + stage) / 4, negative = 4 / (4 - stage)
 */
export const BUFF_DIVISOR = 4;

// ============================================================================
// BATTLE PHASES
// ============================================================================

/**
 * Battle phase states
 */
export type BattlePhase = 
  | 'countdown'        // Pre-battle countdown
  | 'neutral'          // Normal combat, fast moves being used
  | 'suspend_charged'  // Charged move minigame active
  | 'suspend_switch'   // Switch window active after faint
  | 'game_paused'      // Battle paused
  | 'game_over';       // Battle ended

// ============================================================================
// BATTLE STATISTICS
// ============================================================================

/**
 * Per-Pokémon battle statistics tracking
 * Used for post-battle analysis and Battle Rating calculation
 */
export interface BattleStatistics {
  /** Total damage dealt (as percentage of opponent's max HP) */
  damage: number;
  /** Number of opponent shields used against this Pokémon's attacks */
  shieldsBurned: number;
  /** Number of shields this Pokémon used */
  shieldsUsed: number;
  /** Damage prevented by shields */
  damageBlocked: number;
  /** Damage dealt while shields were active */
  damageFromShields: number;
  /** Shields burned while this Pokemon had shields */
  shieldsFromShields: number;
  /** Switch advantage situations */
  switchAdvantages: number;
  /** Total energy gained */
  energyGained: number;
  /** Total energy spent on charged moves */
  energyUsed: number;
  /** Damage dealt by charged moves */
  chargedDamage: number;
}

/**
 * Create initial battle statistics
 */
export function createInitialBattleStatistics(): BattleStatistics {
  return {
    damage: 0,
    shieldsBurned: 0,
    shieldsUsed: 0,
    damageBlocked: 0,
    damageFromShields: 0,
    shieldsFromShields: 0,
    switchAdvantages: 0,
    energyGained: 0,
    energyUsed: 0,
    chargedDamage: 0,
  };
}

// ============================================================================
// BATTLE RATING
// ============================================================================

/**
 * Calculate Battle Rating (0-1000)
 * 
 * Formula: 500 × (DamageDealt/OpponentHP) + 500 × (HPRemaining/MaxHP)
 * 
 * - Maximum: 1000 (victory with no damage taken)
 * - Minimum: 0 (loss with no damage dealt)
 * - Victory minimum: 500 (opponent at 0 HP)
 * 
 * This rating measures battle performance beyond just win/loss,
 * useful for ranking matchups and evaluating team effectiveness.
 * 
 * @param currentHP - Pokémon's remaining HP
 * @param maxHP - Pokémon's maximum HP
 * @param opponentCurrentHP - Opponent's remaining HP
 * @param opponentMaxHP - Opponent's maximum HP
 * @returns Battle rating from 0-1000
 */
export function calculateBattleRating(
  currentHP: number,
  maxHP: number,
  opponentCurrentHP: number,
  opponentMaxHP: number
): number {
  const damageDealtPercent = (opponentMaxHP - opponentCurrentHP) / opponentMaxHP;
  const hpRemainingPercent = currentHP / maxHP;
  
  return Math.floor((500 * damageDealtPercent) + (500 * hpRemainingPercent));
}

/**
 * Calculate team Battle Rating (sum of individual ratings)
 * 
 * @param team - Array of { currentHP, maxHP } for each Pokémon
 * @param opponentTeam - Array of { currentHP, maxHP } for each opponent
 * @returns Combined Battle Rating
 */
export function calculateTeamBattleRating(
  team: Array<{ currentHP: number; maxHP: number }>,
  opponentTeam: Array<{ currentHP: number; maxHP: number }>
): number {
  // Calculate total HP percentages
  const totalMaxHP = team.reduce((sum, p) => sum + p.maxHP, 0);
  const totalCurrentHP = team.reduce((sum, p) => sum + p.currentHP, 0);
  const opponentTotalMaxHP = opponentTeam.reduce((sum, p) => sum + p.maxHP, 0);
  const opponentTotalCurrentHP = opponentTeam.reduce((sum, p) => sum + p.currentHP, 0);

  return calculateBattleRating(
    totalCurrentHP,
    totalMaxHP,
    opponentTotalCurrentHP,
    opponentTotalMaxHP
  );
}
