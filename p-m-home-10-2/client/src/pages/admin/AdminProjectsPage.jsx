import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { ProjectFormModal } from '../../components/admin/projects/ProjectFormModal.jsx';
import { BulkActionsToolbar } from '../../components/admin/projects/BulkActionsToolbar.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { IconButton } from '../../components/ui/IconButton.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { MotionPage } from '../../components/motion/MotionPage.jsx';
import { Table, TableHeader, TableBody, TableRow, Th, Td } from '../../components/ui/Table.jsx';
import { todayKey, addDaysToLocalKey } from '../../utils/date.js';
import {
  FolderKanban,
  Eye,
  Pencil,
  Trash2,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Clock,
  FolderOpen,
  Pause,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { MotionCard } from '../../components/motion/MotionCard.jsx';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const PROJECT_KPIS = [
  { key: 'totalProjects', label: 'Total', icon: FolderKanban, accent: 'var(--accent)', bg: 'var(--accent-light)' },
  { key: 'activeProjects', label: 'Active', icon: FolderOpen, accent: 'var(--success)', bg: 'var(--success-light)' },
  { key: 'onHoldProjects', label: 'On hold', icon: Pause, accent: 'var(--warning)', bg: 'var(--warning-light)' },
  { key: 'completedProjects', label: 'Done', icon: CheckCircle2, accent: 'var(--purple)', bg: 'var(--purple-light)' },
];

/**
 * Admin Projects: list, filter, create/edit, status, delete.
 * Improved layout, stats strip, and clearer UX.
 */
export function AdminProjectsPage() {
  const navigate = useNavigate();
  const { state, setProjectStatus, deleteProject } = useDataStore();
  const [statusFilter, setStatusFilter] = useState('');
  const [searchName, setSearchName] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [selectedProjects, setSelectedProjects] = useState(new Set());
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [statusChangeId, setStatusChangeId] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const projects = state.projects || [];
  const users = state.users || [];

  const filteredProjects = useMemo(() => {
    let list = projects;
    if (statusFilter) list = list.filter((p) => p.status === statusFilter);
    if (searchName.trim()) {
      const q = searchName.trim().toLowerCase();
      list = list.filter((p) => (p.name || '').toLowerCase().includes(q));
    }
    if (departmentFilter) {
      const map = new Map();
      users.forEach((u) => {
        if (u.department) map.set(u.id, u.department);
      });
      list = list.filter((p) => {
        const assignedUserIds = p.assignedUserIds || [];
        return assignedUserIds.some((userId) => map.get(userId) === departmentFilter);
      });
    }

    // Date filtering logic
    if (startDateFilter || endDateFilter) {
      const startKey = startDateFilter || null;
      const endKey = endDateFilter || null;

      list = list.filter((p) => {
        const projectStart = p.startDate ? p.startDate.slice(0, 10) : null;
        const projectEnd = p.endDate ? p.endDate.slice(0, 10) : null;

        // If project has no dates, exclude from date-filtered results
        if (!projectStart && !projectEnd) return false;

        // Handle different filter scenarios
        if (startKey && endKey) {
          // Both filter dates provided - check for overlap
          // Project overlaps with filter if: projectStart <= filterEnd AND projectEnd >= filterStart
          const hasOverlap = (!projectStart || projectStart <= endKey) &&
                           (!projectEnd || projectEnd >= startKey);
          return hasOverlap;
        } else if (startKey) {
          // Only filter start date - show projects that start on or after this date
          return !projectStart || projectStart >= startKey;
        } else if (endKey) {
          // Only filter end date - show projects that end on or before this date
          return !projectEnd || projectEnd <= endKey;
        }

        return true;
      });
    }

    return list;
  }, [projects, statusFilter, searchName, departmentFilter, users, startDateFilter, endDateFilter]);

  const totalFiltered = filteredProjects.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedProjects = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, safePage, pageSize]);

  useEffect(() => setPage(1), [statusFilter, searchName, departmentFilter, startDateFilter, endDateFilter, pageSize]);
  useEffect(() => {
    setPage((p) => (p > totalPages && totalPages >= 1 ? totalPages : p));
  }, [totalPages]);

  const hasActiveFilters = !!statusFilter || !!searchName.trim() || !!departmentFilter || !!startDateFilter || !!endDateFilter;
  const activeCount = projects.filter((p) => p.status === 'ACTIVE').length;
  const onHoldCount = projects.filter((p) => p.status === 'ON_HOLD').length;
  const completedCount = projects.filter((p) => p.status === 'COMPLETED').length;

  // Calculate project counts
  const totalProjects = projects.length;

  const projectKpis = useMemo(() => ({
    totalProjects: projects.length,
    activeProjects: activeCount,
    onHoldProjects: onHoldCount,
    completedProjects: completedCount,
  }), [projects.length, activeCount, onHoldCount, completedCount]);

  const soonestDeadlineProject = useMemo(() => {
    const today = new Date();
    return projects
      .filter((p) => p.status === 'ACTIVE' && p.endDate && new Date(p.endDate) >= today)
      .sort((a, b) => new Date(a.endDate) - new Date(b.endDate))[0] ?? null;
  }, [projects]);

  function handleCreate() {
    setEditingProject(null);
    setCreateModalOpen(true);
  }

  function handleEdit(project) {
    setEditingProject(project);
    setCreateModalOpen(true);
  }

  function handleStatusChange(projectId, newStatus) {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    if (newStatus === 'ON_HOLD') {
      const ok = window.confirm(
        `Put "${project.name}" on hold? Tasks will remain visible, but the project will be marked as On Hold.`
      );
      if (!ok) {
        setStatusChangeId(null);
        return;
      }
    }

    if (newStatus === 'COMPLETED') {
      const ok = window.confirm(
        `Mark "${project.name}" as completed? You can still view tasks, but the project will be read-only.`
      );
      if (!ok) {
        setStatusChangeId(null);
        return;
      }
    }

    setProjectStatus(projectId, newStatus);
    setStatusChangeId(null);
  }

  function handleDelete(project) {
    if (
      window.confirm(
        `Are you sure you want to delete "${project.name}"? This will also delete all associated tasks. This action cannot be undone.`
      )
    ) {
      const result = deleteProject(project.id);
      if (!result.ok) alert(result.error || 'Failed to delete project');
    }
  }

  function clearFilters() {
    setStatusFilter('');
    setSearchName('');
    setDepartmentFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
  }

  function handleProjectSelect(projectId, selected) {
    const newSelected = new Set(selectedProjects);
    if (selected) {
      newSelected.add(projectId);
    } else {
      newSelected.delete(projectId);
    }
    setSelectedProjects(newSelected);
  }

  function handleSelectAll(selected) {
    if (selected) {
      setSelectedProjects(new Set(filteredProjects.map(p => p.id)));
    } else {
      setSelectedProjects(new Set());
    }
  }

  function handleBulkStatusChange(newStatus) {
    if (selectedProjects.size === 0) return;

    selectedProjects.forEach(projectId => {
      setProjectStatus(projectId, newStatus);
    });

    setSelectedProjects(new Set());
  }

  function clearSelection() {
    setSelectedProjects(new Set());
  }

  const isReadOnly = (project) => project.status === 'ON_HOLD' || project.status === 'COMPLETED';

  function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <MotionPage className="space-y-6 sm:space-y-8">

      {/* Projects Overview */}
      <section aria-labelledby="projects-kpis">
        <div className="mb-4">
          <h2 id="projects-kpis" className="flex items-center gap-2 text-lg font-semibold text-[var(--fg)] mb-0.5">
            <FolderKanban className="w-5 h-5 text-[var(--accent)] shrink-0" aria-hidden="true" />
            Projects Overview
          </h2>
          <p className="text-sm text-[var(--fg-muted)]">Real-time status and performance metrics</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
          {PROJECT_KPIS.map(({ key, label, icon: Icon, accent, bg }) => (
            <div key={key} className="block group">
              <MotionCard
                asListItem
                className="rounded-xl border-2 border-[var(--border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] hover:border-[var(--border-focus)] transition-all duration-300 h-full group-hover:-translate-y-1"
                style={{ background: bg }}
              >
                <div className="relative z-10 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-1">{label}</p>
                      <p className="text-2xl sm:text-3xl font-bold tabular-nums truncate" style={{ color: accent }}>
                        {projectKpis[key]}
                      </p>
                    </div>
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" style={{ background: accent, color: 'white' }}>
                      <Icon className="w-5 h-5" aria-hidden />
                    </div>
                  </div>
                </div>
              </MotionCard>
            </div>
          ))}
          {soonestDeadlineProject && (
            <div className="block group">
              <MotionCard
                asListItem
                className="rounded-xl border-2 border-[var(--warning)] bg-gradient-to-br from-yellow-50 to-orange-50 backdrop-blur-sm shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] hover:from-yellow-100 hover:to-orange-100 transition-all duration-300 h-full group-hover:-translate-y-1"
              >
                <div className="relative z-10 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[var(--warning)] uppercase tracking-wider mb-1">Upcoming</p>
                      <p className="text-lg font-bold text-[var(--fg)]">Project Deadline</p>
                    </div>
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-200 to-orange-200 text-orange-700 shrink-0 group-hover:scale-110 transition-all duration-300">
                      <Clock className="w-5 h-5" aria-hidden />
                    </div>
                  </div>
                  <div className="text-xs text-[var(--warning)] uppercase tracking-wider">
                    {soonestDeadlineProject.name} - DUE {formatDate(soonestDeadlineProject.endDate)}
                  </div>
                </div>
              </MotionCard>
            </div>
          )}
        </div>
      </section>

      {/* Filters */}
      <section aria-labelledby="projects-filters-heading">
        <Card>
          <h2 id="projects-filters-heading" className="flex items-center gap-2 text-sm font-semibold text-[var(--fg)] uppercase tracking-wider mb-4">
            <Filter className="w-4 h-4 text-[var(--fg-muted)]" aria-hidden />
            Search & filter
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <label htmlFor="projects-search" className="block text-xs font-medium text-[var(--fg-muted)] mb-1.5">
                Project name
              </label>
              <Input
                id="projects-search"
                type="search"
                placeholder="Search projects…"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                leftIcon={Search}
              />
            </div>
            <div>
              <label htmlFor="projects-department-filter" className="block text-xs font-medium text-[var(--fg-muted)] mb-1.5">
                Department
              </label>
              <Select
                id="projects-department-filter"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="DEV">DEV</option>
                <option value="PRESALES">PRESALES</option>
                <option value="TESTER">TESTER</option>
              </Select>
            </div>
            <div className="xl:col-span-2">
              <label className="block text-xs font-medium text-[var(--fg-muted)] mb-1.5">
                Date range
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  placeholder="From date"
                  className="min-w-[130px]"
                  aria-label="From date"
                />
                <span className="text-[var(--fg-muted)] text-sm">to</span>
                <Input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  placeholder="To date"
                  className="min-w-[130px]"
                  aria-label="To date"
                />
              </div>
            </div>
            {hasActiveFilters && (
              <div className="flex items-end xl:col-span-1">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              </div>
            )}
          </div>
          {hasActiveFilters && (
            <p className="text-sm text-[var(--fg-muted)] mt-3 pt-3 border-t border-[var(--border)]">
              Showing {filteredProjects.length} of {projects.length} projects
            </p>
          )}
        </Card>
      </section>

      {/* Projects list - table with pagination */}
      <section aria-labelledby="projects-list-heading">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <h2 id="projects-list-heading" className="flex items-center gap-2 text-lg font-semibold text-[var(--fg)]">
              <FolderKanban className="w-5 h-5 text-[var(--accent)] shrink-0" aria-hidden />
              {hasActiveFilters ? `Results (${filteredProjects.length})` : 'All projects'}
            </h2>
            {filteredProjects.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectAll(selectedProjects.size !== filteredProjects.length)}
                className="text-xs"
              >
                {selectedProjects.size === filteredProjects.length ? 'Deselect All' : 'Select All'}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <span className="text-sm text-[var(--fg-muted)]">
                {filteredProjects.length} of {projects.length} shown
              </span>
            )}
            <Button variant="primary" size="sm" leftIcon={Plus} onClick={handleCreate} aria-label="Create project">
              Create Project
            </Button>
          </div>
        </div>

        <BulkActionsToolbar
          selectedCount={selectedProjects.size}
          onBulkStatusChange={handleBulkStatusChange}
          onBulkDelete={() => {
            if (window.confirm(`Delete ${selectedProjects.size} selected projects?`)) {
              selectedProjects.forEach(projectId => {
                const project = projects.find(p => p.id === projectId);
                if (project) handleDelete(project);
              });
              clearSelection();
            }
          }}
          onClearSelection={clearSelection}
        />

        {filteredProjects.length === 0 ? (
          <EmptyState
            title={projects.length === 0 ? 'No projects yet' : 'No results match your filters'}
            message={
              projects.length === 0
                ? 'Create your first project, then add team members and tasks from the project page to start tracking work.'
                : 'Try adjusting your search terms or clearing some filters to see more results.'
            }
            actions={
              projects.length === 0
                ? [{ label: 'Create Project', onClick: handleCreate }]
                : [{ label: 'Clear filters', onClick: clearFilters }]
            }
            icon={FolderKanban}
          />
        ) : (
          <>
            <Table stickyHeader>
              <TableHeader>
                <TableRow hover={false}>
                  <Th className="w-10">
                    <input
                      type="checkbox"
                      aria-label="Select all on page"
                      checked={paginatedProjects.length > 0 && paginatedProjects.every((p) => selectedProjects.has(p.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          paginatedProjects.forEach((p) => setSelectedProjects((prev) => new Set([...prev, p.id])));
                        } else {
                          setSelectedProjects((prev) => {
                            const next = new Set(prev);
                            paginatedProjects.forEach((p) => next.delete(p.id));
                            return next;
                          });
                        }
                      }}
                      className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--ring)]"
                    />
                  </Th>
                  <Th>Project name</Th>
                  <Th>Status</Th>
                  <Th>Start date</Th>
                  <Th>End date</Th>
                  <Th>Members</Th>
                  <Th className="text-right w-40">Actions</Th>
                </TableRow>
              </TableHeader>
              <TableBody zebra>
                {paginatedProjects.map((project) => {
                  const memberIds = project.assignedUserIds || [];
                  const memberNames = memberIds
                    .map((id) => users.find((u) => u.id === id)?.name)
                    .filter(Boolean);
                  const memberLabel = memberNames.length ? memberNames.slice(0, 2).join(', ') + (memberNames.length > 2 ? ` +${memberNames.length - 2}` : '') : '—';
                  return (
                    <TableRow key={project.id}>
                      <Td>
                        <input
                          type="checkbox"
                          aria-label={`Select ${project.name}`}
                          checked={selectedProjects.has(project.id)}
                          onChange={(e) => handleProjectSelect(project.id, e.target.checked)}
                          className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--ring)]"
                        />
                      </Td>
                      <Td>
                        <Link to={`/admin/projects/${project.id}`} className="font-medium text-[var(--primary)] hover:underline">
                          {project.name || '—'}
                        </Link>
                      </Td>
                      <Td>
                        <StatusBadge status={project.status} />
                      </Td>
                      <Td>{formatDate(project.startDate)}</Td>
                      <Td>{formatDate(project.endDate)}</Td>
                      <Td className="text-[var(--fg-muted)]">{memberLabel}</Td>
                      <Td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <IconButton icon={Eye} variant="ghost" size="sm" aria-label={`View ${project.name}`} onClick={() => navigate(`/admin/projects/${project.id}`)} />
                          <IconButton icon={Pencil} variant="ghost" size="sm" aria-label={`Edit ${project.name}`} onClick={() => handleEdit(project)} disabled={project.status === 'COMPLETED' || project.status === 'ON_HOLD'} />
                          {project.status === 'ON_HOLD' && (
                            <IconButton icon={PlayCircle} variant="ghost" size="sm" aria-label={`Make ${project.name} active`} onClick={() => handleStatusChange(project.id, 'ACTIVE')} className="text-[var(--success)] hover:bg-[var(--success-light)]" />
                          )}
                          {project.status !== 'ON_HOLD' && (
                            <IconButton icon={PauseCircle} variant="ghost" size="sm" aria-label={`Put ${project.name} on hold`} onClick={() => handleStatusChange(project.id, 'ON_HOLD')} className="text-[var(--fg-muted)] hover:text-[var(--fg)]" />
                          )}
                          {project.status !== 'COMPLETED' && (
                            <IconButton icon={CheckCircle2} variant="ghost" size="sm" aria-label={`Mark ${project.name} completed`} onClick={() => handleStatusChange(project.id, 'COMPLETED')} className="text-[var(--fg-muted)] hover:text-[var(--fg)]" />
                          )}
                          <IconButton icon={Trash2} variant="ghost" size="sm" aria-label={`Delete ${project.name}`} onClick={() => handleDelete(project)} className="text-[var(--danger)] hover:bg-[var(--danger-light)]" />
                        </div>
                      </Td>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-[var(--border)]">
              <div className="flex items-center gap-3">
                <span className="text-sm text-[var(--fg-muted)]">
                  Showing {((safePage - 1) * pageSize) + 1}–{Math.min(safePage * pageSize, totalFiltered)} of {totalFiltered}
                </span>
                <label htmlFor="projects-page-size" className="text-sm text-[var(--fg-muted)]">Per page</label>
                <Select
                  id="projects-page-size"
                  value={String(pageSize)}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="w-20"
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <IconButton
                  icon={ChevronLeft}
                  variant="outline"
                  size="sm"
                  aria-label="Previous page"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                />
                <span className="text-sm font-medium text-[var(--fg)] min-w-[6rem] text-center">
                  Page {safePage} of {totalPages}
                </span>
                <IconButton
                  icon={ChevronRight}
                  variant="outline"
                  size="sm"
                  aria-label="Next page"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                />
              </div>
            </div>
          </>
        )}
      </section>

      <ProjectFormModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setEditingProject(null);
        }}
        onSuccess={() => {
          setCreateModalOpen(false);
          setEditingProject(null);
        }}
        project={editingProject}
      />
    </MotionPage>
  );
}
