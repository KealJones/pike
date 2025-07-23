import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { CssBaseline } from '@mui/material'
import { createBrowserRouter, RouterProvider } from 'react-router';
import AnalysisPage from './pages/index.tsx'
import { Layout } from './ui/Layout.tsx'

const router = createBrowserRouter([
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
], {basename:'/poke/'});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CssBaseline />
    <RouterProvider router={router} />
  </StrictMode>,
)
