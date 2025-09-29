import { Avatar, Box, MenuItem, Stack, Typography } from '@mui/material';
import {
  MaterialReactTable,
  MRT_FilterFns,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';
import { useMemo } from 'react';
import {
  pokemonTypes,
  type GameMasterFile,
  type Pokemon,
  type PokemonType,
} from '../types/pokemon.types';
const typeColors: Record<PokemonType, string> = {
  Bug: '#92BC2C',
  Dark: '#595761',
  Dragon: '#0C69C8',
  Electric: '#F2D94E',
  Fire: '#FBA54C',
  Fairy: '#EE90E6',
  Fighting: '#D3425F',
  Flying: '#A1BBEC',
  Ghost: '#5F6DBC',
  Grass: '#5FBD58',
  Ground: '#DA7C4D',
  Ice: '#75D0C1',
  Normal: '#A0A29F',
  Poison: '#B763CF',
  Psychic: '#FA8581',
  Rock: '#C9BB8A',
  Steel: '#5695A3',
  Water: '#539DDF',
  None: '#A0A29F',
  Stellar: '#6A5ACD',
};

export function PokemonDataTable(props: {
  isLoading?: boolean;
  candidates: Pokemon[];
  league: number;
  gameMaster: GameMasterFile;
  shadowPriority: Map<string, { nonShadowIndex: number; shadowIndex: number }>;
}) {
  const shadowPriorityKeys = Array.from(props.shadowPriority.keys());
  const columns = useMemo<MRT_ColumnDef<Pokemon>[]>(
    //column definitions...
    () => [
      {
        header: 'Ranked Target',
        id: 'targetSpeciesId',
        size: 250,
        grow: true,
        filterFn: (row, _, filterValue, addMeta) => {
          return (
            MRT_FilterFns.fuzzy(row, _, filterValue, addMeta) ||
            // Custom logic for filtering the ranked target so that you can find by other evolution names (similar to "+" prefix on pvpoke)
            // TODO: Could add alot more search/filter features similar to PvPoke or PokemonGo https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/1486-searching-filtering-your-pokemon-inventory/
            (row.original.rankTarget?.gm?.family?.parentSpeciesIds?.some(
              (element) => {
                if (typeof element === 'string') {
                  // Filtering should be case insensitive
                  return element
                    .toLowerCase()
                    .includes(filterValue.toLowerCase());
                }
              },
            ) ??
              false)
          );
        },
        enableColumnFilterModes: false,
        accessorFn: (row) =>
          `${row.rank?.index} - ${row.rankTarget?.speciesId}`,
        GroupedCell: ({ row }) => {
          //const { grouping } = table.getState();
          const pvpokeRankScore = row.original.rankTarget?.score ?? 0;
          const optimalMoveset = row.original.rankTarget?.moveset ?? [];
          const eliteMoves = row.original?.rankTarget?.gm?.eliteMoves ?? [];
          return (
            <Stack direction="column" alignItems="center" spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box component="span">
                  <Typography display="inline">
                    #{row.original.rank?.index} -{' '}
                  </Typography>
                  <Typography sx={{ fontWeight: '500', display: 'inline' }}>
                    {row.original.rankTarget?.speciesName}
                  </Typography>{' '}
                  <Typography display="inline">
                    ({row.getLeafRows().length})
                  </Typography>
                  <Typography>Score: {pvpokeRankScore}</Typography>
                </Box>
                <Avatar
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${
                    '' //row.original.shiny ? 'shiny/' : ''
                  }${row.original.rankTarget?.dexId}.png`}
                />
              </Stack>
              <Stack direction={'column'}>
                {optimalMoveset.map((moveId) => (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    key={moveId}
                  >
                    {props.gameMaster.movesById[moveId].name}
                    {eliteMoves.includes(moveId) ? '*' : ''}
                  </Typography>
                ))}
                <Typography variant="caption" color="text.secondary">
                  {shadowPriorityKeys.includes(
                    row.original.rankTarget?.speciesId ?? '',
                  )
                    ? `Non-Shadow Form (Rank #${
                        props.shadowPriority.get(
                          row.original.rankTarget?.speciesId ?? '',
                        )?.nonShadowIndex
                      })`
                    : shadowPriorityKeys.includes(
                          `${row.original.rankTarget?.speciesId}_shadow`,
                        )
                      ? `Shadow Form (Rank #${
                          props.shadowPriority.get(
                            `${row.original.rankTarget?.speciesId}_shadow`,
                          )?.shadowIndex
                        })`
                      : ''}
                </Typography>
              </Stack>
            </Stack>
          );
        },
      },
      {
        header: 'PvPoke Score',
        id: 'pvpokeScore',
        enableHiding: true,
        accessorFn: (row) => row.rankTarget?.score ?? 0,
      },
      {
        header: 'Rank Percentile',
        id: 'rankPercentile',
        grow: true,
        accessorFn: (row) => row.rank?.percentile,

        Cell: ({ cell }) => toPercenage(cell.getValue<number>()),
        filterVariant: 'range-slider',
        filterFn: 'betweenInclusive', // default (or between)
        muiFilterSliderProps: {
          marks: true,
          max: 100, //custom max (as opposed to faceted max)
          min: 0, //custom min (as opposed to faceted min)
          step: 1,
          // valueLabelFormat: (value) =>
          //   value.toLocaleString('en-US', {
          //     style: 'currency',
          //     currency: 'USD',
          //   }),
        },
      },
      {
        header: 'Species ID',
        id: 'speciesId',
        accessorFn: (row) => row.speciesId,
        Cell: ({ cell, row }) =>
          `${row.original.shiny ? '✨ ' : ''}${cell.getValue<string>()}`,
      },
      {
        header: 'Shiny',
        id: 'shiny',
        accessorFn: (row) => row.shiny,
        enableHiding: true,
      },
      {
        header: 'CP',
        id: 'cp',
        grow: true,
        accessorFn: (row) => row.stats?.cp,
        filterVariant: 'range-slider',
        filterFn: 'betweenInclusive', // default (or between)
        muiFilterSliderProps: {
          marks: true,
          max: props.league, //custom max (as opposed to faceted max)
          min: 0, //custom min (as opposed to faceted min)
          step: 1,
          // valueLabelFormat: (value) =>
          //   value.toLocaleString('en-US', {
          //     style: 'currency',
          //     currency: 'USD',
          //   }),
        },
      },
      {
        header: 'Types',
        id: 'types',
        grow: true,
        accessorFn: (row) =>
          row.types
            .map((type) => type.charAt(0).toUpperCase() + type.slice(1))
            .join(', '),
        filterVariant: 'multi-select',
        columnFilterModeOptions: ['includesString', 'equalsString'],
        renderColumnFilterModeMenuItems: ({ onSelectFilterMode }) => [
          <MenuItem key="0" onClick={() => onSelectFilterMode('oneOf')}>
            <div>One of</div>
          </MenuItem>,
          <MenuItem key="1" onClick={() => onSelectFilterMode('anyOf')}>
            <div>Any of</div>
          </MenuItem>,
          <MenuItem key="2" onClick={() => onSelectFilterMode('allOf')}>
            <div>All of</div>
          </MenuItem>,
          <MenuItem key="3" onClick={() => onSelectFilterMode('not')}>
            <div>None of</div>
          </MenuItem>,
        ],
        filterSelectOptions: pokemonTypes,
        Cell: ({ cell }) => {
          const types = cell.getValue() as string;

          return (
            <Stack direction="row" spacing={1}>
              {types.split(', ').map((type) => {
                if (type === 'None') {
                  return null;
                }
                return (
                  <Avatar
                    sx={{
                      bgcolor: typeColors[type as PokemonType],
                      width: 24,
                      height: 24,
                    }}
                    key={type}
                  >
                    <Box
                      component={'img'}
                      sx={{
                        width: '60%',
                        height: '60%',
                      }}
                      src={`/pike/icons/${type.toLowerCase()}.svg`}
                    />
                  </Avatar>
                );
              })}
            </Stack>
          );
        },
      },
      {
        header: 'Target CP',
        id: 'targetCp',
        grow: true,
        accessorFn: (row) => row.rank?.potentialCP,
      },
      {
        header: 'Shadow Form is ranked higher',
        id: 'shadowRankedHigher',
        filterVariant: 'select', // This will render a checkbox in the filter
        accessorFn: (row) =>
          shadowPriorityKeys.includes(row.rankTarget?.speciesId ?? '')
            ? 'True'
            : 'False',
        filterSelectOptions: ['True', 'False'],
      },
      {
        header: 'Attack IV',
        id: 'attackIv',
        grow: true,
        accessorFn: (row) => row.stats?.ivs.attack,
      },
      {
        header: 'Defense IV',
        id: 'defenseIv',
        grow: true,
        accessorFn: (row) => row.stats?.ivs.defense,
      },
      {
        header: 'Stamina IV',
        id: 'staminaIv',
        grow: true,
        accessorFn: (row) => row.stats?.ivs.stamina,
      },
      // {
      //   header: 'Age',
      //   accessorKey: 'age',
      // },
      // {
      //   header: 'Gender',
      //   accessorKey: 'gender',
      // },
      // {
      //   header: 'State',
      //   accessorKey: 'state',
      // },
      // {
      //   header: 'Salary',
      //   accessorKey: 'salary',
      // },
    ],
    [],
    //end
  );

  const table = useMaterialReactTable({
    columns,
    data: props.candidates,
    enableGrouping: true,
    enableStickyHeader: true,
    enableColumnOrdering: true,
    enablePagination: false,
    enableColumnResizing: true,
    enableColumnFilterModes: true,
    enableRowVirtualization: true,
    muiToolbarAlertBannerProps: undefined,
    state: { isLoading: props.isLoading ?? false },
    initialState: {
      density: 'compact',
      expanded: true, //expand all groups by default
      grouping: ['targetSpeciesId'], //an array of columns to group by by default (can be multiple)
      //pagination: { pageIndex: 0, pageSize: 100 },
      columnVisibility: {
        shiny: false,
        pvpokeScore: false,
      },
      sorting: [
        {
          id: 'targetSpeciesId', // The accessor or id of the column to sort by
          desc: false, // true for descending, false for ascending
        },
        {
          id: 'rankPercentile', // The accessor or id of the column to sort by
          desc: true, // true for descending, false for ascending
        },
      ],
    },
    filterFns: {
      oneOf: (row, id, filterValue: string[]) => {
        const rawValue: string = row.original.ty.getValue(id);
        const value = rawValue.split(',').map((v) => v.trim());
        return filterValue.some(
          (filter) => value.includes(filter) && value.includes('None'),
        );
      },
      anyOf: (row, id, filterValue: string[]) => {
        const rawValue: string = row.getValue(id);
        const value = rawValue.split(',').map((v) => v.trim());
        return filterValue.some((filter) => value.includes(filter));
      },
      allOf: (row, id, filterValue: string[]) => {
        //console.log('allOf filterValue', filterValue);
        const rawValue: string = row.getValue(id);
        const value = rawValue.split(',').map((v) => v.trim());
        return filterValue.every((filter) => {
          return value.includes(filter);
        });
      },
      not: (row, id, filterValue: string[]) => {
        const rawValue: string = row.getValue(id);
        const value = rawValue.split(',').map((v) => v.trim());
        return !filterValue.some((filter) => value.includes(filter));
      },
    },
    muiTableContainerProps: { sx: { flexGrow: 1 } },
    muiTableBodyCellProps: ({ cell }) => ({
      ...(cell.getIsGrouped() ? { colSpan: 2 } : {}),
    }),
    muiTableBodyRowProps: ({ row }) => ({
      //conditionally style selected rows
      sx: {
        backgroundColor:
          row.original.rank?.potentialCP == row.original.stats?.cp
            ? 'green'
            : undefined,
      },
    }),
  });

  return <MaterialReactTable table={table} />;
}

function toPercenage(num: number): string {
  return `${roundToOneDecimal(num)}%`;
}
function roundToOneDecimal(num: number): number {
  return Math.round(num * 10) / 10;
}
