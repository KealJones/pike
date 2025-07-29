import './App.css';

import { Outlet } from 'react-router';
import { ReactRouterAppProvider } from '@toolpad/core/react-router';
import type { Navigation } from '@toolpad/core/AppProvider';
import { Logo } from './ui/Logo';
import { DialogsProvider } from '@toolpad/core/useDialogs';
import theme from './ui/theme';
import { Upload } from '@mui/icons-material';

const NAVIGATION: Navigation = [
  {
    title: 'Upload',
    icon: <Upload />,
    //segment: 'upload',
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
