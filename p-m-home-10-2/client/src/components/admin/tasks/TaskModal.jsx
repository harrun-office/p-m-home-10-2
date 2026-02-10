import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useDataStore } from '../../../store/dataStore.jsx';
import { getSession } from '../../../store/sessionStore.js';
import { ReadOnlyBanner } from '../../ui/ReadOnlyBanner.jsx';
import { Input } from '../../ui/Input.jsx';
import { Select } from '../../ui/Select.jsx';
import { Field } from '../../ui/Field.jsx';
import { Button } from '../../ui/Button.jsx';
import { IconButton } from '../../ui/IconButton.jsx';
import { modalBackdrop, modalPanel } from '../../motion/motionPresets.js';
import { Paperclip } from 'lucide-react';

/**
 * Create / Edit task modal.
 * Session from sessionStore.getSession() (never guess from seed).
 * employeeMode: assigneeId forced to session.userId, project list = only assigned ACTIVE projects; no assignee dropdown.
 */
export function TaskModal({ open, mode, task, preselectedProjectId, onClose, onSuccess, onAssigneeNotify, employeeMode }) {
  const { state, createTask, updateTask } = useDataStore();
  const [projectId, setProjectId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [learningTag, setLearningTag] = useState(false);
  const [extraTags, setExtraTags] = useState('');
  const [linksStr, setLinksStr] = useState('');
  const [attachmentList, setAttachmentList] = useState([]); // file names or URLs
  const [attachmentUrlInput, setAttachmentUrlInput] = useState('');
  const fileInputRef = useRef(null);
  const [errors, setErrors] = useState({});
  const [savedMessage, setSavedMessage] = useState('');

  const session = getSession();
  const projects = state.projects || [];
  const users = (state.users || []).filter((u) => u.isActive !== false && u.role !== 'ADMIN');
  const activeProjects = projects.filter((p) => p.status === 'ACTIVE');
  const assignedActiveProjects = employeeMode && session
    ? projects.filter((p) => p.status === 'ACTIVE' && (p.assignedUserIds || []).includes(session.userId))
    : activeProjects;
  const isEdit = mode === 'edit';

  const selectedProject = projects.find((p) => p.id === projectId);
  const projectReadOnly = selectedProject && (selectedProject.status === 'ON_HOLD' || selectedProject.status === 'COMPLETED');

  const effectiveAssigneeId = employeeMode && session ? session.userId : assigneeId;

  // Only initialize form when modal opens or mode/task/preselectedProjectId changes.
  // Do NOT depend on activeProjects/assignedActiveProjects/projects — they are new array refs every render
  // and would re-run this effect and wipe out the user's input (e.g. title, description) while typing.
  useEffect(() => {
    if (!open) return;
    setErrors({});
    setSavedMessage('');
    const projectList = employeeMode ? assignedActiveProjects : (isEdit ? projects : activeProjects);
    if (isEdit && task) {
      setProjectId(task.projectId ?? '');
      setTitle(task.title ?? '');
      setDescription(task.description ?? '');
      setAssigneeId(task.assigneeId ?? '');
      setPriority(task.priority ?? 'MEDIUM');
      const tags = Array.isArray(task.tags) ? task.tags : [];
      setLearningTag(tags.includes('Learning'));
      setExtraTags(tags.filter((t) => t !== 'Learning').join(', '));
      setLinksStr(Array.isArray(task.links) ? task.links.join('\n') : '');
      setAttachmentList(Array.isArray(task.attachments) ? [...task.attachments] : []);
      setAttachmentUrlInput('');
    } else {
      setProjectId(preselectedProjectId ?? (projectList[0]?.id ?? ''));
      setTitle('');
      setDescription('');
      setAssigneeId(employeeMode && session ? session.userId : '');
      setPriority('MEDIUM');
      setLearningTag(false);
      setExtraTags('');
      setLinksStr('');
      setAttachmentList([]);
      setAttachmentUrlInput('');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [open, mode, task?.id, preselectedProjectId, isEdit, employeeMode, session?.userId]);

  function getTags() {
    const list = learningTag ? ['Learning'] : [];
    const parts = (extraTags || '').split(',').map((s) => s.trim()).filter(Boolean);
    return [...list, ...parts];
  }

  function getLinks() {
    return (linksStr || '').split('\n').map((s) => s.trim()).filter(Boolean);
  }

  function getAttachments() {
    return attachmentList.filter(Boolean);
  }

  function handleFileSelect(e) {
    const files = e.target.files;
    if (!files?.length) return;
    const names = Array.from(files).map((f) => f.name);
    setAttachmentList((prev) => [...prev, ...names]);
    e.target.value = '';
  }

  function removeAttachment(index) {
    setAttachmentList((prev) => prev.filter((_, i) => i !== index));
  }

  function addAttachmentUrl() {
    const url = attachmentUrlInput.trim();
    if (!url) return;
    setAttachmentList((prev) => [...prev, url]);
    setAttachmentUrlInput('');
  }

  function validate() {
    const err = {};
    if (!projectId) err.projectId = 'Project is required';
    if (!title.trim()) err.title = 'Title is required';
    if (!employeeMode && !assigneeId) err.assigneeId = 'Assignee is required';
    if (projectReadOnly) err.project = 'Project is read-only (On Hold or Completed).';
    setErrors(err);
    return Object.keys(err).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    if (projectReadOnly || !session) return;

    const tags = getTags();

    if (isEdit && task) {
      const patch = { title: title.trim(), description: description.trim(), projectId, priority, tags, links: getLinks(), attachments: getAttachments() };
      if (!employeeMode) patch.assigneeId = assigneeId;
      const result = updateTask(task.id, patch, session);
      if (result.ok) {
        setSavedMessage('Saved');
        setTimeout(() => { onSuccess?.(); onClose(); }, 600);
      } else if (result.error) {
        setErrors({ submit: result.error });
      }
    } else {
      const payload = {
        projectId,
        title: title.trim(),
        description: description.trim(),
        assigneeId: effectiveAssigneeId,
        priority,
        tags,
        links: getLinks(),
        attachments: getAttachments(),
      };
      const result = createTask(payload, session);
      if (result.ok) {
        const assignee = users.find((u) => u.id === effectiveAssigneeId);
        const assigneeName = assignee ? assignee.name : 'assignee';
        if (onAssigneeNotify) onAssigneeNotify(`Task assigned notification created for ${assigneeName}`);
        setSavedMessage('Saved');
        setTimeout(() => { onSuccess?.(); onClose(); }, 600);
      } else if (result.error) {
        setErrors({ submit: result.error });
      }
    }
  }

  const projectOptions = employeeMode ? (isEdit ? assignedActiveProjects : assignedActiveProjects) : (isEdit ? projects : activeProjects);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={modalBackdrop.initial}
          animate={modalBackdrop.animate}
          exit={modalBackdrop.exit}
          transition={modalBackdrop.transition}
          className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6 cursor-default"
        >
          <div
            className="absolute inset-0 bg-[var(--backdrop)] backdrop-blur-sm"
            aria-hidden="true"
            onClick={onClose}
          />
          <motion.div
            initial={modalPanel.initial}
            animate={modalPanel.animate}
            exit={modalPanel.exit}
            transition={modalPanel.transition}
            role="dialog"
            aria-modal="true"
            aria-label={isEdit ? 'Edit Task' : 'Create Task'}
            className="relative bg-[var(--card)] rounded-2xl shadow-[var(--shadow-lg)] max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col border border-[var(--border)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with title and close button */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
              <h2 className="text-lg font-semibold text-[var(--fg)]">{isEdit ? 'Edit Task' : 'Create Task'}</h2>
              <IconButton
                icon={X}
                aria-label="Close"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="shrink-0"
              />
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {savedMessage && (
                  <p className="text-sm text-[var(--success-muted-fg)] bg-[var(--success-muted)] px-3 py-2 rounded-[var(--radius)]">{savedMessage}</p>
                )}
                {errors.submit && (
                  <p className="text-sm text-[var(--danger-muted-fg)] bg-[var(--danger-muted)] px-3 py-2 rounded-[var(--radius)]">{errors.submit}</p>
                )}
                {projectReadOnly && <ReadOnlyBanner />}

                <Field label="Project" htmlFor="task-project" required>
                  <Select
                    id="task-project"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    error={errors.projectId}
                    disabled={!!preselectedProjectId}
                  >
                    <option value="">Select project</option>
                    {projectOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.status})
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Title" htmlFor="task-title" required>
                  <Input
                    id="task-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Task title"
                    error={errors.title}
                  />
                </Field>

                <Field label="Description" htmlFor="task-desc">
                  <textarea
                    id="task-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-[var(--fg)] placeholder:text-[var(--muted-fg)] shadow-[var(--shadow-sm)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]/20 focus:shadow-[var(--shadow)] transition-all duration-150"
                    placeholder="Optional description"
                  />
                </Field>

                {!employeeMode && (
                  <Field label="Assignee" htmlFor="task-assignee" required>
                    <Select
                      id="task-assignee"
                      value={assigneeId}
                      onChange={(e) => setAssigneeId(e.target.value)}
                      error={errors.assigneeId}
                    >
                      <option value="">Select assignee</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                      ))}
                    </Select>
                  </Field>
                )}
                {employeeMode && session && (
                  <p className="text-sm text-[var(--muted-fg)]">Assigning to: {session.name}</p>
                )}

                <Field label="Priority" htmlFor="task-priority">
                  <Select
                    id="task-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </Select>
                </Field>

                <Field label="Tags">
                  <label className="flex items-center gap-2 mb-2 cursor-pointer text-[var(--fg)]">
                    <input
                      type="checkbox"
                      checked={learningTag}
                      onChange={(e) => setLearningTag(e.target.checked)}
                      className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--ring)]"
                    />
                    <span className="text-sm">Learning task</span>
                  </label>
                  <Input
                    type="text"
                    value={extraTags}
                    onChange={(e) => setExtraTags(e.target.value)}
                    placeholder="Other tags (comma separated)"
                  />
                </Field>

                <Field label="Links" htmlFor="task-links">
                  <textarea
                    id="task-links"
                    value={linksStr}
                    onChange={(e) => setLinksStr(e.target.value)}
                    rows={2}
                    className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-[var(--fg)] placeholder:text-[var(--muted-fg)] shadow-[var(--shadow-sm)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]/20 focus:shadow-[var(--shadow)] transition-all duration-150"
                    placeholder="One URL per line (optional)"
                  />
                </Field>

                <Field label="File attachments" htmlFor="task-attachments">
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <label className="flex-1 flex items-center justify-center gap-2 rounded-[var(--radius)] border-2 border-dashed border-[var(--border)] bg-[var(--muted)]/30 px-4 py-3 text-sm text-[var(--fg-muted)] hover:border-[var(--accent)] hover:bg-[var(--muted)]/50 cursor-pointer transition-colors">
                        <Paperclip className="w-4 h-4 shrink-0" />
                        <span>Choose files to attach</span>
                        <input
                          ref={fileInputRef}
                          id="task-attachments"
                          type="file"
                          multiple
                          className="sr-only"
                          onChange={handleFileSelect}
                          aria-label="Upload attachment files"
                        />
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="url"
                        value={attachmentUrlInput}
                        onChange={(e) => setAttachmentUrlInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAttachmentUrl())}
                        placeholder="Or paste attachment URL"
                        className="flex-1"
                      />
                      <Button type="button" variant="outline" size="sm" onClick={addAttachmentUrl}>
                        Add URL
                      </Button>
                    </div>
                    {attachmentList.length > 0 && (
                      <ul className="mt-2 space-y-1.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-2 max-h-32 overflow-y-auto">
                        {attachmentList.map((name, index) => (
                          <li key={`${index}-${name}`} className="flex items-center justify-between gap-2 text-sm text-[var(--fg)]">
                            <span className="min-w-0 truncate" title={name}>{name}</span>
                            <button
                              type="button"
                              onClick={() => removeAttachment(index)}
                              className="shrink-0 p-1 rounded text-[var(--fg-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-light)] transition-colors"
                              aria-label={`Remove ${name}`}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </Field>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={projectReadOnly || !session}
                  >
                    {isEdit ? 'Save' : 'Create'}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
