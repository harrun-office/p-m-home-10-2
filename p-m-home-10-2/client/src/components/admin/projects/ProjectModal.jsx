import { useState, useEffect } from 'react';
import { useDataStore } from '../../../store/dataStore.jsx';
import { MotionModal } from '../../motion/MotionModal.jsx';
import { Button } from '../../ui/Button.jsx';
import { Input } from '../../ui/Input.jsx';
import { Field } from '../../ui/Field.jsx';
import { IconButton } from '../../ui/IconButton.jsx';
import { X, Trash2, FolderPlus, FileText, Calendar, Users, Search, Check, User, ChevronLeft, ChevronRight, Sparkles, Target, Clock, Crown } from 'lucide-react';

/**
 * Create / Edit project modal. Token-based, MotionModal, ESC closes, close button top-right.
 */
export function ProjectModal({ open, mode, project, onClose, onSuccess, onDelete }) {
  const { state, createProject, updateProject, assignMembers, deleteProject } = useDataStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const users = (state.users || []).filter((u) => u.isActive !== false && u.role !== 'ADMIN');
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const isEdit = mode === 'edit';

  // Step configuration
  const steps = [
    {
      id: 'details',
      title: 'Project Details',
      description: 'Basic information about your project',
      icon: FileText,
      required: true
    },
    {
      id: 'timeline',
      title: 'Timeline',
      description: 'Set project duration and milestones',
      icon: Calendar,
      required: true
    },
    {
      id: 'team',
      title: 'Team Members',
      description: 'Assign team members to the project',
      icon: Users,
      required: true
    }
  ];

  useEffect(() => {
    if (!open) return;
    setCurrentStep(0);
    setErrors({});
    setSuccessMessage('');
    setSearchQuery('');
    if (isEdit && project) {
      setName(project.name ?? '');
      setDescription(project.description ?? '');
      setStartDate(project.startDate ? project.startDate.slice(0, 10) : '');
      setEndDate(project.endDate ? project.endDate.slice(0, 10) : '');
      setSelectedUserIds(Array.isArray(project.assignedUserIds) ? [...project.assignedUserIds] : []);
    } else {
      setName('');
      setDescription('');
      const today = new Date().toISOString().slice(0, 10);
      setStartDate(today);
      setEndDate(today);
      setSelectedUserIds([]);
    }
  }, [open, mode, project, isEdit]);

  useEffect(() => {
    if (!open) return;
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [open, onClose]);

  function validateStep(stepIndex) {
    const err = {};
    if (stepIndex === 0) { // Details step
      if (!name.trim()) err.name = 'Project name is required';
      if (!description.trim()) err.description = 'Description is required';
    } else if (stepIndex === 1) { // Timeline step
      if (!startDate) err.startDate = 'Start date is required';
      if (!endDate) err.endDate = 'End date is required';
      if (startDate && endDate && startDate > endDate) {
        err.endDate = 'End date must be on or after start date';
      }
    } else if (stepIndex === 2) { // Team step
      if (selectedUserIds.length === 0) err.members = 'At least one member must be assigned';
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  }

  function validate() {
    const err = {};
    if (!name.trim()) err.name = 'Project name is required';
    if (!description.trim()) err.description = 'Description is required';
    if (!startDate) err.startDate = 'Start date is required';
    if (!endDate) err.endDate = 'End date is required';
    if (startDate && endDate && startDate > endDate) {
      err.endDate = 'End date must be on or after start date';
    }
    if (selectedUserIds.length === 0) err.members = 'At least one member must be assigned';
    setErrors(err);
    return Object.keys(err).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    const startISO = startDate ? `${startDate}T00:00:00.000Z` : startDate;
    const endISO = endDate ? `${endDate}T00:00:00.000Z` : endDate;

    if (isEdit && project) {
      updateProject(project.id, { name: name.trim(), description: description.trim(), startDate: startISO, endDate: endISO });
      assignMembers(project.id, selectedUserIds);
      setSuccessMessage('Project updated.');
    } else {
      createProject({
        name: name.trim(),
        description: description.trim(),
        startDate: startISO,
        endDate: endISO,
        assignedUserIds: selectedUserIds,
      });
      setSuccessMessage('Project created.');
    }

    setTimeout(() => {
      onSuccess?.();
      onClose();
    }, 800);
  }

  function toggleUser(id) {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
    );
  }

  function nextStep() {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
        setErrors({});
      }
    }
  }

  function prevStep() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  }

  function goToStep(stepIndex) {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
      setErrors({});
    }
  }

  function handleDelete() {
    if (!project) return;
    if (window.confirm(`Are you sure you want to delete "${project.name}"? This will also delete all associated tasks. This action cannot be undone.`)) {
      const result = deleteProject(project.id);
      if (result.ok) {
        setSuccessMessage('Project deleted.');
        setTimeout(() => {
          onDelete?.();
          onSuccess?.();
          onClose();
        }, 800);
      } else {
        setErrors({ delete: result.error || 'Failed to delete project' });
      }
    }
  }

  return (
    <MotionModal open={open} onClose={onClose}>
      <div className="rounded-[var(--radius-2xl)] border border-[var(--border)] bg-gradient-to-br from-[var(--card)] to-[var(--muted-tint)] shadow-[var(--shadow-2xl)] w-full max-w-3xl min-w-[min(100%,24rem)] max-h-[95vh] overflow-hidden flex flex-col text-[var(--card-fg)] backdrop-blur-xl">
        {/* Modern Header with Progress */}
        <div className="relative px-8 py-6 border-b border-[var(--border)] bg-gradient-to-r from-[var(--surface)]/95 to-[var(--card)]/95 backdrop-blur-sm">
          {/* Close Button */}
          <div className="absolute top-4 right-4">
            <IconButton
              icon={X}
              aria-label="Close"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-[var(--muted)] transition-all duration-200 rounded-full"
            />
          </div>

          {/* Header Content */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] text-white shadow-[var(--shadow-lg)]">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--fg)] tracking-tight">
                {isEdit ? 'Edit Project' : 'Create New Project'}
              </h1>
              <p className="text-sm text-[var(--muted-fg)] mt-1">
                {isEdit ? 'Update your project details and team' : 'Build something amazing with your team'}
              </p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              const isAccessible = index <= currentStep;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <button
                    onClick={() => isAccessible && goToStep(index)}
                    disabled={!isAccessible}
                    className={`flex flex-col items-center gap-2 p-2 rounded-xl transition-all duration-300 ${
                      isAccessible ? 'cursor-pointer hover:bg-[var(--muted)]/50' : 'cursor-not-allowed opacity-50'
                    } ${isCurrent ? 'bg-[var(--primary)]/10' : ''}`}
                  >
                    <div className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${
                      isCompleted
                        ? 'bg-[var(--success)] text-white shadow-[var(--shadow-md)]'
                        : isCurrent
                          ? 'bg-[var(--primary)] text-white shadow-[var(--shadow-lg)]'
                          : 'bg-[var(--muted)] text-[var(--muted-fg)]'
                    }`}>
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                    </div>
                    <div className="text-center">
                      <p className={`text-xs font-medium transition-colors duration-300 ${
                        isCurrent ? 'text-[var(--primary)]' : isCompleted ? 'text-[var(--success)]' : 'text-[var(--muted-fg)]'
                      }`}>
                        {step.title}
                      </p>
                    </div>
                  </button>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 rounded-full transition-colors duration-500 ${
                      index < currentStep ? 'bg-[var(--success)]' : 'bg-[var(--border)]'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mx-8 mt-6 p-4 bg-gradient-to-r from-[var(--success-muted)] to-[var(--success-light)] border border-[var(--success)]/30 rounded-xl shadow-[var(--shadow-sm)]">
            <p className="text-sm text-[var(--success-muted-fg)] flex items-center gap-2">
              <Check className="w-4 h-4" />
              {successMessage}
            </p>
          </div>
        )}

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {/* Step 0: Project Details */}
          {currentStep === 0 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-[var(--shadow-lg)] mb-4">
                  <Target className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-semibold text-[var(--fg)] mb-2">Project Details</h2>
                <p className="text-[var(--muted-fg)]">Tell us about your project vision and goals</p>
              </div>

              <div className="space-y-6 max-w-md mx-auto">
                <Field label="Project Name" htmlFor="project-name" required>
                  <Input
                    id="project-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Q1 Marketing Campaign"
                    error={errors.name}
                    className="text-lg py-3"
                  />
                </Field>

                <Field label="Description" htmlFor="project-desc" required>
                  <textarea
                    id="project-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-[var(--fg)] placeholder:text-[var(--muted-fg)] shadow-[var(--shadow-sm)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 focus:shadow-[var(--shadow-md)] transition-all duration-200 resize-none"
                    placeholder="Describe your project's goals, objectives, and what success looks like..."
                    error={errors.description}
                  />
                </Field>
              </div>
            </div>
          )}

          {/* Step 1: Timeline */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-teal-600 text-white shadow-[var(--shadow-lg)] mb-4">
                  <Clock className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-semibold text-[var(--fg)] mb-2">Project Timeline</h2>
                <p className="text-[var(--muted-fg)]">Set your project duration and key milestones</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-lg mx-auto">
                <Field label="Start Date" htmlFor="project-start" required>
                  <div className="relative">
                    <Input
                      id="project-start"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      error={errors.startDate}
                      className="pl-12 py-3 text-base"
                    />
                    <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--muted-fg)] pointer-events-none" />
                  </div>
                </Field>

                <Field label="End Date" htmlFor="project-end" required>
                  <div className="relative">
                    <Input
                      id="project-end"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      error={errors.endDate}
                      className="pl-12 py-3 text-base"
                    />
                    <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--muted-fg)] pointer-events-none" />
                  </div>
                </Field>
              </div>

              {startDate && endDate && (
                <div className="text-center p-4 bg-[var(--muted-tint)] rounded-xl max-w-lg mx-auto">
                  <p className="text-sm text-[var(--muted-fg)]">
                    Duration: <span className="font-medium text-[var(--fg)]">
                      {Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))} days
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Team Members */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-[var(--shadow-lg)] mb-4">
                  <Crown className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-semibold text-[var(--fg)] mb-2">Team Assembly</h2>
                <p className="text-[var(--muted-fg)]">Choose the perfect team for your project</p>
              </div>

              <div className="max-w-2xl mx-auto">
                {/* Search Bar */}
                <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--muted-fg)]" />
                  <input
                    type="text"
                    placeholder="Search team members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--fg)] placeholder:text-[var(--muted-fg)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 transition-all duration-200 text-base"
                  />
                </div>

                {/* Member Selection */}
                <div className={`rounded-xl border-2 p-6 transition-all duration-200 ${
                  errors.members
                    ? 'border-[var(--danger)] bg-[var(--danger-light)]'
                    : 'border-[var(--border)] bg-gradient-to-br from-[var(--card)] to-[var(--muted-tint)]'
                } shadow-[var(--shadow-sm)]`}>
                  {filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <User className="w-12 h-12 text-[var(--muted-fg)] mb-4" />
                      <p className="text-lg font-medium text-[var(--muted-fg)] mb-2">
                        {searchQuery ? 'No members found' : 'No team members available'}
                      </p>
                      <p className="text-sm text-[var(--muted-fg)]">
                        {searchQuery ? 'Try adjusting your search terms' : 'Contact admin to add team members'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filteredUsers.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => toggleUser(user.id)}
                          className={`group relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                            selectedUserIds.includes(user.id)
                              ? 'border-[var(--primary)] bg-[var(--primary)]/5 shadow-[var(--shadow-md)]'
                              : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/50 hover:shadow-[var(--shadow-sm)]'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`relative flex items-center justify-center w-10 h-10 rounded-xl border-2 transition-all duration-200 ${
                              selectedUserIds.includes(user.id)
                                ? 'bg-[var(--primary)] border-[var(--primary)]'
                                : 'border-[var(--border)] bg-[var(--muted)] group-hover:border-[var(--primary)]/50'
                            }`}>
                              {selectedUserIds.includes(user.id) ? (
                                <Check className="w-5 h-5 text-white" />
                              ) : (
                                <User className="w-5 h-5 text-[var(--muted-fg)]" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-[var(--fg)] truncate">{user.name}</span>
                                {selectedUserIds.includes(user.id) && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--primary)] text-white">
                                    Selected
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-[var(--muted-fg)] truncate block">{user.email}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {errors.members && (
                  <div className="mt-4 p-3 bg-[var(--danger-light)] border border-[var(--danger)]/30 rounded-lg">
                    <p className="text-xs text-[var(--danger)] font-medium flex items-center gap-2" role="alert">
                      <span className="w-1.5 h-1.5 bg-[var(--danger)] rounded-full"></span>
                      {errors.members}
                    </p>
                  </div>
                )}

                <div className="mt-6 text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--muted-tint)] rounded-lg">
                    <Users className="w-4 h-4 text-[var(--muted-fg)]" />
                    <span className="text-sm text-[var(--muted-fg)]">
                      {selectedUserIds.length} of {filteredUsers.length} team members selected
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Step Navigation */}
        <div className="flex items-center justify-between px-8 py-6 border-t border-[var(--border)] bg-gradient-to-r from-[var(--surface)]/95 to-[var(--card)]/95 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {isEdit && (
              <Button
                type="button"
                variant="danger"
                onClick={handleDelete}
                leftIcon={Trash2}
                className="hover:shadow-[var(--shadow-md)] transition-all duration-200"
              >
                Delete project
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStep > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                leftIcon={ChevronLeft}
                className="hover:bg-[var(--muted)] transition-all duration-200"
              >
                Previous
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="hover:bg-[var(--muted)] transition-all duration-200"
            >
              Cancel
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button
                type="button"
                variant="primary"
                onClick={nextStep}
                rightIcon={ChevronRight}
                className="shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all duration-200"
              >
                Next Step
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                onClick={handleSubmit}
                className="shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all duration-200"
              >
                {isEdit ? 'Save Changes' : 'Create Project'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </MotionModal>
  );
}
