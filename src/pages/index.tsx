import { Stack } from '@mui/material';
import { Suspense } from 'react';
import { PotentialPokemon } from '../ui/PotentialPokemon';

export default function AnalysisPage() {
  return (
    <Stack component="main" height="100%">
      <Suspense fallback={<div>Loading...</div>}>
        <PotentialPokemon />
      </Suspense>
    </Stack>
  );
}
