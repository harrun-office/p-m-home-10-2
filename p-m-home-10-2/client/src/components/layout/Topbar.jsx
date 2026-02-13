import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Moon, Sun, Menu, X, User } from 'lucide-react';
import { getSession, clearSession } from '../../store/sessionStore.js';
import { removeToken } from '../../utils/authToken.js';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useSidebar } from '../../context/SidebarContext.jsx';

const HEADER_HEIGHT = 64; // Match sidebar header (h-16)

/** Map current pathname to a short page title for the header. */
function getPageTitle(pathname, isAdmin) {
  const base = isAdmin ? '/admin' : '/app';
  if (!pathname.startsWith(base)) return '';
  const rest = pathname.slice(base.length).replace(/^\/+/, '') || 'index';
  const parts = rest.split('/').filter(Boolean);
  const segment = parts[0];
  const isDetail = parts.length > 1;
  const map = isAdmin
    ? {
      '': 'Dashboard',
      index: 'Dashboard',
      projects: isDetail ? 'Project' : 'Projects',
      tasks: 'Tasks',
      profile: 'Profile',
      notifications: 'Notifications',
      users: isDetail ? 'Employee' : 'Employees',
      'dev-tools': 'Dev Tools',
    }
    : {
      '': 'Dashboard',
      index: 'Dashboard',
      projects: isDetail ? 'Project' : 'My Projects',
      tasks: 'My Tasks',
      profile: 'Profile',
      notifications: 'Notifications',
    };
  return map[segment] ?? segment?.replace(/-/g, ' ') ?? 'Dashboard';
}

/**
 * Modern enterprise header component following international design standards
 * Features: clean layout, proper accessibility, responsive design, semantic HTML
 */
export function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getSession();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const { collapsed, toggleSidebar } = useSidebar();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const menuRef = useRef(null);
  const userInitial = session?.name?.charAt(0)?.toUpperCase() ?? '?';
  const displayName = session?.name || 'User';
  const pageTitle = useMemo(
    () => getPageTitle(location.pathname, session?.role === 'ADMIN'),
    [location.pathname, session?.role]
  );

  function handleLogout() {
    setProfileOpen(false);
    removeToken();
    clearSession();
    navigate('/login', { replace: true });
  }

  function handleProfile() {
    setProfileOpen(false);
    navigate(session?.role === 'ADMIN' ? '/admin/profile' : '/app/profile');
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        profileOpen &&
        profileRef.current &&
        !profileRef.current.contains(e.target) &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setProfileOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setProfileOpen(false);
    };
    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [profileOpen]);

  if (!session) return null;

  return (
    <header
      className="sticky top-0 z-50 w-full border-b backdrop-blur-xl supports-[backdrop-filter]:bg-[var(--header-bg)]"
      style={{
        height: HEADER_HEIGHT,
        backgroundColor: 'var(--header-bg)',
        borderColor: 'var(--header-border)',
        boxShadow: 'var(--header-shadow)',
      }}
      role="banner"
    >
      <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left Section: Brand & Navigation */}
        <div className="flex items-center gap-4 min-w-0">

          {/* Brand section - always visible */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex flex-col justify-center ml-2">
              <span className="text-sm font-semibold leading-tight truncate" style={{ color: 'var(--fg)' }}>Project Management</span>
              <span className="text-xs font-medium leading-tight truncate max-w-[200px]" style={{ color: 'var(--fg-muted)' }}>
                {pageTitle || 'Dashboard'}
              </span>
            </div>
          </div>
        </div>

        {/* Center Section: Spacer for balance */}
        <div className="flex-1" aria-hidden="true" />

        {/* Right Section: User Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={() => toggleTheme()}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--card)] text-[var(--fg)] shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-[var(--accent)] hover:text-[var(--accent-fg)] hover:border-[var(--accent)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ring-offset)]"
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          >
            {isDark ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          {/* User Profile dropdown */}
          <div ref={profileRef} className="relative">
            {/* User Menu trigger - Desktop */}
            <button
              type="button"
              onClick={() => setProfileOpen((o) => !o)}
              aria-expanded={profileOpen}
              aria-haspopup="true"
              aria-label="User menu"
              className="hidden sm:flex items-center gap-2 rounded-lg border bg-[var(--card)] backdrop-blur-sm px-3 py-2 shadow-sm transition-all duration-200 hover:bg-[var(--muted)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ring-offset)]"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 text-xs font-bold text-white ring-2 shadow-sm opacity-90"
                style={{ boxShadow: '0 0 0 2px var(--header-bg)' }}
              >
                {userInitial}
              </div>
              <div className="flex flex-col items-start min-w-0">
                <span className="text-sm font-medium leading-none truncate max-w-[120px]" style={{ color: 'var(--fg)' }} title={displayName}>
                  {displayName}
                </span>
              </div>
            </button>

            {/* User Avatar trigger - Mobile */}
            <button
              type="button"
              onClick={() => setProfileOpen((o) => !o)}
              aria-expanded={profileOpen}
              aria-haspopup="true"
              aria-label="User menu"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 text-xs font-bold text-white shadow-sm sm:hidden border border-[var(--border)]"
              style={{ boxShadow: '0 0 0 2px var(--header-bg)' }}
            >
              {userInitial}
            </button>

            {/* Dropdown menu */}
            {profileOpen && (
              <div
                ref={menuRef}
                role="menu"
                className="absolute right-0 top-full mt-3 z-50 min-w-[180px] rounded-lg border border-[var(--border)] bg-[var(--card)] py-1 shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleProfile}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--fg)] transition-colors text-left hover:bg-[var(--muted)] hover:text-[var(--fg)]"
                >
                  <User className="h-4 w-4 shrink-0 text-[var(--fg-muted)]" />
                  <span>Profile</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--danger)] transition-colors text-left hover:bg-[var(--danger-light)] hover:text-[var(--danger)]"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
