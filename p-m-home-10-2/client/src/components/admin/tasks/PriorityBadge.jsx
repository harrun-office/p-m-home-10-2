import { Badge } from '../../ui/Badge.jsx';

/**
 * HIGH -> danger, MEDIUM -> warning, LOW -> neutral. Token-based.
 */
const VARIANT_MAP = {
  HIGH: 'danger',
  MEDIUM: 'warning',
  LOW: 'neutral',
};

const LABELS = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

export function PriorityBadge({ priority }) {
  const p = priority && VARIANT_MAP[priority] ? priority : 'MEDIUM';
  const label = LABELS[p] ?? 'Medium';
  const variant = VARIANT_MAP[p] ?? 'neutral';

  return <Badge variant={variant}>{label}</Badge>;
}
