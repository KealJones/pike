import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  GameMasterFile,
  GameMasterMove,
  Pokemon,
  RankingTarget,
} from './types/pokemon.types';
import { getPokemonGamemasterData } from './utils/gamemaster';

export interface AppState {
  league: number;
  gameMasterPromise: Promise<GameMasterFile>;
  rankingGreatPromise: Promise<RankingTarget[]>;
  rankingUltraPromise: Promise<RankingTarget[]>;
  rankingMasterPromise: Promise<RankingTarget[]>;
}

export interface PokemonStorageState {
  pokemonStorage: Pokemon[];
  updatePokemonStorage: (newPokemon: Pokemon[]) => void;
}

export const usePokemonFamily = create<PokemonStorageState>()(
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

export const useAppStore = create<AppState>()(() => ({
  league: 1500,
  gameMasterPromise: fetch(
    'https://esm.sh/gh/pvpoke/pvpoke/src/data/gamemaster.min.json' /*'/poke/gamemaster.json'*/,
  ).then(async (response) => {
    const result = await response.json();
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
  rankingGreatPromise: fetch(
    'https://esm.sh/gh/pvpoke/pvpoke@2551b50/src/data/rankings/gobattleleague/overall/rankings-1500.json' /*'/poke/rankings-1500.json'*/,
  ).then((response) => response.json()),
  rankingUltraPromise: fetch(
    'https://esm.sh/gh/pvpoke/pvpoke@2551b50/src/data/rankings/gobattleleague/overall/rankings-2500.json' /*'/poke/rankings-1500.json'*/,
  ).then((response) => response.json()),
  rankingMasterPromise: fetch(
    'https://esm.sh/gh/pvpoke/pvpoke@2551b50/src/data/rankings/gobattleleague/overall/rankings-10000.json' /*'/poke/rankings-1500.json'*/,
  ).then((response) => response.json()),
}));

// https://raw.githubusercontent.com/pvpoke/pvpoke/refs/heads/master/src/data/gamemaster.min.json
// https://raw.githubusercontent.com/pvpoke/pvpoke/refs/heads/master/src/data/rankings/gobattleleague/overall/rankings-1500.json
// https://raw.githubusercontent.com/pvpoke/pvpoke/refs/heads/master/src/data/rankings/gobattleleague/overall/rankings-2500.json
// https://raw.githubusercontent.com/pvpoke/pvpoke/refs/heads/master/src/data/rankings/gobattleleague/overall/rankings-10000.json
