import { motion } from 'framer-motion';

/**
 * Mini bar chart component for trend visualization
 */
export function MiniBarChart({ data = [], height = 40, color = 'bg-[var(--primary)]' }) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-end justify-center space-x-1"
        style={{ height }}
      >
        <div className="text-xs text-[var(--fg-muted)]">No data</div>
      </div>
    );
  }

  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);

  return (
    <div
      className="flex items-end justify-center space-x-1"
      style={{ height }}
    >
      {data.map((value, index) => {
        const heightPercent = maxValue > 0 ? (value / maxValue) * 100 : 0;
        const isHighest = value === maxValue && maxValue > minValue;

        return (
          <motion.div
            key={index}
            className={`w-2 rounded-sm ${color} ${isHighest ? 'opacity-100' : 'opacity-70'}`}
            initial={{ height: 0 }}
            animate={{ height: `${Math.max(heightPercent, 5)}%` }}
            transition={{ duration: 0.8, delay: index * 0.1 }}
            style={{ minHeight: '4px' }}
          />
        );
      })}
    </div>
  );
}