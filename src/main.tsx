import { CssBaseline, ThemeProvider } from '@mui/material';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import App from './App.tsx';
import './AppStore.ts';
import './index.css';
import BottleCapCalculatorPage from './pages/BottleCapCalculatorPage.tsx';
import AnalysisPage from './pages/index.tsx';
import PvpTradeCalculatorPage from './pages/PvpTradeCalculator.tsx';
import { Layout } from './ui/Layout.tsx';
import theme from './ui/theme.ts';

const router = createBrowserRouter(
  [
    {
      Component: App,
      children: [
        {
          Component: Layout,
          children: [
            { path: '/', Component: AnalysisPage },
            {
              path: '/pvp-trade-calculator',
              Component: PvpTradeCalculatorPage,
            },
            {
              path: '/bottle-cap-calculator',
              Component: BottleCapCalculatorPage,
            },
          ],
        },
      ],
    },
  ],
  { basename: '/pike/' },
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CssBaseline />
    <ThemeProvider theme={theme}>
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>,
);
