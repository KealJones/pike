'use client';

import { useState, useEffect, type ChangeEvent, use } from 'react';
import { buildPokemonStorageJson } from '../utils/buildPokemonStorageJson';
import type { GameMasterPromise, Pokemon } from '../types/pokemon.types';

export const PokemonStorageSource: React.FC<{ gameMasterPromise: GameMasterPromise, setPokemonStorage: (pokemonStorage: Pokemon[]) => void }> = ({ gameMasterPromise, setPokemonStorage }) => {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const gameMaster = use(gameMasterPromise);

  useEffect(() => {
    // This code runs only on the client-side
    const savedStorage = localStorage.getItem('pokemon-storage');
    if (savedStorage) {
      setFileContent(savedStorage);
      setPokemonStorage(JSON.parse(savedStorage));
    }
  }, [setPokemonStorage]);
  // Simple CSV to JSON converter
  const csvToJson = (csv: string) => {
    const lines = csv.split(/\r?\n/).filter((line) => line.trim() !== '');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map((h) => h.trim());
    return lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim());
      const obj: Record<string, string> = {};
      headers.forEach((header, i) => {
        obj[header] = values[i] || '';
      });
      return obj;
    });
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
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
        setFileContent(JSON.stringify(buildPokemonStorageJson(jsonData, gameMaster), null, 2));
        setPokemonStorage(buildPokemonStorageJson(jsonData, gameMaster));
        // Save to localStorage
        try {
          localStorage.setItem('pokemon-storage', JSON.stringify(buildPokemonStorageJson(jsonData, gameMaster)));
          setPokemonStorage(buildPokemonStorageJson(jsonData, gameMaster));
          setStatus(
            type === 'json' ? 'JSON saved to localStorage.' : 'CSV converted to JSON and saved to localStorage.'
          );
        } catch (err) {
          setStatus(`Failed to save to localStorage. ${JSON.stringify(err)}`);
        }
      };
      reader.onerror = (e: ProgressEvent<FileReader>) => {
        console.error('Error reading file:', e.target?.error);
        setFileContent(null);
        setPokemonStorage([]);
        setStatus('Error reading file.');
      };
      reader.readAsText(file);
    } else {
      setPokemonStorage([]);
      setFileContent(null);
      setFileName(null);
      setStatus(null);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      {fileName && <p>Selected File: {fileName}</p>}
      {status && <p>{status}</p>}
      {fileContent && (
        <div>
          <h3>File Content:</h3>
          <pre style={{ maxHeight: '300px', overflow: 'auto' }}>{fileContent}</pre>
        </div>
      )}
    </div>
  );
};

export default PokemonStorageSource;
