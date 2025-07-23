'use client';
import Box from '@mui/material/Box';
import type { Pokemon } from '../types/pokemon.types';

export function PokemonEntry(props: { pokemon: Pokemon }) {
  const singlePokemon = props.pokemon;

  return (
    <Box
      sx={{
        position: 'relative',
        minWidth: '350px',
        aspectRatio: '1 / 1',
        borderRadius: '20px',
        bgcolor:
          (singlePokemon?.stats?.cp ?? 0) > 1400 && (singlePokemon?.stats?.cp ?? 0) < 1500 ? 'green' : singlePokemon.alignment == 'shadow' ? 'purple' : 'orange',
      }}
    >
      <Box
        component={'svg'}
        sx={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          marginBottom: '2rem',
          transitionProperty: 'transform',
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
          transitionDuration: '300ms',
          '--transform-scale-x': '1.5',
          '--transform-scale-y': '1.5',
        }}
        viewBox="0 0 375 283"
        fill="none"
        style={{ opacity: '0.1' }}
      >
        <rect x="159.52" y="175" width="152" height="152" rx="8" transform="rotate(-45 159.52 175)" fill="white" />
        <rect y="107.48" width="152" height="152" rx="8" transform="rotate(-45 0 107.48)" fill="white" />
      </Box>
      <Box
        sx={{
          display: 'flex',
          position: 'relative',
          paddingLeft: '2.5rem',
          paddingRight: '2.5rem',
          paddingTop: '2.5rem',
          justifyContent: 'center',
          alignItems: 'center',
          transitionProperty: 'transform',
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
          transitionDuration: '300ms',
        }}
      >
        <Box
          sx={{
            display: 'block',
            position: 'absolute',
            bottom: '0',
            left: '0',
            marginBottom: '-6rem',
            width: '12rem',
            height: '12rem',
          }}
          style={{
            background: 'radial-gradient(black, transparent 60%)',
            transform: 'rotate3d(0, 0, 1, 20deg) scale3d(1, 0.6, 1)',
            opacity: '0.2',
          }}
        ></Box>
        {/* <!--<img className="relative w-40" src="https://raw.githubusercontent.com/nileplumb/PkmnShuffleMap/refs/heads/master/UICONS/pokemon/${singlePokemon.mon_number}${singlePokemon.mon_isshiny === 'YES' ? 'S' : ''}.png">--> */}
        <Box
          component={'img'}
          sx={{ position: 'relative', width: '10rem' }}
          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${
            singlePokemon.shiny ? 'shiny/' : ''
          }${singlePokemon.dex}.png`}
          alt=""
        />
      </Box>
      <Box
        sx={{
          position: 'relative',
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem',
          paddingBottom: '1.5rem',
          marginTop: '1.5rem',
          color: '#ffffff',
        }}
      >
        <Box component={'span'} sx={{ display: 'block', marginBottom: '-0.25rem', opacity: 0.75 }}>
          {toPercenage(singlePokemon?.rank?.percentile ?? 0)}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ columns: '1' }}>
            <Box
              component={'span'}
              sx={{ display: 'block', fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: 600 }}
            >
              {singlePokemon.alignment == 'shadow' ? '🫟 ' : ''}
              {singlePokemon.shiny ? '✨ ' : ''}
              {singlePokemon.name}
            </Box>
            <Box
              component={'span'}
              sx={{ display: 'block', fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: 600 }}
            >
              <img style={{ height: '12px', display: 'inline-block' }} src="./great-league.png" />{' '}
              {` #${singlePokemon?.rank?.index} ${singlePokemon.rankTarget?.speciesName
                .toUpperCase()} `}
            </Box>
          </Box>
          <Box
            component={'span'}
            sx={{
              color:
                (singlePokemon?.stats?.cp ?? 0) > 1400 && (singlePokemon?.stats?.cp ?? 0) < 1500 ? 'green'
                  : singlePokemon.alignment == 'shadow'
                  ? 'purple'
                  : 'orange',
              display: ['block', 'flex'],
              paddingTop: '0.5rem',
              paddingBottom: '0.5rem',
              paddingLeft: '0.75rem',
              paddingRight: '0.75rem',
              alignItems: 'center',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              lineHeight: ['1rem', 1],
              fontWeight: 700,
              backgroundColor: '#ffffff',
            }}
          >
            {singlePokemon.stats?.cp}
          </Box>
        </Box>
        <pre style={{ display: 'none' }}>${JSON.stringify(singlePokemon, null, 2)}</pre>
      </Box>
    </Box>
  );
}

function toPercenage(num: number): string {
  return `${Math.round(num)}%`;
}
