// --- NEW/UPDATED TYPES ---
export type TailStrategy = 'single' | 'upper';
export type UpperAggregator = 'max' | 'median' | 'mean';

export type PercentileInputs = {
  species: BaseStats;
  friendship: FriendshipTier;
  lucky: boolean;
  recipientTrainerLevel: number;
  league?: League;
  customCpCap?: number;
  percentile?: number; // 0..1 (e.g., 0.80)
  optimizeBy?: 'SP' | 'CP'; // default "SP"
  levelMax?: number; // default 51
  tailStrategy?: TailStrategy; // default "upper"
  upperAggregator?: UpperAggregator; // default "max"
};

export type PercentileResult = {
  percentile: number;
  postTradeLevel: number;
  postTradeCP: number;
  representativeIV: IV;
  cpRangeAtLevel: { minCP: number; maxCP: number }; // CP range for IVs at/above percentile
  tradeScreenRange: { minCP: number; maxCP: number }; // Full possible CP range (floor to 15/15/15)
  levelCapApplied?: number;
  preTradePowerAdvice: string;
  // extra context for UI tooltips
  tail?: {
    size: number;
    cutoffIndex: number; // first index included in tail
    bestScore: number;
    medianScore: number;
    meanScore: number;
  };
};

export function postTradeLevelCap(recipientTL: number): number {
  // Integer post-trade level cannot exceed TL+2
  return Math.max(1, Math.min(51, Math.floor(recipientTL + 2)));
}

// --- REPLACEMENT FUNCTION ---
export function computePercentileTarget(
  inputs: PercentileInputs,
): PercentileResult {
  const {
    species,
    friendship,
    lucky,
    recipientTrainerLevel,
    league = 'great',
    customCpCap,
    percentile = 0.8,
    optimizeBy = 'SP',
    levelMax = 51,
    tailStrategy = 'upper',
    upperAggregator = 'max',
  } = inputs;

  const cap = typeof customCpCap === 'number' ? customCpCap : leagueCap(league);
  const floor = lucky ? 12 : ivFloorByTier[friendship];
  const Lcap = postTradeLevelCap(recipientTrainerLevel);
  const scanMax = Math.min(levelMax, Lcap);

  const candidates = ivsForFloor(floor).map((iv) => {
    const best = bestIntegerLevelUnderCap(species, iv, cap, scanMax);
    const score =
      optimizeBy === 'SP' ? statProduct(species, iv, best.level) : best.cp;
    return { iv, level: best.level, cp: best.cp, score };
  });

  candidates.sort((a, b) => a.score - b.score);

  let pick: { iv: IV; level: number; cp: number; score: number };

  if (tailStrategy === 'single') {
    // Old behavior: pick the entry at ~exact percentile
    const idx = Math.min(
      candidates.length - 1,
      Math.max(0, Math.floor(candidates.length * percentile)),
    );
    pick = candidates[idx];
  } else {
    // New behavior: pick from the UPPER TAIL (≥ percentile)
    const cutoff = Math.min(
      candidates.length - 1,
      Math.max(0, Math.floor(candidates.length * percentile)),
    );
    const tail = candidates.slice(cutoff); // ascending by score

    let chosen = tail[tail.length - 1]; // default to max
    if (upperAggregator === 'median') {
      chosen = tail[Math.floor((tail.length - 1) / 2)];
    } else if (upperAggregator === 'mean') {
      const mean =
        tail.reduce((acc, e) => acc + e.score, 0) / (tail.length || 1);
      chosen = tail.reduce(
        (best, e) =>
          Math.abs(e.score - mean) < Math.abs(best.score - mean) ? e : best,
        tail[0],
      );
    }

    pick = chosen;

    const tailBest = tail[tail.length - 1].score;
    const tailMedian = tail[Math.floor((tail.length - 1) / 2)].score;
    const tailMean =
      tail.reduce((acc, e) => acc + e.score, 0) / (tail.length || 1);

    // Calculate CP range for IVs at/above percentile
    const percentileCPs = tail.map((t) => t.cp);
    const percentileRange = {
      minCP: Math.min(...percentileCPs),
      maxCP: Math.max(...percentileCPs),
    };

    const fullRange = tradeScreenRange(species, pick.level, friendship, lucky);
    return {
      percentile,
      postTradeLevel: pick.level,
      postTradeCP: pick.cp,
      representativeIV: pick.iv,
      cpRangeAtLevel: percentileRange,
      tradeScreenRange: fullRange,
      levelCapApplied: Lcap < levelMax ? Lcap : undefined,
      preTradePowerAdvice: `Power to **exact Level ${pick.level}.0** before trading (avoid .5). Trade sets level to an integer and caps at recipient TL+2.`,
      tail: {
        size: tail.length,
        cutoffIndex: cutoff,
        bestScore: tailBest,
        medianScore: tailMedian,
        meanScore: tailMean,
      },
    };
  }

  // For single strategy, percentile range is just the picked IV's CP
  const percentileRange = { minCP: pick.cp, maxCP: pick.cp };
  const fullRange = tradeScreenRange(species, pick.level, friendship, lucky);
  return {
    percentile,
    postTradeLevel: pick.level,
    postTradeCP: pick.cp,
    representativeIV: pick.iv,
    cpRangeAtLevel: percentileRange,
    tradeScreenRange: fullRange,
    levelCapApplied: Lcap < levelMax ? Lcap : undefined,
    preTradePowerAdvice: `Power to **exact Level ${pick.level}.0** before trading (avoid .5). Trade sets level to an integer and caps at recipient TL+2.`,
  };
}

export function tradeScreenRange(
  base: BaseStats,
  level: number,
  friendship: FriendshipTier,
  lucky: boolean,
) {
  const floor = lucky ? 12 : ivFloorByTier[friendship];
  const minCP = cp(base, { a: floor, d: floor, s: floor }, level);
  const maxCP = cp(base, { a: 15, d: 15, s: 15 }, level);
  return { minCP, maxCP };
}

export type BaseStats = { atk: number; def: number; sta: number };

export type FriendshipTier = 'good' | 'great' | 'ultra' | 'best';
export type League = 'great' | 'ultra' | 'master';

export const ivFloorByTier: Record<FriendshipTier, number> = {
  good: 1,
  great: 2,
  ultra: 3,
  best: 5,
};

// League caps. Master is uncapped -> Infinity
export function leagueCap(league: League): number {
  if (league === 'great') return 1500;
  if (league === 'ultra') return 2500;
  return Number.POSITIVE_INFINITY; // master
}

// CPM table for integer levels 1..51 (post-trade is integer).
export const CPM: Record<number, number> = {
  1: 0.094,
  2: 0.16639787,
  3: 0.21573247,
  4: 0.25572005,
  5: 0.29024988,
  6: 0.3210876,
  7: 0.34921268,
  8: 0.3752356,
  9: 0.39956728,
  10: 0.42250001,
  11: 0.44310755,
  12: 0.46279839,
  13: 0.48168495,
  14: 0.49985844,
  15: 0.51739395,
  16: 0.53435433,
  17: 0.55079269,
  18: 0.56675452,
  19: 0.58227891,
  20: 0.59740001,
  21: 0.61215729,
  22: 0.62656713,
  23: 0.64065295,
  24: 0.65443563,
  25: 0.667934,
  26: 0.68116492,
  27: 0.69414365,
  28: 0.70688421,
  29: 0.71939909,
  30: 0.7317,
  31: 0.73776948,
  32: 0.74378943,
  33: 0.74976104,
  34: 0.75568551,
  35: 0.76156384,
  36: 0.76739717,
  37: 0.7731865,
  38: 0.77893275,
  39: 0.78463697,
  40: 0.7903,
  41: 0.7953,
  42: 0.8003,
  43: 0.8053,
  44: 0.8103,
  45: 0.8153,
  46: 0.8203,
  47: 0.8253,
  48: 0.8303,
  49: 0.8353,
  50: 0.8403,
  51: 0.8453,
};

export type IV = { a: number; d: number; s: number };

export function cp(base: BaseStats, iv: IV, level: number): number {
  const m = CPM[level];
  if (!m) throw new Error(`Unsupported level ${level}`);
  const A = base.atk + iv.a;
  const D = base.def + iv.d;
  const S = base.sta + iv.s;
  const v = (A * Math.sqrt(D) * Math.sqrt(S) * m * m) / 10;
  return Math.max(10, Math.floor(v));
}

// PvP “stat product” proxy
export function statProduct(base: BaseStats, iv: IV, level: number): number {
  const m = CPM[level];
  const A = (base.atk + iv.a) * m;
  const D = (base.def + iv.d) * m;
  const S = Math.floor((base.sta + iv.s) * m);
  return A * D * S;
}

function ivsForFloor(floor: number): IV[] {
  const arr: IV[] = [];
  for (let a = floor; a <= 15; a++) {
    for (let d = floor; d <= 15; d++) {
      for (let s = floor; s <= 15; s++) {
        arr.push({ a, d, s });
      }
    }
  }
  return arr;
}

function bestIntegerLevelUnderCap(
  base: BaseStats,
  iv: IV,
  capCP: number,
  maxLevel: number,
): { level: number; cp: number } {
  // If cap is Infinity (Master), just take highest level ≤ maxLevel
  if (!Number.isFinite(capCP)) {
    const L = maxLevel;
    return { level: L, cp: cp(base, iv, L) };
  }
  let best = { level: 1, cp: cp(base, iv, 1) };
  for (let L = 1; L <= maxLevel; L++) {
    const c = cp(base, iv, L);
    if (c <= capCP && c >= best.cp) best = { level: L, cp: c };
  }
  return best;
}
