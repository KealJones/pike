import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { CssBaseline } from '@mui/material'
import { ErrorBoundary } from 'react-error-boundary';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CssBaseline />
      <ErrorBoundary fallback={<div>Something went wrong.</div>} onError={(error, info) => {
        console.error("Error caught by ErrorBoundary:", error);
        console.info("Error info:", info);
      }}>
        <App />
      </ErrorBoundary>
  </StrictMode>,
)
