import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconButton } from './IconButton.jsx';
import { MoreVertical, CheckCircle2, PauseCircle, PlayCircle } from 'lucide-react';

/**
 * Contextual action menu with dropdown options
 */
export function ActionMenu({ trigger, actions = [], disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleAction = (action) => {
    if (action.onClick) {
      action.onClick();
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div
        ref={triggerRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={disabled ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
      >
        {trigger || (
          <IconButton
            icon={MoreVertical}
            variant="ghost"
            size="sm"
            aria-label="Actions menu"
            disabled={disabled}
          />
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1 z-50 min-w-[10rem] rounded-xl border-2 border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-lg)] py-1.5"
          >
            {actions.map((action, index) => (
              <div key={action.id || index}>
                {action.type === 'divider' ? (
                  <div className="border-t border-[var(--border)] my-1" />
                ) : (
                  <button
                    type="button"
                    onClick={() => handleAction(action)}
                    disabled={action.disabled}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center gap-3 transition-colors ${action.destructive
                        ? 'text-[var(--danger)] hover:bg-[var(--danger-light)]'
                        : 'text-[var(--fg)] hover:bg-[var(--muted)]/50'
                      } ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {action.icon && (
                      <action.icon className={`w-4 h-4 shrink-0 ${action.destructive ? 'text-[var(--danger)]' : 'text-[var(--fg-muted)]'}`} />
                    )}
                    <span>{action.label}</span>
                    {action.shortcut && (
                      <span className="ml-auto text-xs text-[var(--fg-muted)]">{action.shortcut}</span>
                    )}
                  </button>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Pre-configured project actions menu
 */
export function ProjectActionsMenu({
  project,
  onEdit,
  onStatusChange,
  onDelete,
  trigger,
  disabled = false
}) {
  const getStatusActions = () => {
    const actions = [];

    if (project.status !== 'ACTIVE') {
      actions.push({
        id: 'activate',
        label: 'Mark as Active',
        icon: PlayCircle,
        onClick: () => onStatusChange?.(project.id, 'ACTIVE')
      });
    }

    if (project.status !== 'ON_HOLD') {
      actions.push({
        id: 'hold',
        label: 'Put on Hold',
        icon: PauseCircle,
        onClick: () => onStatusChange?.(project.id, 'ON_HOLD')
      });
    }

    if (project.status !== 'COMPLETED') {
      actions.push({
        id: 'complete',
        label: 'Mark as Completed',
        icon: CheckCircle2,
        onClick: () => onStatusChange?.(project.id, 'COMPLETED')
      });
    }

    return actions;
  };

  const actions = [
    {
      id: 'view',
      label: 'View Details',
      icon: () => <span>👁️</span>,
      onClick: () => {
        // Navigate to project detail - this will be handled by Link in parent
      }
    },
    {
      id: 'edit',
      label: 'Edit Project',
      icon: () => <span>✏️</span>,
      onClick: () => onEdit?.(project),
      disabled: project.status === 'COMPLETED' || project.status === 'ON_HOLD'
    },
    { type: 'divider' },
    ...getStatusActions(),
    { type: 'divider' },
    {
      id: 'delete',
      label: 'Delete Project',
      icon: () => <span>🗑️</span>,
      onClick: () => onDelete?.(project),
      destructive: true
    }
  ];

  return (
    <ActionMenu
      trigger={trigger}
      actions={actions}
      disabled={disabled}
    />
  );
}