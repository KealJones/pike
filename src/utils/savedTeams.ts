import type { BattlePokemon } from '../types/battle.types';

export interface SavedTeam {
  id: string;
  name: string;
  pokemon: Array<{
    speciesId: string;
    speciesName: string;
    cp: number;
    level: number;
    ivs: { attack: number; defense: number; hp: number };
    fastMove: { moveId: string; name: string };
    chargedMoves: Array<{ moveId: string; name: string }>;
  }>;
  createdAt: string;
}

const STORAGE_KEY = 'pike-saved-teams';

export function getSavedTeams(): SavedTeam[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading saved teams:', error);
    return [];
  }
}

export function saveTeam(name: string, pokemon: BattlePokemon[]): SavedTeam {
  const teams = getSavedTeams();
  
  const savedTeam: SavedTeam = {
    id: `team-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    createdAt: new Date().toISOString(),
    pokemon: pokemon.map((p) => ({
      speciesId: p.speciesId,
      speciesName: p.speciesName,
      cp: p.cp,
      level: p.level,
      ivs: { attack: p.ivs.atk, defense: p.ivs.def, hp: p.ivs.hp },
      fastMove: { moveId: p.fastMove.moveId, name: p.fastMove.name },
      chargedMoves: p.chargedMoves
        .filter((m) => m !== null)
        .map((m) => ({ moveId: m.moveId, name: m.name })),
    })),
  };

  teams.push(savedTeam);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
  
  return savedTeam;
}

export function deleteTeam(teamId: string): void {
  const teams = getSavedTeams().filter((t) => t.id !== teamId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
}

export function updateTeamName(teamId: string, newName: string): void {
  const teams = getSavedTeams();
  const team = teams.find((t) => t.id === teamId);
  if (team) {
    team.name = newName;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
  }
}
