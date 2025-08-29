import { use } from 'react';
import { useLeague } from '../AppStore';
import type { RankingTarget } from '../types/pokemon.types';

export function useRankingList(): RankingTarget[] {
  // Custom hook logic for managing the ranking list
  const leagueRankListPromise = useLeague(
    (state) => state.leagueRankListPromise,
  );
  return use(leagueRankListPromise);
}
