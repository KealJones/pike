import { type NavigationPageItem } from '@toolpad/core';
import PokemonStorageUploader from './PokemonStorageUploader';

export function UploadNavItem({ item }: { item: NavigationPageItem }) {
  return <PokemonStorageUploader item={item} />;
}
