/**
 * BattleControls - Player action buttons
 */

import { Box, Button, Stack, Typography } from '@mui/material';
import { useBattleStore } from '../../stores/battleStore';
import { getActivePokemon } from '../../utils/pvp/battleEngine';
import { canUseFastMove, canUseChargedMove } from '../../utils/pvp/battleHelpers';

export function BattleControls() {
  const { playerTeam, currentTurn, isActive, playerFastMove, playerChargedMove, playerSwitch } =
    useBattleStore();

  const activePokemon = getActivePokemon(playerTeam);

  const canUseFast = canUseFastMove(activePokemon, currentTurn);
  const canUseCharged1 = canUseChargedMove(activePokemon, 0, currentTurn);
  const canUseCharged2 =
    activePokemon.chargedMoves[1] && canUseChargedMove(activePokemon, 1, currentTurn);

  const handleFastMove = () => {
    if (!isActive) return;
    playerFastMove();
  };

  const handleChargedMove = (index: number) => {
    if (!isActive) return;
    // Simplified: no minigame, just use with full effectiveness
    playerChargedMove(index, 10); // 10/10 bubbles hit
  };

  const handleSwitch = (index: number) => {
    if (!isActive) return;
    if (index === playerTeam.activePokemonIndex) return;
    playerSwitch(index);
  };

  return (
    <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
      <Stack spacing={2}>
        {/* Fast Move */}
        <Box>
          <Typography variant="caption" gutterBottom>
            Fast Move
          </Typography>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleFastMove}
            disabled={!isActive || activePokemon.isFainted || !canUseFast}
          >
            {activePokemon.fastMove.name}
          </Button>
        </Box>

        {/* Charged Moves */}
        <Box>
          <Typography variant="caption" gutterBottom>
            Charged Moves
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              fullWidth
              variant="contained"
              color="secondary"
              onClick={() => handleChargedMove(0)}
              disabled={!isActive || !canUseCharged1 || activePokemon.isFainted}
            >
              {activePokemon.chargedMoves[0]?.name || 'None'}
              <br />
              <Typography variant="caption">
                ({activePokemon.chargedMoves[0]?.energy || 0} energy)
              </Typography>
            </Button>
            {activePokemon.chargedMoves[1] && (
              <Button
                fullWidth
                variant="contained"
                color="secondary"
                onClick={() => handleChargedMove(1)}
                disabled={!isActive || !canUseCharged2 || activePokemon.isFainted}
              >
                {activePokemon.chargedMoves[1].name}
                <br />
                <Typography variant="caption">
                  ({activePokemon.chargedMoves[1].energy} energy)
                </Typography>
              </Button>
            )}
          </Stack>
        </Box>

        {/* Switch */}
        <Box>
          <Typography variant="caption" gutterBottom>
            Switch Pokémon
          </Typography>
          <Stack direction="row" spacing={1}>
            {playerTeam.pokemon.map((pokemon, index) => (
              <Button
                key={index}
                fullWidth
                variant="outlined"
                size="small"
                onClick={() => handleSwitch(index)}
                disabled={
                  !isActive ||
                  index === playerTeam.activePokemonIndex ||
                  pokemon.isFainted
                }
                sx={{
                  opacity: index === playerTeam.activePokemonIndex ? 0.5 : 1,
                }}
              >
                {pokemon.speciesName}
                <br />
                <Typography variant="caption">
                  {Math.floor((pokemon.currentHP / pokemon.maxHP) * 100)}%
                </Typography>
              </Button>
            ))}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
