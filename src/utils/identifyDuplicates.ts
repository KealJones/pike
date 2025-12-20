import type { GameMasterFile, Pokemon } from '../types/pokemon.types';
import { getPokemonGamemasterData } from './gamemaster';
import { buildIvChart, type RankOccurence } from './rank-calculator';

export interface DuplicateGroup {
  speciesId: string;
  speciesName: string;
  alignment: 'shadow' | 'normal';
  totalCount: number;
  keep: Pokemon[];
  delete: Pokemon[];
}

export interface EvolutionRankInfo {
  evolvedSpeciesId: string;
  evolvedSpeciesName: string;
  percentile: number;
  rank: number;
}

export interface DuplicateAnalysis {
  groups: DuplicateGroup[];
  totalPokemon: number;
  totalToKeep: number;
  totalToDelete: number;
}

/**
 * Get all evolved forms for a species (recursively)
 */
function getEvolutionChain(
  speciesId: string,
  gameMaster: GameMasterFile,
): string[] {
  const gmData = getPokemonGamemasterData(speciesId, gameMaster);
  if (!gmData?.family?.evolutions) return [];

  const evolutions: string[] = [];
  for (const evo of gmData.family.evolutions) {
    evolutions.push(evo);
    // Recursively get evolutions of evolutions
    evolutions.push(...getEvolutionChain(evo, gameMaster));
  }

  return evolutions;
}

/**
 * Calculate how good this Pokemon would be if evolved
 */
function calculateEvolutionRanks(
  pokemon: Pokemon,
  gameMaster: GameMasterFile,
  cpMax: number,
  ivChartCache: Map<string, Record<string, RankOccurence>>,
): EvolutionRankInfo[] {
  const evolutions = getEvolutionChain(pokemon.speciesId, gameMaster);
  const results: EvolutionRankInfo[] = [];

  for (const evolvedSpeciesId of evolutions) {
    const evolvedGmData = getPokemonGamemasterData(
      evolvedSpeciesId,
      gameMaster,
    );
    if (!evolvedGmData) continue;

    // Build IV chart for evolved form if not cached
    let evolvedIvChart = ivChartCache.get(evolvedSpeciesId);
    if (!evolvedIvChart) {
      evolvedIvChart = buildIvChart({
        maxCP: cpMax,
        maxLevel: 51,
        pokedexEntry: {
          number: evolvedGmData.dex.toString(),
          name: evolvedGmData.speciesName,
          baseAttack: evolvedGmData.baseStats.atk,
          baseDefense: evolvedGmData.baseStats.def,
          baseHealth: evolvedGmData.baseStats.hp,
          family: evolvedGmData.family?.id,
        },
      });
      ivChartCache.set(evolvedSpeciesId, evolvedIvChart);
    }

    // Check rank for this Pokemon's IVs in the evolved form
    const ivKey = `${pokemon.stats.ivs.attack}/${pokemon.stats.ivs.defense}/${pokemon.stats.ivs.stamina}`;
    const rankInfo = evolvedIvChart[ivKey];

    if (rankInfo) {
      const ivChartLength = Object.keys(evolvedIvChart).length;
      const percentile =
        ((ivChartLength - rankInfo.rank) / ivChartLength) * 100;

      results.push({
        evolvedSpeciesId,
        evolvedSpeciesName: evolvedGmData.speciesName,
        percentile,
        rank: rankInfo.rank,
      });
    }
  }

  return results;
}

/**
 * Identifies which Pokemon to keep and which are safe to delete
 *
 * Keep criteria (in priority order):
 * 1. Already built (CP close to league cap)
 * 2. Best IVs for PvP (highest rank %)
 * 3. Best IVs for any evolved form
 *
 * @param pokemonStorage - All Pokemon in storage
 * @param cpMax - League CP cap (e.g., 1500 for Great League)
 * @param gameMaster - Game master data
 * @param keepTopN - How many of each species/alignment to keep (default: 1)
 * @param builtThreshold - CP threshold to consider "built" (default: 50 CP below cap)
 */
export async function identifyDuplicates(
  pokemonStorage: Pokemon[],
  cpMax: number,
  gameMaster: GameMasterFile,
  keepTopN: number = 1,
  builtThreshold: number = 50,
): Promise<DuplicateAnalysis> {
  const ivChartCache = new Map<string, Record<string, RankOccurence>>();

  // Group Pokemon by speciesId + alignment
  const groups = new Map<string, Pokemon[]>();

  for (const pokemon of pokemonStorage) {
    const alignment = pokemon.alignment === 'shadow' ? 'shadow' : 'normal';
    const key = `${pokemon.speciesId}|||||${alignment}`;

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(pokemon);
  }

  const duplicateGroups: DuplicateGroup[] = [];
  let totalToKeep = 0;
  let totalToDelete = 0;

  // Process each group
  for (const [key, pokemonList] of groups.entries()) {
    const [speciesId, alignmentStr] = key.split('|||||');
    const alignment = alignmentStr as 'shadow' | 'normal';

    if (pokemonList.length === 0) continue;

    // Get game master data for this species
    const gmData = getPokemonGamemasterData(speciesId, gameMaster);
    if (!gmData) continue;

    // Build IV chart for ranking if not cached
    let ivChart = ivChartCache.get(speciesId);
    if (!ivChart) {
      ivChart = buildIvChart({
        maxCP: cpMax,
        maxLevel: 51,
        pokedexEntry: {
          number: gmData.dex.toString(),
          name: gmData.speciesName,
          baseAttack: gmData.baseStats.atk,
          baseDefense: gmData.baseStats.def,
          baseHealth: gmData.baseStats.hp,
          family: gmData.family?.id,
        },
      });
      ivChartCache.set(speciesId, ivChart);
    }

    // Calculate rank percentile for each Pokemon (for current form and evolutions)
    const rankedPokemon = pokemonList.map((p) => {
      const ivKey = `${p.stats.ivs.attack}/${p.stats.ivs.defense}/${p.stats.ivs.stamina}`;
      const rankInfo = ivChart![ivKey];
      const ivChartLength = Object.keys(ivChart ?? {}).length;

      const percentile =
        ((ivChartLength - rankInfo!.rank) / ivChartLength) * 100;

      const isBuilt = p.stats.cp ? p.stats.cp >= cpMax - builtThreshold : false;

      // Check evolution potential
      const evolutionRanks = calculateEvolutionRanks(
        p,
        gameMaster,
        cpMax,
        ivChartCache,
      );
      const bestEvolutionRank =
        evolutionRanks.length > 0
          ? evolutionRanks.reduce((best, current) =>
              current.percentile > best.percentile ? current : best,
            )
          : null;

      return {
        ...p,
        calculatedRank: {
          percentile,
          isBuilt,
          cp: p.stats.cp ?? 0,
          evolutionRanks,
          bestEvolutionRank,
        },
      };
    });

    // Sort by priority for current form ranking
    const sortedByCurrentForm = [...rankedPokemon].sort((a, b) => {
      if (a.calculatedRank.percentile !== b.calculatedRank.percentile) {
        return b.calculatedRank.percentile - a.calculatedRank.percentile;
      }
      return b.calculatedRank.cp - a.calculatedRank.cp;
    });

    // Sort by priority for evolution potential
    const sortedByEvolution = [...rankedPokemon].sort((a, b) => {
      const aEvoPercentile =
        a.calculatedRank.bestEvolutionRank?.percentile ?? 0;
      const bEvoPercentile =
        b.calculatedRank.bestEvolutionRank?.percentile ?? 0;

      if (aEvoPercentile !== bEvoPercentile) {
        return bEvoPercentile - aEvoPercentile;
      }
      return b.calculatedRank.cp - a.calculatedRank.cp;
    });

    // Keep Pokemon that are already built
    const builtPokemon = rankedPokemon.filter((p) => p.calculatedRank.isBuilt);
    const unbuiltPokemon = rankedPokemon.filter(
      (p) => !p.calculatedRank.isBuilt,
    );

    // Identify must-keep Pokemon
    const mustKeep = new Set<Pokemon>();

    // Add all built Pokemon
    builtPokemon.forEach((p) => mustKeep.add(p));

    // Add best for current form (if has evolutions)
    const hasEvolutions = getEvolutionChain(speciesId, gameMaster).length > 0;
    if (hasEvolutions && unbuiltPokemon.length > 0) {
      const bestCurrentForm = sortedByCurrentForm.find(
        (p) => !p.calculatedRank.isBuilt,
      );
      if (bestCurrentForm) mustKeep.add(bestCurrentForm);
    }

    // Add best for evolution (if has evolutions)
    if (hasEvolutions && unbuiltPokemon.length > 0) {
      const bestForEvolution = sortedByEvolution.find(
        (p) => !p.calculatedRank.isBuilt && p.calculatedRank.bestEvolutionRank,
      );
      if (bestForEvolution) mustKeep.add(bestForEvolution);
    }

    // Sort all unbuilt by overall best potential
    const sortedUnbuilt = unbuiltPokemon.sort((a, b) => {
      const aMaxPercentile = Math.max(
        a.calculatedRank.percentile,
        a.calculatedRank.bestEvolutionRank?.percentile ?? 0,
      );
      const bMaxPercentile = Math.max(
        b.calculatedRank.percentile,
        b.calculatedRank.bestEvolutionRank?.percentile ?? 0,
      );

      if (aMaxPercentile !== bMaxPercentile) {
        return bMaxPercentile - aMaxPercentile;
      }
      return b.calculatedRank.cp - a.calculatedRank.cp;
    });

    // Fill remaining slots up to keepTopN
    const toKeep: Pokemon[] = Array.from(mustKeep);

    for (const pokemon of sortedUnbuilt) {
      if (toKeep.length >= keepTopN) break;
      if (!mustKeep.has(pokemon)) {
        toKeep.push(pokemon);
      }
    }

    const toDelete = unbuiltPokemon.filter((p) => !toKeep.includes(p));

    totalToKeep += toKeep.length;
    totalToDelete += toDelete.length;

    duplicateGroups.push({
      speciesId,
      speciesName: gmData.speciesName,
      alignment,
      totalCount: pokemonList.length,
      keep: toKeep,
      delete: toDelete,
    });
  }

  // Sort groups by number of deletable Pokemon (most deletable first)
  duplicateGroups.sort((a, b) => b.delete.length - a.delete.length);

  return {
    groups: duplicateGroups,
    totalPokemon: pokemonStorage.length,
    totalToKeep,
    totalToDelete,
  };
}

/**
 * Generates a Pokemon Go search string for the given Pokemon list
 */
export function generateSearchString(pokemonList: Pokemon[]): string {
  if (pokemonList.length === 0) return '';

  // Group by species for more efficient search string
  const speciesGroups = new Map<string, Pokemon[]>();

  for (const pokemon of pokemonList) {
    if (!speciesGroups.has(pokemon.name)) {
      speciesGroups.set(pokemon.name, []);
    }
    speciesGroups.get(pokemon.name)!.push(pokemon);
  }

  // Build search string
  const parts: string[] = [];

  for (const [name, pokemons] of speciesGroups.entries()) {
    // Get unique CP values for this species
    const cpValues = [
      ...new Set(
        pokemons.map((p) => p.stats.cp).filter((cp) => cp !== undefined),
      ),
    ].sort((a, b) => a! - b!);

    if (cpValues.length > 0) {
      // Create search like: name&cp10,cp25,cp30
      const cpPart = cpValues.map((cp) => `cp${cp}`).join(',');
      parts.push(`${name.toLowerCase()}&${cpPart}`);
    }
  }

  return parts.join(',');
}
