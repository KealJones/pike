import { type NavigationPageItem } from '@toolpad/core';
import { use } from 'react';
import { useAppStore, usePokemonStorage } from '../AppStore';
import PokemonStorageUploader from './PokemonStorageUploader';

export function UploadNavItem({ item }: { item: NavigationPageItem }) {
  const gameMasterPromise = useAppStore((state) => state.gameMasterPromise);
  const gameMaster = use(gameMasterPromise);
  const setPokemonStorage = usePokemonStorage(
    (state) => state.updatePokemonStorage,
  );
  return (
    <PokemonStorageUploader
      gameMaster={gameMaster}
      setPokemonStorage={setPokemonStorage}
      item={item}
    />
  );
}
