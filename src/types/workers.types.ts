import type { GameMasterFile } from './pokemon.types';
export type BuildIvChartsStatus = 'not modified' | 'success' | 'failure';

export interface EventBase {
  id: string;
  name: string;
}

export interface BuildIvChartsEventBase extends EventBase {
  name: 'buildIvCharts';
}

export interface BuildIvChartsRequest extends BuildIvChartsEventBase {
  pokemon: GameMasterFile['pokemon'];
}

export interface BuildIvChartsResponse extends BuildIvChartsEventBase {
  response: {
    status: BuildIvChartsStatus;
    details?: Record<string, any>;
  };
}
