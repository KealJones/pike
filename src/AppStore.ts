import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  GameMasterFile,
  GameMasterMove,
  Pokemon,
  RankingTarget,
} from './types/pokemon.types';
import type { BuildIvChartsResponse } from './types/workers.types';
import { fetchJson } from './utils/fetchJson';
import { getPokemonGamemasterData } from './utils/gamemaster';
import type { LeagueCpCap } from './utils/leagues';

export let ivChartsCreated: Promise<BuildIvChartsResponse['response']>;

export interface GameMasterState {
  //gameMaster: GameMasterFile;
  // setGameMaster: (newGameMaster: GameMasterFile) => void;
  gameMasterPromise: Promise<GameMasterFile>;
}

export const useGameMasterPromise = create<GameMasterState>()((_) => ({
  gameMasterPromise: fetchJson(
    `https://esm.sh/gh/pvpoke/pvpoke/src/data/gamemaster.min.json`,
  ).then(async (result: GameMasterFile) => {
    // ivChartsCreated = ivChartWorkerController.postMessage({
    //   name: 'buildIvCharts',
    //   pokemon: result.pokemon,
    // });

    // Promise.all(rankIvChart2500Promises).then((result) => {
    //   const myMap = new Map<string, RankOccurence[]>();
    //   result.forEach((entry) => {
    //     myMap.set(entry.key, entry.value);
    //   });
    //   useRankIvChart.getState().setRankIvChart2500(myMap);
    // });
    // Promise.all(rankIvChart10000Promises).then((result) => {
    //   const myMap = new Map<string, RankOccurence[]>();
    //   result.forEach((entry) => {
    //     myMap.set(entry.key, entry.value);
    //   });
    //   useRankIvChart.getState().setRankIvChart10000(myMap);
    // });

    const pokemon = Object.fromEntries(
      // It will always be an array coming in, we covert it to the keyed object here.
      Array.isArray(result.pokemon)
        ? result.pokemon.map((p: any) => {
            const parentSpeciesIds: string[] = [p.speciesId];
            let parentSpeciesId = p.family?.parent;
            while (parentSpeciesId) {
              const parentEntry = getPokemonGamemasterData(
                parentSpeciesId,
                result,
              );
              if (!parentEntry) break;
              parentSpeciesIds.push(parentEntry.speciesId);
              parentSpeciesId = parentEntry.family?.parent;
            }
            return [
              p.speciesId,
              {
                ...p,
                family: { ...p.family, parentSpeciesIds },
              },
            ];
          })
        : [],
    );

    return {
      ...result,
      pokemon,
      movesById: Object.fromEntries(
        result.moves.map((move: GameMasterMove) => [move.moveId, move]),
      ),
    };
  }),
}));

export interface LeagueState {
  league: LeagueCpCap;
  leagueRankListPromise: Promise<RankingTarget[]>;
  setLeague: (newLeague: LeagueCpCap) => void;
}

export const useLeague = create<LeagueState>()(
  //persist(
  (set) => {
    const leagueRankListPromise = fetchJson(
      `https://esm.sh/gh/pvpoke/pvpoke/src/data/rankings/gobattleleague/overall/rankings-1500.json`,
    ).then((result: RankingTarget[]) => {
      return result.map((item, index) => ({
        ...item,
        position: index + 1,
      }));
    });
    return {
      leagueRankListPromise,
      league: 1500,
      setLeague: (newLeague: LeagueCpCap) => {
        const leagueRankListPromise = fetchJson(
          `https://esm.sh/gh/pvpoke/pvpoke/src/data/rankings/gobattleleague/overall/rankings-${newLeague}.json`,
        ).then((result: RankingTarget[]) => {
          return result.map((item, index) => ({
            ...item,
            position: index + 1,
          }));
        });
        set({
          league: newLeague,
          leagueRankListPromise,
        });
      },
    };
  },
  //)
);

export interface PokemonStorageState {
  pokemonStorage: Pokemon[];
  updatePokemonStorage: (newPokemon: Pokemon[]) => void;
}

export const usePokemonStorage = create<PokemonStorageState>()(
  persist(
    (set) => ({
      pokemonStorage: [],
      updatePokemonStorage: (newPokemon: Pokemon[]) =>
        set({ pokemonStorage: newPokemon }),
    }),
    {
      name: 'pokemon-storage',
    },
  ),
);

// https://raw.githubusercontent.com/pvpoke/pvpoke/refs/heads/master/src/data/gamemaster.min.json
// https://raw.githubusercontent.com/pvpoke/pvpoke/refs/heads/master/src/data/rankings/gobattleleague/overall/rankings-1500.json
// https://raw.githubusercontent.com/pvpoke/pvpoke/refs/heads/master/src/data/rankings/gobattleleague/overall/rankings-2500.json
// https://raw.githubusercontent.com/pvpoke/pvpoke/refs/heads/master/src/data/rankings/gobattleleague/overall/rankings-10000.json
