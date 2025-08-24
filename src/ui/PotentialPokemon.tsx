'use client';
import { Stack, ToggleButton, ToggleButtonGroup } from '@mui/material';
import Box from '@mui/material/Box';
import { use, useMemo, useState } from 'react';
import type {
  GameMasterPromise,
  Pokemon,
  RankingTarget,
} from '../types/pokemon.types';
import { getCandidates } from '../utils/rank';
import { PokemonDataTable } from './PokemonDataTable';

export function PotentialPokemon({
  filterRank,
  gameMasterPromise,
  rankings1500Promise,
  rankings2500Promise,
  rankings50000Promise,
  pokemonStorage,
}: {
  filterRank?: number;
  gameMasterPromise: GameMasterPromise;
  rankings1500Promise: Promise<RankingTarget[]>;
  rankings2500Promise: Promise<RankingTarget[]>;
  rankings50000Promise: Promise<RankingTarget[]>;
  pokemonStorage: Pokemon[];
}) {
  const [league, setLeague] = useState(1500);
  const gameMaster = use(gameMasterPromise);
  // const rankings1500 = use(rankings1500Promise);
  // const rankings2500 = use(rankings2500Promise);
  // const rankings50000 = use(rankings50000Promise);
  const rankPercentFilter = filterRank ?? 0;
  const rankingListToUse =
    league === 1500
      ? use(rankings1500Promise)
      : league === 2500
        ? use(rankings2500Promise)
        : use(rankings50000Promise);
  const candidates = useMemo(
    () =>
      getCandidates(
        pokemonStorage,
        rankPercentFilter,
        league,
        gameMaster,
        rankingListToUse,
      ) ?? [],
    [pokemonStorage, rankPercentFilter, league, gameMaster, rankingListToUse],
  );

  // console log all candidates grouped by gm.family.id
  const familyGroups = new Map<string, Pokemon[]>();
  for (const candidate of candidates) {
    const familyId = candidate?.family.id;
    if (familyId) {
      if (!familyGroups.has(familyId)) {
        familyGroups.set(familyId, []);
      }
      familyGroups.get(familyId)?.push(candidate);
    }
  }
  // sort the family groups by the number of candidates in descending order
  const sortedFamilyGroups = Array.from(familyGroups.entries()).sort(
    ([, a], [, b]) => b.length - a.length,
  );
  console.log('Candidates grouped by family:', sortedFamilyGroups);

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
