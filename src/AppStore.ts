import type { GameMasterFile, Pokemon, Ranking1500Target } from './types/pokemon.types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AppState {
  gameMasterPromise: Promise<GameMasterFile>;
  ranking1500Promise: Promise<Ranking1500Target[]>;
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
  gameMasterPromise: fetch('/poke/gamemaster.json').then((response) => response.json()),
  ranking1500Promise: fetch('/poke/rankings-1500.json').then((response) => response.json()),
}));
