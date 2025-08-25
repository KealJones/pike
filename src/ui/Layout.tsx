import {
  DashboardLayout,
  DashboardSidebarPageItem,
  type NavigationPageItem,
} from '@toolpad/core';
import { useCallback } from 'react';
import { Outlet } from 'react-router';
import { UploadNavItem } from './UploadNavItem';

export function Layout() {
  const renderPageItem = useCallback((item: NavigationPageItem) => {
    if (item.title === 'Upload') {
      return <UploadNavItem item={item} />;
    }

    return <DashboardSidebarPageItem item={item} />;
  }, []);

  return (
    <DashboardLayout
      defaultSidebarCollapsed
      renderPageItem={renderPageItem}
      // @ts-expect-error this is typed incorrectly, all props should be entirely optional
      slotProps={{ header: { hideMenuButton: true }, toolbarActions: {} }}
    >
      <Outlet />
    </DashboardLayout>
  );
}
