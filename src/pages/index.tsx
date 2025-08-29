import { Stack } from '@mui/material';
import { Suspense } from 'react';
import { usePokemonStorage } from '../AppStore';
import { PotentialPokemon } from '../ui/PotentialPokemon';

export default function AnalysisPage() {
  const pokemonStorage = usePokemonStorage((state) => state.pokemonStorage);

  return (
    <Stack component="main" height="100%">
      <Suspense
        fallback={<div>Loading Rankings, GameMaster, and Storage data...</div>}
      >
        <PotentialPokemon pokemonStorage={pokemonStorage} />
      </Suspense>
    </Stack>
  );
}
