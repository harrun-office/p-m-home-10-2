import { motion } from 'framer-motion';
import { ProgressRing } from '../../ui/ProgressRing.jsx';
import { MiniBarChart } from '../../ui/MiniBarChart.jsx';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Enhanced metric card with visual indicators and trends
 */
export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  chart,
  icon: Icon,
  color = 'blue',
  size = 'default'
}) {
  const colorClasses = {
    blue: {
      bg: 'bg-[var(--info-light)]',
      border: 'border-[var(--info-muted)]',
      text: 'text-[var(--info-muted-fg)]',
      icon: 'text-[var(--info)]'
    },
    green: {
      bg: 'bg-[var(--success-light)]',
      border: 'border-[var(--success-muted)]',
      text: 'text-[var(--success-muted-fg)]',
      icon: 'text-[var(--success)]'
    },
    amber: {
      bg: 'bg-[var(--warning-light)]',
      border: 'border-[var(--warning-muted)]',
      text: 'text-[var(--warning-muted-fg)]',
      icon: 'text-[var(--warning)]'
    },
    gray: {
      bg: 'bg-[var(--muted)]',
      border: 'border-[var(--border)]',
      text: 'text-[var(--fg-muted)]',
      icon: 'text-[var(--fg-muted)]'
    }
  };

  const theme = colorClasses[color] || colorClasses.blue;

  const getTrendIcon = () => {
    if (!trend) return Minus;
    return trend === 'up' ? TrendingUp : TrendingDown;
  };

  const getTrendColor = () => {
    if (!trend) return 'text-[var(--fg-muted)]';
    return trend === 'up' ? 'text-[var(--success)]' : 'text-[var(--danger)]';
  };

  const TrendIcon = getTrendIcon();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative ${theme.bg} ${theme.border} border-2 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {Icon && <Icon className={`w-5 h-5 ${theme.icon}`} />}
            <h3 className={`text-sm font-medium ${theme.text}`}>{title}</h3>
          </div>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-bold text-[var(--fg)] tabular-nums">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
            {subtitle && (
              <span className="text-sm text-[var(--fg-muted)]">{subtitle}</span>
            )}
          </div>

          {(trend || trendValue) && (
            <div className="flex items-center gap-1 text-xs">
              <TrendIcon className={`w-3 h-3 ${getTrendColor()}`} />
              <span className={getTrendColor()}>
                {trendValue && `${trendValue > 0 ? '+' : ''}${trendValue}`}
                {trend === 'up' && '↑'}
                {trend === 'down' && '↓'}
              </span>
            </div>
          )}
        </div>

        {/* Chart */}
        {chart && (
          <div className="flex-shrink-0 ml-4">
            {chart}
          </div>
        )}
      </div>
    </motion.div>
  );
}