import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useCallback, useState } from 'react';
import { useFormat } from '../AppStore';
import { useGameMaster } from '../hooks/useGameMaster';
import type { GamemasterPokemonEntry } from '../types/pokemon.types';
import type { BottleCapType } from '../utils/bottleCapCalculator';
import {
  calculateBottleCapTarget,
  getAllBottleCapOptions,
} from '../utils/bottleCapCalculator';
import type { PokedexEntry } from '../utils/rank-calculator';

export default function BottleCapCalculatorPage() {
  const gameMaster = useGameMaster();
  const { cp: maxCP } = useFormat();
  const pokemonList = Array.isArray(gameMaster.pokemon)
    ? gameMaster.pokemon
    : Object.values(gameMaster.pokemon);

  const [selectedPokemon, setSelectedPokemon] =
    useState<GamemasterPokemonEntry | null>(null);
  const [currentAttack, setCurrentAttack] = useState(0);
  const [currentDefense, setCurrentDefense] = useState(0);
  const [currentHP, setCurrentHP] = useState(0);
  const [bottleCapType, setBottleCapType] = useState<BottleCapType>('silver');
  const [result, setResult] = useState<ReturnType<
    typeof calculateBottleCapTarget
  > | null>(null);
  const [allOptions, setAllOptions] = useState<
    ReturnType<typeof getAllBottleCapOptions>
  >([]);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = useCallback(() => {
    setError(null);
    if (!selectedPokemon) {
      setError('Please select a Pokémon');
      return;
    }

    if (
      currentAttack < 0 ||
      currentAttack > 15 ||
      currentDefense < 0 ||
      currentDefense > 15 ||
      currentHP < 0 ||
      currentHP > 15
    ) {
      setError('IVs must be between 0 and 15');
      return;
    }

    const pokedexEntry: PokedexEntry = {
      number: String(selectedPokemon.dex),
      name: selectedPokemon.speciesName,
      baseAttack: selectedPokemon.baseStats.atk,
      baseDefense: selectedPokemon.baseStats.def,
      baseHealth: selectedPokemon.baseStats.hp,
      family: selectedPokemon.family.id,
    };

    try {
      const suggestion = calculateBottleCapTarget({
        currentAttack,
        currentDefense,
        currentHP,
        bottleCapType,
        pokedexEntry,
        maxCP,
        maxLevel: 51,
      });

      if (!suggestion) {
        setError('Could not find a valid bottle cap target');
        setResult(null);
        setAllOptions([]);
        return;
      }

      setResult(suggestion);

      // Get alternative options
      const options = getAllBottleCapOptions(
        {
          currentAttack,
          currentDefense,
          currentHP,
          bottleCapType,
          pokedexEntry,
          maxCP,
          maxLevel: 51,
        },
        10,
      );
      setAllOptions(options);
    } catch (e) {
      setError((e as Error).message);
      setResult(null);
      setAllOptions([]);
    }
  }, [
    selectedPokemon,
    currentAttack,
    currentDefense,
    currentHP,
    bottleCapType,
    maxCP,
  ]);

  return (
    <Stack spacing={3} p={3} maxWidth={1200} mx="auto" component="main">
      <Typography variant="h4">Bottle Cap Calculator</Typography>
      <Typography variant="body2" color="text.secondary">
        Determine if bottle caps can improve your Pokémon's PvP viability.
        Select your Pokémon, enter current IVs, choose bottle cap type, and see
        the best reachable rank for the current league format.
      </Typography>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={3}>
          <Typography variant="h6">Pokémon & Current IVs</Typography>
          <Autocomplete
            options={pokemonList}
            getOptionLabel={(option) => option.speciesName}
            value={selectedPokemon}
            onChange={(_, newValue) => {
              setSelectedPokemon(newValue);
              setResult(null);
              setAllOptions([]);
            }}
            renderInput={(params) => (
              <TextField {...params} label="Select Pokémon" size="small" />
            )}
            isOptionEqualToValue={(option, value) =>
              option.speciesId === value.speciesId
            }
          />

          <Stack direction="row" spacing={2}>
            <TextField
              label="Attack IV"
              type="number"
              value={currentAttack}
              onChange={(e) => setCurrentAttack(Number(e.target.value))}
              size="small"
              inputProps={{ min: 0, max: 15 }}
              fullWidth
            />
            <TextField
              label="Defense IV"
              type="number"
              value={currentDefense}
              onChange={(e) => setCurrentDefense(Number(e.target.value))}
              size="small"
              inputProps={{ min: 0, max: 15 }}
              fullWidth
            />
            <TextField
              label="HP IV"
              type="number"
              value={currentHP}
              onChange={(e) => setCurrentHP(Number(e.target.value))}
              size="small"
              inputProps={{ min: 0, max: 15 }}
              fullWidth
            />
          </Stack>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Bottle Cap Type
            </Typography>
            <ToggleButtonGroup
              value={bottleCapType}
              exclusive
              onChange={(_, newValue) => {
                if (newValue !== null) {
                  setBottleCapType(newValue);
                  setResult(null);
                  setAllOptions([]);
                }
              }}
              size="small"
            >
              <ToggleButton value="silver">
                Silver (Increase ONE stat)
              </ToggleButton>
              <ToggleButton value="gold">
                Gold (Increase ANY/ALL stats)
              </ToggleButton>
            </ToggleButtonGroup>
            <Typography
              variant="caption"
              display="block"
              color="text.secondary"
              sx={{ mt: 1 }}
            >
              {bottleCapType === 'silver'
                ? 'Can adjust one stat (Attack, Defense, or HP) up to 15'
                : 'Can adjust any combination of stats up to 15'}
            </Typography>
          </Box>

          <Button variant="contained" onClick={handleCalculate}>
            Calculate Best Target
          </Button>
        </Stack>
      </Paper>

      {error && <Alert severity="error">{error}</Alert>}

      {result && (
        <>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recommended Target
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Current IVs
                </Typography>
                <Typography variant="h5">
                  {currentAttack}/{currentDefense}/{currentHP}
                  {result.currentRank && (
                    <Chip
                      label={`Rank #${result.currentRank.rank} (${result.currentPercentile?.toFixed(1)}%)`}
                      size="small"
                      sx={{ ml: 2 }}
                    />
                  )}
                  {!result.currentRank && (
                    <Chip
                      label="Not in rank chart"
                      size="small"
                      color="warning"
                      sx={{ ml: 2 }}
                    />
                  )}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" color="success.main">
                  Target IVs
                </Typography>
                <Typography variant="h5" color="success.main">
                  {result.targetIV.attack}/{result.targetIV.defense}/
                  {result.targetIV.hp}
                  <Chip
                    label={`Rank #${result.targetRank.rank} (${result.targetPercentile.toFixed(1)}%)`}
                    size="small"
                    color="success"
                    sx={{ ml: 2 }}
                  />
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Improvements Needed
                </Typography>
                <Stack direction="row" spacing={2}>
                  {result.improvements.attack > 0 && (
                    <Chip
                      label={`Attack +${result.improvements.attack}`}
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {result.improvements.defense > 0 && (
                    <Chip
                      label={`Defense +${result.improvements.defense}`}
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {result.improvements.hp > 0 && (
                    <Chip
                      label={`HP +${result.improvements.hp}`}
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {result.improvements.attack === 0 &&
                    result.improvements.defense === 0 &&
                    result.improvements.hp === 0 && (
                      <Chip label="Already optimal!" color="success" />
                    )}
                </Stack>
              </Box>

              {result.totalCapsNeeded > 0 && (
                <Alert severity="info">
                  <strong>
                    1 {bottleCapType === 'silver' ? 'Silver' : 'Gold'} Bottle
                    Cap needed
                  </strong>
                </Alert>
              )}

              {result.totalCapsNeeded === 0 && (
                <Alert severity="success">
                  <strong>No bottle cap needed - already optimal!</strong>
                </Alert>
              )}

              {result.rankImprovement !== null &&
                result.rankImprovement > 0 && (
                  <Alert severity="success">
                    Improves rank by {result.rankImprovement} position
                    {result.rankImprovement !== 1 ? 's' : ''}!
                  </Alert>
                )}

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Stat Product: {Math.round(result.targetRank.product)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Level: {result.targetRank.level}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  CP: {result.targetRank.cp}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {allOptions.length > 1 && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Alternative Options (Top 10)
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Rank</TableCell>
                      <TableCell>Percentile</TableCell>
                      <TableCell>Target IVs</TableCell>
                      <TableCell>Improvements</TableCell>
                      <TableCell>Cap Needed</TableCell>
                      <TableCell>Cap Type</TableCell>
                      <TableCell>Stat Product</TableCell>
                      <TableCell>Level</TableCell>
                      <TableCell>CP</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allOptions.map((option, index) => {
                      const statsChanged = [
                        option.improvements.attack > 0,
                        option.improvements.defense > 0,
                        option.improvements.hp > 0,
                      ].filter(Boolean).length;

                      const capType =
                        statsChanged === 0
                          ? 'None'
                          : statsChanged === 1
                            ? 'Silver'
                            : 'Gold';

                      return (
                        <TableRow key={index}>
                          <TableCell>#{option.targetRank.rank}</TableCell>
                          <TableCell>
                            {option.targetPercentile.toFixed(1)}%
                          </TableCell>
                          <TableCell>
                            {option.targetIV.attack}/{option.targetIV.defense}/
                            {option.targetIV.hp}
                          </TableCell>
                          <TableCell>
                            {option.improvements.attack > 0 &&
                              `A+${option.improvements.attack} `}
                            {option.improvements.defense > 0 &&
                              `D+${option.improvements.defense} `}
                            {option.improvements.hp > 0 &&
                              `HP+${option.improvements.hp}`}
                            {option.improvements.attack === 0 &&
                              option.improvements.defense === 0 &&
                              option.improvements.hp === 0 &&
                              'None'}
                          </TableCell>
                          <TableCell>{option.totalCapsNeeded}</TableCell>
                          <TableCell>{capType}</TableCell>
                          <TableCell>
                            {Math.round(option.targetRank.product)}
                          </TableCell>
                          <TableCell>{option.targetRank.level}</TableCell>
                          <TableCell>{option.targetRank.cp}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </>
      )}
    </Stack>
  );
}
