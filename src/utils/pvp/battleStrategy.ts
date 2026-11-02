/**
 * Battle Strategy Engine
 * Calculates optimal strategies for PvP battles including:
 * - Shield usage recommendations
 * - Switch timing suggestions
 * - Charged move selection
 * - Full battle simulations with optimal play
 */

import type { BattlePokemon, BattleTeam, GameMasterMove } from '../../types/battle.types';
import { getTypeEffectiveness } from './typeEffectiveness';
import { calculateDamage } from './damageCalculator';
import { calculateBattleStats, canUseChargedMove } from './battleHelpers';
import { processFastMove, processChargedMove, processSwitch, getActivePokemon, updateActivePokemon, checkBattleEnd } from './battleEngine';

// ============================================================================
// TYPES
// ============================================================================

export interface ShieldDecision {
  shouldShield: boolean;
  reason: string;
  damageIfShielded: number;
  damageIfNotShielded: number;
  wouldFaintWithoutShield: boolean;
  remainingShields: number;
}

export interface SwitchDecision {
  shouldSwitch: boolean;
  bestSwitchIndex: number | null;
  reason: string;
  currentMatchupScore: number;
  newMatchupScore: number;
}

export interface ChargedMoveDecision {
  shouldUse: boolean;
  moveIndex: number;
  reason: string;
  expectedDamage: number;
  wouldKO: boolean;
  baitPotential: number; // 0-1, how likely opponent shields
}

export interface TurnRecommendation {
  action: 'fast' | 'charged' | 'switch' | 'wait';
  chargedMoveIndex?: number;
  switchIndex?: number;
  confidence: number; // 0-1
  explanation: string;
  alternatives?: string[];
}

export interface BattleSimulationResult {
  winner: 'player' | 'opponent' | 'draw';
  turnsElapsed: number;
  playerRemainingHP: number;
  opponentRemainingHP: number;
  playerPokemonRemaining: number;
  opponentPokemonRemaining: number;
  battleRating: number; // 0-1000
  moveSequence: SimulatedAction[];
}

export interface SimulatedAction {
  turn: number;
  player: 'player' | 'opponent';
  action: 'fast' | 'charged' | 'switch' | 'shield';
  details: string;
  recommendation?: string;
}

export interface StrategyProfile {
  shieldStrategy: 'aggressive' | 'conservative' | 'optimal';
  chargedMoveStrategy: 'bait' | 'nuke' | 'balanced';
  switchStrategy: 'proactive' | 'reactive' | 'never';
}

// ============================================================================
// DAMAGE ESTIMATION
// ============================================================================

/**
 * Estimate damage from a charged move without modifying state
 */
export function estimateChargedMoveDamage(
  attacker: BattlePokemon,
  defender: BattlePokemon,
  move: GameMasterMove,
  shielded: boolean
): number {
  if (shielded) {
    return 1; // Shields reduce to minimum damage
  }

  const attackerStats = (attacker as any).stats || calculateBattleStats(
    attacker.baseStats,
    attacker.ivs,
    attacker.level
  );
  const defenderStats = (defender as any).stats || calculateBattleStats(
    defender.baseStats,
    defender.ivs,
    defender.level
  );

  return calculateDamage({
    movePower: move.power,
    moveType: move.type,
    attackerAttack: attackerStats.attack,
    attackerTypes: attacker.types,
    attackerBuffStage: attacker.buffs?.attack || 0,
    defenderDefense: defenderStats.defense,
    defenderTypes: defender.types,
    defenderBuffStage: defender.buffs?.defense || 0,
  });
}

/**
 * Estimate fast move damage per turn (DPT)
 */
export function estimateFastMoveDPT(
  attacker: BattlePokemon,
  defender: BattlePokemon
): number {
  const attackerStats = (attacker as any).stats || calculateBattleStats(
    attacker.baseStats,
    attacker.ivs,
    attacker.level
  );
  const defenderStats = (defender as any).stats || calculateBattleStats(
    defender.baseStats,
    defender.ivs,
    defender.level
  );

  const damage = calculateDamage({
    movePower: attacker.fastMove.power,
    moveType: attacker.fastMove.type,
    attackerAttack: attackerStats.attack,
    attackerTypes: attacker.types,
    attackerBuffStage: attacker.buffs?.attack || 0,
    defenderDefense: defenderStats.defense,
    defenderTypes: defender.types,
    defenderBuffStage: defender.buffs?.defense || 0,
  });

  return damage / attacker.fastMove.turns;
}

// ============================================================================
// SHIELD STRATEGY
// ============================================================================

/**
 * Analyze whether to shield an incoming charged move
 */
export function analyzeShieldDecision(
  defender: BattlePokemon,
  attacker: BattlePokemon,
  incomingMove: GameMasterMove,
  _opponentShields: number,
  remainingOpponentPokemon: number
): ShieldDecision {
  const damageIfNotShielded = estimateChargedMoveDamage(attacker, defender, incomingMove, false);
  const damageIfShielded = 1; // Minimum damage when shielded
  const wouldFaintWithoutShield = defender.currentHP <= damageIfNotShielded;
  const hpPercent = defender.currentHP / defender.maxHP;
  const damagePercent = damageIfNotShielded / defender.maxHP;

  // No shields available
  if (defender.shields <= 0) {
    return {
      shouldShield: false,
      reason: 'No shields remaining',
      damageIfShielded,
      damageIfNotShielded,
      wouldFaintWithoutShield,
      remainingShields: 0,
    };
  }

  // ALWAYS shield if it would KO
  if (wouldFaintWithoutShield) {
    return {
      shouldShield: true,
      reason: 'Shield to prevent fainting',
      damageIfShielded,
      damageIfNotShielded,
      wouldFaintWithoutShield,
      remainingShields: defender.shields - 1,
    };
  }

  // Analyze move value - is this a high damage nuke or a bait move?
  const isBaitMove = incomingMove.energy <= 40 && incomingMove.power <= 60;
  const isNukeMove = incomingMove.power >= 100;

  // Don't shield bait moves unless critical HP
  if (isBaitMove && hpPercent > 0.4) {
    return {
      shouldShield: false,
      reason: `Don't shield ${incomingMove.name} (bait move) - save shields for nukes`,
      damageIfShielded,
      damageIfNotShielded,
      wouldFaintWithoutShield,
      remainingShields: defender.shields,
    };
  }

  // Shield high damage moves
  if (isNukeMove || damagePercent > 0.5) {
    return {
      shouldShield: true,
      reason: `Shield ${incomingMove.name} - high damage move (${Math.round(damagePercent * 100)}% HP)`,
      damageIfShielded,
      damageIfNotShielded,
      wouldFaintWithoutShield,
      remainingShields: defender.shields - 1,
    };
  }

  // Conservative shield usage with last shield
  if (defender.shields === 1 && damagePercent < 0.35 && remainingOpponentPokemon > 1) {
    return {
      shouldShield: false,
      reason: 'Conserve last shield for later threats',
      damageIfShielded,
      damageIfNotShielded,
      wouldFaintWithoutShield,
      remainingShields: defender.shields,
    };
  }

  // Moderate damage - shield if HP is low
  if (damagePercent > 0.3 && hpPercent < 0.6) {
    return {
      shouldShield: true,
      reason: `Shield to preserve HP (${Math.round(damagePercent * 100)}% damage at ${Math.round(hpPercent * 100)}% HP)`,
      damageIfShielded,
      damageIfNotShielded,
      wouldFaintWithoutShield,
      remainingShields: defender.shields - 1,
    };
  }

  // Default: don't shield moderate damage at high HP
  return {
    shouldShield: false,
    reason: 'Take the damage - not critical',
    damageIfShielded,
    damageIfNotShielded,
    wouldFaintWithoutShield,
    remainingShields: defender.shields,
  };
}

// ============================================================================
// SWITCH STRATEGY
// ============================================================================

/**
 * Calculate matchup score between two Pokemon (-1 to 1)
 */
export function calculateMatchupScore(
  pokemon: BattlePokemon,
  opponent: BattlePokemon
): number {
  // Type effectiveness of our moves
  const fastEffectiveness = getTypeEffectiveness(pokemon.fastMove.type, opponent.types);
  
  let bestChargedEffectiveness = 1;
  pokemon.chargedMoves.forEach(move => {
    if (move) {
      const eff = getTypeEffectiveness(move.type, opponent.types);
      if (eff > bestChargedEffectiveness) bestChargedEffectiveness = eff;
    }
  });

  // Type effectiveness of opponent's moves against us
  const oppFastEffectiveness = getTypeEffectiveness(opponent.fastMove.type, pokemon.types);
  
  let oppBestChargedEffectiveness = 1;
  opponent.chargedMoves.forEach(move => {
    if (move) {
      const eff = getTypeEffectiveness(move.type, pokemon.types);
      if (eff > oppBestChargedEffectiveness) oppBestChargedEffectiveness = eff;
    }
  });

  // Our advantage minus their advantage
  const ourAdvantage = (fastEffectiveness - 1) * 0.5 + (bestChargedEffectiveness - 1) * 0.5;
  const theirAdvantage = (oppFastEffectiveness - 1) * 0.5 + (oppBestChargedEffectiveness - 1) * 0.5;

  // HP factor
  const ourHPPercent = pokemon.currentHP / pokemon.maxHP;
  const theirHPPercent = opponent.currentHP / opponent.maxHP;
  const hpFactor = (ourHPPercent - theirHPPercent) * 0.2;

  return Math.max(-1, Math.min(1, ourAdvantage - theirAdvantage + hpFactor));
}

/**
 * Analyze whether to switch Pokemon
 */
export function analyzeSwitchDecision(
  team: BattleTeam,
  opponent: BattlePokemon,
  currentTurn: number
): SwitchDecision {
  const activePokemon = team.pokemon[team.activePokemonIndex];

  // Check switch cooldown
  if (currentTurn < activePokemon.switchCooldownUntil) {
    return {
      shouldSwitch: false,
      bestSwitchIndex: null,
      reason: 'Switch on cooldown',
      currentMatchupScore: calculateMatchupScore(activePokemon, opponent),
      newMatchupScore: 0,
    };
  }

  const currentScore = calculateMatchupScore(activePokemon, opponent);

  // Find best switch option
  let bestIndex: number | null = null;
  let bestScore = currentScore;

  team.pokemon.forEach((pokemon, index) => {
    if (index === team.activePokemonIndex || pokemon.isFainted) return;

    const score = calculateMatchupScore(pokemon, opponent);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  // Only switch if significant improvement
  const improvement = bestScore - currentScore;
  if (bestIndex !== null && improvement > 0.3) {
    return {
      shouldSwitch: true,
      bestSwitchIndex: bestIndex,
      reason: `Switch to ${team.pokemon[bestIndex].speciesName} for better matchup (+${Math.round(improvement * 100)}%)`,
      currentMatchupScore: currentScore,
      newMatchupScore: bestScore,
    };
  }

  // Switch if losing badly
  if (currentScore < -0.4 && activePokemon.currentHP / activePokemon.maxHP < 0.5 && bestIndex !== null) {
    return {
      shouldSwitch: true,
      bestSwitchIndex: bestIndex,
      reason: `Switch to escape bad matchup (current: ${Math.round(currentScore * 100)}%)`,
      currentMatchupScore: currentScore,
      newMatchupScore: bestScore,
    };
  }

  return {
    shouldSwitch: false,
    bestSwitchIndex: null,
    reason: 'Current matchup is acceptable',
    currentMatchupScore: currentScore,
    newMatchupScore: bestScore,
  };
}

// ============================================================================
// CHARGED MOVE STRATEGY
// ============================================================================

/**
 * Analyze which charged move to use
 */
export function analyzeChargedMoveDecision(
  attacker: BattlePokemon,
  defender: BattlePokemon,
  currentTurn: number
): ChargedMoveDecision {
  const availableMoves: { index: number; move: GameMasterMove }[] = [];

  attacker.chargedMoves.forEach((move, index) => {
    if (move && canUseChargedMove(attacker, index, currentTurn)) {
      availableMoves.push({ index, move });
    }
  });

  if (availableMoves.length === 0) {
    return {
      shouldUse: false,
      moveIndex: 0,
      reason: 'No charged moves available',
      expectedDamage: 0,
      wouldKO: false,
      baitPotential: 0,
    };
  }

  // Analyze each available move
  const analyses = availableMoves.map(({ index, move }) => {
    const damage = estimateChargedMoveDamage(attacker, defender, move, false);
    const wouldKO = damage >= defender.currentHP;
    const isBait = move.energy <= 40;
    const baitPotential = isBait ? 0.7 : 0.3; // Likelihood opponent shields

    return {
      index,
      move,
      damage,
      wouldKO,
      baitPotential,
      value: wouldKO ? damage * 2 : damage / (defender.shields > 0 && !isBait ? 2 : 1),
    };
  });

  // Sort by value
  analyses.sort((a, b) => b.value - a.value);
  const best = analyses[0];

  // Decide whether to use charged move
  const defenderHPPercent = defender.currentHP / defender.maxHP;

  // Always use if it would KO
  if (best.wouldKO) {
    return {
      shouldUse: true,
      moveIndex: best.index,
      reason: `Use ${best.move.name} to KO opponent`,
      expectedDamage: best.damage,
      wouldKO: true,
      baitPotential: best.baitPotential,
    };
  }

  // Bait strategy: use low energy move first to draw shield
  if (defender.shields > 0 && analyses.length > 1) {
    const baitMove = analyses.find(a => a.move.energy <= 40);
    if (baitMove && attacker.energy >= 80) {
      return {
        shouldUse: true,
        moveIndex: baitMove.index,
        reason: `Bait with ${baitMove.move.name} to draw shield`,
        expectedDamage: baitMove.damage,
        wouldKO: false,
        baitPotential: 0.7,
      };
    }
  }

  // Use charged move if energy is high or opponent is low HP
  if (attacker.energy >= 80 || defenderHPPercent < 0.4) {
    return {
      shouldUse: true,
      moveIndex: best.index,
      reason: `Use ${best.move.name} for ${Math.round(best.damage / defender.maxHP * 100)}% damage`,
      expectedDamage: best.damage,
      wouldKO: best.wouldKO,
      baitPotential: best.baitPotential,
    };
  }

  return {
    shouldUse: false,
    moveIndex: best.index,
    reason: 'Farm more energy before using charged move',
    expectedDamage: best.damage,
    wouldKO: best.wouldKO,
    baitPotential: best.baitPotential,
  };
}

// ============================================================================
// TURN RECOMMENDATION
// ============================================================================

/**
 * Get optimal action recommendation for current turn
 */
export function getTurnRecommendation(
  playerTeam: BattleTeam,
  opponentTeam: BattleTeam,
  currentTurn: number
): TurnRecommendation {
  const playerPokemon = getActivePokemon(playerTeam);
  const opponentPokemon = getActivePokemon(opponentTeam);

  // Check if locked in fast move
  if (currentTurn < playerPokemon.fastMoveLockedUntil) {
    return {
      action: 'wait',
      confidence: 1.0,
      explanation: 'Locked in fast move animation',
    };
  }

  // Analyze switch
  const switchAnalysis = analyzeSwitchDecision(playerTeam, opponentPokemon, currentTurn);
  if (switchAnalysis.shouldSwitch && switchAnalysis.bestSwitchIndex !== null) {
    return {
      action: 'switch',
      switchIndex: switchAnalysis.bestSwitchIndex,
      confidence: 0.8,
      explanation: switchAnalysis.reason,
      alternatives: ['Continue farming energy'],
    };
  }

  // Analyze charged move
  const chargedAnalysis = analyzeChargedMoveDecision(playerPokemon, opponentPokemon, currentTurn);
  if (chargedAnalysis.shouldUse) {
    return {
      action: 'charged',
      chargedMoveIndex: chargedAnalysis.moveIndex,
      confidence: chargedAnalysis.wouldKO ? 0.95 : 0.75,
      explanation: chargedAnalysis.reason,
      alternatives: chargedAnalysis.wouldKO ? undefined : ['Farm more energy'],
    };
  }

  // Default: fast move
  return {
    action: 'fast',
    confidence: 0.9,
    explanation: `Use ${playerPokemon.fastMove.name} to farm energy`,
    alternatives: chargedAnalysis.expectedDamage > 0 ? 
      [`Use ${playerPokemon.chargedMoves[chargedAnalysis.moveIndex]?.name}`] : undefined,
  };
}

// ============================================================================
// FULL BATTLE SIMULATION
// ============================================================================

/**
 * Deep clone a battle team
 */
function cloneTeam(team: BattleTeam): BattleTeam {
  return {
    ...team,
    pokemon: team.pokemon.map(p => ({ ...p, buffs: { ...p.buffs } })) as [BattlePokemon, BattlePokemon, BattlePokemon],
  };
}

/**
 * Count remaining alive Pokemon
 */
function countAlivePokemon(team: BattleTeam): number {
  return team.pokemon.filter(p => !p.isFainted).length;
}

/**
 * Get next alive Pokemon index
 */
function getNextAlivePokemonIndex(team: BattleTeam): number | null {
  for (let i = 0; i < team.pokemon.length; i++) {
    if (!team.pokemon[i].isFainted) return i;
  }
  return null;
}

/**
 * Simulate a complete battle with optimal play
 */
export function simulateBattle(
  playerTeamOriginal: BattleTeam,
  opponentTeamOriginal: BattleTeam,
  _playerStrategy: StrategyProfile = { shieldStrategy: 'optimal', chargedMoveStrategy: 'balanced', switchStrategy: 'reactive' },
  _opponentStrategy: StrategyProfile = { shieldStrategy: 'optimal', chargedMoveStrategy: 'balanced', switchStrategy: 'reactive' }
): BattleSimulationResult {
  // Clone teams to avoid mutation
  let playerTeam = cloneTeam(playerTeamOriginal);
  let opponentTeam = cloneTeam(opponentTeamOriginal);
  
  const moveSequence: SimulatedAction[] = [];
  let turn = 0;
  const maxTurns = 480; // 4 minute battle

  while (turn < maxTurns) {
    turn++;

    // Check for battle end
    const winner = checkBattleEnd(playerTeam, opponentTeam);
    if (winner) {
      const playerTotalHP = playerTeam.pokemon.reduce((sum, p) => sum + p.currentHP, 0);
      const playerMaxHP = playerTeam.pokemon.reduce((sum, p) => sum + p.maxHP, 0);
      const oppTotalHP = opponentTeam.pokemon.reduce((sum, p) => sum + p.currentHP, 0);
      const oppMaxHP = opponentTeam.pokemon.reduce((sum, p) => sum + p.maxHP, 0);

      return {
        winner,
        turnsElapsed: turn,
        playerRemainingHP: playerTotalHP,
        opponentRemainingHP: oppTotalHP,
        playerPokemonRemaining: countAlivePokemon(playerTeam),
        opponentPokemonRemaining: countAlivePokemon(opponentTeam),
        battleRating: winner === 'player' 
          ? 500 + (playerTotalHP / playerMaxHP * 500)
          : 500 - (oppTotalHP / oppMaxHP * 500),
        moveSequence,
      };
    }

    const playerPokemon = getActivePokemon(playerTeam);
    const opponentPokemon = getActivePokemon(opponentTeam);

    // Player turn
    if (turn >= playerPokemon.fastMoveLockedUntil) {
      const recommendation = getTurnRecommendation(playerTeam, opponentTeam, turn);

      if (recommendation.action === 'charged' && recommendation.chargedMoveIndex !== undefined) {
        const move = playerPokemon.chargedMoves[recommendation.chargedMoveIndex]!;
        
        // Opponent decides shield
        const shieldDecision = analyzeShieldDecision(
          opponentPokemon,
          playerPokemon,
          move,
          playerPokemon.shields,
          countAlivePokemon(playerTeam)
        );
        
        const result = processChargedMove(
          playerPokemon,
          opponentPokemon,
          move,
          1.0,
          shieldDecision.shouldShield,
          turn,
          'player'
        );

        playerTeam = updateActivePokemon(playerTeam, result.attacker);
        opponentTeam = updateActivePokemon(opponentTeam, result.defender);

        moveSequence.push({
          turn,
          player: 'player',
          action: 'charged',
          details: `${playerPokemon.speciesName} used ${move.name}`,
          recommendation: recommendation.explanation,
        });

        if (shieldDecision.shouldShield) {
          moveSequence.push({
            turn,
            player: 'opponent',
            action: 'shield',
            details: `${opponentPokemon.speciesName} shielded`,
          });
        }

        // Auto-switch if fainted
        if (result.defender.isFainted) {
          const nextIndex = getNextAlivePokemonIndex(opponentTeam);
          if (nextIndex !== null) {
            opponentTeam = { ...opponentTeam, activePokemonIndex: nextIndex };
          }
        }
      } else if (recommendation.action === 'switch' && recommendation.switchIndex !== undefined) {
        const result = processSwitch(playerTeam, recommendation.switchIndex, turn);
        playerTeam = result.team;
        moveSequence.push({
          turn,
          player: 'player',
          action: 'switch',
          details: `Switched to ${playerTeam.pokemon[recommendation.switchIndex].speciesName}`,
          recommendation: recommendation.explanation,
        });
      } else {
        // Fast move
        const result = processFastMove(playerPokemon, opponentPokemon, turn);
        playerTeam = updateActivePokemon(playerTeam, result.attacker);
        opponentTeam = updateActivePokemon(opponentTeam, result.defender);
        moveSequence.push({
          turn,
          player: 'player',
          action: 'fast',
          details: `${playerPokemon.speciesName} used ${playerPokemon.fastMove.name}`,
        });

        // Auto-switch if fainted
        if (result.defender.isFainted) {
          const nextIndex = getNextAlivePokemonIndex(opponentTeam);
          if (nextIndex !== null) {
            opponentTeam = { ...opponentTeam, activePokemonIndex: nextIndex };
          }
        }
      }
    }

    // Opponent turn (similar logic)
    const updatedOpponentPokemon = getActivePokemon(opponentTeam);
    const updatedPlayerPokemon = getActivePokemon(playerTeam);

    if (turn >= updatedOpponentPokemon.fastMoveLockedUntil && !updatedOpponentPokemon.isFainted) {
      const oppRecommendation = getTurnRecommendation(opponentTeam, playerTeam, turn);

      if (oppRecommendation.action === 'charged' && oppRecommendation.chargedMoveIndex !== undefined) {
        const move = updatedOpponentPokemon.chargedMoves[oppRecommendation.chargedMoveIndex]!;
        
        const shieldDecision = analyzeShieldDecision(
          updatedPlayerPokemon,
          updatedOpponentPokemon,
          move,
          updatedOpponentPokemon.shields,
          countAlivePokemon(opponentTeam)
        );

        const result = processChargedMove(
          updatedOpponentPokemon,
          updatedPlayerPokemon,
          move,
          1.0,
          shieldDecision.shouldShield,
          turn,
          'opponent'
        );

        opponentTeam = updateActivePokemon(opponentTeam, result.attacker);
        playerTeam = updateActivePokemon(playerTeam, result.defender);

        moveSequence.push({
          turn,
          player: 'opponent',
          action: 'charged',
          details: `${updatedOpponentPokemon.speciesName} used ${move.name}`,
        });

        if (shieldDecision.shouldShield) {
          moveSequence.push({
            turn,
            player: 'player',
            action: 'shield',
            details: `${updatedPlayerPokemon.speciesName} shielded`,
            recommendation: shieldDecision.reason,
          });
        }

        if (result.defender.isFainted) {
          const nextIndex = getNextAlivePokemonIndex(playerTeam);
          if (nextIndex !== null) {
            playerTeam = { ...playerTeam, activePokemonIndex: nextIndex };
          }
        }
      } else if (oppRecommendation.action === 'switch' && oppRecommendation.switchIndex !== undefined) {
        const result = processSwitch(opponentTeam, oppRecommendation.switchIndex, turn);
        opponentTeam = result.team;
      } else {
        const result = processFastMove(updatedOpponentPokemon, updatedPlayerPokemon, turn);
        opponentTeam = updateActivePokemon(opponentTeam, result.attacker);
        playerTeam = updateActivePokemon(playerTeam, result.defender);

        if (result.defender.isFainted) {
          const nextIndex = getNextAlivePokemonIndex(playerTeam);
          if (nextIndex !== null) {
            playerTeam = { ...playerTeam, activePokemonIndex: nextIndex };
          }
        }
      }
    }
  }

  // Time expired - calculate by remaining HP
  const playerTotalHP = playerTeam.pokemon.reduce((sum, p) => sum + p.currentHP, 0);
  const oppTotalHP = opponentTeam.pokemon.reduce((sum, p) => sum + p.currentHP, 0);

  return {
    winner: playerTotalHP > oppTotalHP ? 'player' : oppTotalHP > playerTotalHP ? 'opponent' : 'draw',
    turnsElapsed: maxTurns,
    playerRemainingHP: playerTotalHP,
    opponentRemainingHP: oppTotalHP,
    playerPokemonRemaining: countAlivePokemon(playerTeam),
    opponentPokemonRemaining: countAlivePokemon(opponentTeam),
    battleRating: 500 + ((playerTotalHP - oppTotalHP) / (playerTeam.pokemon[0].maxHP) * 250),
    moveSequence,
  };
}

/**
 * Run multiple simulations to find optimal strategy
 */
export function findOptimalStrategy(
  playerTeam: BattleTeam,
  opponentTeam: BattleTeam,
  simulations: number = 10
): {
  bestResult: BattleSimulationResult;
  winRate: number;
  recommendations: string[];
} {
  const results: BattleSimulationResult[] = [];

  for (let i = 0; i < simulations; i++) {
    results.push(simulateBattle(playerTeam, opponentTeam));
  }

  const wins = results.filter(r => r.winner === 'player').length;
  const winRate = wins / simulations;

  // Find best result
  const bestResult = results.reduce((best, current) => 
    current.battleRating > best.battleRating ? current : best
  );

  // Generate recommendations from best simulation
  const recommendations: string[] = [];

  // Analyze early switches
  const earlySwitches = bestResult.moveSequence
    .filter(a => a.player === 'player' && a.action === 'switch' && a.turn < 20);
  if (earlySwitches.length > 0) {
    recommendations.push(`Consider early switch: ${earlySwitches[0].details}`);
  }

  // Analyze shield usage
  const playerShields = bestResult.moveSequence
    .filter(a => a.player === 'player' && a.action === 'shield');
  if (playerShields.length > 0) {
    recommendations.push(`Shield timing: ${playerShields.map(s => `Turn ${s.turn}`).join(', ')}`);
  }

  // Analyze charged move timing
  const playerCharged = bestResult.moveSequence
    .filter(a => a.player === 'player' && a.action === 'charged');
  if (playerCharged.length > 0) {
    const first = playerCharged[0];
    recommendations.push(`First charged move at turn ${first.turn}: ${first.details}`);
  }

  return {
    bestResult,
    winRate,
    recommendations,
  };
}
