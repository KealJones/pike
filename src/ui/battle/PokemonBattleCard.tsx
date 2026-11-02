/**
 * PokemonBattleCard - Displays a Pokémon's battle state
 */

import { Box, LinearProgress, Typography, Chip, Stack } from '@mui/material';
import type { BattlePokemon } from '../../types/battle.types';
import { getHPPercentage, getEnergyPercentage } from '../../utils/pvp/battleHelpers';
import { getStageArrows } from '../../utils/pvp/buffSystem';

interface PokemonBattleCardProps {
  pokemon: BattlePokemon;
  isOpponent?: boolean;
}

export function PokemonBattleCard({ pokemon, isOpponent = false }: PokemonBattleCardProps) {
  const hpPercent = getHPPercentage(pokemon);
  const energyPercent = getEnergyPercentage(pokemon);

  const hpColor = hpPercent > 50 ? 'success' : hpPercent > 20 ? 'warning' : 'error';

  return (
    <Box
      sx={{
        p: 2,
        border: 2,
        borderColor: pokemon.isFainted ? 'grey.500' : 'primary.main',
        borderRadius: 2,
        bgcolor: 'background.paper',
        opacity: pokemon.isFainted ? 0.5 : 1,
      }}
    >
      <Stack spacing={1}>
        {/* Name and CP */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{pokemon.speciesName}</Typography>
          <Typography variant="body2" color="text.secondary">
            CP {pokemon.cp}
          </Typography>
        </Box>

        {/* Types */}
        <Box display="flex" gap={1}>
          {pokemon.types.map((type) => (
            <Chip
              key={type}
              label={type}
              size="small"
              sx={{ textTransform: 'capitalize' }}
            />
          ))}
        </Box>

        {/* HP Bar */}
        <Box>
          <Box display="flex" justifyContent="space-between" mb={0.5}>
            <Typography variant="caption">HP</Typography>
            <Typography variant="caption">
              {pokemon.currentHP} / {pokemon.maxHP}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={hpPercent}
            color={hpColor}
            sx={{ height: 8, borderRadius: 1 }}
          />
        </Box>

        {/* Energy Bar */}
        {!isOpponent && (
          <Box>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption">Energy</Typography>
              <Typography variant="caption">{pokemon.energy}</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={energyPercent}
              color="info"
              sx={{ height: 6, borderRadius: 1 }}
            />
          </Box>
        )}

        {/* Shields */}
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="caption">Shields:</Typography>
          {[...Array(2)].map((_, i) => (
            <Box
              key={i}
              sx={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                bgcolor: i < pokemon.shields ? 'info.main' : 'grey.300',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="caption" sx={{ color: 'white', fontSize: 10 }}>
                {i < pokemon.shields ? '🛡' : ''}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Buffs/Debuffs */}
        {(pokemon.buffs.attack !== 0 || pokemon.buffs.defense !== 0) && (
          <Box display="flex" gap={1}>
            {pokemon.buffs.attack !== 0 && (
              <Chip
                label={`ATK ${getStageArrows(pokemon.buffs.attack)}`}
                size="small"
                color={pokemon.buffs.attack > 0 ? 'success' : 'error'}
              />
            )}
            {pokemon.buffs.defense !== 0 && (
              <Chip
                label={`DEF ${getStageArrows(pokemon.buffs.defense)}`}
                size="small"
                color={pokemon.buffs.defense > 0 ? 'success' : 'error'}
              />
            )}
          </Box>
        )}

        {/* Moves */}
        {!isOpponent && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              Fast: {pokemon.fastMove.name}
            </Typography>
            <br />
            <Typography variant="caption" color="text.secondary">
              Charged: {pokemon.chargedMoves[0]?.name}
              {pokemon.chargedMoves[1] && `, ${pokemon.chargedMoves[1].name}`}
            </Typography>
          </Box>
        )}
      </Stack>
    </Box>
  );
}
