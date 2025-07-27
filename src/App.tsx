import './App.css';

import { Outlet } from 'react-router';
import { ReactRouterAppProvider } from '@toolpad/core/react-router';
import type { Navigation } from '@toolpad/core/AppProvider';
import { Dashboard } from '@mui/icons-material';
import { Logo } from './ui/Logo';
import { UploadStorageDialogTrigger } from './ui/UploadStorageDialog';
import { DialogsProvider } from '@toolpad/core/useDialogs';
import theme from './ui/theme';

const NAVIGATION: Navigation = [
  {
    title: 'Dashboard',
    icon: <Dashboard />,
    action: <UploadStorageDialogTrigger />,
  },
];

const BRANDING = {
  title: 'Poke',
  logo: <Logo />,
};

function App() {
  return (
    <ReactRouterAppProvider navigation={NAVIGATION} branding={BRANDING} theme={theme}>
      <DialogsProvider>
        <Outlet />
      </DialogsProvider>
    </ReactRouterAppProvider>
  );
}

export default App;
