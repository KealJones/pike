import { DashboardLayout, PageContainer } from "@toolpad/core";
import { Outlet } from "react-router";

export function Layout() {
  return <DashboardLayout defaultSidebarCollapsed>
    <Outlet />
  </DashboardLayout>;
}
