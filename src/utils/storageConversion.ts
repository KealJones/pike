import type {
  GameMasterFile,
  PokeGenieEntry,
  ProEntry,
} from '../types/pokemon.types';

// These templates match the final output shape, and all transforms are handled inside
export const proTemplate = {
  name: (e: ProEntry) => e.mon_name ?? '',
  shiny: (e: ProEntry) => e.mon_isshiny === 'YES',
  lucky: (e: ProEntry) => e.mon_islucky === 'YES',
  alignment: (e: ProEntry) => standardizeAlignment(e.mon_alignment),
  form: (e: ProEntry) => {
    const arr = e.mon_form?.split('_');
    arr?.shift();
    return standardizeForm(e.mon_name ?? '', arr?.join('_') ?? '');
  },
  moves: (e: ProEntry) => ({
    fast: standardizeMove(e.mon_move_1),
    charged: [standardizeMove(e.mon_move_2), standardizeMove(e.mon_move_3)],
  }),
  stats: (e: ProEntry) => ({
    ivs: {
      attack: e.mon_attack ?? 0,
      defense: e.mon_defence ?? 0,
      stamina: e.mon_stamina ?? 0,
    },
    battle: {
      attack: 0,
      defense: 0,
      stamina: 0,
    },
    cp: e.mon_cp ?? 0,
  }),
};

export const genieTemplate = {
  name: (e: PokeGenieEntry) => e.Name ?? '',
  shiny: (_: PokeGenieEntry) => false,
  lucky: (e: PokeGenieEntry) => e.Lucky === '1',
  alignment: (e: PokeGenieEntry) => standardizeAlignment(e['Shadow/Purified']),
  form: (e: PokeGenieEntry) => standardizeForm(e.Name ?? '', e.Form ?? ''),
  moves: (e: PokeGenieEntry) => ({
    fast: standardizeMove(e['Quick Move']),
    charged: [
      standardizeMove(e['Charge Move']),
      standardizeMove(e['Charge Move 2']),
    ],
  }),
  stats: (e: PokeGenieEntry) => {
    console.log(e['Atk IV']);

    return {
      ivs: {
        attack: parseInt(e['Atk IV'] ?? '0'),
        defense: parseInt(e['Def IV'] ?? '0'),
        stamina: parseInt(e['Sta IV'] ?? '0'),
      },
      battle: {
        attack: 0,
        defense: 0,
        stamina: 0,
      },
      cp: parseInt(e.CP ?? '0'),
    };
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isProEntry(entry: any): entry is ProEntry {
  return Object.keys(entry)[0]?.startsWith('mon_') ?? false;
}

/**
 * the form in poke genie is in one format (e.g., "galar") but in the gamemaster is in another format (e.g., "galarian").
 */
const formRewriteMap: { [key: string]: string } = {
  alola: 'alolan',
  galar: 'galarian',
  hisui: 'hisuian',
  paldea: 'paldean',
};

export function standardizeForm(
  name: string,
  form: string,
): undefined | string {
  // Remove the name prefix from the form in pro entries
  const formClean = form.replace(`${name.toLocaleUpperCase()}_`, '');
  if (
    (name.toLocaleLowerCase() == 'zamazenta' ||
      name.toLocaleLowerCase() == 'zacian') &&
    (formClean.toLocaleLowerCase() == 'sword' ||
      formClean.toLocaleLowerCase() == 'shield')
  )
    return `crowned_${formClean}`;
  // Special case for Burmy without form (usually happens cause of poke genie not capturing the context)
  if (name.toLocaleUpperCase() == 'BURMY' && formClean == '') return 'plant';
  // Special case for Oricorio Pom-Pom form because it comes through as "POMPOM" from pro but is referred to as "pom-pom" in the gamemaster.
  if (name.toLocaleUpperCase() == 'ORICORIO' && formClean == 'POMPOM')
    return 'pom-pom';
  // rewrite certain forms to the gamemaster form
  const formLower =
    formRewriteMap[formClean.toLowerCase()] ?? formClean.toLowerCase();
  // Exclude "normal" form as it is not a "form" in the gamemaster.
  if (formLower == '' || formLower == 'normal') return undefined;
  // Return standardized form
  return formLower;
}

/**
 * converts string to a `moveId` format
 * e.g., "VINE_WHIP_FAST" -> "VINE_WHIP"
 */
export function standardizeMove(move: string | undefined): string | undefined {
  if (!move) return undefined;
  // Capitalize, Remove the "FAST" suffix, and replace spaces with underscores.
  return move
    ?.toLocaleUpperCase()
    ?.replace(/_FAST$/, '')
    ?.replace(/ /g, '_');
}

/**
 * converts alignment from poke genie or string to a standard format
 * e.g., "1" -> "shadow", "2" -> "purified" -> "SHADOW" -> "shadow"
 */
export function standardizeAlignment(
  alignment?: string,
): 'shadow' | 'purified' | undefined {
  if (alignment == null) return undefined;
  // Alignment is a string of a number in Poke Genie, 0 = none, 1 = shadow, 2 = purified.
  const alignmentLookup: (undefined | 'shadow' | 'purified')[] = [
    undefined,
    'shadow',
    'purified',
  ];
  const alignmentNumber = parseInt(alignment);
  if (!isNaN(alignmentNumber)) {
    return alignmentLookup[alignmentNumber];
  } else {
    // If it is not a number, we assume it is a string in which case it most likely comes from pro and return it as lowercase.
    return alignment.toLowerCase() as 'shadow' | 'purified';
  }
}

/**
 * Neither Poke Genie nor Pro have a direct `speciesId` that can be used to lookup in the gamemaster. So we create one based on the template {NAME}[_{ALIGNMENT}]_{FORM} and fallback to just `name` if the `possibleId` isn't found.
 */
export function createSpeciesId(
  name: string,
  alignment: string | undefined,
  form: string | undefined,
  gameMaster: { pokemon: GameMasterFile['pokemon']; [key: string]: unknown },
): string {
  // create a list of all speciesIds in the gamemaster
  const gameMasterSpeciesIds = Array.isArray(gameMaster.pokemon)
    ? gameMaster.pokemon.map((p) => p.speciesId)
    : Object.keys(gameMaster.pokemon);
  if (gameMasterSpeciesIds.includes([name, form, alignment].join('_'))) {
    return [name, form, alignment].join('_');
  }

  if (name == 'giratina_altered_shadow_b') {
    form = 'altered';
    alignment = 'shadow';
  }

  if (name.toLowerCase() == 'morpeko' && form != 'full_belly') {
    form = 'full_belly';
  }

  const possibleId = [
    name
      .replace(/-/g, '_')
      .replace(' ', '_')
      .replace(/clodsiresb/i, 'clodsire')
      .replace(/[^a-zA-Z0-9_]/g, ''),
    form?.replace(/-/g, '_'),
    alignment,
  ]
    .filter(Boolean)
    .join('_')
    .toLowerCase();

  // Check if the possibleId is in the gamemaster
  if (gameMasterSpeciesIds.includes(possibleId)) {
    return possibleId;
  } else if (gameMasterSpeciesIds.includes(name.toLowerCase())) {
    // If the `possibleId` didnt match but the name matches a speciesId in the gamemaster, we use that as the speciesId instead (close enough?).
    return name.toLowerCase();
  }
  // If neither match, we throw an error. Thats too much of a mismatch.
  throw new Error(
    `No gamemaster data found for speciesId: ${possibleId} or ${name.toLowerCase()}`,
  );
}
