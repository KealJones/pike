import { use } from 'react';
import { useGameMasterPromise } from '../AppStore';
import type { GameMasterFile } from '../types/pokemon.types';

export function useGameMaster(): GameMasterFile {
  const gameMasterPromise = useGameMasterPromise(
    (state) => state.gameMasterPromise,
  );
  return use<GameMasterFile>(gameMasterPromise);
}
