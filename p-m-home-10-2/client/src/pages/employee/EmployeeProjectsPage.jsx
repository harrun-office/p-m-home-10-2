import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore.jsx';
import { getSession } from '../../store/sessionStore.js';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { FolderKanban, Calendar, ChevronRight, PlayCircle, CheckCircle2 } from 'lucide-react';

/**
 * Employee projects: only projects where assignedUserIds includes session.userId.
 * Improved layout, filters, and project cards.
 */
export function EmployeeProjectsPage() {
  const navigate = useNavigate();
  const { state } = useDataStore();
  const session = getSession();

  useEffect(() => {
    if (!session) navigate('/login', { replace: true });
  }, [session, navigate]);

  const projects = state.projects || [];

  const myProjects = useMemo(() => {
    if (!session) return [];
    return projects.filter((p) => (p.assignedUserIds || []).includes(session.userId));
  }, [projects, session]);

  const activeCount = myProjects.filter((p) => p.status === 'ACTIVE').length;
  const completedCount = myProjects.filter((p) => p.status === 'COMPLETED').length;

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
      </div>

      {/* Project cards */}
      <section aria-labelledby="my-projects-list-heading">
        <h2 id="my-projects-list-heading" className="flex items-center gap-2 text-lg font-semibold text-[var(--fg)] mb-4">
          <FolderKanban className="w-5 h-5 text-[var(--accent)] shrink-0" aria-hidden />
          All my projects
        </h2>

        {myProjects.length === 0 ? (
          <Card className="py-12">
            <EmptyState
              title="No projects assigned"
              message="You are not assigned to any projects yet."
            />
          </Card>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
            {myProjects.map((p) => (
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
