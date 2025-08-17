import { Stack } from '@mui/material';
import { Suspense } from 'react';
import { useAppStore, usePokemonStorage } from '../AppStore';
import { PotentialPokemon } from '../ui/PotentialPokemon';

export default function AnalysisPage() {
  const pokemonStorage = usePokemonStorage((state) => state.pokemonStorage);
  const gameMasterPromise = useAppStore((state) => state.gameMasterPromise);
  const ranking1500Promise = useAppStore((state) => state.rankingGreatPromise);
  const ranking2500Promise = useAppStore((state) => state.rankingUltraPromise);
  const ranking50000Promise = useAppStore(
    (state) => state.rankingMasterPromise,
  );

  return (
    <Stack component="main">
      <Suspense
        fallback={<div>Loading Rankings, GameMaster, and Storage data...</div>}
      >
        <PotentialPokemon
          pokemonStorage={pokemonStorage}
          gameMasterPromise={gameMasterPromise}
          rankings1500Promise={ranking1500Promise}
          rankings2500Promise={ranking2500Promise}
          rankings50000Promise={ranking50000Promise}
        />
      </Suspense>
    </Stack>
  );
}
