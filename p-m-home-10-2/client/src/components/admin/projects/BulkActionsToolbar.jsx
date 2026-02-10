import { motion } from 'framer-motion';
import { Button } from '../../ui/Button.jsx';
import { X, CheckCircle2, PauseCircle, PlayCircle, Trash2 } from 'lucide-react';

/**
 * Bulk actions toolbar that appears when projects are selected
 */
export function BulkActionsToolbar({
  selectedCount,
  onBulkStatusChange,
  onClearSelection,
  onBulkDelete
}) {
  if (selectedCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-[var(--info-light)] border border-[var(--info-muted)] rounded-lg p-4 mb-4 flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 bg-[var(--primary)] rounded flex items-center justify-center">
          <CheckCircle2 className="w-3 h-3 text-[var(--primary-fg)]" />
        </div>
        <span className="text-sm font-medium text-[var(--info-muted-fg)]">
          {selectedCount} project{selectedCount > 1 ? 's' : ''} selected
        </span>
      </div>

      <div className="flex items-center gap-2">
        <select
          onChange={(e) => {
            if (e.target.value) {
              onBulkStatusChange?.(e.target.value);
              e.target.value = ''; // Reset select
            }
          }}
          className="text-sm border border-[var(--info-muted)] rounded px-3 py-1 bg-[var(--surface)] text-[var(--fg)]"
          defaultValue=""
        >
          <option value="" disabled>Change status...</option>
          <option value="ACTIVE">Mark as Active</option>
          <option value="ON_HOLD">Put on Hold</option>
          <option value="COMPLETED">Mark as Completed</option>
        </select>

        <Button
          variant="outline"
          size="sm"
          onClick={onBulkDelete}
          className="text-[var(--danger)] border-[var(--danger-muted)] hover:bg-[var(--danger-light)]"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="text-[var(--info-muted-fg)] hover:bg-[var(--info-muted)]"
        >
          <X className="w-4 h-4 mr-1" />
          Clear
        </Button>
      </div>
    </motion.div>
  );
}