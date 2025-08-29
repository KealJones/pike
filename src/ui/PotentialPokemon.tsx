'use client';
import { Stack, ToggleButton, ToggleButtonGroup } from '@mui/material';
import Box from '@mui/material/Box';
import { useMemo } from 'react';
import { useLeague } from '../AppStore';
import { useGameMaster } from '../hooks/useGameMaster';
import { useRankingList } from '../hooks/useRankingList';
import type { Pokemon } from '../types/pokemon.types';
import { getCandidates } from '../utils/rank';
import { PokemonDataTable } from './PokemonDataTable';

export function PotentialPokemon({
  pokemonStorage,
}: {
  pokemonStorage: Pokemon[];
}) {
  const league = useLeague((state) => state.league);
  const setLeague = useLeague((state) => state.setLeague);
  const gameMaster = useGameMaster();
  const rankingListToUse = useRankingList();

  const candidates = useMemo(
    () =>
      getCandidates(pokemonStorage, league, gameMaster, rankingListToUse) ?? [],
    [pokemonStorage, league, gameMaster, rankingListToUse],
  );

  const shadowPotentials = useMemo(() => {
    const results = new Map<
      string,
      { nonShadowIndex: number; shadowIndex: number }
    >();
    // loop over rankings1500 and find shadow pokemon that are at a higher index than their non-shadow counterparts
    for (const [index, r] of rankingListToUse.entries()) {
      if (r.speciesId.includes('_shadow')) {
        console.log(r);
        const nonShadowIndex = rankingListToUse.findIndex(
          (nonShadow) =>
            nonShadow.speciesId.replace('_shadow', '') ===
              r.speciesId.replace('_shadow', '') &&
            !nonShadow.speciesId.includes('_shadow'),
        );
        if (nonShadowIndex !== -1 && index < nonShadowIndex) {
          if (!results.has(r.speciesId)) {
            results.set(r.speciesId, { nonShadowIndex, shadowIndex: index });
          }
        }
      }
    }
    return Array.from(results.keys());
  }, [rankingListToUse]);

  // console.log('shadowPotentials', shadowPotentials);

  if (candidates.length === 0) {
    return (
      <>
        <Box sx={{ padding: '20px' }}>No candidates.</Box>
      </>
    );
  }

  return (
    <>
      <Stack direction="row" alignItems="center">
        <ToggleButtonGroup
          onChange={(_, value) => setLeague(value)}
          value={league}
          exclusive
        >
          <ToggleButton value={1500}>Great League - 1500</ToggleButton>
          <ToggleButton value={2500}>Ultra League - 2500</ToggleButton>
          <ToggleButton value={50000}>Master League - 50000</ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      <PokemonDataTable
        candidates={candidates}
        gameMaster={gameMaster}
        league={league}
        shadowPriority={shadowPotentials}
      />
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
