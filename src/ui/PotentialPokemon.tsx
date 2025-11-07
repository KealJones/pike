'use client';
import { useEffect, useMemo, useState } from 'react';
import { ivChartsCreated, useFormat, usePokemonStorage } from '../AppStore';
import { useGameMaster } from '../hooks/useGameMaster';
import { useRankingList } from '../hooks/useRankingList';
import type { Pokemon } from '../types/pokemon.types';
// import { getPokemonGamemasterData } from '../utils/gamemaster';
import { getCandidates } from '../utils/rank';
import { PokemonDataTable } from './PokemonDataTable';

export function PotentialPokemon() {
  const league = useFormat((state) => state.cp);
  const gameMaster = useGameMaster();
  const rankingListToUse = useRankingList();
  const pokemonStorage = usePokemonStorage((state) => state.pokemonStorage);
  const [candidates, setCandidates] = useState<Pokemon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // const rankingIds = rankingListToUse
  //   .map(
  //     (r) =>
  //       getPokemonGamemasterData(r.speciesId, gameMaster)?.family
  //         ?.parentSpeciesIds ?? r.speciesId,
  //   )
  //   .flat();
  const pokemonStorageNotInRankings = new Map<string, number>();
  pokemonStorage.forEach((p) => {
    //if (rankingIds.includes(p.speciesId)) return;
    const count = pokemonStorageNotInRankings.get(p.speciesId) ?? 0;
    pokemonStorageNotInRankings.set(p.speciesId, count + 1);
  });
  // sort by count descending
  const sortedPokemonStorageNotInRankings = new Map(
    Array.from(pokemonStorageNotInRankings.entries()).sort(
      (a, b) => b[1] - a[1],
    ),
  );
  console.log(
    'pokemonStorageNotInRankings:',
    sortedPokemonStorageNotInRankings,
  );

  useEffect(() => {
    let cancel = (_?: any) => {};
    let isMounted = true;
    let p = new Promise((resolve) => {
      cancel = resolve;
    });
    Promise.race([
      p,
      (async () => {
        if (isMounted) {
          setIsLoading(true);
        }
        await ivChartsCreated;
        const start = performance.now();
        const result = await getCandidates(
          pokemonStorage,
          league,
          gameMaster,
          rankingListToUse,
        );
        console.log(
          `getCandidates results took ${performance.now() - start}ms:`,
          result,
        );
        if (isMounted) {
          setCandidates(result ?? []);
          setIsLoading(false);
        }
      })(),
    ]);
    return () => {
      cancel();
      isMounted = false;
    };
  }, [pokemonStorage, league, gameMaster, rankingListToUse]);

  const shadowPotentials = useMemo(() => {
    const results = new Map<
      string,
      { nonShadowIndex: number; shadowIndex: number }
    >();
    // loop over rankings1500 and find shadow pokemon that are at a higher index than their non-shadow counterparts
    for (const [index, r] of rankingListToUse.entries()) {
      const rank = r.position;
      if (r.speciesId.includes('_shadow')) {
        //console.log(r);
        const nonShadowIndex = rankingListToUse.find(
          (nonShadow) =>
            nonShadow.speciesId === r.speciesId.replace('_shadow', '') &&
            !nonShadow.speciesId.includes('_shadow'),
        );
        if (nonShadowIndex != null && rank < nonShadowIndex.position) {
          if (!results.has(r.speciesId)) {
            results.set(r.speciesId, {
              nonShadowIndex: nonShadowIndex.position,
              shadowIndex: index,
            });
          }
        }
      }
    }
    console.log('shadowPotentials results:', results);
    return results;
  }, [rankingListToUse]);
  //console.log('shadowPotentials:', shadowPotentials);

  // if (candidates !== undefined && candidates?.length === 0) {
  //   return (
  //     <>
  //       <Box sx={{ padding: '20px' }}>No candidates .</Box>
  //     </>
  //   );
  // } else if (candidates === undefined) {
  //   return (
  //     <>
  //       <Box sx={{ padding: '20px' }}>Loading candidates...</Box>
  //     </>
  //   );
  // }

  return (
    <>
      <PokemonDataTable
        isLoading={isLoading}
        candidates={candidates ?? []}
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
