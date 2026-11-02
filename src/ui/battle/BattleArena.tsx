/**
 * BattleArena - Main battle view component
 */

import { Box, Paper, Typography, LinearProgress, Stack } from '@mui/material';
import { useBattleStore } from '../../stores/battleStore';
import { getActivePokemon } from '../../utils/pvp/battleEngine';
import { PokemonBattleCard } from './PokemonBattleCard';
import { BattleControls } from './BattleControls';
import { BattleLog } from './BattleLog';
import { ShieldPromptDialog } from './ShieldPromptDialog';
import { StrategyAdvisorPanel } from './StrategyAdvisorPanel';
import { useEffect, useRef } from 'react';

export function BattleArena() {
  const {
    playerTeam,
    opponentTeam,
    currentTurn,
    battleTimer,
    isActive,
    winner,
    advanceTurn,
    opponentAction,
    shieldPrompt,
    isPaused,
    simulationSpeed,
  } = useBattleStore();

  const turnIntervalRef = useRef<number | undefined>(undefined);

  // Auto-advance turns (respects pause for shield prompts)
  useEffect(() => {
    if (!isActive || winner || shieldPrompt.isActive || isPaused) {
      if (turnIntervalRef.current) {
        clearInterval(turnIntervalRef.current);
      }
      return;
    }

    const turnDelay = 500 / simulationSpeed; // Adjust for simulation speed
    
    turnIntervalRef.current = setInterval(() => {
      advanceTurn();
      // AI takes action every turn (respects its own move locks internally)
      opponentAction();
    }, turnDelay);

    return () => {
      if (turnIntervalRef.current) {
        clearInterval(turnIntervalRef.current);
      }
    };
  }, [isActive, winner, currentTurn, advanceTurn, opponentAction, shieldPrompt.isActive, isPaused, simulationSpeed]);

  if (!playerTeam || !playerTeam.pokemon || playerTeam.pokemon.length < 3) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Select teams to start the battle
        </Typography>
      </Box>
    );
  }

  const playerPokemon = getActivePokemon(playerTeam);
  const opponentPokemon = getActivePokemon(opponentTeam);

  const timerPercent = (battleTimer / 240) * 100;

  return (
    <Box>
      <Stack spacing={2}>
        {/* Battle Timer */}
        <Paper sx={{ p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="h6">
              Turn {currentTurn} | {Math.floor(battleTimer)}s
            </Typography>
            {winner && (
              <Typography variant="h6" color={winner === 'player' ? 'success.main' : 'error.main'}>
                {winner === 'player' ? 'Victory!' : winner === 'opponent' ? 'Defeat' : 'Draw'}
              </Typography>
            )}
          </Box>
          <LinearProgress
            variant="determinate"
            value={timerPercent}
            color={timerPercent > 50 ? 'info' : timerPercent > 20 ? 'warning' : 'error'}
            sx={{ height: 8, borderRadius: 1 }}
          />
        </Paper>

        {/* Battle Field */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 3,
            p: 3,
            bgcolor: 'grey.100',
            borderRadius: 2,
            minHeight: 400,
          }}
        >
          {/* Opponent Side */}
          <Box>
            <Typography variant="overline" color="error.main" gutterBottom>
              Opponent
            </Typography>
            <PokemonBattleCard pokemon={opponentPokemon} isOpponent />
            
            {/* Opponent Team */}
            <Box mt={2} display="flex" gap={1}>
              {opponentTeam.pokemon.map((p, i) => (
                <Box
                  key={i}
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: 1,
                    border: 2,
                    borderColor: i === opponentTeam.activePokemonIndex ? 'error.main' : 'grey.400',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: p.isFainted ? 'grey.300' : 'white',
                    opacity: p.isFainted ? 0.5 : 1,
                  }}
                >
                  <Typography variant="caption" align="center" sx={{ fontSize: 9 }}>
                    {p.speciesName.substring(0, 8)}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(p.currentHP / p.maxHP) * 100}
                    sx={{ width: '90%', height: 3, mt: 0.5 }}
                  />
                </Box>
              ))}
            </Box>
          </Box>

          {/* Player Side */}
          <Box>
            <Typography variant="overline" color="success.main" gutterBottom>
              You
            </Typography>
            <PokemonBattleCard pokemon={playerPokemon} />
            
            {/* Player Team */}
            <Box mt={2} display="flex" gap={1}>
              {playerTeam.pokemon.map((p, i) => (
                <Box
                  key={i}
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: 1,
                    border: 2,
                    borderColor: i === playerTeam.activePokemonIndex ? 'success.main' : 'grey.400',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: p.isFainted ? 'grey.300' : 'white',
                    opacity: p.isFainted ? 0.5 : 1,
                  }}
                >
                  <Typography variant="caption" align="center" sx={{ fontSize: 9 }}>
                    {p.speciesName.substring(0, 8)}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(p.currentHP / p.maxHP) * 100}
                    sx={{ width: '90%', height: 3, mt: 0.5 }}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        {/* Controls */}
        <BattleControls />

        {/* Strategy Advisor */}
        <StrategyAdvisorPanel />

        {/* Battle Log */}
        <BattleLog />

        {/* Shield Prompt Dialog */}
        <ShieldPromptDialog />
      </Stack>
    </Box>
  );
}
