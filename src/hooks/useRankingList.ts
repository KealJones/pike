import { use } from 'react';
import { useFormat } from '../AppStore';
import type { RankingTarget } from '../types/pokemon.types';

export function useRankingList(): RankingTarget[] {
  // Custom hook logic for managing the ranking list
  const leagueRankListPromise = useFormat(
    (state) => state.leagueRankListPromise,
  );
  return use(leagueRankListPromise);
}
