import type { GameMasterFile, GamemasterPokemonEntry } from "../types/pokemon.types";

//export const gameMaster: { pokemon: GamemasterPokemonEntry[], [key: string]: unknown } = await (await fetch('https://raw.githubusercontent.com/pvpoke/pvpoke/refs/heads/master/src/data/gamemaster.min.json')).json();
export function getPokemonGamemasterData(speciesId: string, gameMaster: GameMasterFile): GamemasterPokemonEntry {
  let entry = gameMaster.pokemon.find(p => p.speciesId === speciesId);
  if (!entry) {
    console.warn(`No gamemaster data found for speciesId: ${speciesId}`);
    // That particular speciesId might be a form or variant that is not directly listed in the gamemaster.
    // For example, "pikachu_gofest_2025_goggles_red"
    // In this case, we take the base speciesId (e.g., "pikachu") and find the entry for that.
    entry = gameMaster.pokemon.find(p => p.speciesId === speciesId.split('_')[0]);
    if (!entry) {
      console.warn(`No gamemaster data found for speciesId: ${speciesId.split('_')[0]}`);
      throw new Error(`No gamemaster data found for speciesId: ${speciesId}`);
    }
  }
  return entry;
}
