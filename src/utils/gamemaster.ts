import type {
  GameMasterFile,
  GamemasterPokemonEntry,
} from '../types/pokemon.types';

//export const gameMaster: { pokemon: GamemasterPokemonEntry[], [key: string]: unknown } = await (await fetch('https://raw.githubusercontent.com/pvpoke/pvpoke/refs/heads/master/src/data/gamemaster.min.json')).json();
export function getPokemonGamemasterData(
  speciesId: string,
  gameMaster: GameMasterFile,
): GamemasterPokemonEntry {
  let potentialSpeciesId = speciesId;
  if (potentialSpeciesId.includes('morpeko')) {
    potentialSpeciesId = 'morpeko_full_belly';
  }
  if (potentialSpeciesId == 'clodsiresb') {
    potentialSpeciesId = 'clodsire';
  }
  let entry = Array.isArray(gameMaster.pokemon)
    ? gameMaster.pokemon.find((p) => p.speciesId === potentialSpeciesId)
    : gameMaster.pokemon[potentialSpeciesId];

  if (!entry) {
    console.warn(
      `No gamemaster data found for speciesId: ${potentialSpeciesId}`,
    );

    // That particular speciesId might be a form or variant that is not directly listed in the gamemaster.
    // For example, "pikachu_gofest_2025_goggles_red"
    // In this case, we take the base speciesId (e.g., "pikachu") and find the entry for that.
    while (entry == null) {
      const speciesIdParts = potentialSpeciesId.split('_');

      speciesIdParts.pop();
      potentialSpeciesId = speciesIdParts.join('_');
      entry = Array.isArray(gameMaster.pokemon)
        ? gameMaster.pokemon.find((p) => p.speciesId === potentialSpeciesId)
        : gameMaster.pokemon[potentialSpeciesId];
      if (!entry) {
        console.warn(
          `No gamemaster data found for speciesId: ${potentialSpeciesId}`,
        );
      } else {
        console.info(
          `Found gamemaster data for speciesId: ${potentialSpeciesId}`,
        );
        break;
      }
      if (speciesIdParts.length <= 1 && !entry) break;
    }

    if (!entry) {
      throw new Error(
        `No gamemaster data found for speciesId: ${potentialSpeciesId}`,
      );
    }
  }
  return entry;
}
