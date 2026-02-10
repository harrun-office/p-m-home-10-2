import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Users, Paperclip, Search, Check, User } from 'lucide-react';
import { useDataStore } from '../../../store/dataStore.jsx';
import { Button } from '../../ui/Button.jsx';
import { Input } from '../../ui/Input.jsx';

/**
 * Create project modal — same size, design and layout as UserFormModal.
 * Fields: project name, description, start date, end date, attachments, adding employees.
 */
export function ProjectFormModal({ isOpen, onClose, onSuccess }) {
  const { state, createProject } = useDataStore();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
  });
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const users = (state.users || []).filter((u) => u.isActive !== false && u.role !== 'ADMIN');
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (!isOpen) return;
    const today = new Date().toISOString().slice(0, 10);
    setFormData({ name: '', description: '', startDate: today, endDate: today });
    setSelectedUserIds([]);
    setAttachments([]);
    setSearchQuery('');
    setErrors({});
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const fn = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [isOpen, onClose]);

  function validate() {
    const err = {};
    if (!formData.name?.trim()) err.name = 'Project name is required';
    if (!formData.description?.trim()) err.description = 'Description is required';
    if (!formData.startDate) err.startDate = 'Start date is required';
    if (!formData.endDate) err.endDate = 'End date is required';
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      err.endDate = 'End date must be on or after start date';
    }
    if (selectedUserIds.length === 0) err.members = 'At least one team member is required';
    setErrors(err);
    return Object.keys(err).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const startISO = formData.startDate ? `${formData.startDate}T00:00:00.000Z` : '';
      const endISO = formData.endDate ? `${formData.endDate}T00:00:00.000Z` : '';
      createProject({
        name: formData.name.trim(),
        description: formData.description.trim(),
        startDate: startISO,
        endDate: endISO,
        assignedUserIds: selectedUserIds,
      });
      onSuccess?.();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleUser(id) {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
    );
  }

  function handleFileChange(e) {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  }

  function removeAttachment(index) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  if (!isOpen) return null;

  const fieldClass = 'space-y-1.5';
  const labelClass = 'block text-sm font-medium text-[var(--fg)]';

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-project-title"
    >
      <div className="absolute inset-0 bg-[var(--backdrop)] backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-2xl)] flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
          <h2 id="create-project-title" className="text-lg font-semibold text-[var(--fg)]">Create Project</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-9 h-9 rounded-[var(--radius)] text-[var(--fg-muted)] hover:bg-[var(--muted)] hover:text-[var(--fg)] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Basic information */}
            <section className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
                Basic information
              </h3>
              <div className={fieldClass}>
                <label htmlFor="project-name" className={labelClass}>
                  Project name <span className="text-[var(--danger)]">*</span>
                </label>
                <Input
                  id="project-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Q1 Marketing Campaign"
                  required
                />
                {errors.name && (
                  <p className="text-xs text-[var(--danger)]" role="alert">{errors.name}</p>
                )}
              </div>
              <div className={fieldClass}>
                <label htmlFor="project-description" className={labelClass}>
                  Description <span className="text-[var(--danger)]">*</span>
                </label>
                <textarea
                  id="project-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--fg)] placeholder:text-[var(--muted-fg)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 resize-none"
                  placeholder="Describe goals and objectives..."
                  required
                />
                {errors.description && (
                  <p className="text-xs text-[var(--danger)]" role="alert">{errors.description}</p>
                )}
              </div>
            </section>

            {/* Timeline */}
            <section className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
                Timeline
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={fieldClass}>
                  <label htmlFor="project-start" className={labelClass}>
                    Start date <span className="text-[var(--danger)]">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-fg)] pointer-events-none" />
                    <Input
                      id="project-start"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                  {errors.startDate && (
                    <p className="text-xs text-[var(--danger)]" role="alert">{errors.startDate}</p>
                  )}
                </div>
                <div className={fieldClass}>
                  <label htmlFor="project-end" className={labelClass}>
                    End date <span className="text-[var(--danger)]">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-fg)] pointer-events-none" />
                    <Input
                      id="project-end"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                  {errors.endDate && (
                    <p className="text-xs text-[var(--danger)]" role="alert">{errors.endDate}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Attachments */}
            <section className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
                Attachments
              </h3>
              <div className={fieldClass}>
                <label className="flex items-center gap-2 cursor-pointer w-fit">
                  <span className="flex items-center justify-center w-9 h-9 rounded-[var(--radius)] bg-[var(--muted)] text-[var(--fg-muted)]">
                    <Paperclip className="w-4 h-4" />
                  </span>
                  <span className="text-sm font-medium text-[var(--fg)]">Add files</span>
                  <input
                    type="file"
                    multiple
                    className="sr-only"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg"
                  />
                </label>
                {attachments.length > 0 && (
                  <ul className="mt-2 space-y-1 text-sm text-[var(--fg-muted)]">
                    {attachments.map((file, i) => (
                      <li key={i} className="flex items-center justify-between gap-2 py-1">
                        <span className="truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(i)}
                          className="text-[var(--danger)] hover:underline shrink-0"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-xs text-[var(--fg-muted)]">
                  Optional. Attachments are stored locally for this session.
                </p>
              </div>
            </section>

            {/* Team members */}
            <section className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
                Team members
              </h3>
              <div className={fieldClass}>
                <label htmlFor="project-member-search" className={labelClass}>
                  Add employees <span className="text-[var(--danger)]">*</span>
                </label>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-fg)]" />
                  <Input
                    id="project-member-search"
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)]/50 max-h-48 overflow-y-auto p-2 space-y-1">
                  {filteredUsers.length === 0 ? (
                    <p className="text-sm text-[var(--fg-muted)] py-4 text-center">
                      {searchQuery ? 'No members found' : 'No team members available'}
                    </p>
                  ) : (
                    filteredUsers.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => toggleUser(user.id)}
                        className={`w-full flex items-center gap-3 p-2 rounded-[var(--radius)] text-left transition-colors ${
                          selectedUserIds.includes(user.id)
                            ? 'bg-[var(--primary)]/10 border border-[var(--primary)]/30'
                            : 'hover:bg-[var(--muted)]/50 border border-transparent'
                        }`}
                      >
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${
                            selectedUserIds.includes(user.id)
                              ? 'bg-[var(--primary)] text-white'
                              : 'bg-[var(--muted)] text-[var(--muted-fg)]'
                          }`}
                        >
                          {selectedUserIds.includes(user.id) ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[var(--fg)] truncate">{user.name}</p>
                          <p className="text-xs text-[var(--fg-muted)] truncate">{user.email}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                {errors.members && (
                  <p className="text-xs text-[var(--danger)] mt-1" role="alert">{errors.members}</p>
                )}
                <p className="text-xs text-[var(--fg-muted)] flex items-center gap-1 mt-1">
                  <Users className="w-3.5 h-3.5" />
                  {selectedUserIds.length} selected
                </p>
              </div>
            </section>
          </div>

          <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--bg)]/50 flex items-center justify-end gap-3 shrink-0 rounded-b-2xl">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
