import { PokemonStorageUploader } from '../ui/PokemonStorageUploader';
import { PotentialPokemon } from '../ui/PotentialPokemon';
import { useAppStore, usePokemonStorage } from '../AppStore';
import { Suspense } from 'react';

// const gameMasterPromise: Promise<GameMasterFile> = fetch(
//   'https://raw.githubusercontent.com/pvpoke/pvpoke/refs/heads/master/src/data/gamemaster.min.json'
// ).then((response) => response.json());
// const rankings1500Promise: Promise<Ranking1500Target[]> = fetch(
//   'https://raw.githubusercontent.com/pvpoke/pvpoke/refs/heads/master/src/data/rankings/gobattleleague/overall/rankings-1500.json'
// ).then((response) => response.json())

export default function AnalysisPage() {
  const pokemonStorage = usePokemonStorage((state) => state.pokemonStorage);
  const setPokemonStorage = usePokemonStorage((state) => state.updatePokemonStorage);
  const gameMasterPromise = useAppStore((state) => state.gameMasterPromise);
  const ranking1500Promise = useAppStore((state) => state.ranking1500Promise);

  return (<>
      <main>
        <Suspense fallback={<div>Loading Uploader...</div>}>
          <PokemonStorageUploader
            gameMasterPromise={gameMasterPromise}
            setPokemonStorage={setPokemonStorage}
          />
          </Suspense>
          <Suspense fallback={<div>Loading Rankings, GameMaster, and Storage data...</div>}>
          <PotentialPokemon
            filterRank={80}
            maxCp={1500}
            pokemonStorage={pokemonStorage}
            gameMasterPromise={gameMasterPromise}
            rankings1500Promise={ranking1500Promise}
          />
        </Suspense>
      </main>
      <footer></footer>
      </>
  );
}
