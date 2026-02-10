import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, MoreVertical } from 'lucide-react';
import { Card } from './Card.jsx';
import { IconButton } from './IconButton.jsx';
import { Badge } from './Badge.jsx';

/**
 * Responsive data card component that replaces table rows on mobile
 * Displays information in a card format with expandable details
 */
export function DataCard({
  data,
  fields,
  actions = [],
  primaryField = 'name',
  secondaryField = 'description',
  avatar,
  status,
  badges = [],
  expandable = false,
  expandedContent,
  className = '',
  onClick,
  variant = 'default',
  compact = false
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const variants = {
    default: 'bg-white border-gray-200 hover:shadow-md hover:border-gray-300',
    primary: 'bg-blue-50 border-blue-200/30 hover:shadow-md',
    success: 'bg-green-50 border-green-200/30 hover:shadow-md',
    warning: 'bg-yellow-50 border-yellow-200/30 hover:shadow-md',
    danger: 'bg-red-50 border-red-200/30 hover:shadow-md'
  };

  const handleCardClick = (e) => {
    // Don't trigger if clicking on interactive elements
    if (e.target.closest('button, a, input, select')) {
      return;
    }
    if (onClick) {
      onClick(data);
    }
  };

  const padding = compact ? 'p-3.5 sm:p-4' : 'p-4 sm:p-5';
  const avatarSize = compact ? 'w-10 h-10 text-sm' : 'w-11 h-11 text-sm';
  const titleClass = compact ? 'text-base font-semibold leading-tight' : 'font-semibold';
  const secondaryClass = compact ? 'text-sm line-clamp-1 mt-1' : 'text-sm line-clamp-2 mt-0.5';
  const fieldsGap = compact ? 'gap-2 mt-3 pt-3' : 'gap-3 mt-4 pt-4';
  const fieldLabelClass = compact ? 'text-[10px] font-medium uppercase tracking-wider' : 'text-xs font-medium uppercase tracking-wider';
  const fieldValueClass = compact ? 'text-xs mt-0.5' : 'text-sm mt-1';
  const expandGap = compact ? 'mt-3 pt-3' : 'mt-4 pt-4';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={`rounded-lg border border-gray-200 shadow-sm transition-all duration-200 ${variants[variant]} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={handleCardClick}
    >
      <div className={padding}>
        {/* Header Row */}
        <div className={`flex items-center justify-between ${compact ? 'gap-3' : 'gap-4'}`}>
          <div className={`flex items-center flex-1 min-w-0 ${compact ? 'gap-3' : 'gap-3'}`}>
            {avatar && (
              <div className={`flex-shrink-0 rounded-lg bg-blue-50 flex items-center justify-center font-semibold text-blue-600 ${avatarSize}`}>
                {avatar}
              </div>
            )}

            <div className={`flex-1 overflow-hidden ${compact ? 'min-w-[130px]' : 'min-w-0'}`}>
              <div className="flex items-center gap-2 flex-nowrap">
                <div className="min-w-0 flex-1 overflow-hidden">
                  <h3 className={`block truncate text-gray-900 ${titleClass}`}>
                    {data[primaryField] ?? 'Untitled'}
                  </h3>
                  {secondaryField && (data[secondaryField] != null && data[secondaryField] !== '') && (
                    <p className={`block truncate text-gray-600 ${secondaryClass}`}>
                      {data[secondaryField]}
                    </p>
                  )}
                </div>
                {status && (
                  <Badge variant={status.variant} className="flex-shrink-0 text-xs px-2 py-0.5">
                    {status.label}
                  </Badge>
                )}
              </div>
              {badges.length > 0 && (
                <div className={`flex flex-wrap gap-1 ${compact ? 'mt-1' : 'mt-2'}`}>
                  {badges.map((badge, index) => (
                    <Badge key={index} variant={badge.variant} className="text-[10px] px-1.5 py-0">
                      {badge.label}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {expandable && (
              <IconButton
                icon={isExpanded ? ChevronUp : ChevronDown}
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
                className="w-7 h-7"
              />
            )}
            {actions.length > 0 && (
              <div className="flex gap-0.5">
                {actions.slice(0, 2).map((action, index) => (
                  <IconButton
                    key={index}
                    icon={action.icon}
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      action.onClick(data);
                    }}
                    aria-label={action.label}
                    className={`${action.className || ''} w-7 h-7`}
                  />
                ))}
                {actions.length > 2 && (
                  <IconButton
                    icon={MoreVertical}
                    variant="ghost"
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="More"
                    className="w-7 h-7"
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Additional Fields Grid */}
        {fields && fields.length > 0 && (
          <div className={`grid grid-cols-2 sm:grid-cols-4 border-t border-gray-200 ${fieldsGap}`}>
            {fields.map((field, index) => (
              <div key={index} className="min-w-0">
                <div className={`text-gray-600 ${fieldLabelClass}`}>
                  {field.label}
                </div>
                <div className={`text-gray-900 font-medium ${fieldValueClass}`}>
                  {field.value ?? '—'}
                </div>
              </div>
            ))}
          </div>
        )}

        {expandable && isExpanded && expandedContent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className={`border-t border-gray-200 ${expandGap}`}
          >
            {expandedContent(data)}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Responsive data grid that switches between table and cards based on screen size
 */
export function ResponsiveDataGrid({
  data = [],
  columns = [],
  cardConfig = {},
  emptyState,
  loading = false,
  className = ''
}) {
  const [viewMode, setViewMode] = useState('auto'); // 'auto', 'cards', 'table'

  const shouldUseCards = () => {
    if (viewMode === 'cards') return true;
    if (viewMode === 'table') return false;
    // Auto mode: use cards on mobile/tablet, table on desktop
    return window.innerWidth < 1024;
  };

  const getAlignClass = (align) => {
    if (align === 'center') return 'text-center';
    if (align === 'right') return 'text-right';
    return 'text-left';
  };

  const renderTableView = () => (
    <div className="overflow-x-auto rounded-xl border-2 border-gray-200 shadow-sm bg-white">
      <table className="min-w-full border-collapse table-fixed">
        <colgroup>
          {columns.map((col, index) => (
            <col key={index} style={{ width: col.width || 'auto' }} />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/50">
            {columns.map((col, index) => (
              <th
                key={index}
                className="px-4 sm:px-5 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center align-middle"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-[var(--surface)] divide-y divide-[var(--border)]">
          {data.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50/40 transition-colors">
              {columns.map((col, colIndex) => {
                const content = col.render ? col.render(item) : item[col.key];
                const align = col.align;
                const wrapperClass =
                  align === 'right'
                    ? 'w-full flex flex-wrap justify-end gap-2 items-center'
                    : align === 'center'
                      ? 'w-full flex flex-wrap justify-center items-center'
                      : '';
                return (
                  <td
                    key={colIndex}
                    className={`px-4 sm:px-5 py-4 text-sm text-gray-900 align-middle ${col.key === 'actions' ? '' : 'whitespace-nowrap'} ${getAlignClass(align)}`}
                  >
                    {wrapperClass ? <div className={wrapperClass}>{content}</div> : content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderCardView = () => {
    const compact = cardConfig.compact === true;
    const gridClass = compact
      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4'
      : 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6';

    return (
      <div className={gridClass}>
        {data.map((item, index) => {
          // Only pass valid DataCard props
          const {
            compact,
            primaryField,
            secondaryField,
            avatar,
            status,
            badges,
            fields,
            actions,
            expandable,
            expandedContent,
            variant,
            onClick
          } = cardConfig;

          const evaluatedConfig = {
            compact: compact === true,
            primaryField,
            secondaryField,
            avatar: typeof avatar === 'function' ? avatar(item) : avatar,
            status: typeof status === 'function' ? status(item) : status,
            badges: typeof badges === 'function' ? badges(item) : badges,
            fields: typeof fields === 'function' ? fields(item) : fields,
            actions: typeof actions === 'function' ? actions(item) : actions,
            expandable,
            expandedContent: typeof expandedContent === 'function' ? expandedContent(item) : expandedContent,
            variant,
            onClick
          };

          return (
            <DataCard
              key={index}
              data={item}
              {...evaluatedConfig}
            />
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-4 sm:p-5">
            <div className="animate-pulse space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gray-100 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
                <div className="h-3 bg-gray-100 rounded" />
                <div className="h-3 bg-gray-100 rounded" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (data.length === 0 && emptyState) {
    return emptyState;
  }

  return (
    <div className={className}>
      {renderTableView()}
    </div>
  );
}