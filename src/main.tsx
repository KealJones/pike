import { CssBaseline, ThemeProvider } from '@mui/material';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router';
import App from './App.tsx';
import './AppStore.ts';
import './index.css';
import BottleCapCalculatorPage from './pages/BottleCapCalculatorPage.tsx';
import DuplicateManagerPage from './pages/DuplicateManagerPage.tsx';
import AnalysisPage from './pages/index.tsx';
import PvpTradeCalculatorPage from './pages/PvpTradeCalculator.tsx';
import SearchStringBuilderPage from './pages/SearchStringBuilderPage.tsx';
import { Layout } from './ui/Layout.tsx';
import theme from './ui/theme.ts';

const router = createHashRouter([
  {
    Component: App,
    children: [
      {
        Component: Layout,
        children: [
          { path: '/', Component: AnalysisPage },
          {
            path: '/duplicate-manager',
            Component: DuplicateManagerPage,
          },
          {
            path: '/pvp-trade-calculator',
            Component: PvpTradeCalculatorPage,
          },
          {
            path: '/bottle-cap-calculator',
            Component: BottleCapCalculatorPage,
          },
          {
            path: '/search-string-builder',
            Component: SearchStringBuilderPage,
          },
        ],
      },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CssBaseline />
    <ThemeProvider theme={theme}>
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>,
);
