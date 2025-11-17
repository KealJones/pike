import type { PokedexEntry, RankOccurence } from './rank-calculator';
import { buildRank } from './rank-calculator';

export type BottleCapType = 'silver' | 'gold';

export interface BottleCapInput {
  currentAttack: number;
  currentDefense: number;
  currentHP: number;
  bottleCapType: BottleCapType;
  pokedexEntry: PokedexEntry;
  maxCP: number;
  maxLevel?: number;
}

export interface BottleCapSuggestion {
  targetIV: {
    attack: number;
    defense: number;
    hp: number;
  };
  improvements: {
    attack: number; // How much to increase (0 if no change)
    defense: number;
    hp: number;
  };
  totalCapsNeeded: number; // For silver caps
  currentRank: RankOccurence | null;
  currentPercentile: number | null; // Percentile of current rank (null if not in chart)
  targetRank: RankOccurence;
  targetPercentile: number; // Percentile of target rank
  rankImprovement: number | null; // How many ranks better (null if current not in chart)
  totalRanks: number; // Total number of ranks in the chart
}

/**
 * Find the best IV spread reachable via bottle caps
 */
export function calculateBottleCapTarget(
  input: BottleCapInput,
): BottleCapSuggestion | null {
  const {
    currentAttack,
    currentDefense,
    currentHP,
    bottleCapType,
    pokedexEntry,
    maxCP,
    maxLevel = 51,
  } = input;

  // Build the full rank chart
  const rankChart = buildRank({
    pokedexEntry,
    maxCP,
    maxLevel,
    minimumStatValue: 0,
  });

  if (rankChart.length === 0) {
    return null;
  }

  // Find current rank if it exists in the chart
  const currentRank = rankChart.find(
    (entry) =>
      entry.attackStat === currentAttack &&
      entry.defenseStat === currentDefense &&
      entry.healthStat === currentHP,
  );

  // Filter to only reachable IV spreads
  const reachableEntries = rankChart.filter((entry) => {
    if (bottleCapType === 'gold') {
      // Gold cap: can increase ANY/ALL stats up to 15
      // All stats must be >= current (can't decrease)
      return (
        entry.attackStat >= currentAttack &&
        entry.defenseStat >= currentDefense &&
        entry.healthStat >= currentHP
      );
    } else {
      // Silver cap: can increase ONLY ONE stat up to 15, others stay same
      const attackChanged = entry.attackStat !== currentAttack;
      const defenseChanged = entry.defenseStat !== currentDefense;
      const hpChanged = entry.healthStat !== currentHP;

      // Exactly one stat changed (or none if already optimal)
      const changedCount = [attackChanged, defenseChanged, hpChanged].filter(
        Boolean,
      ).length;

      if (changedCount > 1) return false;

      // The one that changed must have increased (or stayed same)
      return (
        entry.attackStat >= currentAttack &&
        entry.defenseStat >= currentDefense &&
        entry.healthStat >= currentHP
      );
    }
  });

  if (reachableEntries.length === 0) {
    return null;
  }

  // Get the best reachable rank (already sorted by stat product)
  const bestReachable = reachableEntries[0];

  // Calculate improvements needed
  const attackImprovement = bestReachable.attackStat - currentAttack;
  const defenseImprovement = bestReachable.defenseStat - currentDefense;
  const hpImprovement = bestReachable.healthStat - currentHP;

  // Count how many stats changed (for silver cap validation)
  const statsChanged = [
    attackImprovement > 0,
    defenseImprovement > 0,
    hpImprovement > 0,
  ].filter(Boolean).length;

  // Always just 1 bottle cap needed
  const totalCapsNeeded = statsChanged > 0 ? 1 : 0;

  const rankImprovement = currentRank
    ? currentRank.rank - bestReachable.rank
    : null;

  // Calculate percentiles
  const totalRanks = rankChart.length;
  const currentPercentile = currentRank
    ? ((totalRanks - currentRank.rank + 1) / totalRanks) * 100
    : null;
  const targetPercentile =
    ((totalRanks - bestReachable.rank + 1) / totalRanks) * 100;

  return {
    targetIV: {
      attack: bestReachable.attackStat,
      defense: bestReachable.defenseStat,
      hp: bestReachable.healthStat,
    },
    improvements: {
      attack: attackImprovement,
      defense: defenseImprovement,
      hp: hpImprovement,
    },
    totalCapsNeeded,
    currentRank: currentRank || null,
    currentPercentile,
    targetRank: bestReachable,
    targetPercentile,
    rankImprovement,
    totalRanks,
  };
}

/**
 * Calculate all possible bottle cap options (for showing alternatives)
 */
export function getAllBottleCapOptions(
  input: BottleCapInput,
  maxOptions: number = 10,
): BottleCapSuggestion[] {
  const {
    currentAttack,
    currentDefense,
    currentHP,
    pokedexEntry,
    maxCP,
    maxLevel = 51,
  } = input;

  const rankChart = buildRank({
    pokedexEntry,
    maxCP,
    maxLevel,
    minimumStatValue: 0,
  });

  if (rankChart.length === 0) {
    return [];
  }

  const currentRank = rankChart.find(
    (entry) =>
      entry.attackStat === currentAttack &&
      entry.defenseStat === currentDefense &&
      entry.healthStat === currentHP,
  );

  // For getAllBottleCapOptions, we don't filter by bottle cap type
  // Just show what's reachable by increasing stats
  const reachableEntries = rankChart.filter((entry) => {
    return (
      entry.attackStat >= currentAttack &&
      entry.defenseStat >= currentDefense &&
      entry.healthStat >= currentHP
    );
  });

  // Limit to top results
  const topEntries = reachableEntries.slice(0, maxOptions);
  const totalRanks = rankChart.length;

  return topEntries.map((entry) => {
    const attackImprovement = entry.attackStat - currentAttack;
    const defenseImprovement = entry.defenseStat - currentDefense;
    const hpImprovement = entry.healthStat - currentHP;

    const statsChanged = [
      attackImprovement > 0,
      defenseImprovement > 0,
      hpImprovement > 0,
    ].filter(Boolean).length;

    const totalCapsNeeded = statsChanged > 0 ? 1 : 0;
    const rankImprovement = currentRank ? currentRank.rank - entry.rank : null;

    const currentPercentile = currentRank
      ? ((totalRanks - currentRank.rank + 1) / totalRanks) * 100
      : null;
    const targetPercentile = ((totalRanks - entry.rank + 1) / totalRanks) * 100;

    return {
      targetIV: {
        attack: entry.attackStat,
        defense: entry.defenseStat,
        hp: entry.healthStat,
      },
      improvements: {
        attack: attackImprovement,
        defense: defenseImprovement,
        hp: hpImprovement,
      },
      totalCapsNeeded,
      currentRank: currentRank || null,
      currentPercentile,
      targetRank: entry,
      targetPercentile,
      rankImprovement,
      totalRanks,
    };
  });
}
