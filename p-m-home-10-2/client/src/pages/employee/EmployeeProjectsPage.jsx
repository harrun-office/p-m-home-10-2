import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore.jsx';
import { getSession } from '../../store/sessionStore.js';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { FolderKanban, Filter, Calendar, ChevronRight, PlayCircle, PauseCircle, CheckCircle2 } from 'lucide-react';

/**
 * Employee projects: only projects where assignedUserIds includes session.userId.
 * Improved layout, filters, and project cards.
 */
export function EmployeeProjectsPage() {
  const navigate = useNavigate();
  const { state } = useDataStore();
  const session = getSession();
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!session) navigate('/login', { replace: true });
  }, [session, navigate]);

  const projects = state.projects || [];

  const myProjects = useMemo(() => {
    if (!session) return [];
    return projects.filter((p) => (p.assignedUserIds || []).includes(session.userId));
  }, [projects, session]);

  const filteredProjects = useMemo(() => {
    if (!statusFilter) return myProjects;
    return myProjects.filter((p) => p.status === statusFilter);
  }, [myProjects, statusFilter]);

  const activeCount = myProjects.filter((p) => p.status === 'ACTIVE').length;
  const completedCount = myProjects.filter((p) => p.status === 'COMPLETED').length;
  const hasActiveFilters = !!statusFilter;

  function clearFilters() {
    setStatusFilter('');
  }

  function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  if (!session) return null;

  return (
    <div className="space-y-6 sm:space-y-8">

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card padding="p-4" className="flex items-center gap-4">
          <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--primary-muted)] text-[var(--primary-muted-fg)] shrink-0">
            <FolderKanban className="w-6 h-6" aria-hidden />
          </span>
          <div>
            <p className="text-2xl font-bold tabular-nums text-[var(--fg)]">{myProjects.length}</p>
            <p className="text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider">Total</p>
          </div>
        </Card>
        <Card padding="p-4" className="flex items-center gap-4">
          <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--success-light)] text-[var(--success-muted-fg)] shrink-0">
            <PlayCircle className="w-6 h-6" aria-hidden />
          </span>
          <div>
            <p className="text-2xl font-bold tabular-nums text-[var(--fg)]">{activeCount}</p>
            <p className="text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider">Active</p>
          </div>
        </Card>
        <Card padding="p-4" className="flex items-center gap-4">
          <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--muted)] text-[var(--fg-muted)] shrink-0">
            <CheckCircle2 className="w-6 h-6" aria-hidden />
          </span>
          <div>
            <p className="text-2xl font-bold tabular-nums text-[var(--fg)]">{completedCount}</p>
            <p className="text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider">Completed</p>
          </div>
        </Card>
        {hasActiveFilters && (
          <Card padding="p-4" className="flex items-center gap-4 col-span-2 sm:col-span-1">
            <p className="text-2xl font-bold tabular-nums text-[var(--primary-muted-fg)]">{filteredProjects.length}</p>
            <div>
              <p className="text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider">Results</p>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-1 h-auto py-0.5 text-xs">
                Clear filter
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Filter */}
      <section aria-labelledby="my-projects-filter-heading">
        <Card>
          <h2 id="my-projects-filter-heading" className="flex items-center gap-2 text-sm font-semibold text-[var(--fg)] uppercase tracking-wider mb-4">
            <Filter className="w-4 h-4 text-[var(--fg-muted)]" aria-hidden />
            Filter
          </h2>
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[160px]">
              <label htmlFor="my-projects-status" className="block text-xs font-medium text-[var(--fg-muted)] mb-1.5">
                Status
              </label>
              <Select
                id="my-projects-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
              </Select>
            </div>
            {hasActiveFilters && (
              <p className="text-sm text-[var(--fg-muted)]">
                Showing {filteredProjects.length} of {myProjects.length} projects
              </p>
            )}
          </div>
        </Card>
      </section>

      {/* Project cards */}
      <section aria-labelledby="my-projects-list-heading">
        <h2 id="my-projects-list-heading" className="flex items-center gap-2 text-lg font-semibold text-[var(--fg)] mb-4">
          <FolderKanban className="w-5 h-5 text-[var(--accent)] shrink-0" aria-hidden />
          {hasActiveFilters ? `Results (${filteredProjects.length})` : 'All my projects'}
        </h2>

        {filteredProjects.length === 0 ? (
          <Card className="py-12">
            <EmptyState
              title={myProjects.length === 0 ? 'No projects assigned' : 'No results match your filter'}
              message={
                myProjects.length === 0
                  ? 'You are not assigned to any projects yet.'
                  : 'Try clearing the status filter.'
              }
              actionLabel={myProjects.length > 0 ? 'Clear filter' : undefined}
              onAction={myProjects.length > 0 ? clearFilters : undefined}
            />
          </Card>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
            {filteredProjects.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/app/projects/${p.id}`}
                  className="block h-full group"
                  aria-label={`View project ${p.name}`}
                >
                  <Card
                    padding="p-5"
                    className="h-full flex flex-col transition-all duration-200 group-hover:shadow-[var(--shadow-md)] group-hover:border-[var(--border-focus)]"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <span
                        className="flex items-center justify-center w-11 h-11 rounded-xl bg-[var(--primary-muted)] text-[var(--primary-muted-fg)] shrink-0"
                        aria-hidden
                      >
                        <FolderKanban className="w-5 h-5" />
                      </span>
                      <StatusBadge status={p.status} />
                    </div>
                    <h3 className="font-semibold text-[var(--fg)] truncate mb-1">{p.name}</h3>
                    {p.description && (
                      <p className="text-sm text-[var(--fg-muted)] line-clamp-2 mb-3">{p.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-[var(--fg-muted)] mt-auto pt-3 border-t border-[var(--border)]">
                      <Calendar className="w-4 h-4 shrink-0 text-[var(--fg-muted)]" aria-hidden />
                      <span>
                        {formatDate(p.startDate)} — {formatDate(p.endDate)}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent-muted-fg)] mt-2 group-hover:gap-2 transition-all">
                      View project
                      <ChevronRight className="w-4 h-4 shrink-0" aria-hidden />
                    </span>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
