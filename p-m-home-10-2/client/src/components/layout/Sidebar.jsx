import { useState } from 'react';
import { NavLink, useMatch, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, FolderKanban } from 'lucide-react';
import { getSession } from '../../store/sessionStore.js';
import { useDataStore } from '../../store/dataStore.jsx';
import { getNavGroups } from './navConfig.js';
import { useSidebar } from '../../context/SidebarContext.jsx';

/**
 * Modern enterprise sidebar component following international design standards
 * Features: clean layout, proper accessibility, responsive design, semantic HTML
 */
function NavItem({ to, label, icon: Icon, basePath, unreadCount = 0, collapsed, delay = 0, isOverviewGroup = false }) {
  const match = useMatch({ path: to, end: to === basePath });
  const isNavActive = !!match;

  return (
    <NavLink
      to={to}
      end={to === basePath}
      aria-current={isNavActive ? 'page' : undefined}
      title={collapsed ? label : undefined}
      onClick={collapsed ? (e) => e.stopPropagation() : undefined}
      className={({ isActive: active }) =>
        `group relative flex items-center gap-3 rounded-lg transition-all duration-300 ease-out ${collapsed ? 'px-2 py-3 justify-center' : 'px-3 py-2.5'
        } text-sm font-medium ${active
          ? 'bg-gradient-to-r from-blue-50/80 to-indigo-50/80 text-blue-700 shadow-sm ring-1 ring-blue-200/30 backdrop-blur-sm'
          : 'text-muted-foreground hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-indigo-50/80 hover:text-blue-700 hover:shadow-sm hover:ring-1 hover:ring-blue-200/30 hover:backdrop-blur-sm'
        }`
      }
      style={{
        transitionDelay: `${delay}ms`,
      }}
    >
      {/* Active indicator */}
      {isNavActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-r-full" />
      )}

      <Icon
        className={`${collapsed ? 'h-5 w-5' : 'h-4 w-4'
          } flex-shrink-0 transition-all duration-300 ${isNavActive
            ? 'text-blue-600 scale-110'
            : 'group-hover:scale-105'
          }`}
        aria-hidden
      />

      {!collapsed && (
        <div className="flex items-center justify-between flex-1 min-w-0">
          <span className="truncate transition-all duration-300 ease-out group-hover:translate-x-0.5">
            {label}
          </span>
          {unreadCount > 0 && (
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm transition-all duration-300 ${isNavActive
              ? 'bg-red-500 scale-110 shadow-lg'
              : 'bg-red-500 group-hover:scale-105'
              }`}
              style={{ transitionDelay: `${delay + 50}ms` }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      )}

      {/* Hover effect - Overview section only */}
      {isOverviewGroup && (
        <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
      )}
    </NavLink>
  );
}

function SidebarNavContent({ groups, basePath, unreadCount, collapsed }) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Main navigation">
      <div className="space-y-6">
        {groups.map((group, groupIndex) => (
          <div key={group.label} className="space-y-2">
            {!collapsed && (
              <h2
                className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 transition-all duration-300 ease-out"
                style={{ transitionDelay: `${groupIndex * 100}ms` }}
              >
                {group.label}
              </h2>
            )}
            <ul className="space-y-1">
              {group.links.map((link, linkIndex) => (
                <li key={link.to} className={collapsed ? "flex justify-center" : ""}>
                  <NavItem
                    to={link.to}
                    label={link.label}
                    icon={link.icon}
                    basePath={basePath}
                    unreadCount={link.showUnread ? unreadCount : 0}
                    collapsed={collapsed}
                    delay={(groupIndex * 100) + (linkIndex * 50)}
                    isOverviewGroup={group.label === 'Overview'}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}

export function Sidebar() {
  const session = getSession();
  const { state } = useDataStore();
  const { collapsed, toggleCollapsed } = useSidebar();
  const [collapsedHovered, setCollapsedHovered] = useState(false);

  const isAdmin = session?.role === 'ADMIN';
  const basePath = isAdmin ? '/admin' : '/app';
  const groups = getNavGroups(isAdmin);

  const unreadCount = session
    ? (state.notifications || []).filter((n) => n.userId === session.userId && !n.read).length
    : 0;

  return (
    <aside
      className={`fixed left-0 top-0 z-[60] h-screen border-r border-border/40 bg-background/95 backdrop-blur-xl transition-all duration-300 ease-out shadow-2xl ${collapsed ? 'w-16' : 'w-64'
        }`}
      role="navigation"
      aria-label="Main sidebar"
      onMouseEnter={() => collapsed && setCollapsedHovered(true)}
      onMouseLeave={() => setCollapsedHovered(false)}
    >
      <div className="flex h-full flex-col">
        {/* Header/Logo Section */}
        <div
          className={`flex h-16 shrink-0 items-center border-b border-border/40 transition-all duration-300 ${collapsed ? 'relative px-2' : 'justify-between px-4'
            }`}
        >
          {collapsed ? (
            <div className="relative flex flex-1 items-center justify-center min-w-0 min-h-[4rem]">
              <Link
                to={basePath}
                className={`absolute inset-0 flex items-center justify-center rounded-lg p-1 transition-opacity duration-200 ${collapsedHovered ? 'opacity-0 pointer-events-none' : 'opacity-100'
                  }`}
                title="Project Management"
                onClick={(e) => { if (collapsed) { e.preventDefault(); toggleCollapsed(); } }}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white shadow-lg transition-all duration-200 hover:scale-105">
                  <FolderKanban className="h-4 w-4" />
                </div>
              </Link>
              <button
                onClick={toggleCollapsed}
                className={`absolute inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-card text-foreground shadow-md shadow-black/5 ring-1 ring-black/[0.04] backdrop-blur-md transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:shadow-lg hover:scale-105 hover:border-border active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 ${collapsedHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                  }`}
                title="Open sidebar"
                aria-label="Open sidebar"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <Link
                to={basePath}
                className="group flex items-center gap-3 rounded-lg p-1 transition-all duration-200 hover:bg-accent/50"
                title="Project Management"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white shadow-lg transition-all duration-200 group-hover:scale-105">
                  <FolderKanban className="h-4 w-4" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-bold text-foreground leading-none">
                    Project Management
                  </span>
                </div>
              </Link>
              <button
                onClick={toggleCollapsed}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-card text-foreground shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:shadow-md hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Navigation Section - when collapsed: click empty space to open; click a link to navigate */}
        <div
          className={`flex-1 overflow-hidden ${collapsed ? 'cursor-pointer' : ''}`}
          onClick={collapsed ? toggleCollapsed : undefined}
          role={collapsed ? 'button' : undefined}
          tabIndex={collapsed ? 0 : undefined}
          aria-label={collapsed ? 'Open sidebar' : undefined}
          onKeyDown={collapsed ? (e) => e.key === 'Enter' && toggleCollapsed() : undefined}
        >
          <SidebarNavContent
            groups={groups}
            basePath={basePath}
            unreadCount={unreadCount}
            collapsed={collapsed}
          />
        </div>

      </div>
    </aside>
  );
}
