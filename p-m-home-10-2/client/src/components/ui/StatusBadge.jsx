import { Badge } from './Badge.jsx';

/**
 * ACTIVE -> success, ON_HOLD -> warning, COMPLETED -> muted. Token-based.
 */
const VARIANT_MAP = {
  ACTIVE: 'success',
  ON_HOLD: 'warning',
  COMPLETED: 'neutral',
};

const LABELS = {
  ACTIVE: 'Active',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
};

export function StatusBadge({ status }) {
  const label = (status && LABELS[status]) ?? status ?? '—';
  const variant = (status && VARIANT_MAP[status]) ?? 'neutral';

  return <Badge variant={variant}>{label}</Badge>;
}
