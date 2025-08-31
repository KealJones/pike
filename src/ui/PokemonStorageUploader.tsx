'use client';

import {
  DashboardSidebarPageItem,
  type NavigationPageItem,
} from '@toolpad/core';
import { type ChangeEvent } from 'react';
import { usePokemonStorage } from '../AppStore';
import { useGameMaster } from '../hooks/useGameMaster';
import { buildPokemonStorageJson } from '../utils/buildPokemonStorageJson';
import { csvToJson } from '../utils/csvToJson';

export const PokemonStorageUploader: React.FC<{
  item: NavigationPageItem;
}> = ({ item }) => {
  const gameMaster = useGameMaster();
  const setPokemonStorage = usePokemonStorage(
    (state) => state.updatePokemonStorage,
  );
  // useEffect(() => {
  //   // This code runs only on the client-side
  //   //const savedStorage = localStorage.getItem('pokemon-storage');
  //   if (savedStorage) {
  //     setPokemonStorage(JSON.parse(savedStorage));
  //   }
  // }, [setPokemonStorage]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const content = e.target?.result as string;

        let jsonData;
        // Try to parse as JSON
        try {
          jsonData = JSON.parse(content);
        } catch {
          // If not JSON, try CSV
          try {
            jsonData = csvToJson(content);
          } catch {
            throw new Error('File format not recognized or invalid.');
            return;
          }
        }
        const pokemonStorage = buildPokemonStorageJson(jsonData, gameMaster);
        setPokemonStorage(pokemonStorage);
        // Save to localStorage
        //throw new Error(`Failed to save to localStorage`);
      };
      reader.onerror = (e: ProgressEvent<FileReader>) => {
        console.error('Error reading file:', e.target?.error);
        throw new Error('Error reading file.');
      };
      reader.readAsText(file);
    }
  };

  return (
    <>
      <label htmlFor="file-upload">
        <DashboardSidebarPageItem item={item} LinkComponent={'div'} />
      </label>
      <input
        id="file-upload"
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </>
  );
};

export default PokemonStorageUploader;
