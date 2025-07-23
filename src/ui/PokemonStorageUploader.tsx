'use client';

import { useState, type ChangeEvent, use } from 'react';
import { buildPokemonStorageJson } from '../utils/buildPokemonStorageJson';
import type { GameMasterPromise, Pokemon } from '../types/pokemon.types';
import { Typography } from '@mui/material';
import { csvToJson } from '../utils/csvToJson';

export const PokemonStorageUploader: React.FC<{ gameMasterPromise: GameMasterPromise, setPokemonStorage: (pokemonStorage: Pokemon[]) => void }> = ({ gameMasterPromise, setPokemonStorage }) => {
  const [status, setStatus] = useState<string | null>(null);
  const gameMaster = use(gameMasterPromise);

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
        let type = '';
        // Try to parse as JSON
        try {
          jsonData = JSON.parse(content);
          type = 'json';
        } catch {
          // If not JSON, try CSV
          try {
            jsonData = csvToJson(content);
            type = 'csv';
          } catch {
            setStatus('File format not recognized or invalid.');
            return;
          }
        }
        const pokemonStorage = buildPokemonStorageJson(jsonData, gameMaster);
        setPokemonStorage(pokemonStorage);
        // Save to localStorage
        try {
          //localStorage.setItem('pokemon-storage', JSON.stringify(pokemonStorage));
          setStatus(
            type === 'json' ? 'Saved to localStorage.' : 'Saved to localStorage.'
          );
        } catch (err) {
          setStatus(`Failed to save to localStorage. ${JSON.stringify(err)}`);
        }
      };
      reader.onerror = (e: ProgressEvent<FileReader>) => {
        console.error('Error reading file:', e.target?.error);
        setStatus('Error reading file.');
      };
      reader.readAsText(file);
    } else {
      setStatus(null);
    }
  };

  return (
    <div>
      {status && <Typography variant='subtitle1' color="error">{status}</Typography>}
      <input type="file" onChange={handleFileChange} />
    </div>
  );
};

export default PokemonStorageUploader;
