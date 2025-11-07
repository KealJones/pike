import { use } from 'react';
import { useFormat, type PvpFormat } from '../AppStore';

export function useFormatList(): PvpFormat[] {
  // Custom hook logic for managing the ranking list
  const formatListPromise = useFormat((state) => state.formatListPromise);
  return use(formatListPromise);
}
