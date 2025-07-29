import { DashboardLayout, DashboardSidebarPageItem, useDialogs, type NavigationPageItem } from '@toolpad/core';
import { Outlet } from 'react-router';
import { useCallback } from 'react';
import { UploadStorageDialog } from './UploadStorageDialog';

export function Layout() {
    const dialogManager = useDialogs();
  const renderPageItem = useCallback((item: NavigationPageItem) => {
    if (item.title === 'Upload') {
      // @ts-expect-error onClick does get passed in correctly
      return <DashboardSidebarPageItem item={item} onClick={() => dialogManager.open(UploadStorageDialog)} />;
    }

    return <DashboardSidebarPageItem item={item} />;
  }, []);

  return (
    <DashboardLayout
      defaultSidebarCollapsed
      renderPageItem={renderPageItem}
      // @ts-expect-error this is typed incorrectly, all props should be entirely optional
      slotProps={{ header: { hideMenuButton: true } }}
    >
      <Outlet />
    </DashboardLayout>
  );
}
