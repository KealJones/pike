import { CssBaseline, ThemeProvider } from '@mui/material';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import App from './App.tsx';
import './index.css';
import AnalysisPage from './pages/index.tsx';
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
            {
              path: '/',
              Component: AnalysisPage,
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
