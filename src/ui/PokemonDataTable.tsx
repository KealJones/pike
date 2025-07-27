import { MaterialReactTable, useMaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { useMemo } from 'react';
import { type GameMasterFile, type Pokemon, type PokemonType, pokemonTypes } from '../types/pokemon.types';
import { Avatar, Stack, Box, Typography, MenuItem } from '@mui/material';
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

export function PokemonDataTable(props: { candidates: Pokemon[]; league: number; gameMaster: GameMasterFile }) {
  //const state = use
  const columns = useMemo<MRT_ColumnDef<Pokemon>[]>(
    //column definitions...
    () => [
      {
        header: 'Ranked Target',
        id: 'targetSpeciesId',
        accessorFn: (row) => `${row.rank?.index} - ${row.rankTarget?.speciesId}`,
        GroupedCell: ({ row }) => {
          //const { grouping } = table.getState();
          const optimalMoveset = row.original.rankTarget?.moveset ?? [];

          return (
            <Stack direction="column" alignItems="center" spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box component="span">
                  #{row.original.rank?.index} - {row.original.rankTarget?.speciesId.toUpperCase()} (
                  {row.getLeafRows().length})
                </Box>
                <Avatar
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${
                    row.original.shiny ? 'shiny/' : ''
                  }${row.original.rankTarget?.dexId}.png`}
                />
              </Stack>
              <Stack direction={'column'}>
                {optimalMoveset.map((moveId) => (
                  <Typography variant="caption" color="text.secondary">
                    {props.gameMaster.movesById[moveId].name}
                  </Typography>
                ))}
              </Stack>
            </Stack>
          );
        },
      },
      {
        header: 'Unqualified Candidates',
        id: 'unqualifiedCandidates',
        enableHiding: true,
        accessorFn: (row) => row.rank?.unqualifiedCandidateCount?.count ?? 0,
      },
      {
        header: 'Rank Percentile',
        id: 'rankPercentile',
        accessorFn: (row) => toPercenage(row.rank?.percentile ?? 0),
      },
      {
        header: 'Species ID',
        id: 'speciesId',
        accessorFn: (row) => row.speciesId,
      },
      {
        header: 'CP',
        id: 'cp',
        accessorFn: (row) => row.stats?.cp,
        filterVariant: 'range-slider',
        filterFn: 'betweenInclusive', // default (or between)
        muiFilterSliderProps: {
          marks: true,
          max: 1500, //custom max (as opposed to faceted max)
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
        accessorFn: (row) => row.types.map((type) => type.charAt(0).toUpperCase() + type.slice(1)).join(', '),
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
                  <Avatar sx={{ bgcolor: typeColors[type as PokemonType] }} key={type}>
                    <Box
                      component={'img'}
                      sx={{
                        width: '60%',
                        height: '60%',
                      }}
                      src={`/poke/icons/${type.toLowerCase()}.svg`}
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
        accessorFn: (row) => row.rank?.potentialCP,
      },
      {
        header: 'Attack IV',
        id: 'attackIv',
        accessorFn: (row) => row.stats?.ivs.attack,
      },
      {
        header: 'Stamina IV',
        id: 'staminaIv',
        accessorFn: (row) => row.stats?.ivs.stamina,
      },
      {
        header: 'Defense IV',
        id: 'defenseIv',
        accessorFn: (row) => row.stats?.ivs.defense,
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
    []
    //end
  );

  const table = useMaterialReactTable({
    columns,
    data: props.candidates,
    enableGrouping: true,
    enableStickyHeader: true,
    enableColumnOrdering: true,
    enableColumnResizing: true,
    enableColumnFilterModes: true,
    initialState: {
      expanded: true, //expand all groups by default
      grouping: ['targetSpeciesId'], //an array of columns to group by by default (can be multiple)
      pagination: { pageIndex: 0, pageSize: 500 },
      columnVisibility: { unqualifiedCandidates: false },
    },
    filterFns: {
      oneOf: (row, id, filterValue: string[]) => {
        const value: string = row.getValue(id);
        console.log('oneOf value', value);
        return filterValue.some((filter) => value.includes(filter));
      },
      anyOf: (row, id, filterValue: string[]) => {
        const value: string = row.getValue(id);
        return filterValue.some((filter) => value.includes(filter));
      },
      allOf: (row, id, filterValue: string[]) => {
        console.log('allOf filterValue', filterValue);
        return filterValue.every((filter) => {
          const value: string = row.getValue(id);
          console.log('value', value);
          return filter.includes(value);
        });
      },
      not: (row, id, filterValue: string[]) => {
        const value: string = row.getValue(id);
        return !filterValue.some((filter) => value.includes(filter));
      },
    },
    muiTableContainerProps: { sx: { maxHeight: '800px' } },
    muiTableBodyCellProps: ({ cell }) => ({
      ...(cell.getIsGrouped() ? { colSpan: 2 } : {}),
    }),
    muiTableBodyRowProps: ({ row }) => ({
      //conditionally style selected rows
      sx: {
        backgroundColor: row.original.rank?.potentialCP == row.original.stats?.cp ? 'green' : undefined,
      },
    }),
  });

  return (
    <Stack gap="1rem">
      <MaterialReactTable table={table} />
    </Stack>
  );
}

function toPercenage(num: number): string {
  return `${roundToOneDecimal(num)}%`;
}
function roundToOneDecimal(num: number): number {
  return Math.round(num * 10) / 10;
}
