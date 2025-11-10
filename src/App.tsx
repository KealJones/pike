import './App.css';

import { QueryStats, TableChart, Upload } from '@mui/icons-material';
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
    title: 'PvP Trade Calculator',
    segment: 'pvp-trade-calculator',
    icon: <QueryStats />,
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
