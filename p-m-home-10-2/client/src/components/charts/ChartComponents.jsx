import { useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * Simple bar chart component
 */
export function BarChart({ data = [], height = 200, color = 'bg-blue-500', showValues = false }) {
  const maxValue = Math.max(...data.map(d => d.value || 0));

  return (
    <div className="flex items-end justify-between gap-1" style={{ height }}>
      {data.map((item, index) => {
        const heightPercent = maxValue > 0 ? ((item.value || 0) / maxValue) * 100 : 0;

        return (
          <div key={index} className="flex-1 flex flex-col items-center gap-2">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(heightPercent, 2)}%` }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className={`w-full ${color} rounded-t transition-colors hover:brightness-110`}
              style={{ minHeight: '4px' }}
            />
            {showValues && (
              <span className="text-xs font-medium text-gray-600">
                {item.value || 0}
              </span>
            )}
            {item.label && (
              <span className="text-xs text-gray-500 truncate max-w-full">
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Line chart component
 */
export function LineChart({ data = [], height = 200, color = 'text-blue-500', strokeWidth = 2 }) {
  const maxValue = Math.max(...data.map(d => d.value || 0));
  const minValue = Math.min(...data.map(d => d.value || 0));
  const range = maxValue - minValue || 1;

  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - (((item.value || 0) - minValue) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative" style={{ height }}>
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.1" className="text-gray-200" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" />

        {/* Line */}
        <motion.polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className={color}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />

        {/* Data points */}
        {data.map((item, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = 100 - (((item.value || 0) - minValue) / range) * 100;

          return (
            <motion.circle
              key={index}
              cx={x}
              cy={y}
              r="1.5"
              className={color.replace('text-', 'fill-')}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            />
          );
        })}
      </svg>

      {/* Value labels */}
      <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs text-gray-500">
        {data.map((item, index) => (
          <span key={index} className="text-center">
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Pie chart component
 */
export function PieChart({ data = [], size = 200, showLabels = true }) {
  const total = data.reduce((sum, item) => sum + (item.value || 0), 0);
  let currentAngle = -90; // Start from top

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((item, index) => {
          const percentage = total > 0 ? (item.value || 0) / total : 0;
          const angle = percentage * 360;
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;

          // Convert angles to radians for calculations
          const startAngleRad = (startAngle * Math.PI) / 180;
          const endAngleRad = (endAngle * Math.PI) / 180;

          // Calculate path
          const x1 = size/2 + (size/2 - 20) * Math.cos(startAngleRad);
          const y1 = size/2 + (size/2 - 20) * Math.sin(startAngleRad);
          const x2 = size/2 + (size/2 - 20) * Math.cos(endAngleRad);
          const y2 = size/2 + (size/2 - 20) * Math.sin(endAngleRad);

          const largeArcFlag = angle > 180 ? 1 : 0;

          const pathData = [
            `M ${size/2} ${size/2}`,
            `L ${x1} ${y1}`,
            `A ${size/2 - 20} ${size/2 - 20} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
          ].join(' ');

          currentAngle = endAngle;

          return (
            <motion.path
              key={index}
              d={pathData}
              fill={item.color || `hsl(${index * 360 / data.length}, 70%, 60%)`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            />
          );
        })}
      </svg>

      {/* Center label */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{total}</div>
          <div className="text-sm text-gray-500">Total</div>
        </div>
      </div>

      {/* Legend */}
      {showLabels && (
        <div className="absolute -right-32 top-0 space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color || `hsl(${index * 360 / data.length}, 70%, 60%)` }}
              />
              <span className="text-sm text-gray-700">{item.label}</span>
              <span className="text-sm font-medium text-gray-900 ml-auto">
                {item.value || 0}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Donut chart component
 */
export function DonutChart({ data = [], size = 200, thickness = 40, showLabels = true }) {
  const total = data.reduce((sum, item) => sum + (item.value || 0), 0);
  let currentAngle = -90;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((item, index) => {
          const percentage = total > 0 ? (item.value || 0) / total : 0;
          const angle = percentage * 360;
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;

          const startAngleRad = (startAngle * Math.PI) / 180;
          const endAngleRad = (endAngle * Math.PI) / 180;

          const innerRadius = size/2 - thickness;
          const outerRadius = size/2;

          const x1 = size/2 + innerRadius * Math.cos(startAngleRad);
          const y1 = size/2 + innerRadius * Math.sin(startAngleRad);
          const x2 = size/2 + outerRadius * Math.cos(startAngleRad);
          const y2 = size/2 + outerRadius * Math.sin(startAngleRad);
          const x3 = size/2 + outerRadius * Math.cos(endAngleRad);
          const y3 = size/2 + outerRadius * Math.sin(endAngleRad);
          const x4 = size/2 + innerRadius * Math.cos(endAngleRad);
          const y4 = size/2 + innerRadius * Math.sin(endAngleRad);

          const largeArcFlag = angle > 180 ? 1 : 0;

          const pathData = [
            `M ${x2} ${y2}`,
            `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x3} ${y3}`,
            `L ${x4} ${y4}`,
            `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x1} ${y1}`,
            'Z'
          ].join(' ');

          currentAngle = endAngle;

          return (
            <motion.path
              key={index}
              d={pathData}
              fill={item.color || `hsl(${index * 360 / data.length}, 70%, 60%)`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            />
          );
        })}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{total}</div>
          <div className="text-sm text-gray-500">Total</div>
        </div>
      </div>

      {/* Legend */}
      {showLabels && (
        <div className="absolute -right-32 top-0 space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color || `hsl(${index * 360 / data.length}, 70%, 60%)` }}
              />
              <span className="text-sm text-gray-700">{item.label}</span>
              <span className="text-sm font-medium text-gray-900 ml-auto">
                {Math.round(((item.value || 0) / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Sparkline chart (mini line chart)
 */
export function Sparkline({ data = [], width = 100, height = 20, color = 'text-blue-500', strokeWidth = 1.5 }) {
  const values = data.map(d => d.value || 0);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = maxValue - minValue || 1;

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - ((value - minValue) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className={color}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/**
 * Stat card with trend indicator
 */
export function StatCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon: Icon,
  chart: ChartComponent,
  chartData,
  className = ''
}) {
  const getTrendColor = () => {
    if (!trend) return 'text-gray-500';
    return trend === 'up' ? 'text-green-600' : 'text-red-600';
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    return trend === 'up' ? '↗️' : '↘️';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-8 h-8 text-blue-500" />}
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {subtitle && (
              <p className="text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Trend indicator */}
        {(trend || trendValue) && (
          <div className={`flex items-center gap-1 text-sm ${getTrendColor()}`}>
            <span>{getTrendIcon()}</span>
            <span>{trendValue > 0 ? '+' : ''}{trendValue}</span>
          </div>
        )}
      </div>

      {/* Chart */}
      {ChartComponent && chartData && (
        <div className="mt-4 h-16">
          <ChartComponent data={chartData} height={64} />
        </div>
      )}
    </motion.div>
  );
}

/**
 * Timeline component for project progress
 */
export function Timeline({ events = [], className = '' }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {events.map((event, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="flex items-start gap-4"
        >
          {/* Timeline dot */}
          <div className="flex flex-col items-center">
            <div className={`w-3 h-3 rounded-full ${event.color || 'bg-blue-500'}`} />
            {index < events.length - 1 && (
              <div className="w-px h-8 bg-gray-300 mt-2" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 pb-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">{event.title}</h4>
              <span className="text-sm text-gray-500">{event.date}</span>
            </div>
            {event.description && (
              <p className="text-sm text-gray-600 mt-1">{event.description}</p>
            )}
            {event.status && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                event.status === 'completed' ? 'bg-green-100 text-green-800' :
                event.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {event.status}
              </span>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}