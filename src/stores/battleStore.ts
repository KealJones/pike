/**
 * Battle state management with Zustand
 * Manages the complete PvP battle simulation state
 */

import { create } from 'zustand';
import type {
  BattleState,
  BattleTeam,
  BattlePokemon,
  BattleEvent,
  GameMasterMove,
} from '../types/battle.types';
import {
  getActivePokemon,
  updateActivePokemon,
  processFastMove,
  processChargedMove,
  processSwitch,
  checkBattleEnd,
  calculateWinnerByHP,
} from '../utils/pvp/battleEngine';
import { getAIAction, shouldShield } from '../utils/pvp/battleAI';
import { 
  analyzeShieldDecision, 
  simulateBattle,
  findOptimalStrategy,
  type ShieldDecision,
  type TurnRecommendation,
  type BattleSimulationResult,
} from '../utils/pvp/battleStrategy';

/**
 * Pending shield prompt state
 */
interface ShieldPromptState {
  isActive: boolean;
  incomingMove: GameMasterMove | null;
  attacker: BattlePokemon | null;
  defender: BattlePokemon | null;
  analysis: ShieldDecision | null;
}

/**
 * Strategy advisor state
 */
interface StrategyAdvisorState {
  enabled: boolean;
  currentRecommendation: TurnRecommendation | null;
  simulationResult: BattleSimulationResult | null;
  showOverlay: boolean;
}

interface BattleStore extends BattleState {
  // Shield prompt state
  shieldPrompt: ShieldPromptState;
  
  // Strategy advisor
  strategyAdvisor: StrategyAdvisorState;
  
  // Simulation mode
  isSimulating: boolean;
  simulationSpeed: number; // 1 = normal, 2 = 2x, 0.5 = half speed
  isPaused: boolean;

  // Actions
  initializeBattle: (playerTeam: BattleTeam, opponentTeam: BattleTeam) => void;
  advanceTurn: () => void;
  playerFastMove: () => void;
  playerChargedMove: (moveIndex: number, bubblesHit: number) => void;
  playerSwitch: (pokemonIndex: number) => void;
  playerRespondToShield: (useShield: boolean) => void;
  opponentAction: () => void;
  resetBattle: () => void;
  addBattleEvent: (event: BattleEvent) => void;
  
  // Strategy advisor actions
  toggleStrategyAdvisor: () => void;
  runSimulation: () => void;
  findBestStrategy: () => void;
  
  // Simulation mode actions
  startAutoSimulation: () => void;
  stopAutoSimulation: () => void;
  setSimulationSpeed: (speed: number) => void;
  togglePause: () => void;
}

const TURN_DURATION = 0.5; // seconds
const BATTLE_DURATION = 240; // seconds
const MAX_TURNS = BATTLE_DURATION / TURN_DURATION; // 480 turns

/**
 * Find the next alive Pokémon in a team
 */
function getNextAlivePokemonIndex(team: BattleTeam): number | null {
  for (let i = 0; i < team.pokemon.length; i++) {
    if (!team.pokemon[i].isFainted) {
      return i;
    }
  }
  return null;
}

const createInitialState = (): BattleState & { 
  shieldPrompt: ShieldPromptState; 
  strategyAdvisor: StrategyAdvisorState;
  isSimulating: boolean;
  simulationSpeed: number;
  isPaused: boolean;
} => ({
  playerTeam: {
    pokemon: [] as unknown as [BattlePokemon, BattlePokemon, BattlePokemon],
    activePokemonIndex: 0,
  },
  opponentTeam: {
    pokemon: [] as unknown as [BattlePokemon, BattlePokemon, BattlePokemon],
    activePokemonIndex: 0,
  },
  currentTurn: 0,
  battleTimer: BATTLE_DURATION,
  isActive: false,
  winner: null,
  phase: 'neutral' as const,
  pendingActions: [],
  chargedMoveState: null,
  battleLog: [],
  shieldPrompt: {
    isActive: false,
    incomingMove: null,
    attacker: null,
    defender: null,
    analysis: null,
  },
  strategyAdvisor: {
    enabled: false,
    currentRecommendation: null,
    simulationResult: null,
    showOverlay: false,
  },
  isSimulating: false,
  simulationSpeed: 1,
  isPaused: false,
});

export const useBattleStore = create<BattleStore>((set, get) => ({
  ...createInitialState(),

  initializeBattle: (playerTeam, opponentTeam) => {
    set({
      ...createInitialState(),
      playerTeam,
      opponentTeam,
      isActive: true,
      battleLog: [
        {
          turn: 0,
          type: 'turn-start',
          playerId: 'player',
          message: 'Battle started!',
        },
      ],
    });
  },

  advanceTurn: () => {
    const state = get();
    if (!state.isActive || state.winner) return;

    const newTurn = state.currentTurn + 1;
    const newTimer = BATTLE_DURATION - (newTurn * TURN_DURATION);

    // Check time expiry
    if (newTurn >= MAX_TURNS) {
      const winner = calculateWinnerByHP(state.playerTeam, state.opponentTeam);
      set({
        currentTurn: newTurn,
        battleTimer: 0,
        isActive: false,
        winner,
        battleLog: [
          ...state.battleLog,
          {
            turn: newTurn,
            type: 'turn-start',
            playerId: 'player',
            message: `Time expired! ${winner === 'player' ? 'You win' : winner === 'opponent' ? 'Opponent wins' : 'Draw'}!`,
          },
        ],
      });
      return;
    }

    set({
      currentTurn: newTurn,
      battleTimer: newTimer,
    });

    // Check for battle end
    const winner = checkBattleEnd(state.playerTeam, state.opponentTeam);
    if (winner) {
      set({
        isActive: false,
        winner,
        battleLog: [
          ...get().battleLog,
          {
            turn: newTurn,
            type: 'turn-start',
            playerId: 'player',
            message: `Battle ended! ${winner === 'player' ? 'You win' : winner === 'opponent' ? 'Opponent wins' : 'Draw'}!`,
          },
        ],
      });
    }
  },

  playerFastMove: () => {
    const state = get();
    if (!state.isActive || state.winner) return;

    const playerPokemon = getActivePokemon(state.playerTeam);
    const opponentPokemon = getActivePokemon(state.opponentTeam);

    const result = processFastMove(
      playerPokemon,
      opponentPokemon,
      state.currentTurn
    );

    let updatedOpponentTeam = updateActivePokemon(state.opponentTeam, result.defender);
    const battleLog = [...state.battleLog, ...result.events];

    // Auto-switch opponent if their Pokémon fainted
    if (result.defender.isFainted) {
      const nextIndex = getNextAlivePokemonIndex(updatedOpponentTeam);
      if (nextIndex !== null && nextIndex !== updatedOpponentTeam.activePokemonIndex) {
        updatedOpponentTeam = { ...updatedOpponentTeam, activePokemonIndex: nextIndex };
        battleLog.push({
          turn: state.currentTurn,
          type: 'switch',
          playerId: 'opponent',
          message: `Opponent sent out ${updatedOpponentTeam.pokemon[nextIndex].speciesName}!`,
        });
      }
    }

    set({
      playerTeam: updateActivePokemon(state.playerTeam, result.attacker),
      opponentTeam: updatedOpponentTeam,
      battleLog,
    });
  },

  playerChargedMove: (moveIndex, bubblesHit) => {
    const state = get();
    if (!state.isActive || state.winner) return;

    const playerPokemon = getActivePokemon(state.playerTeam);
    const opponentPokemon = getActivePokemon(state.opponentTeam);

    const move = playerPokemon.chargedMoves[moveIndex];
    if (!move) return;

    // Check energy
    if (playerPokemon.energy < move.energy) return;

    // Calculate damage multiplier based on bubbles hit (simplified)
    const damageMultiplier = Math.max(0.25, Math.min(1.0, bubblesHit / 10));

      // Opponent decides to shield using AI logic
      const shielded = opponentPokemon.shields > 0 && shouldShield(
        opponentPokemon,
        { power: move.power, type: move.type }
      );
    const result = processChargedMove(
      playerPokemon,
      opponentPokemon,
      move,
      damageMultiplier,
      shielded,
      state.currentTurn,
      'player'
    );

    let updatedOpponentTeam = updateActivePokemon(state.opponentTeam, result.defender);
    const battleLog = [...state.battleLog, ...result.events];

    // Auto-switch opponent if their Pokémon fainted
    if (result.defender.isFainted) {
      const nextIndex = getNextAlivePokemonIndex(updatedOpponentTeam);
      if (nextIndex !== null && nextIndex !== updatedOpponentTeam.activePokemonIndex) {
        updatedOpponentTeam = { ...updatedOpponentTeam, activePokemonIndex: nextIndex };
        battleLog.push({
          turn: state.currentTurn,
          type: 'switch',
          playerId: 'opponent',
          message: `Opponent sent out ${updatedOpponentTeam.pokemon[nextIndex].speciesName}!`,
        });
      }
    }

    set({
      playerTeam: updateActivePokemon(state.playerTeam, result.attacker),
      opponentTeam: updatedOpponentTeam,
      battleLog,
    });
  },

  playerSwitch: (pokemonIndex) => {
    const state = get();
    if (!state.isActive || state.winner) return;

    const result = processSwitch(state.playerTeam, pokemonIndex, state.currentTurn);

    set({
      playerTeam: result.team,
      battleLog: [...state.battleLog, ...result.events],
    });
  },

  playerRespondToShield: (useShield: boolean) => {
    const state = get();
    if (!state.shieldPrompt.isActive || !state.shieldPrompt.incomingMove) return;

    const { incomingMove, attacker } = state.shieldPrompt;
    const playerPokemon = getActivePokemon(state.playerTeam);
    const opponentPokemon = attacker!;

    // Process the charged move with player's shield decision
    const result = processChargedMove(
      opponentPokemon,
      playerPokemon,
      incomingMove,
      1.0,
      useShield,
      state.currentTurn,
      'opponent'
    );

    let updatedPlayerTeam = updateActivePokemon(state.playerTeam, result.defender);
    const battleLog = [
      ...state.battleLog,
      ...result.events.map((e) => ({ ...e, playerId: 'opponent' as const })),
    ];

    if (useShield) {
      battleLog.push({
        turn: state.currentTurn,
        type: 'shield-used',
        playerId: 'player',
        message: `${playerPokemon.speciesName} shielded!`,
      });
    }

    // Auto-switch player if their Pokémon fainted
    if (result.defender.isFainted) {
      const nextIndex = getNextAlivePokemonIndex(updatedPlayerTeam);
      if (nextIndex !== null && nextIndex !== updatedPlayerTeam.activePokemonIndex) {
        updatedPlayerTeam = { ...updatedPlayerTeam, activePokemonIndex: nextIndex };
        battleLog.push({
          turn: state.currentTurn,
          type: 'switch',
          playerId: 'player',
          message: `You sent out ${updatedPlayerTeam.pokemon[nextIndex].speciesName}!`,
        });
      }
    }

    set({
      opponentTeam: updateActivePokemon(state.opponentTeam, result.attacker),
      playerTeam: updatedPlayerTeam,
      battleLog,
      shieldPrompt: {
        isActive: false,
        incomingMove: null,
        attacker: null,
        defender: null,
        analysis: null,
      },
      isPaused: false, // Resume battle after shield decision
    });
  },

  opponentAction: () => {
    const state = get();
    if (!state.isActive || state.winner || state.shieldPrompt.isActive || state.isPaused) return;

    const opponentPokemon = getActivePokemon(state.opponentTeam);
    const playerPokemon = getActivePokemon(state.playerTeam);

    // Get AI decision
    const aiDecision = getAIAction(state.opponentTeam, playerPokemon, state.currentTurn);

    if (aiDecision.action === 'wait') {
      // AI is locked or waiting, do nothing
      return;
    }

    if (aiDecision.action === 'switch' && aiDecision.switchIndex !== undefined) {
      // AI switches Pokemon
      const result = processSwitch(
        state.opponentTeam,
        aiDecision.switchIndex,
        state.currentTurn
      );

      set({
        opponentTeam: result.team,
        battleLog: [
          ...state.battleLog,
          ...result.events.map((e) => ({ ...e, playerId: 'opponent' as const })),
        ],
      });
    } else if (aiDecision.action === 'charged' && aiDecision.moveIndex !== undefined) {
      // AI uses charged move - PROMPT PLAYER FOR SHIELD
      const move = opponentPokemon.chargedMoves[aiDecision.moveIndex]!;

      // If player has shields, prompt for shield decision
      if (playerPokemon.shields > 0) {
        const analysis = analyzeShieldDecision(
          playerPokemon,
          opponentPokemon,
          move,
          opponentPokemon.shields,
          state.opponentTeam.pokemon.filter(p => !p.isFainted).length
        );

        set({
          shieldPrompt: {
            isActive: true,
            incomingMove: move,
            attacker: opponentPokemon,
            defender: playerPokemon,
            analysis,
          },
          isPaused: true, // Pause battle for shield decision
          battleLog: [
            ...state.battleLog,
            {
              turn: state.currentTurn,
              type: 'charged-move',
              playerId: 'opponent',
              message: `${opponentPokemon.speciesName} is using ${move.name}! Shield?`,
            },
          ],
        });
        return; // Wait for player response
      }

      // No shields - process immediately
      const result = processChargedMove(
        opponentPokemon,
        playerPokemon,
        move,
        1.0,
        false,
        state.currentTurn,
        'opponent'
      );

      let updatedPlayerTeam = updateActivePokemon(state.playerTeam, result.defender);
      const battleLog = [
        ...state.battleLog,
        ...result.events.map((e) => ({ ...e, playerId: 'opponent' as const })),
      ];

      // Auto-switch player if their Pokémon fainted
      if (result.defender.isFainted) {
        const nextIndex = getNextAlivePokemonIndex(updatedPlayerTeam);
        if (nextIndex !== null && nextIndex !== updatedPlayerTeam.activePokemonIndex) {
          updatedPlayerTeam = { ...updatedPlayerTeam, activePokemonIndex: nextIndex };
          battleLog.push({
            turn: state.currentTurn,
            type: 'switch',
            playerId: 'player',
            message: `You sent out ${updatedPlayerTeam.pokemon[nextIndex].speciesName}!`,
          });
        }
      }

      set({
        opponentTeam: updateActivePokemon(state.opponentTeam, result.attacker),
        playerTeam: updatedPlayerTeam,
        battleLog,
      });
    } else if (aiDecision.action === 'fast') {
      // AI uses fast move
      const result = processFastMove(opponentPokemon, playerPokemon, state.currentTurn);

      let updatedPlayerTeam = updateActivePokemon(state.playerTeam, result.defender);
      const battleLog = [
        ...state.battleLog,
        ...result.events.map((e) => ({ ...e, playerId: 'opponent' as const })),
      ];

      // Auto-switch player if their Pokémon fainted
      if (result.defender.isFainted) {
        const nextIndex = getNextAlivePokemonIndex(updatedPlayerTeam);
        if (nextIndex !== null && nextIndex !== updatedPlayerTeam.activePokemonIndex) {
          updatedPlayerTeam = { ...updatedPlayerTeam, activePokemonIndex: nextIndex };
          battleLog.push({
            turn: state.currentTurn,
            type: 'switch',
            playerId: 'player',
            message: `You sent out ${updatedPlayerTeam.pokemon[nextIndex].speciesName}!`,
          });
        }
      }

      set({
        opponentTeam: updateActivePokemon(state.opponentTeam, result.attacker),
        playerTeam: updatedPlayerTeam,
        battleLog,
      });
    }
    // If action is 'wait', do nothing
  },

  resetBattle: () => {
    set(createInitialState());
  },

  addBattleEvent: (event) => {
    set((state) => ({
      battleLog: [...state.battleLog, event],
    }));
  },

  // Strategy advisor actions
  toggleStrategyAdvisor: () => {
    set((state) => ({
      strategyAdvisor: {
        ...state.strategyAdvisor,
        enabled: !state.strategyAdvisor.enabled,
        showOverlay: !state.strategyAdvisor.enabled,
      },
    }));
  },

  runSimulation: () => {
    const state = get();
    if (!state.playerTeam.pokemon.length || !state.opponentTeam.pokemon.length) return;

    const result = simulateBattle(state.playerTeam, state.opponentTeam);
    
    set({
      strategyAdvisor: {
        ...state.strategyAdvisor,
        simulationResult: result,
      },
    });
  },

  findBestStrategy: () => {
    const state = get();
    if (!state.playerTeam.pokemon.length || !state.opponentTeam.pokemon.length) return;

    const { bestResult, recommendations } = findOptimalStrategy(
      state.playerTeam,
      state.opponentTeam,
      5
    );
    
    set({
      strategyAdvisor: {
        ...state.strategyAdvisor,
        simulationResult: bestResult,
      },
      battleLog: [
        ...state.battleLog,
        {
          turn: state.currentTurn,
          type: 'turn-start',
          playerId: 'player',
          message: `Strategy recommendations: ${recommendations.join('; ')}`,
        },
      ],
    });
  },

  // Simulation mode actions
  startAutoSimulation: () => {
    set({ isSimulating: true, isPaused: false });
  },

  stopAutoSimulation: () => {
    set({ isSimulating: false });
  },

  setSimulationSpeed: (speed: number) => {
    set({ simulationSpeed: speed });
  },

  togglePause: () => {
    set((state) => ({ isPaused: !state.isPaused }));
  },
}));
