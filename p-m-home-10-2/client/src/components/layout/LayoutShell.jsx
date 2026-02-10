import { Sidebar } from './Sidebar.jsx';
import { Topbar } from './Topbar.jsx';
import { useSidebar, SidebarProvider } from '../../context/SidebarContext.jsx';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

/**
 * Panel + canvas structure: app canvas background, floating sidebar (fixed), content area with margin.
 * 8px spacing scale; sidebar floats with 16px inset; content margin-left matches.
 */
function LayoutShellContent({ children }) {
  const { collapsed, toggleCollapsed } = useSidebar();

  return (
    <div
      className="layout-shell flex min-h-0 flex-1"
      style={{
        background: 'var(--app-canvas)',
        backgroundImage: 'var(--app-canvas-dots)',
        backgroundSize: '24px 24px',
      }}
    >
      <Sidebar />

      {/* Right side: Header + Main content */}
      <div className={`flex-1 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        collapsed ? 'ml-16' : 'ml-64'
      }`}>
        {/* Header positioned below sidebar */}
        <Topbar />

        {/* Main content below header */}
        <main
          className="content-canvas flex-1 overflow-auto scroll-smooth focus:outline-none relative"
          role="main"
          id="main-content"
        >
          <div className="mx-auto w-full max-w-[var(--content-max)] flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function LayoutShell({ children }) {
  return (
    <SidebarProvider>
      <LayoutShellContent>{children}</LayoutShellContent>
    </SidebarProvider>
  );
}
