// frontend/src/layout/AppLayout.jsx
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "../hooks/sidebarContext.jsx";
import Sidebar from "../components/menubars/Sidebar.jsx";
import Topbar  from "../components/menubars/Topbar.jsx";
import { usePageTitle } from "../hooks/usePageTitle.js";

function LayoutShell({ navItems }) {
  const title = usePageTitle();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar navItems={navItems} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar title={title} />

        <main className="flex-1 overflow-y-auto">
          <div className="p-5 md:p-6 max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AppLayout({ navItems }) {
  return (
    <SidebarProvider>
      <LayoutShell navItems={navItems} />
    </SidebarProvider>
  );
}