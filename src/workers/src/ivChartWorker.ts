import { get, set, setMany } from 'idb-keyval';
import type {
  BuildIvChartsRequest,
  BuildIvChartsResponse,
  EventBase,
} from '../../types/workers.types';
import { generateDigest } from '../../utils/generateDigest';
import { leagueCpCaps } from '../../utils/leagues';
import { buildIvChart } from '../../utils/rank-calculator';

class WorkerThreadController {
  worker: Window & typeof globalThis;
  actionHandlerMap: {};
  constructor() {
    this.worker = self;
    this.actionHandlerMap = {};
    this.worker.onmessage = this.onmessage.bind(this);
  }
  async onmessage(e: MessageEvent<EventBase>) {
    const { name } = e.data;
    switch (name) {
      case 'buildIvCharts':
        onBuildIvChartsEvent(e.data as BuildIvChartsRequest);
        break;
      default:
        break;
    }
  }
}
// @ts-expect-error its fine
const _workerThreadController = new WorkerThreadController();

async function onBuildIvChartsEvent(e: BuildIvChartsRequest) {
  console.log('IV Chart Worker received event:', e);
  const { id, pokemon } = e;
  const pokemonDigest = await get('pokemonDigest');
  const newPokemonDigest = await generateDigest(JSON.stringify(pokemon));

  if (pokemonDigest == null || pokemonDigest !== newPokemonDigest) {
    const rankIvCharts = Array.isArray(pokemon)
      ? pokemon.flatMap((p) =>
          leagueCpCaps.map(
            (leagueCp) =>
              [
                `${leagueCp}-${p.speciesId}`,
                buildIvChart({
                  maxCP: leagueCp,
                  maxLevel: 51,
                  pokedexEntry: {
                    number: p.dex.toString(),
                    name: p.speciesName,
                    baseAttack: p.baseStats.atk,
                    baseDefense: p.baseStats.def,
                    baseHealth: p.baseStats.hp,
                    family: p?.family?.id,
                  },
                }),
              ] as [IDBValidKey, any],
          ),
        )
      : [];
    setMany(rankIvCharts).then(async () => {
      await set('pokemonDigest', newPokemonDigest);
      self.postMessage({
        id,
        name: e.name,
        response: {
          status: 'success',
        },
      } satisfies BuildIvChartsResponse);
    });
  } else {
    // Send the result back to the main thread
    self.postMessage({
      id,
      name: e.name,
      response: {
        status: 'not modified',
        details: { message: 'The `pokemonDigest` is unchanged.' },
      },
    } satisfies BuildIvChartsResponse);
  }
}
