/**
 * Type definitions for PvP battle system
 * Represents all state needed for frame-accurate battle simulation
 */

import type { BuffStages } from '../utils/pvp/buffSystem';
import type { BattleStatistics, BattlePhase } from '../utils/pvp/battleConstants';

/**
 * Game Master move data (from gamemaster.json)
 */
export interface GameMasterMove {
  moveId: string;
  name: string;
  abbreviation?: string;
  type: string;
  power: number;
  energy: number; // Cost for charged moves
  energyGain: number; // Gain for fast moves
  cooldown: number; // Milliseconds
  turns: number; // 0.5s turns
  archetype: string;
  buffs?: [number, number]; // [attack change, defense change]
  buffTarget?: 'self' | 'opponent';
  buffApplyChance?: string; // "1", "0.3", ".125", etc.
}

/**
 * Game Master Pokémon entry (from gamemaster.json)
 */
export interface GameMasterPokemon {
  dex: number;
  speciesName: string;
  speciesId: string;
  baseStats: {
    atk: number;
    def: number;
    hp: number;
  };
  types: [string, string] | [string];
  fastMoves: string[];
  chargedMoves: string[];
  eliteMoves?: string[];
  tags?: string[];
}

/**
 * Shadow Pokémon type
 */
export type ShadowType = 'normal' | 'shadow' | 'purified';

/**
 * Individual Pokémon in battle with full state
 */
export interface BattlePokemon {
  // Identity
  speciesId: string;
  speciesName: string;
  dex: number;

  // Stats
  baseStats: {
    atk: number;
    def: number;
    hp: number;
  };
  ivs: {
    atk: number;
    def: number;
    hp: number;
  };
  level: number;
  cp: number;

  // Types
  types: string[];

  // Shadow status
  shadowType?: ShadowType;

  // Moves
  fastMove: GameMasterMove;
  chargedMoves: [GameMasterMove, GameMasterMove | null];

  // Battle state
  currentHP: number;
  maxHP: number;
  energy: number; // 0-100
  shields: number; // 0-2
  buffs: BuffStages; // Attack/defense stages
  
  // Timing state
  fastMoveLockedUntil: number; // Turn number
  switchCooldownUntil: number; // Turn number
  isFainted: boolean;

  // Battle statistics (optional, for tracking)
  battleStats?: BattleStatistics;
}

/**
 * Complete team of 3 Pokémon
 */
export interface BattleTeam {
  pokemon: [BattlePokemon, BattlePokemon, BattlePokemon];
  activePokemonIndex: number; // 0, 1, or 2
}

/**
 * Action types that can be queued
 */
export type BattleActionType = 
  | 'fast-move'
  | 'charged-move-1'
  | 'charged-move-2'
  | 'switch'
  | 'shield'
  | 'wait';

/**
 * Player action in the queue
 */
export interface BattleAction {
  playerId: 'player' | 'opponent';
  type: BattleActionType;
  targetIndex?: number; // For switch actions
  chargedMoveIndex?: number; // 0 or 1
}

/**
 * Event types for battle log
 */
export type BattleEventType =
  | 'fast-move'
  | 'charged-move'
  | 'shield-used'
  | 'switch'
  | 'buff-applied'
  | 'debuff-applied'
  | 'damage-dealt'
  | 'fainted'
  | 'energy-gained'
  | 'turn-start';

/**
 * Battle event for logging
 */
export interface BattleEvent {
  turn: number;
  type: BattleEventType;
  playerId: 'player' | 'opponent';
  message: string;
  data?: Record<string, unknown>;
}

/**
 * Charged move minigame state
 */
export interface ChargedMoveMinigame {
  active: boolean;
  playerId: 'player' | 'opponent';
  move: GameMasterMove;
  bubblesHit: number;
  totalBubbles: number;
  damageMultiplier: number; // 0.0 to 1.0
  shieldPromptActive: boolean; // For defender
}

/**
 * Overall battle state
 */
export interface BattleState {
  // Teams
  playerTeam: BattleTeam;
  opponentTeam: BattleTeam;

  // Battle progress
  currentTurn: number;
  battleTimer: number; // Seconds remaining (starts at 240)
  isActive: boolean;
  winner: 'player' | 'opponent' | 'draw' | null;
  
  // Battle phase (for proper state management)
  phase: BattlePhase;

  // Action queue
  pendingActions: BattleAction[];

  // Charged move state
  chargedMoveState: ChargedMoveMinigame | null;

  // Battle log
  battleLog: BattleEvent[];
}

/**
 * Configuration for team builder
 */
export interface TeamBuilderPokemon {
  speciesId: string;
  ivs: {
    atk: number;
    def: number;
    hp: number;
  };
  level: number;
  fastMoveId: string;
  chargedMove1Id: string;
  chargedMove2Id?: string;
}

/**
 * League/format configuration
 */
export interface LeagueConfig {
  name: string;
  cpLimit: number | null; // null for Master League
}

export const LEAGUES: Record<string, LeagueConfig> = {
  great: { name: 'Great League', cpLimit: 1500 },
  ultra: { name: 'Ultra League', cpLimit: 2500 },
  master: { name: 'Master League', cpLimit: null },
};
