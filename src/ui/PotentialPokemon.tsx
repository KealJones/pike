'use client';
import type { GameMasterPromise, Pokemon, RankingTarget } from '../types/pokemon.types';
import { getCandidates } from '../utils/rank';
import { use } from 'react';
import Box from '@mui/material/Box';
import { useMemo, useState } from 'react';
import { Button } from '@mui/material';
import { PokemonDataTable } from './PokemonDataTable';

export function PotentialPokemon({
  filterRank,
  maxCp,
  gameMasterPromise,
  rankings1500Promise,
  pokemonStorage,
}: {
  filterRank?: number;
  maxCp?: number;
  gameMasterPromise: GameMasterPromise;
  rankings1500Promise: Promise<RankingTarget[]>;
  pokemonStorage: Pokemon[];
}) {
  const [key, setKey] = useState(0);
  const gameMaster = use(gameMasterPromise);
  const rankings1500 = use(rankings1500Promise);
  const rankPercentFilter = filterRank ?? 80;
  maxCp ??= 1500;
  const refreshButton = (
    <Button onClick={() => setKey((prev) => prev + 1)} variant="outlined" sx={{ marginBottom: '20px' }}>
      Refresh Candidates
    </Button>
  );
  const candidatesByTarget = useMemo(
    () => getCandidates(pokemonStorage, rankPercentFilter, maxCp, gameMaster, rankings1500) ?? {},
    [pokemonStorage, rankPercentFilter, maxCp, gameMaster, rankings1500]
  );
  const candidates = useMemo(() => Object.values(candidatesByTarget).flat(), [candidatesByTarget]);
  if (candidates.length === 0) {
    return (
      <>
        {refreshButton}
        <Box sx={{ padding: '20px' }}>No candidates.</Box>
      </>
    );
  }

  return (
    <>
      {refreshButton}
      <PokemonDataTable key={key} candidates={candidates} gameMaster={gameMaster} league={1500} />
    </>
  );
  {
    /* {Object.entries(getCandidates(pokemonStorage, rankPercentFilter, maxCp, gameMaster, rankings1500) ?? {})?.map(([speciesId, candidates]) => {
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
      })} */
  }
}
