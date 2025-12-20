import { ContentCopy, Delete, ExpandMore } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  FormControlLabel,
  Paper,
  Slider,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';

type FilterState = 'off' | 'include' | 'exclude';

interface FilterCategory {
  title: string;
  filters: Array<{ key: string; label: string }>;
}

const FILTER_CATEGORIES: FilterCategory[] = [
  {
    title: 'Regions',
    filters: [
      { key: 'kanto', label: 'Kanto' },
      { key: 'johto', label: 'Johto' },
      { key: 'hoenn', label: 'Hoenn' },
      { key: 'sinnoh', label: 'Sinnoh' },
      { key: 'unova', label: 'Unova' },
      { key: 'kalos', label: 'Kalos' },
      { key: 'alola', label: 'Alola' },
      { key: 'galar', label: 'Galar' },
      { key: 'hisui', label: 'Hisui' },
      { key: 'paldea', label: 'Paldea' },
    ],
  },
  {
    title: 'Appraisal',
    filters: [
      { key: '0*', label: '0 Stars' },
      { key: '1*', label: '1 Star' },
      { key: '2*', label: '2 Stars' },
      { key: '3*', label: '3 Stars' },
      { key: '4*', label: '4 Stars (Hundo)' },
    ],
  },
  {
    title: 'Special Types',
    filters: [
      { key: 'shiny', label: 'Shiny' },
      { key: 'lucky', label: 'Lucky' },
      { key: 'shadow', label: 'Shadow' },
      { key: 'purified', label: 'Purified' },
      { key: 'legendary', label: 'Legendary' },
      { key: 'mythical', label: 'Mythical' },
      { key: 'ultrabeasts', label: 'Ultra Beasts' },
      { key: 'costume', label: 'Costume' },
    ],
  },
  {
    title: 'Evolution & Power',
    filters: [
      { key: 'evolve', label: 'Can Evolve' },
      { key: 'evolvenew', label: 'Evolves to New' },
      { key: 'item', label: 'Item Evolution' },
      { key: 'tradeevolve', label: 'Trade Evolution' },
      { key: 'megaevolve', label: 'Can Mega Evolve' },
      { key: 'dynamax', label: 'Dynamax Capable' },
      { key: 'gigantamax', label: 'Gigantamax Capable' },
    ],
  },
  {
    title: 'Buddy Level',
    filters: [
      { key: 'buddy0', label: 'No Buddy Hearts' },
      { key: 'buddy1', label: '1 Heart (Good)' },
      { key: 'buddy2', label: '2 Hearts (Great)' },
      { key: 'buddy3', label: '3 Hearts (Ultra)' },
      { key: 'buddy4', label: '4 Hearts (Best)' },
      { key: 'buddy5', label: '5 Hearts (Max)' },
    ],
  },
  {
    title: 'Mega Level',
    filters: [
      { key: 'mega0', label: 'Never Mega Evolved' },
      { key: 'mega1', label: 'Mega Level 1' },
      { key: 'mega2', label: 'Mega Level 2' },
      { key: 'mega3', label: 'Mega Level 3 (Max)' },
    ],
  },
  {
    title: 'Acquisition',
    filters: [
      { key: 'hatched', label: 'Hatched from Egg' },
      { key: 'eggsonly', label: 'Baby Pokémon' },
      { key: 'traded', label: 'Traded' },
      { key: 'raid', label: 'From Raid' },
      { key: 'remoteraid', label: 'Remote Raid' },
      { key: 'megaraid', label: 'Mega Raid' },
      { key: 'exraid', label: 'EX Raid' },
      { key: 'primalraid', label: 'Primal Raid' },
      { key: 'gbl', label: 'GO Battle League' },
      { key: 'snapshot', label: 'Photobomb' },
    ],
  },
  {
    title: 'Other',
    filters: [
      { key: 'defender', label: 'Gym Defender' },
      { key: 'favorite', label: 'Favorite' },
      { key: '@special', label: 'Special Moves' },
      { key: 'male', label: 'Male' },
      { key: 'female', label: 'Female' },
      { key: 'genderunknown', label: 'Genderless' },
      { key: 'xxs', label: 'XXS Size' },
      { key: 'xs', label: 'XS Size' },
      { key: 'xl', label: 'XL Size' },
      { key: 'xxl', label: 'XXL Size' },
      { key: 'locationbackground', label: 'Location Background' },
      { key: 'specialbackground', label: 'Special Background' },
    ],
  },
];

export default function SearchStringBuilderPage() {
  const [filterStates, setFilterStates] = useState<Record<string, FilterState>>(
    {},
  );

  // Range states
  const [cpRange, setCpRange] = useState<[number, number]>([0, 5000]);
  const [cpEnabled, setCpEnabled] = useState(false);
  const [hpRange, setHpRange] = useState<[number, number]>([0, 500]);
  const [hpEnabled, setHpEnabled] = useState(false);
  const [pokedexRange, setPokedexRange] = useState<[number, number]>([1, 1025]);
  const [pokedexEnabled, setPokedexEnabled] = useState(false);
  const [distanceRange, setDistanceRange] = useState<[number, number]>([
    0, 20000,
  ]);
  const [distanceEnabled, setDistanceEnabled] = useState(false);
  const [ageRange, setAgeRange] = useState<[number, number]>([0, 365]);
  const [ageEnabled, setAgeEnabled] = useState(false);
  const [yearRange, setYearRange] = useState<[number, number]>([2016, 2025]);
  const [yearEnabled, setYearEnabled] = useState(false);

  const toggleFilter = (key: string) => {
    setFilterStates((prev) => {
      const current = prev[key] || 'off';
      const next =
        current === 'off'
          ? 'include'
          : current === 'include'
            ? 'exclude'
            : 'off';
      return { ...prev, [key]: next };
    });
  };

  const toggleAllInCategory = (
    filters: Array<{ key: string; label: string }>,
    state: FilterState,
  ) => {
    setFilterStates((prev) => {
      const updates: Record<string, FilterState> = {};
      filters.forEach((filter) => {
        updates[filter.key] = state;
      });
      return { ...prev, ...updates };
    });
  };

  const searchString = useMemo(() => {
    const parts: string[] = [];

    // Add filter terms
    for (const key in filterStates) {
      const state = filterStates[key];
      if (state === 'include') {
        parts.push(key);
      } else if (state === 'exclude') {
        parts.push(`!${key}`);
      }
    }

    // Add range terms
    if (cpEnabled) {
      if (cpRange[0] === 0 && cpRange[1] < 5000) {
        parts.push(`cp-${cpRange[1]}`);
      } else if (cpRange[0] > 0 && cpRange[1] === 5000) {
        parts.push(`cp${cpRange[0]}-`);
      } else if (cpRange[0] > 0 || cpRange[1] < 5000) {
        parts.push(`cp${cpRange[0]}-${cpRange[1]}`);
      }
    }

    if (hpEnabled) {
      if (hpRange[0] === 0 && hpRange[1] < 500) {
        parts.push(`hp-${hpRange[1]}`);
      } else if (hpRange[0] > 0 && hpRange[1] === 500) {
        parts.push(`hp${hpRange[0]}-`);
      } else if (hpRange[0] > 0 || hpRange[1] < 500) {
        parts.push(`hp${hpRange[0]}-${hpRange[1]}`);
      }
    }

    if (pokedexEnabled) {
      if (pokedexRange[0] === 1 && pokedexRange[1] < 1025) {
        parts.push(`-${pokedexRange[1]}`);
      } else if (pokedexRange[0] > 1 && pokedexRange[1] === 1025) {
        parts.push(`${pokedexRange[0]}-`);
      } else if (pokedexRange[0] > 1 || pokedexRange[1] < 1025) {
        parts.push(`${pokedexRange[0]}-${pokedexRange[1]}`);
      }
    }

    if (distanceEnabled) {
      if (distanceRange[0] === 0 && distanceRange[1] < 20000) {
        parts.push(`distance-${distanceRange[1]}`);
      } else if (distanceRange[0] > 0 && distanceRange[1] === 20000) {
        parts.push(`distance${distanceRange[0]}-`);
      } else if (distanceRange[0] > 0 || distanceRange[1] < 20000) {
        parts.push(`distance${distanceRange[0]}-${distanceRange[1]}`);
      }
    }

    if (ageEnabled) {
      if (ageRange[0] === 0 && ageRange[1] < 365) {
        parts.push(`age-${ageRange[1]}`);
      } else if (ageRange[0] > 0 && ageRange[1] === 365) {
        parts.push(`age${ageRange[0]}-`);
      } else if (ageRange[0] > 0 || ageRange[1] < 365) {
        parts.push(`age${ageRange[0]}-${ageRange[1]}`);
      }
    }

    if (yearEnabled) {
      if (yearRange[0] === 2016 && yearRange[1] < 2025) {
        parts.push(`year${yearRange[1]}`);
      } else if (yearRange[0] > 2016 && yearRange[1] === 2025) {
        parts.push(`year${yearRange[0]}-`);
      } else if (yearRange[0] > 2016 || yearRange[1] < 2025) {
        parts.push(`year${yearRange[0]}-${yearRange[1]}`);
      }
    }

    return parts.join('&');
  }, [
    filterStates,
    cpRange,
    cpEnabled,
    hpRange,
    hpEnabled,
    pokedexRange,
    pokedexEnabled,
    distanceRange,
    distanceEnabled,
    ageRange,
    ageEnabled,
    yearRange,
    yearEnabled,
  ]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(searchString);
  };

  const clearAll = () => {
    setFilterStates({});
    setCpEnabled(false);
    setHpEnabled(false);
    setPokedexEnabled(false);
    setDistanceEnabled(false);
    setAgeEnabled(false);
    setYearEnabled(false);
  };

  const activeFiltersCount =
    Object.keys(filterStates).filter((key) => filterStates[key] !== 'off')
      .length +
    (cpEnabled ? 1 : 0) +
    (hpEnabled ? 1 : 0) +
    (pokedexEnabled ? 1 : 0) +
    (distanceEnabled ? 1 : 0) +
    (ageEnabled ? 1 : 0) +
    (yearEnabled ? 1 : 0);

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Search String Builder
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Toggle filters on/off or set to exclude. All active filters are
            combined with AND (&).
          </Typography>
        </Box>

        {/* Result String Display */}
        <Paper sx={{ p: 2 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
            <Typography variant="subtitle2" fontWeight="bold">
              Search String ({activeFiltersCount} active)
            </Typography>
            <Stack direction="row" spacing={1}>
              {activeFiltersCount > 0 && (
                <Button
                  startIcon={<Delete />}
                  onClick={clearAll}
                  size="small"
                  color="error"
                >
                  Clear All
                </Button>
              )}
              <Button
                startIcon={<ContentCopy />}
                onClick={copyToClipboard}
                size="small"
                variant="contained"
                disabled={!searchString}
              >
                Copy
              </Button>
            </Stack>
          </Stack>
          <Paper
            variant="outlined"
            sx={{ p: 2, minHeight: 60, maxWidth: '100%', overflow: 'hidden' }}
          >
            {searchString ? (
              <Typography
                variant="body1"
                fontFamily="monospace"
                sx={{
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'anywhere',
                  wordBreak: 'break-word',
                  textOverflow: 'clip',
                  maxWidth: '588px',
                }}
              >
                {searchString}
              </Typography>
            ) : (
              <Typography
                variant="body2"
                color="text.secondary"
                fontStyle="italic"
              >
                Select filters below to build your search string...
              </Typography>
            )}
          </Paper>
        </Paper>

        {/* Filter Categories */}
        {FILTER_CATEGORIES.map((category) => (
          <Accordion
            key={category.title}
            defaultExpanded={category.title === 'Appraisal'}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">{category.title}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                {/* All Toggle */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1,
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="body2" fontWeight="bold">
                    All
                  </Typography>
                  <ToggleButtonGroup size="small" value={null} exclusive>
                    <ToggleButton
                      value="off"
                      sx={{ px: 2 }}
                      onClick={() =>
                        toggleAllInCategory(category.filters, 'off')
                      }
                    >
                      Off
                    </ToggleButton>
                    <ToggleButton
                      value="include"
                      sx={{ px: 2 }}
                      onClick={() =>
                        toggleAllInCategory(category.filters, 'include')
                      }
                    >
                      Include
                    </ToggleButton>
                    <ToggleButton
                      value="exclude"
                      sx={{ px: 2 }}
                      onClick={() =>
                        toggleAllInCategory(category.filters, 'exclude')
                      }
                    >
                      Exclude
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                {category.filters.map((filter) => {
                  const state = filterStates[filter.key] || 'off';
                  return (
                    <Box
                      key={filter.key}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1,
                        borderRadius: 1,
                        bgcolor:
                          state === 'include'
                            ? 'success.light'
                            : state === 'exclude'
                              ? 'error.light'
                              : 'transparent',
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <Typography variant="body2">{filter.label}</Typography>
                      <ToggleButtonGroup
                        size="small"
                        value={state}
                        exclusive
                        onChange={() => toggleFilter(filter.key)}
                      >
                        <ToggleButton value="off" sx={{ px: 2 }}>
                          Off
                        </ToggleButton>
                        <ToggleButton value="include" sx={{ px: 2 }}>
                          Include
                        </ToggleButton>
                        <ToggleButton value="exclude" sx={{ px: 2 }}>
                          Exclude
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Box>
                  );
                })}
              </Stack>
            </AccordionDetails>
          </Accordion>
        ))}

        {/* Range Filters */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">Ranges</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={3}>
              {/* CP Range */}
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={cpEnabled}
                      onChange={(e) => setCpEnabled(e.target.checked)}
                    />
                  }
                  label={<Typography variant="subtitle2">CP Range</Typography>}
                />
                {cpEnabled && (
                  <Box sx={{ px: 2, mt: 1 }}>
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      mb={1}
                    >
                      <TextField
                        size="small"
                        type="number"
                        value={cpRange[0]}
                        onChange={(e) =>
                          setCpRange([Number(e.target.value), cpRange[1]])
                        }
                        sx={{ width: 100 }}
                      />
                      <Typography>to</Typography>
                      <TextField
                        size="small"
                        type="number"
                        value={cpRange[1]}
                        onChange={(e) =>
                          setCpRange([cpRange[0], Number(e.target.value)])
                        }
                        sx={{ width: 100 }}
                      />
                    </Stack>
                    <Slider
                      value={cpRange}
                      onChange={(_, value) =>
                        setCpRange(value as [number, number])
                      }
                      min={0}
                      max={5000}
                      step={10}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                )}
              </Box>

              {/* HP Range */}
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={hpEnabled}
                      onChange={(e) => setHpEnabled(e.target.checked)}
                    />
                  }
                  label={<Typography variant="subtitle2">HP Range</Typography>}
                />
                {hpEnabled && (
                  <Box sx={{ px: 2, mt: 1 }}>
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      mb={1}
                    >
                      <TextField
                        size="small"
                        type="number"
                        value={hpRange[0]}
                        onChange={(e) =>
                          setHpRange([Number(e.target.value), hpRange[1]])
                        }
                        sx={{ width: 100 }}
                      />
                      <Typography>to</Typography>
                      <TextField
                        size="small"
                        type="number"
                        value={hpRange[1]}
                        onChange={(e) =>
                          setHpRange([hpRange[0], Number(e.target.value)])
                        }
                        sx={{ width: 100 }}
                      />
                    </Stack>
                    <Slider
                      value={hpRange}
                      onChange={(_, value) =>
                        setHpRange(value as [number, number])
                      }
                      min={0}
                      max={500}
                      step={5}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                )}
              </Box>

              {/* Pokédex Range */}
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={pokedexEnabled}
                      onChange={(e) => setPokedexEnabled(e.target.checked)}
                    />
                  }
                  label={
                    <Typography variant="subtitle2">
                      Pokédex Number Range
                    </Typography>
                  }
                />
                {pokedexEnabled && (
                  <Box sx={{ px: 2, mt: 1 }}>
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      mb={1}
                    >
                      <TextField
                        size="small"
                        type="number"
                        value={pokedexRange[0]}
                        onChange={(e) =>
                          setPokedexRange([
                            Number(e.target.value),
                            pokedexRange[1],
                          ])
                        }
                        sx={{ width: 100 }}
                      />
                      <Typography>to</Typography>
                      <TextField
                        size="small"
                        type="number"
                        value={pokedexRange[1]}
                        onChange={(e) =>
                          setPokedexRange([
                            pokedexRange[0],
                            Number(e.target.value),
                          ])
                        }
                        sx={{ width: 100 }}
                      />
                    </Stack>
                    <Slider
                      value={pokedexRange}
                      onChange={(_, value) =>
                        setPokedexRange(value as [number, number])
                      }
                      min={1}
                      max={1025}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                )}
              </Box>

              {/* Distance Range */}
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={distanceEnabled}
                      onChange={(e) => setDistanceEnabled(e.target.checked)}
                    />
                  }
                  label={
                    <Typography variant="subtitle2">Distance (km)</Typography>
                  }
                />
                {distanceEnabled && (
                  <Box sx={{ px: 2, mt: 1 }}>
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      mb={1}
                    >
                      <TextField
                        size="small"
                        type="number"
                        value={distanceRange[0]}
                        onChange={(e) =>
                          setDistanceRange([
                            Number(e.target.value),
                            distanceRange[1],
                          ])
                        }
                        sx={{ width: 100 }}
                      />
                      <Typography>to</Typography>
                      <TextField
                        size="small"
                        type="number"
                        value={distanceRange[1]}
                        onChange={(e) =>
                          setDistanceRange([
                            distanceRange[0],
                            Number(e.target.value),
                          ])
                        }
                        sx={{ width: 100 }}
                      />
                    </Stack>
                    <Slider
                      value={distanceRange}
                      onChange={(_, value) =>
                        setDistanceRange(value as [number, number])
                      }
                      min={0}
                      max={20000}
                      step={100}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                )}
              </Box>

              {/* Age Range */}
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={ageEnabled}
                      onChange={(e) => setAgeEnabled(e.target.checked)}
                    />
                  }
                  label={
                    <Typography variant="subtitle2">Age (days)</Typography>
                  }
                />
                {ageEnabled && (
                  <Box sx={{ px: 2, mt: 1 }}>
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      mb={1}
                    >
                      <TextField
                        size="small"
                        type="number"
                        value={ageRange[0]}
                        onChange={(e) =>
                          setAgeRange([Number(e.target.value), ageRange[1]])
                        }
                        sx={{ width: 100 }}
                      />
                      <Typography>to</Typography>
                      <TextField
                        size="small"
                        type="number"
                        value={ageRange[1]}
                        onChange={(e) =>
                          setAgeRange([ageRange[0], Number(e.target.value)])
                        }
                        sx={{ width: 100 }}
                      />
                    </Stack>
                    <Slider
                      value={ageRange}
                      onChange={(_, value) =>
                        setAgeRange(value as [number, number])
                      }
                      min={0}
                      max={365}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                )}
              </Box>

              {/* Year Range */}
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={yearEnabled}
                      onChange={(e) => setYearEnabled(e.target.checked)}
                    />
                  }
                  label={<Typography variant="subtitle2">Year</Typography>}
                />
                {yearEnabled && (
                  <Box sx={{ px: 2, mt: 1 }}>
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      mb={1}
                    >
                      <TextField
                        size="small"
                        type="number"
                        value={yearRange[0]}
                        onChange={(e) =>
                          setYearRange([Number(e.target.value), yearRange[1]])
                        }
                        sx={{ width: 100 }}
                      />
                      <Typography>to</Typography>
                      <TextField
                        size="small"
                        type="number"
                        value={yearRange[1]}
                        onChange={(e) =>
                          setYearRange([yearRange[0], Number(e.target.value)])
                        }
                        sx={{ width: 100 }}
                      />
                    </Stack>
                    <Slider
                      value={yearRange}
                      onChange={(_, value) =>
                        setYearRange(value as [number, number])
                      }
                      min={2016}
                      max={2025}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                )}
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Tips */}
        <Paper sx={{ p: 2, bgcolor: 'info.light' }}>
          <Typography variant="subtitle2" gutterBottom>
            Quick Tips:
          </Typography>
          <Typography variant="body2" component="div">
            • <strong>Include</strong>: Show Pokémon matching this filter
            <br />• <strong>Exclude</strong>: Hide Pokémon matching this filter
            (adds ! prefix)
            <br />
            • All active filters are combined with AND (&) - Pokémon must match
            all conditions
            <br />• Use ranges to filter by CP, HP, Pokédex number, distance,
            age, or year
          </Typography>
        </Paper>
      </Stack>
    </Box>
  );
}
