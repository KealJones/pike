import { MenuItem, Stack, TextField, Typography } from '@mui/material';
import {
  formatRankingScenarios,
  useFormat,
  type FormatRankingScenario,
} from '../AppStore';
import { useFormatList } from '../hooks/useFormatList';

export const LeaguePicker = () => {
  const formatList = useFormatList();
  const formatTitle = useFormat((state) => state.formatTitle);
  const rankingScenario = useFormat((state) => state.rankingScenario);
  const setFormat = useFormat((state) => state.setFormat);

  return (
    <Stack direction="row" alignItems="center">
      <Typography
        component="a"
        href="https://pvpoke.com/rankings/"
        variant="caption"
        color="text.secondary"
        mr={2}
      >
        Ranking Data by PvPoke
      </Typography>
      <TextField
        select
        onChange={(event) => {
          setFormat(event.target.value, rankingScenario);
        }}
        value={formatTitle}
        aria-label="PvP Format Selection"
      >
        {formatList
          .filter((option) => !option.hideRankings)
          .map((option) => (
            <MenuItem key={option.title} value={option.title}>
              {option.title}
            </MenuItem>
          ))}
      </TextField>
      <TextField
        select
        onChange={(event) => {
          setFormat(formatTitle, event.target.value as FormatRankingScenario);
        }}
        value={rankingScenario}
        aria-label="PvP Format Selection"
      >
        {formatRankingScenarios.map((option) => (
          <MenuItem key={option} value={option}>
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </MenuItem>
        ))}
      </TextField>
    </Stack>
  );
};

// function getLeagueColor(value: LeagueCpCap, isStripe: boolean = false) {
//   switch (value) {
//     case 1500:
//       return isStripe ? '#EF4444, #DC2626 100%' : '#60A5FA, #3B82F6 100%';
//     case 2500:
//       return isStripe ? '#F59E0B, #D97706 100%' : '#374151, #1F2937 100%';
//     case 10000:
//       return isStripe ? '#EC4899, #DB2777 100%' : '#8B5CF6, #7C3AED 100%';
//     default:
//       throw new Error('Unknown league value');
//   }
// }

// const LeagueToggleButton = ({ value }: { value: LeagueCpCap }) => {
//   const league = useLeague((state) => state.league);
//   const isActive = league === value;
//   return (
//     <ToggleButton
//       value={value}
//       sx={{
//         transition: 'all 0.2s ease',
//         filter: isActive ? 'none' : 'grayscale(.75)',
//         overflow: 'hidden',
//         color: isActive ? '#fff' : '#888',
//         zIndex: 1,
//         outline: 'none',
//         backgroundImage: `linear-gradient(to bottom right, ${getLeagueColor(
//           value,
//         )})`,
//         ':hover': {
//           filter: 'none',
//           color: '#fff',
//           outline: 'none',
//         },
//         ':active': {
//           outline: 'none',
//         },
//       }}
//     >
//       <Box
//         sx={{
//           position: 'absolute',
//           top: '-80px',
//           right: '40px',
//           zIndex: 0,
//           width: '1.25rem',
//           height: '18rem',
//           backgroundImage: `linear-gradient(to bottom, ${getLeagueColor(
//             value,
//             true,
//           )})`,
//           transform: 'rotate(45deg)',
//           opacity: 0.9,
//         }}
//       />
//       <Typography
//         variant="body1"
//         zIndex={1}
//         fontWeight={value === league ? 'bold' : 'normal'}
//       >
//         {leagueCpCapToName[value]} - {value}
//       </Typography>
//     </ToggleButton>
//   );
// };
