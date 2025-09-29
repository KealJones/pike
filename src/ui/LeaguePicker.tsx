import {
  Box,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useLeague } from '../AppStore';
import { leagueCpCapToName, type LeagueCpCap } from '../utils/leagues';

export const LeaguePicker = () => {
  const league = useLeague((state) => state.league);
  const setLeague = useLeague((state) => state.setLeague);

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
      <ToggleButtonGroup
        onChange={(_, value) => setLeague(value)}
        value={league}
        exclusive
        aria-label="GO Battle League Selection"
      >
        <LeagueToggleButton value={1500} />
        <LeagueToggleButton value={2500} />
        <LeagueToggleButton value={10000} />
      </ToggleButtonGroup>
    </Stack>
  );
};

function getLeagueColor(value: LeagueCpCap, isStripe: boolean = false) {
  switch (value) {
    case 1500:
      return isStripe ? '#EF4444, #DC2626 100%' : '#60A5FA, #3B82F6 100%';
    case 2500:
      return isStripe ? '#F59E0B, #D97706 100%' : '#374151, #1F2937 100%';
    case 10000:
      return isStripe ? '#EC4899, #DB2777 100%' : '#8B5CF6, #7C3AED 100%';
    default:
      throw new Error('Unknown league value');
  }
}

const LeagueToggleButton = ({ value }: { value: LeagueCpCap }) => {
  const league = useLeague((state) => state.league);
  const isActive = league === value;
  return (
    <ToggleButton
      value={value}
      sx={{
        transition: 'all 0.2s ease',
        filter: isActive ? 'none' : 'grayscale(.75)',
        overflow: 'hidden',
        color: isActive ? '#fff' : '#888',
        zIndex: 1,
        outline: 'none',
        backgroundImage: `linear-gradient(to bottom right, ${getLeagueColor(
          value,
        )})`,
        ':hover': {
          filter: 'none',
          color: '#fff',
          outline: 'none',
        },
        ':active': {
          outline: 'none',
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: '-80px',
          right: '40px',
          zIndex: 0,
          width: '1.25rem',
          height: '18rem',
          backgroundImage: `linear-gradient(to bottom, ${getLeagueColor(
            value,
            true,
          )})`,
          transform: 'rotate(45deg)',
          opacity: 0.9,
        }}
      />
      <Typography
        variant="body1"
        zIndex={1}
        fontWeight={value === league ? 'bold' : 'normal'}
      >
        {leagueCpCapToName[value]} - {value}
      </Typography>
    </ToggleButton>
  );
};
