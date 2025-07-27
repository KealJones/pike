import type { GameMasterFile, GameMasterMove, Pokemon, RankingTarget } from './types/pokemon.types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AppState {
  gameMasterPromise: Promise<GameMasterFile>;
  rankingGreatPromise: Promise<RankingTarget[]>;
  rankingUltraPromise: Promise<RankingTarget[]>;
  rankingMasterPromise: Promise<RankingTarget[]>;
}

export interface PokemonStorageState {
  pokemonStorage: Pokemon[];
  updatePokemonStorage: (newPokemon: Pokemon[]) => void;
}

export const usePokemonStorage = create<PokemonStorageState>()(
  persist((set) => ({
    pokemonStorage: [],
    updatePokemonStorage: (newPokemon: Pokemon[]) => set({ pokemonStorage: newPokemon }),
  }),
{
  name: 'pokemon-storage'
})
);

export const useAppStore = create<AppState>()(() => ({
  gameMasterPromise: fetch('https://raw.githubusercontent.com/pvpoke/pvpoke/refs/heads/master/src/data/gamemaster.min.json'/*'/poke/gamemaster.json'*/).then(async (response) => { const result = await response.json(); return ({...result, movesById: Object.fromEntries(result.moves.map((move: GameMasterMove) => [move.moveId, move]))});}),
  rankingGreatPromise: fetch('https://raw.githubusercontent.com/pvpoke/pvpoke/refs/heads/master/src/data/rankings/gobattleleague/overall/rankings-1500.json'/*'/poke/rankings-1500.json'*/).then((response) => response.json()),
  rankingUltraPromise: fetch('https://raw.githubusercontent.com/pvpoke/pvpoke/refs/heads/master/src/data/rankings/gobattleleague/overall/rankings-2500.json'/*'/poke/rankings-1500.json'*/).then((response) => response.json()),
  rankingMasterPromise: fetch('https://raw.githubusercontent.com/pvpoke/pvpoke/refs/heads/master/src/data/rankings/gobattleleague/overall/rankings-10000.json'/*'/poke/rankings-1500.json'*/).then((response) => response.json()),
}));
