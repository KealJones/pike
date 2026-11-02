import './App.css';

import {
  ContentCopy,
  QueryStats,
  Science,
  Search,
  SportsEsports,
  TableChart,
  Upload,
} from '@mui/icons-material';
import type { Navigation } from '@toolpad/core/AppProvider';
import { ReactRouterAppProvider } from '@toolpad/core/react-router';
import { DialogsProvider } from '@toolpad/core/useDialogs';
import { Outlet } from 'react-router';
import { Logo } from './ui/Logo';
import theme from './ui/theme';

const NAVIGATION: Navigation = [
  {
    title: 'Upload',
    segment: 'upload',
    icon: <Upload />,
  },
  {
    title: 'Storage Rankings',
    segment: '',
    icon: <TableChart />,
  },
  {
    title: 'Duplicate Manager',
    segment: 'duplicate-manager',
    icon: <ContentCopy />,
  },
  {
    title: 'PvP Trade Calculator',
    segment: 'pvp-trade-calculator',
    icon: <QueryStats />,
  },
  {
    title: 'Bottle Cap Calculator',
    segment: 'bottle-cap-calculator',
    icon: <Science />,
  },
  {
    title: 'Search String Builder',
    segment: 'search-string-builder',
    icon: <Search />,
  },
  {
    title: 'PvP Simulation',
    segment: 'pvp-simulation',
    icon: <SportsEsports />,
  },
  // Future extras:
  // { title: 'Feedback', icon: <Feedback /> },
];

const BRANDING = {
  title: 'Piké',
  logo: <Logo />,
};

function App() {
  return (
    <ReactRouterAppProvider
      navigation={NAVIGATION}
      branding={BRANDING}
      theme={theme}
    >
      <DialogsProvider>
        <Outlet />
      </DialogsProvider>
    </ReactRouterAppProvider>
  );
}

export default App;
