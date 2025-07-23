import CatchingPokemonTwoToneIcon from '@mui/icons-material/CatchingPokemonTwoTone';
import PanToolAltIcon from '@mui/icons-material/PanToolAlt';
export function Logo() {
  return (
    <>
      <PanToolAltIcon sx={{ transform: 'rotate(90deg)', color: 'pink' }} />
      <CatchingPokemonTwoToneIcon sx={{ color: 'pink' }} />
    </>
  );
}
