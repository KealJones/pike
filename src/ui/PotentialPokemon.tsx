'use client';
import type { GameMasterPromise, Pokemon, Ranking1500Target } from '../types/pokemon.types';
import { PokemonEntry } from './PokemonEntry';
import { getCandidates } from '../utils/rank';
import { use } from 'react';
import Box from '@mui/material/Box';

export function PotentialPokemon({filterRank, maxCp, gameMasterPromise, rankings1500Promise, pokemonStorage}: { filterRank?: number; maxCp?: number; gameMasterPromise: GameMasterPromise, rankings1500Promise: Promise<Ranking1500Target[]>; pokemonStorage: Pokemon[] }) {
  const gameMaster = use(gameMasterPromise);
  const rankings1500 = use(rankings1500Promise);
  const rankPercentFilter = filterRank ?? 80;
  maxCp ??= 1500;

  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}
      id="pokedex"
    >
      {Object.entries(getCandidates(pokemonStorage, rankPercentFilter, maxCp, gameMaster, rankings1500) ?? {})?.map(([speciesId, candidates]) => {
        if (candidates.length === 0) return null;
        return (
          <Box id={`${speciesId}`} key={`${speciesId}`} sx={{display: 'flex', flexWrap: 'wrap', flexDirection: 'row', gap: '20px'}} >
            {candidates.map((pokemon: Pokemon) => (
              <PokemonEntry
                key={
                  pokemon.speciesId +
                  pokemon.stats.ivs.attack +
                  pokemon.stats.ivs.defense +
                  pokemon.stats.ivs.stamina +
                  pokemon.stats.cp
                }
                pokemon={pokemon}
              />
            ))}
          </Box>
        );
      })}
    </Box>
  );
}
