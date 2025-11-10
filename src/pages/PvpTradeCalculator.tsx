import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useState } from 'react';
import { useGameMaster } from '../hooks/useGameMaster';
import type { GamemasterPokemonEntry } from '../types/pokemon.types';
import {
  computePercentileTarget,
  type BaseStats,
  type PercentileInputs,
  type PercentileResult,
} from '../utils/tradeCpCalculator';

// Simple defaults for quick experimentation
const DEFAULT_STATS: BaseStats = { atk: 100, def: 100, sta: 100 };

export default function PercentileTargetPage() {
  const gameMaster = useGameMaster();
  const pokemonList = Array.isArray(gameMaster.pokemon)
    ? gameMaster.pokemon
    : Object.values(gameMaster.pokemon);

  const [selectedPokemon, setSelectedPokemon] =
    useState<GamemasterPokemonEntry | null>(null);
  const [species, setSpecies] = useState<BaseStats>(DEFAULT_STATS);
  const [friendship, setFriendship] =
    useState<PercentileInputs['friendship']>('good');
  const [lucky, setLucky] = useState(false);
  const [recipientTrainerLevel, setRecipientTrainerLevel] = useState(50);
  const [league, setLeague] = useState<PercentileInputs['league']>('great');
  const [customCpCap, setCustomCpCap] = useState<number | ''>('');
  const [percentile, setPercentile] = useState(0.8);
  const [optimizeBy, setOptimizeBy] =
    useState<PercentileInputs['optimizeBy']>('SP');
  const [levelMax, setLevelMax] = useState(51);
  const [tailStrategy, setTailStrategy] =
    useState<PercentileInputs['tailStrategy']>('upper');
  const [upperAggregator, setUpperAggregator] =
    useState<PercentileInputs['upperAggregator']>('max');
  const [result, setResult] = useState<PercentileResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCompute = useCallback(() => {
    setError(null);
    try {
      const inputs: PercentileInputs = {
        species,
        friendship,
        lucky,
        recipientTrainerLevel,
        league,
        customCpCap: customCpCap === '' ? undefined : customCpCap,
        percentile,
        optimizeBy,
        levelMax,
        tailStrategy,
        upperAggregator,
      };
      const r = computePercentileTarget(inputs);
      setResult(r);
    } catch (e) {
      setError((e as Error).message);
      setResult(null);
    }
  }, [
    species,
    friendship,
    lucky,
    recipientTrainerLevel,
    league,
    customCpCap,
    percentile,
    optimizeBy,
    levelMax,
    tailStrategy,
    upperAggregator,
  ]);

  return (
    <Stack spacing={3} p={3} maxWidth={1000} mx="auto" component="main">
      <Typography variant="h4">PVP Trade Calculator</Typography>
      <Typography variant="body2" color="text.secondary">
        Explore trade outcomes by selecting a percentile goal for post-trade PvP
        optimization. Adjust inputs then press Compute. The tool samples all IV
        spreads at the friendship floor and returns a representative IV at or
        above the chosen percentile.
      </Typography>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          <Stack flex={1} spacing={2}>
            <Typography variant="h6">Species Base Stats</Typography>
            <Autocomplete
              options={pokemonList}
              getOptionLabel={(option) => option.speciesName}
              value={selectedPokemon}
              onChange={(_, newValue) => {
                setSelectedPokemon(newValue);
                if (newValue) {
                  setSpecies({
                    atk: newValue.baseStats.atk,
                    def: newValue.baseStats.def,
                    sta: newValue.baseStats.hp,
                  });
                }
              }}
              renderInput={(params) => (
                <TextField {...params} label="Select Species" size="small" />
              )}
              isOptionEqualToValue={(option, value) =>
                option.speciesId === value.speciesId
              }
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="ATK"
                type="number"
                value={species.atk}
                onChange={(e) =>
                  setSpecies({ ...species, atk: Number(e.target.value) })
                }
                size="small"
              />
              <TextField
                label="DEF"
                type="number"
                value={species.def}
                onChange={(e) =>
                  setSpecies({ ...species, def: Number(e.target.value) })
                }
                size="small"
              />
              <TextField
                label="STA"
                type="number"
                value={species.sta}
                onChange={(e) =>
                  setSpecies({ ...species, sta: Number(e.target.value) })
                }
                size="small"
              />
            </Stack>
            <FormControl size="small">
              <InputLabel id="friendship-label">Friendship Tier</InputLabel>
              <Select
                labelId="friendship-label"
                label="Friendship Tier"
                value={friendship}
                onChange={(e) =>
                  setFriendship(
                    e.target.value as PercentileInputs['friendship'],
                  )
                }
              >
                <MenuItem value="good">Good</MenuItem>
                <MenuItem value="great">Great</MenuItem>
                <MenuItem value="ultra">Ultra</MenuItem>
                <MenuItem value="best">Best</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Checkbox
                  checked={lucky}
                  onChange={(e) => setLucky(e.target.checked)}
                />
              }
              label="Lucky Trade"
            />
            <TextField
              label="Recipient Trainer Level"
              type="number"
              size="small"
              inputProps={{ min: 1, max: 51 }}
              value={recipientTrainerLevel}
              onChange={(e) => setRecipientTrainerLevel(Number(e.target.value))}
            />
            <FormControl size="small">
              <InputLabel id="league-label">League</InputLabel>
              <Select
                labelId="league-label"
                label="League"
                value={league}
                onChange={(e) =>
                  setLeague(e.target.value as PercentileInputs['league'])
                }
              >
                <MenuItem value="great">Great (1500)</MenuItem>
                <MenuItem value="ultra">Ultra (2500)</MenuItem>
                <MenuItem value="master">Master (Uncapped)</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Custom CP Cap (optional)"
              type="number"
              size="small"
              value={customCpCap}
              onChange={(e) => {
                const v = e.target.value;
                setCustomCpCap(v === '' ? '' : Number(v));
              }}
            />
          </Stack>
          <Stack flex={1} spacing={2}>
            <Typography variant="h6">Advanced Settings</Typography>
            <Stack direction="row" spacing={2}>
              <TextField
                sx={{
                  flexGrow: 1,
                }}
                label="Percentile (0-1)"
                type="number"
                size="small"
                slotProps={{
                  htmlInput: {
                    step: 0.01,
                    min: 0,
                    max: 1,
                  },
                }}
                value={percentile}
                onChange={(e) => setPercentile(Number(e.target.value))}
              />
              <TextField
                sx={{
                  flexGrow: 1,
                }}
                label="Max Level"
                type="number"
                size="small"
                slotProps={{
                  htmlInput: {
                    min: 1,
                    max: 51,
                  },
                }}
                value={levelMax}
                onChange={(e) => setLevelMax(Number(e.target.value))}
              />
            </Stack>
            <RadioGroup
              row
              value={optimizeBy}
              onChange={(e) =>
                setOptimizeBy(e.target.value as PercentileInputs['optimizeBy'])
              }
            >
              <FormControlLabel
                value="SP"
                control={<Radio />}
                label="Optimize SP"
              />
              <FormControlLabel
                value="CP"
                control={<Radio />}
                label="Optimize CP"
              />
            </RadioGroup>
            <FormControl size="small">
              <InputLabel id="tail-strategy-label">Tail Strategy</InputLabel>
              <Select
                labelId="tail-strategy-label"
                label="Tail Strategy"
                value={tailStrategy}
                onChange={(e) =>
                  setTailStrategy(
                    e.target.value as PercentileInputs['tailStrategy'],
                  )
                }
              >
                <MenuItem value="upper">Upper Tail (aggregator)</MenuItem>
                <MenuItem value="single">Single Point</MenuItem>
              </Select>
            </FormControl>
            {tailStrategy === 'upper' && (
              <FormControl size="small">
                <InputLabel id="upper-aggregator-label">
                  Upper Aggregator
                </InputLabel>
                <Select
                  labelId="upper-aggregator-label"
                  label="Upper Aggregator"
                  value={upperAggregator}
                  onChange={(e) =>
                    setUpperAggregator(
                      e.target.value as PercentileInputs['upperAggregator'],
                    )
                  }
                >
                  <MenuItem value="max">Max</MenuItem>
                  <MenuItem value="median">Median</MenuItem>
                  <MenuItem value="mean">Mean-Proximity</MenuItem>
                </Select>
              </FormControl>
            )}
            <Button variant="contained" onClick={handleCompute}>
              Compute
            </Button>
          </Stack>
        </Stack>
      </Paper>
      {error && <Alert severity="error">{error}</Alert>}
      {result && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Result
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
            <Box flex={1}>
              <Typography variant="subtitle2" gutterBottom>
                Summary
              </Typography>
              <Typography variant="body2">
                Percentile: {(result.percentile * 100).toFixed(2)}%
              </Typography>
              <Typography variant="body2">
                Post-trade Level: {result.postTradeLevel}
              </Typography>
              <Typography variant="body2">
                Post-trade CP: {result.postTradeCP}
              </Typography>
              <Typography variant="body2">
                Representative IV: {result.representativeIV.a}/
                {result.representativeIV.d}/{result.representativeIV.s}
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" gutterBottom>
                CP Ranges at Level {result.postTradeLevel}
              </Typography>
              <Typography variant="body2" color="success.main">
                {(result.percentile * 100).toFixed(0)}%+ Percentile IVs:{' '}
                {result.cpRangeAtLevel.minCP} - {result.cpRangeAtLevel.maxCP}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Trade Screen Will Show: {result.tradeScreenRange.minCP} -{' '}
                {result.tradeScreenRange.maxCP}
              </Typography>
              {result.levelCapApplied && (
                <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
                  Level cap applied: {result.levelCapApplied}
                </Typography>
              )}
              <Divider sx={{ my: 1 }} />
              <Box
                sx={
                  {
                    //p: 2,
                    // backgroundColor: 'primary.main',
                    // color: 'primary.contrastText',
                    //borderRadius: 1,
                  }
                }
              >
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Power to Level {result.postTradeLevel}.0
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Avoid .5 levels. <br />
                  Trading rounds level down to closest integer. <br />
                  Level is capped at recipient Trainer Level + 2.
                </Typography>
              </Box>
            </Box>
            {result.tail && (
              <Box flex={1}>
                <Typography variant="subtitle2" gutterBottom>
                  Tail Statistics
                </Typography>
                <Typography variant="body2">
                  Tail Size: {result.tail.size}
                </Typography>
                <Typography variant="body2">
                  Cutoff Index: {result.tail.cutoffIndex}
                </Typography>
                <Typography variant="body2">
                  Best Score: {Math.round(result.tail.bestScore)}
                </Typography>
                <Typography variant="body2">
                  Median Score: {Math.round(result.tail.medianScore)}
                </Typography>
                <Typography variant="body2">
                  Mean Score: {Math.round(result.tail.meanScore)}
                </Typography>
              </Box>
            )}
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
