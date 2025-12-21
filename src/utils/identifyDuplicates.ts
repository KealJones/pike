import type {
  GameMasterFile,
  Pokemon,
  RankingTarget,
} from '../types/pokemon.types';
import { getPokemonGamemasterData } from './gamemaster';
import { buildIvChart, type RankOccurence } from './rank-calculator';

export interface DuplicateGroup {
  speciesId: string;
  speciesName: string;
  totalCount: number;
  normalKeep: Pokemon[];
  normalDelete: Pokemon[];
  shadowKeep: Pokemon[];
  shadowDelete: Pokemon[];
}

export interface EvolutionRankInfo {
  evolvedSpeciesId: string;
  evolvedSpeciesName: string;
  percentile: number;
  rank: number;
  rankingInfo?: {
    rank: number;
    rating: number;
  };
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
  rankingList?: RankingTarget[],
): EvolutionRankInfo[] {
  // Normalize speciesId for evolution lookup (remove _shadow)
  const normalizedSpeciesId = pokemon.speciesId.replace(/_shadow$/, '');
  const evolutions = getEvolutionChain(normalizedSpeciesId, gameMaster);
  const results: EvolutionRankInfo[] = [];
  const isShadow = pokemon.alignment === 'shadow';

  // Get current species data (use normalized ID)
  const currentGmData = getPokemonGamemasterData(
    normalizedSpeciesId,
    gameMaster,
  );
  if (!currentGmData) return [];

  for (const evolvedSpeciesId of evolutions) {
    // If this is a shadow Pokemon, check shadow evolution stats
    const targetSpeciesId = isShadow
      ? `${evolvedSpeciesId}_shadow`
      : evolvedSpeciesId;
    const evolvedGmData = getPokemonGamemasterData(
      evolvedSpeciesId,
      gameMaster,
    );
    if (!evolvedGmData) continue;

    // Check if evolution would likely exceed CP cap
    // Use ratio of base stat products as a rough multiplier
    const currentStatProduct =
      currentGmData.baseStats.atk *
      currentGmData.baseStats.def *
      Math.sqrt(currentGmData.baseStats.hp);
    const evolvedStatProduct =
      evolvedGmData.baseStats.atk *
      evolvedGmData.baseStats.def *
      Math.sqrt(evolvedGmData.baseStats.hp);
    const cpMultiplier = Math.sqrt(evolvedStatProduct / currentStatProduct);

    // If current CP exists and evolving would likely exceed cap, skip this evolution
    if (pokemon.stats.cp && pokemon.stats.cp * cpMultiplier > cpMax) {
      continue;
    }

    // Build IV chart for evolved form if not cached (use target ID with shadow if applicable)
    let evolvedIvChart = ivChartCache.get(targetSpeciesId);
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
      ivChartCache.set(targetSpeciesId, evolvedIvChart);
    }

    // Check rank for this Pokemon's IVs in the evolved form
    const ivKey = `${pokemon.stats.ivs.attack}/${pokemon.stats.ivs.defense}/${pokemon.stats.ivs.stamina}`;
    const rankInfo = evolvedIvChart[ivKey];

    if (rankInfo) {
      const ivChartLength = Object.keys(evolvedIvChart).length;
      const percentile =
        ((ivChartLength - rankInfo.rank) / ivChartLength) * 100;

      // Check if this evolution is in the ranking list
      const normalizedEvoId = evolvedSpeciesId.replace(/_shadow$/, '');
      const rankingInfo = rankingList?.find(
        (entry) => entry.speciesId === normalizedEvoId,
      );

      results.push({
        evolvedSpeciesId: targetSpeciesId,
        evolvedSpeciesName: isShadow
          ? `${evolvedGmData.speciesName} (Shadow)`
          : evolvedGmData.speciesName,
        percentile,
        rank: rankInfo.rank,
        rankingInfo: rankingInfo
          ? {
              rank: rankingInfo.position,
              rating: rankingInfo.rating,
            }
          : undefined,
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
 * @param rankingList - Optional ranking list for PvP viability checks
 */
export async function identifyDuplicates(
  pokemonStorage: Pokemon[],
  cpMax: number,
  gameMaster: GameMasterFile,
  keepTopN: number = 1,
  builtThreshold: number = 50,
  rankingList?: RankingTarget[],
): Promise<DuplicateAnalysis> {
  const ivChartCache = new Map<string, Record<string, RankOccurence>>();

  // Group Pokemon by speciesId only (combine normal and shadow)
  const speciesGroups = new Map<
    string,
    { normal: Pokemon[]; shadow: Pokemon[] }
  >();

  for (const pokemon of pokemonStorage) {
    // Normalize speciesId by removing _shadow suffix for grouping
    const normalizedSpeciesId = pokemon.speciesId.replace(/_shadow$/, '');

    if (!speciesGroups.has(normalizedSpeciesId)) {
      speciesGroups.set(normalizedSpeciesId, { normal: [], shadow: [] });
    }

    const group = speciesGroups.get(normalizedSpeciesId)!;
    if (pokemon.alignment === 'shadow') {
      group.shadow.push(pokemon);
    } else {
      group.normal.push(pokemon);
    }
  }

  const duplicateGroups: DuplicateGroup[] = [];
  let totalToKeep = 0;
  let totalToDelete = 0;

  // Process each species group
  for (const [speciesId, { normal, shadow }] of speciesGroups.entries()) {
    const totalCount = normal.length + shadow.length;

    if (totalCount === 0) continue;

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

    // Process normal and shadow separately
    const processAlignment = (pokemonList: Pokemon[]) => {
      if (pokemonList.length === 0) return { keep: [], delete: [] };

      // Calculate rank percentile for each Pokemon (for current form and evolutions)
      const rankedPokemon = pokemonList.map((p) => {
        const ivKey = `${p.stats.ivs.attack}/${p.stats.ivs.defense}/${p.stats.ivs.stamina}`;
        const rankInfo = ivChart![ivKey];
        const ivChartLength = Object.keys(ivChart ?? {}).length;

        const percentile =
          ((ivChartLength - rankInfo!.rank) / ivChartLength) * 100;

        const isBuilt = p.stats.cp
          ? p.stats.cp >= cpMax - builtThreshold
          : false;

        // Check evolution potential
        const evolutionRanks = calculateEvolutionRanks(
          p,
          gameMaster,
          cpMax,
          ivChartCache,
          rankingList,
        );
        const bestEvolutionRank =
          evolutionRanks.length > 0
            ? evolutionRanks.reduce((best, current) =>
                current.percentile > best.percentile ? current : best,
              )
            : null;

        // Check if current form is in ranking list
        const normalizedSpeciesId = p.speciesId.replace(/_shadow$/, '');
        const rankingInfo = rankingList?.find(
          (entry) => entry.speciesId === normalizedSpeciesId,
        );

        return {
          ...p,
          calculatedRank: {
            percentile,
            isBuilt,
            cp: p.stats.cp ?? 0,
            evolutionRanks,
            bestEvolutionRank,
            rankingInfo: rankingInfo
              ? {
                  rank: rankingInfo.position,
                  rating: rankingInfo.rating,
                }
              : undefined,
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

      // Keep Pokemon that are already built
      const builtPokemon = rankedPokemon.filter(
        (p) => p.calculatedRank.isBuilt,
      );
      const unbuiltPokemon = rankedPokemon.filter(
        (p) => !p.calculatedRank.isBuilt,
      );

      // Identify must-keep Pokemon
      const mustKeep = new Set<Pokemon>();

      // Add all built Pokemon
      builtPokemon.forEach((p) => mustKeep.add(p));

      // Add best for current form (if has evolutions)
      const evolutions = getEvolutionChain(speciesId, gameMaster);
      const hasEvolutions = evolutions.length > 0;
      if (hasEvolutions && unbuiltPokemon.length > 0) {
        const bestCurrentForm = sortedByCurrentForm.find(
          (p) => !p.calculatedRank.isBuilt,
        );
        if (bestCurrentForm) mustKeep.add(bestCurrentForm);
      }

      // Add best for EACH possible evolution in the chain
      if (hasEvolutions && unbuiltPokemon.length > 0) {
        for (const evolvedSpeciesId of evolutions) {
          // Check both normal and shadow versions of this evolution
          const normalEvoId = evolvedSpeciesId;
          const shadowEvoId = `${evolvedSpeciesId}_shadow`;

          // Find Pokemon with the best rank for normal evolution
          let bestForNormalEvo: Pokemon | null = null;
          let bestNormalPercentile = -1;

          // Find Pokemon with the best rank for shadow evolution
          let bestForShadowEvo: Pokemon | null = null;
          let bestShadowPercentile = -1;

          for (const pokemon of unbuiltPokemon) {
            if (pokemon.calculatedRank.evolutionRanks) {
              // Check for normal evolution
              const normalRank = pokemon.calculatedRank.evolutionRanks.find(
                (evo) => evo.evolvedSpeciesId === normalEvoId,
              );
              if (normalRank && normalRank.percentile > bestNormalPercentile) {
                bestNormalPercentile = normalRank.percentile;
                bestForNormalEvo = pokemon;
              }

              // Check for shadow evolution
              const shadowRank = pokemon.calculatedRank.evolutionRanks.find(
                (evo) => evo.evolvedSpeciesId === shadowEvoId,
              );
              if (shadowRank && shadowRank.percentile > bestShadowPercentile) {
                bestShadowPercentile = shadowRank.percentile;
                bestForShadowEvo = pokemon;
              }
            }
          }

          if (bestForNormalEvo) {
            mustKeep.add(bestForNormalEvo);
          }
          if (bestForShadowEvo) {
            mustKeep.add(bestForShadowEvo);
          }
        }
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

      return { keep: toKeep, delete: toDelete };
    };

    const normalResult = processAlignment(normal);
    const shadowResult = processAlignment(shadow);

    totalToKeep += normalResult.keep.length + shadowResult.keep.length;
    totalToDelete += normalResult.delete.length + shadowResult.delete.length;

    duplicateGroups.push({
      speciesId,
      speciesName: gmData.speciesName,
      totalCount,
      normalKeep: normalResult.keep,
      normalDelete: normalResult.delete,
      shadowKeep: shadowResult.keep,
      shadowDelete: shadowResult.delete,
    });
  }

  // Sort groups by number of deletable Pokemon (most deletable first)
  duplicateGroups.sort(
    (a, b) =>
      b.normalDelete.length +
      b.shadowDelete.length -
      (a.normalDelete.length + a.shadowDelete.length),
  );

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

  // Group by species name (combining normal and shadow)
  const speciesGroups = new Map<string, Pokemon[]>();

  for (const pokemon of pokemonList) {
    // Normalize name by removing " (shadow)" suffix if present
    const normalizedName = pokemon.name.replace(/ \(shadow\)$/i, '');

    if (!speciesGroups.has(normalizedName)) {
      speciesGroups.set(normalizedName, []);
    }
    speciesGroups.get(normalizedName)!.push(pokemon);
  }

  // Build search string
  const parts: string[] = [];

  for (const [name, pokemons] of speciesGroups.entries()) {
    // Get all unique CP values for this species (both normal and shadow)
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
