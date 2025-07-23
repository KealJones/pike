export interface ProEntry {
  mon_isshiny?: "YES" | "NO";
  mon_islucky?: "YES" | "NO";
  mon_weight?: number;
  mon_move_1?: string;
  mon_height?: number;
  mon_gender?: "MALE" | "FEMALE" | string;
  mon_stamina?: number;
  mon_attack?: number;
  mon_name?: string;
  mon_move_2?: string;
  mon_move_3?: string;
  mon_cp?: number;
  mon_number?: number;
  mon_defence?: number;
  mon_weather_boost?: string;
  mon_form?: string;
  mon_alignment?: "SHADOW" | "PURIFIED" | string;
}

export interface PokeGenieEntry {
  Index?: string;
  Name?: string;
  Form?: string;
  "Pokemon Number"?: string;
  Gender?: "♂" | "♀" | string;
  CP?: string;
  HP?: string;
  "Atk IV"?: string;
  "Def IV"?: string;
  "Sta IV"?: string;
  "IV Avg"?: number | string;
  "Level Min"?: string;
  "Level Max"?: string;
  "Quick Move"?: string;
  "Charge Move"?: string;
  "Charge Move 2"?: string;
  "Scan Date"?: string;
  "Original Scan Date"?: string;
  "Catch Date"?: string;
  Weight?: number | string;
  Height?: number | string;
  Lucky?: string;
  "Shadow/Purified"?: string;
  Favorite?: string;
  Dust?: string;
  "Rank % (G)"?: string;
  "Rank # (G)"?: string;
  "Stat Prod (G)"?: string;
  "Dust Cost (G)"?: string;
  "Candy Cost (G)"?: string;
  "Name (G)"?: string;
  "Form (G)"?: string;
  "Sha/Pur (G)"?: string;
  "Rank % (U)"?: string;
  "Rank # (U)"?: string;
  "Stat Prod (U)"?: string;
  "Dust Cost (U)"?: string;
  "Candy Cost (U)"?: string;
  "Name (U)"?: string;
  "Form (U)"?: string;
  "Sha/Pur (U)"?: string;
  "Rank % (L)"?: string;
  "Rank # (L)"?: string;
  "Stat Prod (L)"?: string;
  "Dust Cost (L)"?: number | string;
  "Candy Cost (L)"?: number | string;
  "Name (L)"?: string;
  "Form (L)"?: string;
  "Sha/Pur (L)"?: number | string;
  "Marked for PvP use"?: string;
}

export interface UniquePokemonDetails {
  /**
   *  This is the unique ID for the species as it includes the "form" (e.g., "meowth" or "meowth_galarian" or "meowth_shadow" or "meowth_shadow_galarian")
   */
  speciesId: string;
  shiny: boolean;
  lucky: boolean;
  alignment?: 'shadow' | 'purified';
  form?: string;
  moves: {
    fast?: string;
    charged?: (string | undefined)[];
  };
  stats: {
    ivs: {
      attack: number;
      defense: number;
      stamina: number;
    };
    battle: {
      attack: number;
      defense: number;
      stamina: number;
    };
    cp?: number;
  };
}

export type GameMasterPromise = Promise<GameMasterFile>;
export type GameMasterFile = { pokemon: GamemasterPokemonEntry[], [key: string]: unknown };

export interface GamemasterPokemonEntry {
  dex: number;
  speciesName: string;
  speciesId: string;
  baseStats: {
    atk: number;
    def: number;
    hp: number;
  };
  types: [string, string];
  fastMoves: string[];
  chargedMoves: string[];
  defaultIVs: {
    cp500: [number, number, number, number];
    cp1500: [number, number, number, number];
    cp2500: [number, number, number, number];
    // Add more if present
  };
  buddyDistance: number;
  thirdMoveCost: number;
  released: boolean;
  family: {
    id: string;
    evolutions?: string[];
    parent?: string;
  };
  tags?: string[];
  level25CP?: number;
  searchPriority?: number;
  eliteMoves?: string[];
}

export interface Pokemon extends UniquePokemonDetails {
  //////////////
  //  Properties that are not unique but standard for this Pokemon species
  //////////////

  /**
   * The name of the species, e.g., "Meowth" or "Meowth (Galarian)"
   *
   * aka `speciesName` in the gamemaster
   */
  name: string;

  /**
   *  This is the unique ID for the species as it includes the "form" (e.g., "meowth" or "meowth_galarian" or "meowth_shadow" or "meowth_shadow_galarian")
   */
  speciesId: string;

  /**
   * This is not a unique ID, because different forms of the same species have the same dex id (e.g., "meowth" is 52 and "meowth_galarian" is also 52)
   **/
  dex: number;


  baseStats: {
    attack: number;
    defense: number;
    stamina: number;
  };
  /**
   * The typing of the pokemon.
   *
   * "none" means there is no secondary type it is only a single type.
   */
  types: [string, string];
  movePool: {
    fast: string[];
    charged: string[];
    elite?: string[];
  };
  searchPriority?: number;
  buddyDistance: number;
  thirdMoveCost: number;
  released: boolean;
  family: {
    id: string;
    evolutions?: string[];
    /**
     * `parent` is the `speciesId` of the pokemon this evolves from.
     */
    parent?: string;
    allParentSpeciesIds: string[];
  };
  /**
   * Includes regional form, e.g., "galarian" or "alolan"
   * Can also include:
   * - "shadow" or "shadoweligible" if the species has a shadow form too
   * - "mega"
   */
  tags?: string[];
  rank?: {
    index?: number;
    percentile?: number;
    score?: number; // This is the score of the pokemon in the rank, e.g
  };
  rankTarget?: Ranking1500Target;
}

export type Rankings1500Matchup = {
  opponent?: string;
  rating?: number;
  opRating?: number;
};

export type Rankings1500Stats = {
  product: number;
  atk: number;
  def: number;
  hp: number;
};

export type Rankings1500Moves = {
  fastMoves: string[];
  chargedMoves: string[];
};

export type Ranking1500Target = {
  speciesId: string;
  speciesName: string;
  rating: number;
  matchups: Rankings1500Matchup[];
  counters: Rankings1500Matchup[];
  moves: Rankings1500Moves;
  moveset: string[];
  score: number;
  scores: number[];
  stats: Rankings1500Stats;
  position: number;
};
