import './App.css';

import { Upload } from '@mui/icons-material';
import type { Navigation } from '@toolpad/core/AppProvider';
import { ReactRouterAppProvider } from '@toolpad/core/react-router';
import { Outlet } from 'react-router';
import { Logo } from './ui/Logo';
import theme from './ui/theme';

const NAVIGATION: Navigation = [
  {
    title: 'Upload',
    icon: <Upload />,
    //segment: 'upload',
  },
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
      <Outlet />
    </ReactRouterAppProvider>
  );
}

export default App;
