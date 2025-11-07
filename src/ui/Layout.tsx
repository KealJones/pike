import {
  DashboardLayout,
  DashboardSidebarPageItem,
  type NavigationPageItem,
} from '@toolpad/core';
import { useCallback } from 'react';
import { Outlet } from 'react-router';
import { LeaguePicker } from './FormatPicker';
import { UploadNavItem } from './UploadNavItem';

export function Layout() {
  const renderPageItem = useCallback((item: NavigationPageItem) => {
    switch (item.title) {
      case 'Upload':
        return <UploadNavItem item={item} />;
      case 'Feedback':
        return (
          <DashboardSidebarPageItem
            item={item}
            href="https://docs.google.com/forms/d/e/1FAIpQLScbtAAitxpL5hDJRzGR-QTDv4ZqlLMDMjI-LZJqhjOGnL4xWg/viewform?usp=dialog"
            {...{ target: '_blank' }}
          />
        );
      default:
        return <DashboardSidebarPageItem item={item} />;
    }
  }, []);

  return (
    <DashboardLayout
      defaultSidebarCollapsed
      renderPageItem={renderPageItem}
      slotProps={{
        // @ts-expect-error this is typed incorrectly, all props should be entirely optional
        header: { hideMenuButton: true },
      }}
      slots={{
        toolbarActions: LeaguePicker,
      }}
    >
      <Outlet />
    </DashboardLayout>
  );
}
