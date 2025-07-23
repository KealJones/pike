import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  colorSchemes: { light: true, dark: true },
  cssVariables: {
    colorSchemeSelector: 'class',
  },
  palette: {
    mode: 'dark',
    primary: {
      main: '#fafafa',
    },
    secondary: {
      main: '#00b0ff',
    },
    error: {
      main: '#ff1744',
    },
  },
  typography: {
    h2: {
      fontFamily: 'Montserrat',
    },
    fontFamily: 'Montserrat',
  },
});

export default theme;
