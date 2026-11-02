/**
 * PvP Simulation Page - Main page for battle simulation
 */

import { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
} from '@mui/material';
import { useGameMaster } from '../hooks/useGameMaster';
import { useRankingList } from '../hooks/useRankingList';
import type { BattleTeam, GameMasterPokemon, GameMasterMove } from '../types/battle.types';
import { TeamBuilder } from '../ui/battle/TeamBuilder';
import { BattleArena } from '../ui/battle/BattleArena';
import { useBattleStore } from '../stores/battleStore';

type ViewMode = 'setup' | 'battle';
type LeagueType = 'great' | 'ultra' | 'master';

const LEAGUE_LIMITS: Record<LeagueType, number | null> = {
  great: 1500,
  ultra: 2500,
  master: null,
};

export default function PvpSimulationPage() {
  const gameMaster = useGameMaster();
  const rankings = useRankingList();
  const { initializeBattle, resetBattle } = useBattleStore();

  const [viewMode, setViewMode] = useState<ViewMode>('setup');
  const [league, setLeague] = useState<LeagueType>('great');
  const [playerTeam, setPlayerTeam] = useState<BattleTeam | null>(null);
  const [opponentTeam, setOpponentTeam] = useState<BattleTeam | null>(null);

  if (!gameMaster) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Loading game data...</Typography>
      </Container>
    );
  }

  // Convert GameMaster data to proper format
  const allPokemon: GameMasterPokemon[] = Array.isArray(gameMaster.pokemon)
    ? gameMaster.pokemon
    : Object.values(gameMaster.pokemon || {});

  const allMoves: Record<string, GameMasterMove> = Array.isArray(gameMaster.moves)
    ? gameMaster.moves.reduce(
        (acc, move) => {
          acc[move.moveId] = move;
          return acc;
        },
        {} as Record<string, GameMasterMove>
      )
    : gameMaster.moves || {};

  const handlePlayerTeamReady = (team: BattleTeam) => {
    setPlayerTeam(team);
  };

  const handleOpponentTeamReady = (team: BattleTeam) => {
    setOpponentTeam(team);
  };

  const handleStartBattle = () => {
    if (!playerTeam || !opponentTeam) {
      alert('Please build both teams first');
      return;
    }

    initializeBattle(playerTeam, opponentTeam);
    setViewMode('battle');
  };

  const handleBackToSetup = () => {
    resetBattle();
    setViewMode('setup');
    setPlayerTeam(null);
    setOpponentTeam(null);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h3" gutterBottom>
          PvP Battle Simulation
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Practice Pokémon GO PvP battles with frame-accurate mechanics. Build your team of 3
          Pokémon and battle against an AI opponent.
        </Typography>

        {viewMode === 'setup' && (
          <Alert severity="info" sx={{ mt: 2 }}>
            This simulation replicates exact Pokémon GO GBL mechanics including 0.5s turns, CMP
            ties, buff/debuff staging, type effectiveness, and STAB bonuses.
          </Alert>
        )}
      </Box>

      {viewMode === 'setup' ? (
        <Stack spacing={4}>
          {/* League Selection */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Select League
            </Typography>
            <ToggleButtonGroup
              value={league}
              exclusive
              onChange={(_, value) => value && setLeague(value)}
              aria-label="league selection"
            >
              <ToggleButton value="great">Great League (1500 CP)</ToggleButton>
              <ToggleButton value="ultra">Ultra League (2500 CP)</ToggleButton>
              <ToggleButton value="master">Master League (No Limit)</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Team Builders */}
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={4}>
            <Box>
              <TeamBuilder
                allPokemon={allPokemon}
                allMoves={allMoves}
                rankings={rankings}
                onTeamReady={handlePlayerTeamReady}
                teamLabel="Your Team"
                cpLimit={LEAGUE_LIMITS[league]}
              />
              {playerTeam && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Team ready! Now build the opponent team.
                </Alert>
              )}
            </Box>

            <Box>
              {playerTeam ? (
                <>
                  <TeamBuilder
                    allPokemon={allPokemon}
                    allMoves={allMoves}
                    rankings={rankings}
                    onTeamReady={handleOpponentTeamReady}
                    teamLabel="Opponent Team"
                    cpLimit={LEAGUE_LIMITS[league]}
                  />
                  {opponentTeam && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      Both teams ready! Click "Start Battle" below.
                    </Alert>
                  )}
                </>
              ) : (
                <Box
                  sx={{
                    p: 4,
                    border: 2,
                    borderColor: 'grey.300',
                    borderRadius: 2,
                    textAlign: 'center',
                    color: 'text.secondary',
                  }}
                >
                  <Typography>Build your team first</Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Start Battle Button */}
          {playerTeam && opponentTeam && (
            <Box textAlign="center">
              <Button variant="contained" size="large" onClick={handleStartBattle}>
                Start Battle
              </Button>
            </Box>
          )}
        </Stack>
      ) : (
        <Stack spacing={2}>
          <Box>
            <Button variant="outlined" onClick={handleBackToSetup}>
              ← Back to Team Setup
            </Button>
          </Box>

          <BattleArena />
        </Stack>
      )}
    </Container>
  );
}
