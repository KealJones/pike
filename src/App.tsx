import './App.css';
import { Box, Typography } from '@mui/material';
import { Suspense, useCallback, useState } from 'react';
import PokemonStorageSource from './ui/PokemonStorageSource';
import { PotentialPokemon } from './ui/PotentialPokemon';
import type { GameMasterFile, Pokemon, Ranking1500Target } from './types/pokemon.types';
// import PokemonStorageSource from './ui/PokemonStorageSource';
// import { PotentialPokemon } from './ui/PotentialPokemon';
  const gameMasterPromise: Promise<GameMasterFile> = fetch(
    'https://raw.githubusercontent.com/pvpoke/pvpoke/refs/heads/master/src/data/gamemaster.min.json'
  ).then((response) => response.json());
  const rankings1500Promise: Promise<Ranking1500Target[]> = fetch(
    'https://raw.githubusercontent.com/pvpoke/pvpoke/refs/heads/master/src/data/rankings/gobattleleague/overall/rankings-1500.json'
  ).then((response) => response.json());

function App() {
  const [appState, setAppState] = useState<{ pokemonStorage: Pokemon[] }>({ pokemonStorage: [] });
  const setPokemonStorage = useCallback((pokemonStorage: Pokemon[]) => {
    setAppState((prevState) => ({ ...prevState, pokemonStorage }));
  }, []);
  return (
    <div>
      <main>

          <Box
            sx={{
              my: 4,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
              Pokemon Storage PvP Checker
            </Typography>
          </Box>

        <Suspense fallback={<div>Loading...</div>}>
          <PokemonStorageSource gameMasterPromise={gameMasterPromise} setPokemonStorage={setPokemonStorage} />
          <PotentialPokemon
            filterRank={80}
            maxCp={1500}
            pokemonStorage={appState.pokemonStorage}
            gameMasterPromise={gameMasterPromise}
            rankings1500Promise={rankings1500Promise}
          />
        </Suspense>

      </main>
      <footer></footer>
    </div>
  );
}

export default App;
