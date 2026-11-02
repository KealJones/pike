/**
 * TeamBuilder - Interface for building battle teams
 */

import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Autocomplete,
  TextField,
  MenuItem,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ButtonGroup,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import type { GameMasterPokemon, GameMasterMove, BattleTeam, BattlePokemon } from '../../types/battle.types';
import type { RankingTarget } from '../../types/pokemon.types';
import { createBattlePokemon } from '../../utils/pvp/battleHelpers';
import { buildRank } from '../../utils/rank-calculator';
import { saveTeam, type SavedTeam } from '../../utils/savedTeams';
import { SavedTeamsDialog } from './SavedTeamsDialog';

interface TeamBuilderProps {
  allPokemon: GameMasterPokemon[];
  allMoves: Record<string, GameMasterMove>;
  rankings: RankingTarget[];
  onTeamReady: (team: BattleTeam) => void;
  teamLabel: string;
  cpLimit?: number | null;
}

interface PokemonSelection {
  species: GameMasterPokemon | null;
  level: number;
  ivs: { atk: number; def: number; hp: number };
  fastMoveId: string;
  chargedMove1Id: string;
  chargedMove2Id: string;
}

const DEFAULT_SELECTION: PokemonSelection = {
  species: null,
  level: 20,
  ivs: { atk: 15, def: 15, hp: 15 },
  fastMoveId: '',
  chargedMove1Id: '',
  chargedMove2Id: '',
};

/**
 * Find optimal IVs and level for a species given CP limit
 */
function findOptimalBuild(
  species: GameMasterPokemon,
  cpLimit: number | null
): { level: number; ivs: { atk: number; def: number; hp: number } } {
  if (!cpLimit) {
    // Master League - use level 50, perfect IVs
    return {
      level: 50,
      ivs: { atk: 15, def: 15, hp: 15 },
    };
  }

  // Build rank for this species at the CP limit
  const pokedexEntry = {
    number: species.dex.toString(),
    name: species.speciesName,
    baseAttack: species.baseStats.atk,
    baseDefense: species.baseStats.def,
    baseHealth: species.baseStats.hp,
    family: species.speciesId,
  };

  try {
    const ranks = buildRank({
      pokedexEntry,
      maxCP: cpLimit,
      maxLevel: 51,
      minimumStatValue: 0,
    });

    if (ranks.length > 0) {
      // Get rank 1 (best stat product)
      const best = ranks[0];
      return {
        level: best.level,
        ivs: {
          atk: best.attackStat,
          def: best.defenseStat,
          hp: best.healthStat,
        },
      };
    }
  } catch (error) {
    console.error('Error finding optimal build:', error);
  }

  // Fallback
  return {
    level: 20,
    ivs: { atk: 0, def: 15, hp: 15 },
  };
}

/**
 * Find optimal moves from rankings data
 */
function findOptimalMoves(
  species: GameMasterPokemon,
  rankings: RankingTarget[],
  allMoves: Record<string, GameMasterMove>
): { fastMoveId: string; chargedMove1Id: string; chargedMove2Id: string } {
  // Find this species in rankings
  const rankingEntry = rankings.find(
    (r) => r.speciesId === species.speciesId || r.speciesName === species.speciesName
  );

  if (rankingEntry?.moveset && rankingEntry.moveset.length > 0) {
    // moveset array format: [fastMove, chargedMove1, chargedMove2?]
    const [fastMoveId, chargedMove1Id, chargedMove2Id] = rankingEntry.moveset;

    return {
      fastMoveId: fastMoveId || species.fastMoves?.[0] || '',
      chargedMove1Id: chargedMove1Id || species.chargedMoves?.[0] || '',
      chargedMove2Id: chargedMove2Id || species.chargedMoves?.[1] || '',
    };
  }

  // Fallback to first available moves
  return {
    fastMoveId: species.fastMoves?.[0] || '',
    chargedMove1Id: species.chargedMoves?.[0] || '',
    chargedMove2Id: species.chargedMoves?.[1] || '',
  };
}

export function TeamBuilder({
  allPokemon,
  allMoves,
  rankings,
  onTeamReady,
  teamLabel,
  cpLimit,
}: TeamBuilderProps) {
  const [slot1, setSlot1] = useState<PokemonSelection>(DEFAULT_SELECTION);
  const [slot2, setSlot2] = useState<PokemonSelection>(DEFAULT_SELECTION);
  const [slot3, setSlot3] = useState<PokemonSelection>(DEFAULT_SELECTION);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [teamName, setTeamName] = useState('');

  // Auto-optimize when species is selected
  const handleSpeciesChange = (
    slot: PokemonSelection,
    setSlot: (slot: PokemonSelection) => void,
    newSpecies: GameMasterPokemon | null
  ) => {
    if (!newSpecies) {
      setSlot({ ...slot, species: newSpecies });
      return;
    }

    setIsOptimizing(true);

    // Small delay to show loading state
    setTimeout(() => {
      const optimal = findOptimalBuild(newSpecies, cpLimit ?? null);
      
      // Get optimal moves from rankings data
      const optimalMoves = findOptimalMoves(newSpecies, rankings, allMoves);

      setSlot({
        species: newSpecies,
        level: optimal.level,
        ivs: optimal.ivs,
        fastMoveId: optimalMoves.fastMoveId,
        chargedMove1Id: optimalMoves.chargedMove1Id,
        chargedMove2Id: optimalMoves.chargedMove2Id,
      });
      
      setIsOptimizing(false);
    }, 100);
  };

  const buildTeamFromSlots = () => {
    if (!slot1.species || !slot2.species || !slot3.species) {
      throw new Error('Please select all 3 Pokémon');
    }

    if (
      !slot1.fastMoveId ||
      !slot1.chargedMove1Id ||
      !slot2.fastMoveId ||
      !slot2.chargedMove1Id ||
      !slot3.fastMoveId ||
      !slot3.chargedMove1Id
    ) {
      throw new Error('Please select moves for all Pokémon');
    }

    const pokemon1 = createBattlePokemon(
      slot1.species,
      slot1.ivs,
      slot1.level,
      allMoves[slot1.fastMoveId],
      allMoves[slot1.chargedMove1Id],
      slot1.chargedMove2Id ? allMoves[slot1.chargedMove2Id] : null
    );

    const pokemon2 = createBattlePokemon(
      slot2.species,
      slot2.ivs,
      slot2.level,
      allMoves[slot2.fastMoveId],
      allMoves[slot2.chargedMove1Id],
      slot2.chargedMove2Id ? allMoves[slot2.chargedMove2Id] : null
    );

    const pokemon3 = createBattlePokemon(
      slot3.species,
      slot3.ivs,
      slot3.level,
      allMoves[slot3.fastMoveId],
      allMoves[slot3.chargedMove1Id],
      slot3.chargedMove2Id ? allMoves[slot3.chargedMove2Id] : null
    );

    return {
      pokemon: [pokemon1, pokemon2, pokemon3] as [BattlePokemon, BattlePokemon, BattlePokemon],
      activePokemonIndex: 0,
    };
  };

  const handleBuildTeam = () => {
    try {
      const team = buildTeamFromSlots();
      onTeamReady(team);
    } catch (error) {
      console.error('Error building team:', error);
      alert(error instanceof Error ? error.message : 'Error building team. Please check your selections.');
    }
  };

  const handleSaveTeam = () => {
    try {
      buildTeamFromSlots();
      setSaveDialogOpen(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Cannot save incomplete team');
    }
  };

  const handleConfirmSave = () => {
    if (!teamName.trim()) {
      alert('Please enter a team name');
      return;
    }

    try {
      const team = buildTeamFromSlots();
      saveTeam(teamName.trim(), team.pokemon);
      setSaveDialogOpen(false);
      setTeamName('');
      alert('Team saved successfully!');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error saving team');
    }
  };

  const handleLoadTeam = (savedTeam: SavedTeam) => {
    const loadSlot = (index: number) => {
      const saved = savedTeam.pokemon[index];
      if (!saved) return;

      const species = allPokemon.find((p) => p.speciesId === saved.speciesId);
      if (!species) return;

      return {
        species,
        level: saved.level,
        ivs: { atk: saved.ivs.attack, def: saved.ivs.defense, hp: saved.ivs.hp },
        fastMoveId: saved.fastMove.moveId,
        chargedMove1Id: saved.chargedMoves[0]?.moveId || '',
        chargedMove2Id: saved.chargedMoves[1]?.moveId || '',
      };
    };

    const loaded1 = loadSlot(0);
    const loaded2 = loadSlot(1);
    const loaded3 = loadSlot(2);

    if (loaded1) setSlot1(loaded1);
    if (loaded2) setSlot2(loaded2);
    if (loaded3) setSlot3(loaded3);
  };

  const renderPokemonSlot = (
    slot: PokemonSelection,
    setSlot: (slot: PokemonSelection) => void,
    slotNumber: number
  ) => {
    const availableFastMoves = slot.species?.fastMoves || [];
    const availableChargedMoves = slot.species?.chargedMoves || [];

    return (
      <Paper sx={{ p: 2, position: 'relative' }}>
        {isOptimizing && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: 'rgba(255, 255, 255, 0.8)',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 1,
            }}
          >
            <CircularProgress />
          </Box>
        )}
        
        <Typography variant="h6" gutterBottom>
          Slot {slotNumber}
        </Typography>

        <Stack spacing={2}>
          {/* Species */}
          <Autocomplete
            options={allPokemon}
            getOptionLabel={(option) => option.speciesName}
            value={slot.species}
            onChange={(_, newValue) => handleSpeciesChange(slot, setSlot, newValue)}
            renderInput={(params) => (
              <TextField 
                {...params} 
                label="Pokémon" 
                helperText={slot.species ? "Auto-optimized IVs, level & moves from rankings" : "Select a Pokémon"}
              />
            )}
          />

          {/* Level */}
          <TextField
            type="number"
            label="Level"
            value={slot.level}
            onChange={(e) => setSlot({ ...slot, level: parseFloat(e.target.value) })}
            inputProps={{ min: 1, max: 51, step: 0.5 }}
            helperText="Auto-optimized for max stat product"
          />

          {/* IVs */}
          <Box>
            <Typography variant="caption" color="text.secondary" gutterBottom display="block">
              IVs (Auto-optimized for league)
            </Typography>
            <Box display="flex" gap={1}>
              <TextField
                type="number"
                label="ATK IV"
                value={slot.ivs.atk}
                onChange={(e) =>
                  setSlot({ ...slot, ivs: { ...slot.ivs, atk: parseInt(e.target.value) } })
                }
                inputProps={{ min: 0, max: 15 }}
                size="small"
              />
              <TextField
                type="number"
                label="DEF IV"
                value={slot.ivs.def}
                onChange={(e) =>
                  setSlot({ ...slot, ivs: { ...slot.ivs, def: parseInt(e.target.value) } })
                }
                inputProps={{ min: 0, max: 15 }}
                size="small"
              />
              <TextField
                type="number"
                label="HP IV"
                value={slot.ivs.hp}
                onChange={(e) =>
                  setSlot({ ...slot, ivs: { ...slot.ivs, hp: parseInt(e.target.value) } })
                }
                inputProps={{ min: 0, max: 15 }}
                size="small"
              />
            </Box>
          </Box>

          {/* Fast Move */}
          <TextField
            select
            label="Fast Move"
            value={slot.fastMoveId}
            onChange={(e) => setSlot({ ...slot, fastMoveId: e.target.value })}
            disabled={!slot.species}
            helperText="Auto-selected from PvP rankings"
          >
            {availableFastMoves.map((moveId) => (
              <MenuItem key={moveId} value={moveId}>
                {allMoves[moveId]?.name || moveId}
              </MenuItem>
            ))}
          </TextField>

          {/* Charged Moves */}
          <TextField
            select
            label="Charged Move 1"
            value={slot.chargedMove1Id}
            onChange={(e) => setSlot({ ...slot, chargedMove1Id: e.target.value })}
            disabled={!slot.species}
            helperText="Auto-selected from PvP rankings"
          >
            {availableChargedMoves.map((moveId) => (
              <MenuItem key={moveId} value={moveId}>
                {allMoves[moveId]?.name || moveId} ({allMoves[moveId]?.energy || 0} energy)
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Charged Move 2 (Optional)"
            value={slot.chargedMove2Id}
            onChange={(e) => setSlot({ ...slot, chargedMove2Id: e.target.value })}
            disabled={!slot.species}
            helperText="Auto-selected from PvP rankings"
          >
            <MenuItem value="">None</MenuItem>
            {availableChargedMoves.map((moveId) => (
              <MenuItem key={moveId} value={moveId}>
                {allMoves[moveId]?.name || moveId} ({allMoves[moveId]?.energy || 0} energy)
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>
    );
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        {teamLabel}
        {cpLimit && (
          <Typography component="span" variant="body2" color="text.secondary" ml={1}>
            (CP Limit: {cpLimit})
          </Typography>
        )}
      </Typography>

      <Stack spacing={2}>
        {renderPokemonSlot(slot1, setSlot1, 1)}
        {renderPokemonSlot(slot2, setSlot2, 2)}
        {renderPokemonSlot(slot3, setSlot3, 3)}

        <ButtonGroup variant="contained" size="large" fullWidth>
          <Button onClick={handleBuildTeam} sx={{ flex: 2 }}>
            Confirm Team
          </Button>
          <Button onClick={handleSaveTeam} startIcon={<SaveIcon />} sx={{ flex: 1 }}>
            Save
          </Button>
          <Button onClick={() => setLoadDialogOpen(true)} startIcon={<FolderOpenIcon />} sx={{ flex: 1 }}>
            Load
          </Button>
        </ButtonGroup>
      </Stack>

      {/* Save Team Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>Save Team</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Team Name"
            fullWidth
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleConfirmSave();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Load Team Dialog */}
      <SavedTeamsDialog
        open={loadDialogOpen}
        onClose={() => setLoadDialogOpen(false)}
        onLoadTeam={handleLoadTeam}
        targetPlayer={teamLabel.toLowerCase().includes('opponent') ? 'opponent' : 'player'}
      />
    </Box>
  );
}
