import { Stack, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useLeague } from '../AppStore';

export const LeaguePicker = () => {
  const league = useLeague((state) => state.league);
  const setLeague = useLeague((state) => state.setLeague);

  return (
    <Stack direction="row" alignItems="center">
      <ToggleButtonGroup
        onChange={(_, value) => setLeague(value)}
        value={league}
        exclusive
      >
        <ToggleButton value={1500}>Great League - 1500</ToggleButton>
        <ToggleButton value={2500}>Ultra League - 2500</ToggleButton>
        <ToggleButton value={10000}>Master League - 10000</ToggleButton>
      </ToggleButtonGroup>
    </Stack>
  );
};
