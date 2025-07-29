import CatchingPokemonTwoToneIcon from '@mui/icons-material/CatchingPokemonTwoTone';
import PanToolAltIcon from '@mui/icons-material/PanToolAlt';
import { Box } from '@mui/material';
export function Logo() {
  return (
    <Box sx={{}}>
      <PanToolAltIcon sx={{ transform: 'rotate(90deg)', color: 'pink' }} />
      <CatchingPokemonTwoToneIcon sx={{ color: 'pink' }} />
    </Box>
  );
}
