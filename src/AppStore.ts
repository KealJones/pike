import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  GameMasterFile,
  GameMasterMove,
  Pokemon,
  RankingTarget,
} from './types/pokemon.types';
import { fetchJson } from './utils/fetchJson';
import { getPokemonGamemasterData } from './utils/gamemaster';

export interface GameMasterState {
  //gameMaster: GameMasterFile;
  // setGameMaster: (newGameMaster: GameMasterFile) => void;
  gameMasterPromise: Promise<GameMasterFile>;
}

export const useGameMasterPromise = create<GameMasterState>()((_) => ({
  gameMasterPromise: fetchJson(
    `https://esm.sh/gh/pvpoke/pvpoke/src/data/gamemaster.min.json`,
  ).then(async (result) => {
    result.pokemon.map((p: any) => {
      const parentSpeciesIds: string[] = [p.speciesId];
      let parentSpeciesId = p.family?.parent;
      while (parentSpeciesId) {
        const parentEntry = getPokemonGamemasterData(parentSpeciesId, result);
        if (!parentEntry) break;
        parentSpeciesIds.push(parentEntry.speciesId);
        parentSpeciesId = parentEntry.family?.parent;
      }
      return { ...p, parentSpeciesIds };
    });

    return {
      ...result,
      movesById: Object.fromEntries(
        result.moves.map((move: GameMasterMove) => [move.moveId, move]),
      ),
    };
  }),
}));

export interface LeagueState {
  league: number;
  leagueRankListPromise: Promise<RankingTarget[]>;
  setLeague: (newLeague: number) => void;
}

export const useLeague = create<LeagueState>()(
  //persist(
  (set) => {
    const leagueRankListPromise = fetchJson(
      `https://esm.sh/gh/pvpoke/pvpoke@new-season-2026/src/data/rankings/gobattleleague/overall/rankings-1500.json`,
    );
    return {
      leagueRankListPromise,
      league: 1500,
      setLeague: (newLeague: number) => {
        const leagueRankListPromise = fetchJson(
          `https://esm.sh/gh/pvpoke/pvpoke@new-season-2026/src/data/rankings/gobattleleague/overall/rankings-${newLeague}.json`,
        );
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
