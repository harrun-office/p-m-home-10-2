import { useState } from 'react';
import { useDataStore } from '../../../store/dataStore.jsx';
import { ReadOnlyBanner } from '../../ui/ReadOnlyBanner.jsx';
import { EmptyState } from '../../ui/EmptyState.jsx';

/**
 * Members tab: current assigned members + add members.
 * All changes via DataStore.assignMembers(projectId, updatedUserIds).
 * If ON_HOLD or COMPLETED: read-only, banner, no add/remove.
 * Block removing last member: "At least one member is required".
 */
export function ProjectMembersPanel({ project }) {
  const { state, assignMembers } = useDataStore();
  const [selectedToAdd, setSelectedToAdd] = useState([]);
  const [validationError, setValidationError] = useState('');

  const users = state.users || [];
  const activeUsers = users.filter((u) => u.isActive !== false && u.role !== 'ADMIN');
  const assignedIds = Array.isArray(project.assignedUserIds) ? project.assignedUserIds : [];
  const assignedMembers = assignedIds
    .map((id) => users.find((u) => u.id === id))
    .filter(Boolean);
  const unassignedUsers = activeUsers.filter((u) => !assignedIds.includes(u.id));
  const isReadOnly = project.status === 'ON_HOLD' || project.status === 'COMPLETED';

  function handleRemove(userId) {
    if (isReadOnly) return;
    const next = assignedIds.filter((id) => id !== userId);
    if (next.length === 0) {
      setValidationError('At least one member is required');
      return;
    }
    setValidationError('');
    assignMembers(project.id, next);
  }

  function handleAddSelected() {
    if (isReadOnly) return;
    if (selectedToAdd.length === 0) return;
    const next = [...assignedIds, ...selectedToAdd];
    setSelectedToAdd([]);
    setValidationError('');
    assignMembers(project.id, next);
  }

  function toggleAdd(userId) {
    setSelectedToAdd((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  return (
    <div className="space-y-6">
      {isReadOnly && <ReadOnlyBanner />}

      {validationError && (
        <p className="text-sm text-[var(--danger)] bg-[var(--danger-light)] px-3 py-2 rounded">{validationError}</p>
      )}

      <section>
        <h3 className="text-sm font-semibold text-[var(--fg)] mb-2">Assigned members</h3>
        {assignedMembers.length === 0 ? (
          <EmptyState title="No members assigned" message="Add members from the list below." />
        ) : (
          <ul className="border border-[var(--border)] rounded-lg divide-y divide-[var(--border)]">
            {assignedMembers.map((u) => (
              <li key={u.id} className="flex items-center justify-between px-4 py-3">
                <div className="text-sm">
                  <span className="font-medium text-[var(--fg)]">{u.name}</span>
                  <span className="text-[var(--fg-muted)] ml-2">{u.email}</span>
                  <span className="text-[var(--fg-muted)] ml-2">· {u.department ?? '—'}</span>
                  <span className="text-[var(--fg-muted)] ml-2">· {u.role ?? '—'}</span>
                </div>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => handleRemove(u.id)}
                    className="text-sm text-[var(--danger)] hover:underline"
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {!isReadOnly && unassignedUsers.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-[var(--fg)] mb-2">Add members</h3>
          <div className="border border-[var(--border)] rounded-lg px-4 py-3 max-h-48 overflow-y-auto space-y-2">
            {unassignedUsers.map((u) => (
              <label key={u.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedToAdd.includes(u.id)}
                  onChange={() => toggleAdd(u.id)}
                  className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--ring)]"
                />
                <span className="text-sm text-[var(--fg)]">{u.name} ({u.email}) · {u.department ?? '—'}</span>
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={handleAddSelected}
            disabled={selectedToAdd.length === 0}
            className="mt-2 px-3 py-1.5 text-sm bg-[var(--primary)] text-[var(--primary-fg)] rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add selected ({selectedToAdd.length})
          </button>
        </section>
      )}

      {!isReadOnly && unassignedUsers.length === 0 && assignedMembers.length > 0 && (
        <EmptyState
          title="No users to add"
          message="All active employees are already assigned to this project."
        />
      )}
    </div>
  );
}
