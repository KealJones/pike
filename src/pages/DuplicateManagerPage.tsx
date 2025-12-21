import {
  CheckCircle,
  ContentCopy,
  Delete,
  ExpandMore,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { ivChartsCreated, useFormat, usePokemonStorage } from '../AppStore';
import { useGameMaster } from '../hooks/useGameMaster';
import { useRankingList } from '../hooks/useRankingList';
import type { Pokemon } from '../types/pokemon.types';
import { getPokemonGamemasterData } from '../utils/gamemaster';
import {
  generateSearchString,
  identifyDuplicates,
  type DuplicateAnalysis,
  type DuplicateGroup,
  type EvolutionRankInfo,
} from '../utils/identifyDuplicates';

export default function DuplicateManagerPage() {
  const league = useFormat((state) => state.cp);
  const gameMaster = useGameMaster();
  const rankingList = useRankingList();
  const pokemonStorage = usePokemonStorage((state) => state.pokemonStorage);

  const [analysis, setAnalysis] = useState<DuplicateAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [keepTopN, setKeepTopN] = useState(1);
  const [builtThreshold, setBuiltThreshold] = useState(50);
  const [searchFilter, setSearchFilter] = useState('');
  const [alignmentFilter, setAlignmentFilter] = useState<
    'all' | 'shadow' | 'normal'
  >('all');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [copiedMessage, setCopiedMessage] = useState('');

  useEffect(() => {
    let cancel = () => {};
    let isMounted = true;

    const analyze = async () => {
      if (isMounted) {
        setIsLoading(true);
      }

      await ivChartsCreated;
      const result = await identifyDuplicates(
        pokemonStorage,
        league,
        gameMaster,
        keepTopN,
        builtThreshold,
        rankingList,
      );

      if (isMounted) {
        setAnalysis(result);
        setIsLoading(false);
      }
    };

    analyze();

    return () => {
      cancel();
      isMounted = false;
    };
  }, [
    pokemonStorage,
    league,
    gameMaster,
    keepTopN,
    builtThreshold,
    rankingList,
  ]);

  const filteredGroups = useMemo(() => {
    if (!analysis) return [];

    let filtered = analysis.groups;

    // Apply search filter
    if (searchFilter) {
      const searchLower = searchFilter.toLowerCase();
      filtered = filtered.filter(
        (g) =>
          g.speciesName.toLowerCase().includes(searchLower) ||
          g.speciesId.toLowerCase().includes(searchLower),
      );
    }

    // Apply alignment filter
    if (alignmentFilter === 'shadow') {
      filtered = filtered.filter(
        (g) => g.shadowKeep.length + g.shadowDelete.length > 0,
      );
    } else if (alignmentFilter === 'normal') {
      filtered = filtered.filter(
        (g) => g.normalKeep.length + g.normalDelete.length > 0,
      );
    }

    // Only show groups with duplicates
    filtered = filtered.filter(
      (g) => g.normalDelete.length + g.shadowDelete.length > 0,
    );

    return filtered;
  }, [analysis, searchFilter, alignmentFilter]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const copyToClipboard = async (text: string, itemName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessage(`Copied ${itemName}!`);
      setTimeout(() => setCopiedMessage(''), 3000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const exportAllDeletables = () => {
    if (!analysis) return;

    const allDeletable = analysis.groups.flatMap((g) => [
      ...g.normalDelete,
      ...g.shadowDelete,
    ]);
    const searchString = generateSearchString(allDeletable);
    copyToClipboard(searchString, 'all deletables');
  };

  const exportAllKeepers = () => {
    if (!analysis) return;

    const allKeepers = analysis.groups.flatMap((g) => [
      ...g.normalKeep,
      ...g.shadowKeep,
    ]);
    const searchString = generateSearchString(allKeepers);
    copyToClipboard(searchString, 'all keepers');
  };

  const exportGroupDeletables = (group: DuplicateGroup) => {
    const allDeletable = [...group.normalDelete, ...group.shadowDelete];
    const searchString = generateSearchString(allDeletable);
    copyToClipboard(searchString, `${group.speciesName} deletables`);
  };

  const exportGroupKeepers = (group: DuplicateGroup) => {
    const allKeepers = [...group.normalKeep, ...group.shadowKeep];
    const searchString = generateSearchString(allKeepers);
    copyToClipboard(searchString, `${group.speciesName} keepers`);
  };

  if (isLoading) {
    return (
      <Box p={3}>
        <Typography>Analyzing duplicates...</Typography>
      </Box>
    );
  }

  if (!analysis) {
    return (
      <Box p={3}>
        <Alert severity="info">
          Upload your Pokemon storage to identify duplicates
        </Alert>
      </Box>
    );
  }

  return (
    <Stack spacing={3} p={3} component="main" maxWidth={1200} mx="auto">
      <Typography variant="h4">Duplicate Manager</Typography>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Stack direction="row" spacing={4} justifyContent="space-around">
          <Box textAlign="center">
            <Typography variant="h3" color="text.secondary">
              {analysis.totalPokemon}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Pokemon
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h3" color="success.main">
              {analysis.totalToKeep}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              To Keep
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h3" color="error.main">
              {analysis.totalToDelete}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Safe to Delete
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <Paper elevation={1} sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Keep Top N</InputLabel>
            <Select
              value={keepTopN}
              label="Keep Top N"
              onChange={(e) => setKeepTopN(Number(e.target.value))}
            >
              <MenuItem value={1}>Keep Top 1</MenuItem>
              <MenuItem value={2}>Keep Top 2</MenuItem>
              <MenuItem value={3}>Keep Top 3</MenuItem>
              <MenuItem value={5}>Keep Top 5</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Built Threshold</InputLabel>
            <Select
              value={builtThreshold}
              label="Built Threshold"
              onChange={(e) => setBuiltThreshold(Number(e.target.value))}
            >
              <MenuItem value={25}>Within 25 CP</MenuItem>
              <MenuItem value={50}>Within 50 CP</MenuItem>
              <MenuItem value={100}>Within 100 CP</MenuItem>
              <MenuItem value={200}>Within 200 CP</MenuItem>
            </Select>
          </FormControl>

          <TextField
            size="small"
            label="Search Species"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            sx={{ minWidth: 200 }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter</InputLabel>
            <Select
              value={alignmentFilter}
              label="Filter"
              onChange={(e) => setAlignmentFilter(e.target.value as any)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="normal">Normal Only</MenuItem>
              <MenuItem value="shadow">Shadow Only</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            startIcon={<ContentCopy />}
            onClick={exportAllDeletables}
            disabled={filteredGroups.length === 0}
          >
            Export All Deletables
          </Button>

          <Button
            variant="outlined"
            startIcon={<ContentCopy />}
            onClick={exportAllKeepers}
            disabled={filteredGroups.length === 0}
          >
            Export All Keepers
          </Button>
        </Stack>
      </Paper>

      {copiedMessage && (
        <Alert severity="success" onClose={() => setCopiedMessage('')}>
          {copiedMessage}
        </Alert>
      )}

      <Typography variant="h6">
        {filteredGroups.length} Species with Duplicates
      </Typography>

      {filteredGroups.length === 0 && (
        <Alert severity="success">
          No duplicates found with current filters! 🎉
        </Alert>
      )}

      {filteredGroups.map((group) => {
        const key = group.speciesId;
        const isExpanded = expandedGroups.has(key);
        const gmData = getPokemonGamemasterData(
          group.speciesId.replace('_shadow', ''),
          gameMaster,
        );

        const totalKeep = group.normalKeep.length + group.shadowKeep.length;
        const totalDelete =
          group.normalDelete.length + group.shadowDelete.length;

        return (
          <Accordion
            key={key}
            expanded={isExpanded}
            onChange={() => toggleGroup(key)}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{ width: '100%', pr: 2 }}
              >
                <Avatar
                  src={`https://esm.sh/gh/PokeAPI/sprites/sprites/pokemon/other/home/${gmData?.dex ?? 0}.png`}
                  sx={{ width: 48, height: 48 }}
                />

                <Box flex={1}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {group.speciesName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {group.totalCount} total
                  </Typography>
                </Box>

                <Chip
                  icon={<CheckCircle />}
                  label={`Keep ${totalKeep}`}
                  color="success"
                  size="small"
                />

                <Chip
                  icon={<Delete />}
                  label={`Delete ${totalDelete}`}
                  color="error"
                  size="small"
                />
              </Stack>
            </AccordionSummary>

            <AccordionDetails>
              <Stack spacing={2}>
                {totalKeep > 0 && (
                  <Box>
                    <Stack direction="row" spacing={1}>
                      <Typography
                        variant="subtitle2"
                        color="success.main"
                        gutterBottom
                      >
                        ✅ KEEP ({totalKeep})
                      </Typography>
                      <Tooltip title="Export keepers for this species">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            exportGroupKeepers(group);
                          }}
                          disabled={totalKeep === 0}
                        >
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                    <Stack spacing={1}>
                      {group.normalKeep.map((pokemon, idx) => (
                        <PokemonRow key={idx} pokemon={pokemon} status="keep" />
                      ))}
                      {group.shadowKeep.map((pokemon, idx) => (
                        <PokemonRow
                          key={`shadow-${idx}`}
                          pokemon={pokemon}
                          status="keep"
                        />
                      ))}
                    </Stack>
                  </Box>
                )}

                {totalDelete > 0 && (
                  <Box>
                    <Stack direction="row" spacing={1}>
                      <Typography
                        variant="subtitle2"
                        color="error.main"
                        gutterBottom
                      >
                        🗑️ SAFE TO DELETE ({totalDelete})
                      </Typography>
                      <Tooltip title="Export deletables for this species">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            exportGroupDeletables(group);
                          }}
                          disabled={totalDelete === 0}
                        >
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                    <Stack spacing={1}>
                      {group.normalDelete.map((pokemon, idx) => (
                        <PokemonRow
                          key={idx}
                          pokemon={pokemon}
                          status="delete"
                        />
                      ))}
                      {group.shadowDelete.map((pokemon, idx) => (
                        <PokemonRow
                          key={`shadow-${idx}`}
                          pokemon={pokemon}
                          status="delete"
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
              </Stack>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Stack>
  );
}

interface PokemonRowProps {
  pokemon: Pokemon & {
    calculatedRank?: {
      percentile: number;
      isBuilt: boolean;
      cp: number;
      evolutionRanks?: EvolutionRankInfo[];
      bestEvolutionRank?: EvolutionRankInfo | null;
      rankingInfo?: {
        rank: number;
        rating: number;
      };
    };
  };
  status: 'keep' | 'delete';
}

function PokemonRow({ pokemon, status }: PokemonRowProps) {
  const isBuilt = pokemon.calculatedRank?.isBuilt ?? false;
  const percentile = pokemon.calculatedRank?.percentile ?? 100;
  const cp = pokemon.stats.cp ?? 0;
  const bestEvolution = pokemon.calculatedRank?.bestEvolutionRank;
  const rankingInfo = pokemon.calculatedRank?.rankingInfo;

  // Determine why this Pokemon is being kept
  const currentFormGood = percentile >= 85; // Top 15% in current form
  const evolutionGood = bestEvolution && bestEvolution.percentile >= 85; // Top 15% when evolved
  const keptForEvolution =
    evolutionGood &&
    (!currentFormGood || bestEvolution.percentile > percentile + 5);
  const keptForBoth = currentFormGood && evolutionGood;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        //bgcolor: status === 'keep' ? 'success.50' : 'grey.50',
        borderColor: status === 'keep' ? 'success.main' : 'grey.300',
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Box flex={1}>
          <Typography variant="body2">
            IVs: {pokemon.stats.ivs.attack}/{pokemon.stats.ivs.defense}/
            {pokemon.stats.ivs.stamina}
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
          >
            <Typography variant="caption" color="text.secondary">
              CP: {cp}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              •
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Current: {percentile.toFixed(1)}%
            </Typography>
            {rankingInfo && (
              <>
                <Typography variant="caption" color="text.secondary">
                  •
                </Typography>
                <Chip
                  label={`#${rankingInfo.rank} ${pokemon.name} (${rankingInfo.rating.toFixed(1)})`}
                  size="small"
                  color="warning"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              </>
            )}
            {bestEvolution && (
              <>
                <Typography variant="caption" color="text.secondary">
                  •
                </Typography>
                <Chip
                  label={`${bestEvolution.evolvedSpeciesName}: ${bestEvolution.percentile.toFixed(1)}%${
                    bestEvolution.rankingInfo
                      ? ` (#${bestEvolution.rankingInfo.rank})`
                      : ''
                  }`}
                  size="small"
                  color={evolutionGood ? 'primary' : 'default'}
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              </>
            )}
            {isBuilt && (
              <>
                <Typography variant="caption" color="text.secondary">
                  •
                </Typography>
                <Chip
                  label="Already Built"
                  size="small"
                  color="info"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              </>
            )}
          </Stack>
        </Box>

        {status === 'keep' && (
          <Tooltip
            title={
              isBuilt
                ? 'Keeping because already powered up'
                : keptForBoth
                  ? `Keeping: Good as both ${pokemon.name} and ${bestEvolution?.evolvedSpeciesName}`
                  : keptForEvolution
                    ? `Keeping for ${bestEvolution?.evolvedSpeciesName} evolution`
                    : 'Keeping: Best for current form'
            }
          >
            <CheckCircle color="success" fontSize="small" />
          </Tooltip>
        )}
      </Stack>
    </Paper>
  );
}
