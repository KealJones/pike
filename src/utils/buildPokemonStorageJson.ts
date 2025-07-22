import type { ProEntry, PokeGenieEntry, Pokemon, GamemasterPokemonEntry, GameMasterFile } from "../types/pokemon.types";
import { getPokemonGamemasterData } from "./gamemaster";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isProEntry(entry: any): entry is ProEntry {
  return Object.keys(entry)[0]?.startsWith('mon_') ?? false;
}

/**
 * the form in poke genie is in one format (e.g., "galar") but in the gamemaster is in another format (e.g., "galarian").
 */
const formRewriteMap: { [key: string]: string } = {
  'alola': 'alolan',
  'galar': 'galarian',
  'hisui': 'hisuian',
  'paldea': 'paldean',
};

function standardizeForm(name: string, form: string): undefined | string {
  // Remove the name prefix from the form in pro entries
  const formClean = form.replace(`${name.toLocaleUpperCase()}_`, '');
  // Special case for Burmy without form (usually happens cause of poke genie not capturing the context)
  if (name.toLocaleUpperCase() == 'BURMY' && formClean == '') return 'plant';
  // Special case for Oricorio Pom-Pom form because it comes through as "POMPOM" from pro but is referred to as "pom-pom" in the gamemaster.
  if (name.toLocaleUpperCase() == 'ORICORIO' && formClean == 'POMPOM') return 'pom-pom';
  // rewrite certain forms to the gamemaster form
  const formLower = formRewriteMap[formClean.toLowerCase()] ?? formClean.toLowerCase()
  // Exclude "normal" form as it is not a "form" in the gamemaster.
  if (formLower == '' || formLower == 'normal') return undefined;
  // Return standardized form
  return formLower;
}

/**
 * converts string to a `moveId` format
 * e.g., "VINE_WHIP_FAST" -> "VINE_WHIP"
 */
function standardizeMove(move: string | undefined): string | undefined {
  if (!move) return undefined;
  // Capitalize, Remove the "FAST" suffix, and replace spaces with underscores.
  return move?.toLocaleUpperCase()?.replace(/_FAST$/, '')?.replace(/ /g, '_');
}


/**
 * converts alignment to a standard format
 * e.g., "1" -> "shadow", "SHADOW" -> "shadow"
 */
function standardizeAlignment(alignment?: string): 'shadow' | 'purified' | undefined {
  if (alignment == null) return undefined;
  // Alignment is a string of a number in Poke Genie, 0 = none, 1 = shadow, 2 = purified.
  const alignmentLookup: (undefined | 'shadow' | 'purified')[] = [undefined, 'shadow', 'purified'];
  try {
    return alignmentLookup[parseInt(alignment)];
  } catch {
    // If it is not a number, we assume it is a string in which case it most likely comes from pro and return it as lowercase.
    return alignment.toLowerCase() as 'shadow' | 'purified';
  }
}

/**
 * Neither Poke Genie nor Pro have a direct `speciesId` that can be used to lookup in the gamemaster. So we create one based on the template {NAME}_[{ALIGNMENT}_]{FORM} and fallback to just `name` if the `possibleId` isn't found.
 */
function createSpeciesId(name: string, alignment: string | undefined, form: string | undefined, gameMaster: { pokemon: GamemasterPokemonEntry[], [key: string]: unknown }): string {
  const possibleId = [name.replace(/-/g, '_').replace(/[^a-zA-Z0-9_]/g, ''), alignment, form?.replace(/-/g, '_')].filter(Boolean).join('_').toLowerCase();
  // create a list of all speciesIds in the gamemaster
  const gameMasterSpeciesIds = gameMaster.pokemon.map((p)=>p.speciesId);
  // Check if the possibleId is in the gamemaster
  if (gameMasterSpeciesIds.includes(possibleId)) {
    return possibleId;
  } else if (gameMasterSpeciesIds.includes(name.toLowerCase())) {
    // If the `possibleId` didnt match but the name matches a speciesId in the gamemaster, we use that as the speciesId instead (close enough?).
    return name.toLowerCase();
  }
  // If neither match, we throw an error. Thats too much of a mismatch.
  throw new Error(`No gamemaster data found for speciesId: ${possibleId} or ${name.toLowerCase()}`);
}

/**
 * Standardizes the Pokemon storage input into a consistent format.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildPokemonStorageJson(input: any, gameMaster: GameMasterFile): Pokemon[] {
  return (Array.isArray(input) ? input : Object.values(input)).map((entry: ProEntry | PokeGenieEntry) => {
    const isPro = isProEntry(entry);
    let proFormClean: string | undefined = undefined;
    if (isPro) {
      const proFormArray = entry.mon_form?.split('_');
      proFormArray?.shift();
      proFormClean = proFormArray?.join('_');
    }

    const form = standardizeForm(isPro ? entry.mon_name ?? '': entry.Name ?? '', isPro ? proFormClean ?? '' : entry.Form ?? '');
    const alignment = standardizeAlignment(isPro ? entry.mon_alignment : entry['Shadow/Purified']);
    const speciesId = createSpeciesId(isPro ? entry.mon_name ?? '' : entry.Name ?? '', alignment, form, gameMaster);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {fastMoves, chargedMoves, eliteMoves, baseStats, defaultIVs: _, family, ...gamemasterData} = getPokemonGamemasterData(speciesId, gameMaster);

    const parentSpeciesIds: string[] = [gamemasterData.speciesId];
    let parentSpeciesId = family?.parent;

    while (parentSpeciesId) {
      const parentEntry = getPokemonGamemasterData(parentSpeciesId, gameMaster);
      if (!parentEntry) break;
      parentSpeciesIds.push(parentEntry.speciesId);
      parentSpeciesId = parentEntry.family?.parent;
    }

    return {
      ...gamemasterData,
      name: gamemasterData.speciesName ?? speciesId.split('_').map((part, index) => `${(index == 0 ? '' : '(') + part.charAt(0).toUpperCase() + part.slice(1) + (index == 0 ? '' : ')')}`).join(' '),
      speciesId,
      shiny: isPro ? entry.mon_isshiny == "YES" : false,
      lucky: isPro ? entry.mon_islucky == "YES" : entry.Lucky === "1",
      alignment,
      form,
      possibleMoves: {
        fast: fastMoves,
        charged: chargedMoves,
        elite: eliteMoves,
      },
      moves: {
        fast: standardizeMove(isPro ? entry.mon_move_1 : entry['Quick Move']),
        charged: [
          standardizeMove(isPro ? entry.mon_move_2 : entry['Charge Move']),
          standardizeMove(isPro ? entry.mon_move_3 : entry['Charge Move 2'])
        ]
      },
      stats: {
        ivs: {
          attack: isPro ? entry.mon_attack ?? 0 : parseInt(entry['Atk IV'] ?? '0'),
          defense: isPro ? entry.mon_defence ?? 0 : parseInt(entry['Def IV'] ?? '0'),
          stamina: isPro ? entry.mon_stamina ?? 0 : parseInt(entry['Sta IV'] ?? '0'),
        },
        battle: {
          attack: 0,
          defense: 0,
          stamina: 0,
        },
        cp: isPro ? entry.mon_cp : parseInt(entry.CP ?? '0'),
      },
      baseStats: {
        attack: baseStats.atk,
        defense: baseStats.def,
        stamina: baseStats.hp,
      },
      family: {
        ...family,
        allParentSpeciesIds: parentSpeciesIds,
      }
    };
  });
}
