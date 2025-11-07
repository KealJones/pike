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

export interface PvpFormat {
  title: string;
  cup: string;
  cp: LeagueCpCap;
  meta: string;
  showCup: boolean;
  showFormat: boolean;
  showMeta: boolean;
  hideRankings?: boolean;
  rules?: string[];
}

export const formatRankingScenarios = [
  'overall',
  'leads',
  'closers',
  'switches',
  'chargers',
  'attackers',
  'consistency',
] as const;

export type FormatRankingScenario = (typeof formatRankingScenarios)[number];

export interface FormatState {
  formatTitle: string;
  cup: string;
  cp: LeagueCpCap;
  rankingScenario: FormatRankingScenario;
  formatListPromise: Promise<PvpFormat[]>;
  leagueRankListPromise: Promise<RankingTarget[]>;
  setFormat: (
    newFormat: string,
    rankingScenario: FormatRankingScenario,
  ) => void;
}

export const useFormat = create<FormatState>()(
  //persist(
  (set) => {
    const formatListPromise = fetchJson(
      `https://esm.sh/gh/pvpoke/pvpoke/src/data/gamemaster/formats.json`,
    ).then((result: PvpFormat[]) => {
      return [
        // Hardcoded formats that are always present
        {
          title: 'Great League',
          cup: 'all',
          cp: 1500,
          meta: 'great',
          showCup: true,
          showFormat: true,
          showMeta: true,
        },
        {
          title: 'Ultra League',
          cup: 'all',
          cp: 2500,
          meta: 'ultra',
          showCup: true,
          showFormat: true,
          showMeta: true,
        },
        {
          title: 'Master League',
          cup: 'all',
          cp: 10000,
          meta: 'master',
          showCup: true,
          showFormat: true,
          showMeta: true,
        },
        ...result,
      ] as PvpFormat[];
    });
    const leagueRankListPromise = fetchJson(
      `https://esm.sh/gh/pvpoke/pvpoke/src/data/rankings/all/overall/rankings-1500.json`,
    ).then((result: RankingTarget[]) => {
      return result.map((item, index) => ({
        ...item,
        position: index + 1,
      }));
    });
    return {
      formatListPromise,
      leagueRankListPromise,
      formatTitle: 'Great League',
      cp: 1500,
      cup: 'all',
      rankingScenario: 'overall',
      title: 'Great League',
      setFormat: (
        newFormat: string,
        rankingScenario: FormatRankingScenario,
      ) => {
        formatListPromise.then((formats) => {
          const format = formats.find((f) => f.title === newFormat);
          if (format) {
            const leagueRankListPromise = fetchJson(
              `https://esm.sh/gh/pvpoke/pvpoke/src/data/rankings/${format.cup}/${rankingScenario}/rankings-${format.cp}.json`,
            ).then((result: RankingTarget[]) => {
              return result.map((item, index) => ({
                ...item,
                position: index + 1,
              }));
            });
            set({
              formatTitle: format.title,
              cp: format.cp,
              cup: format.cup,
              rankingScenario: rankingScenario,
              leagueRankListPromise,
            });
          } else {
            console.error(`Format not found: ${newFormat}`);
          }
        });
      },
    };
  },
  //)
);
// https://pvpoke.com/data/rankings/all/closers/rankings-2500.json?v=1.36.7.21
// https://pvpoke.com/data/rankings/jungle/closers/rankings-1500.json?v=1.36.7.21
// https://esm.sh/gh/pvpoke/pvpoke/src/data/rankings/${format || 'all'}/${format}/all/

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
