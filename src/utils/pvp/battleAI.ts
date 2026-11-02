/**
 * AI opponent logic for PvP battles
 * Implements smart decision-making for charged moves, shields, and switches
 */

import type { BattlePokemon, BattleTeam } from '../../types/battle.types';
import { getTypeEffectiveness } from './typeEffectiveness';
import { canUseFastMove, canUseChargedMove } from './battleHelpers';

/**
 * Calculate type advantage score (-1 to 1)
 */
function getTypeAdvantage(attacker: BattlePokemon, defender: BattlePokemon): number {
  let totalAdvantage = 0;
  let count = 0;

  // Check attacker's move types against defender
  const fastMoveType = attacker.fastMove.type;
  const fastEffectiveness = getTypeEffectiveness(fastMoveType, defender.types);
  totalAdvantage += fastEffectiveness > 1 ? 0.5 : fastEffectiveness < 1 ? -0.5 : 0;
  count++;

  attacker.chargedMoves.forEach((move) => {
    if (move) {
      const effectiveness = getTypeEffectiveness(move.type, defender.types);
      totalAdvantage += effectiveness > 1 ? 0.5 : effectiveness < 1 ? -0.5 : 0;
      count++;
    }
  });

  return count > 0 ? totalAdvantage / count : 0;
}

/**
 * Decide if AI should switch Pokemon
 */
export function shouldSwitch(
  aiTeam: BattleTeam,
  opponentPokemon: BattlePokemon,
  currentTurn: number
): number | null {
  const activePokemon = aiTeam.pokemon[aiTeam.activePokemonIndex];

  // Don't switch if on cooldown
  if (currentTurn < activePokemon.switchCooldownUntil) {
    return null;
  }

  // Don't switch if at good HP and have type advantage
  const currentAdvantage = getTypeAdvantage(activePokemon, opponentPokemon);
  if (activePokemon.currentHP > activePokemon.maxHP * 0.5 && currentAdvantage >= 0) {
    return null;
  }

  // Find best switch option
  let bestIndex: number | null = null;
  let bestScore = currentAdvantage;

  aiTeam.pokemon.forEach((pokemon, index) => {
    if (index === aiTeam.activePokemonIndex || pokemon.isFainted) return;

    const advantage = getTypeAdvantage(pokemon, opponentPokemon);
    const hpScore = pokemon.currentHP / pokemon.maxHP;
    const totalScore = advantage * 0.7 + hpScore * 0.3;

    if (totalScore > bestScore + 0.3) {
      // Need significant improvement to switch
      bestScore = totalScore;
      bestIndex = index;
    }
  });

  return bestIndex;
}

/**
 * Decide if AI should use a charged move and which one
 */
export function shouldUseChargedMove(
  aiPokemon: BattlePokemon,
  opponentPokemon: BattlePokemon,
  currentTurn: number
): { use: boolean; moveIndex: number } {
  // Check if any charged move is available
  const canUse1 = canUseChargedMove(aiPokemon, 0, currentTurn);
  const canUse2 = canUseChargedMove(aiPokemon, 1, currentTurn);

  if (!canUse1 && !canUse2) {
    return { use: false, moveIndex: 0 };
  }

  // Evaluate moves
  let bestIndex = 0;
  let bestScore = -1;

  if (canUse1 && aiPokemon.chargedMoves[0]) {
    const move = aiPokemon.chargedMoves[0];
    const effectiveness = getTypeEffectiveness(move.type, opponentPokemon.types);
    const energyEfficiency = move.power / move.energy;
    const score = effectiveness * move.power + energyEfficiency * 10;

    if (score > bestScore) {
      bestScore = score;
      bestIndex = 0;
    }
  }

  if (canUse2 && aiPokemon.chargedMoves[1]) {
    const move = aiPokemon.chargedMoves[1];
    const effectiveness = getTypeEffectiveness(move.type, opponentPokemon.types);
    const energyEfficiency = move.power / move.energy;
    const score = effectiveness * move.power + energyEfficiency * 10;

    if (score > bestScore) {
      bestScore = score;
      bestIndex = 1;
    }
  }

  if (bestScore < 0) {
    return { use: false, moveIndex: 0 };
  }

  // Use charged move with some strategy:
  // - Always if opponent is low HP and move would KO
  // - 90% chance if energy is nearly full (>80)
  // - 70% chance if at least 60 energy
  // - 50% chance otherwise

  const opponentHPPercent = opponentPokemon.currentHP / opponentPokemon.maxHP;
  const wouldKO = opponentHPPercent < 0.3; // Rough estimate

  if (wouldKO) {
    return { use: true, moveIndex: bestIndex };
  }

  if (aiPokemon.energy > 80) {
    return { use: Math.random() < 0.9, moveIndex: bestIndex };
  }

  if (aiPokemon.energy > 60) {
    return { use: Math.random() < 0.7, moveIndex: bestIndex };
  }

  return { use: Math.random() < 0.5, moveIndex: bestIndex };
}

/**
 * Decide if AI should shield incoming charged move
 */
export function shouldShield(
  aiPokemon: BattlePokemon,
  incomingMove: { power: number; type: string }
): boolean {
  // No shields left
  if (aiPokemon.shields <= 0) {
    return false;
  }

  // Calculate expected damage (rough estimate)
  const effectiveness = getTypeEffectiveness(incomingMove.type, aiPokemon.types);
  const estimatedDamagePercent = (incomingMove.power * effectiveness) / aiPokemon.maxHP;

  // Always shield if it would KO
  if (estimatedDamagePercent > aiPokemon.currentHP / aiPokemon.maxHP) {
    return true;
  }

  // Shield high-damage moves if we have shields and HP matters
  const hpPercent = aiPokemon.currentHP / aiPokemon.maxHP;
  
  // Strategy: Be more defensive with last shield
  if (aiPokemon.shields === 1) {
    return estimatedDamagePercent > 0.4 && hpPercent < 0.7;
  }

  // With 2 shields, shield moderately high damage
  return estimatedDamagePercent > 0.3 && hpPercent < 0.8;
}

/**
 * Get AI action for current turn
 */
export function getAIAction(
  aiTeam: BattleTeam,
  opponentPokemon: BattlePokemon,
  currentTurn: number
): {
  action: 'fast' | 'charged' | 'switch' | 'wait';
  moveIndex?: number;
  switchIndex?: number;
} {
  const aiPokemon = aiTeam.pokemon[aiTeam.activePokemonIndex];

  // If locked in fast move, wait
  if (currentTurn < aiPokemon.fastMoveLockedUntil) {
    return { action: 'wait' };
  }

  // Check if we should switch
  const switchIndex = shouldSwitch(aiTeam, opponentPokemon, currentTurn);
  if (switchIndex !== null) {
    return { action: 'switch', switchIndex };
  }

  // Check if we should use charged move
  const chargedDecision = shouldUseChargedMove(aiPokemon, opponentPokemon, currentTurn);
  if (chargedDecision.use) {
    return { action: 'charged', moveIndex: chargedDecision.moveIndex };
  }

  // Default to fast move if available
  if (canUseFastMove(aiPokemon, currentTurn)) {
    return { action: 'fast' };
  }

  // Can't do anything, wait
  return { action: 'wait' };
}
