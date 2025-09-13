import type {
  GameMasterFile,
  PokeGenieEntry,
  Pokemon,
  ProEntry,
} from '../types/pokemon.types';
import { getPokemonGamemasterData } from './gamemaster';
import { objectConvert } from './objectConvert';
import {
  createSpeciesId,
  genieTemplate,
  isProEntry,
  proTemplate,
} from './storageConversion';

/**
 * Standardizes the Pokemon storage input into a consistent format.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildPokemonStorageJson(
  input: any,
  gameMaster: GameMasterFile,
): Pokemon[] {
  return (Array.isArray(input) ? input : Object.values(input)).map(
    (entry: ProEntry | PokeGenieEntry) => {
      const normalized = isProEntry(entry)
        ? objectConvert(entry, proTemplate)
        : objectConvert(entry, genieTemplate);

      const speciesId = createSpeciesId(
        normalized.name,
        normalized.alignment,
        normalized.form,
        gameMaster,
      );
      const {
        fastMoves,
        chargedMoves,
        eliteMoves,
        baseStats,
        defaultIVs: _,
        ...gamemasterData
      } = getPokemonGamemasterData(speciesId, gameMaster);

      return {
        ...gamemasterData,
        ...normalized,
        name:
          gamemasterData.speciesName ??
          speciesId
            .split('_')
            .map(
              (part, index) =>
                `${(index == 0 ? '' : '(') + part.charAt(0).toUpperCase() + part.slice(1) + (index == 0 ? '' : ')')}`,
            )
            .join(' '),
        speciesId,
        movePool: {
          fast: fastMoves,
          charged: chargedMoves,
          elite: eliteMoves,
        },
        baseStats: {
          attack: baseStats.atk,
          defense: baseStats.def,
          stamina: baseStats.hp,
        },
      };
    },
  );
}
