import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronRight,
  Home,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  MoreVertical,
  ExternalLink
} from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';

/**
 * Breadcrumb navigation component
 */
export function Breadcrumbs({ items = [], className = '' }) {
  const location = useLocation();

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center space-x-2 text-sm ${className}`}>
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isActive = location.pathname === item.href;

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-gray-400 mx-2" aria-hidden="true" />
              )}

              {isLast ? (
                <span
                  className="font-medium text-gray-900"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.href}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label={`Go to ${item.label}`}
                >
                  {item.icon && <item.icon className="w-4 h-4 mr-1" />}
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Enhanced page header with breadcrumbs, metadata, and actions
 */
export function PageHeader({
  title,
  subtitle,
  description,
  breadcrumbs = [],
  metadata = {},
  actions = [],
  className = '',
  compact = false
}) {
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    if (metadata.lastUpdated) {
      setLastUpdated(new Date(metadata.lastUpdated));
    }
  }, [metadata.lastUpdated]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`space-y-4 ${className}`}
    >
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <Breadcrumbs items={breadcrumbs} />
      )}

      {/* Header Content */}
      <div className={`flex flex-col ${compact ? 'gap-3' : 'gap-4'}`}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          {/* Title Section */}
          <div className="flex-1 min-w-0">
            <h1 className={`${compact ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900 tracking-tight`}>
              {title}
            </h1>

            {subtitle && (
              <p className={`${compact ? 'text-base' : 'text-lg'} text-gray-600 mt-1`}>
                {subtitle}
              </p>
            )}

            {description && (
              <p className="text-sm text-gray-500 mt-2 max-w-2xl">
                {description}
              </p>
            )}
          </div>

          {/* Actions */}
          {actions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'primary'}
                  size={action.size || 'md'}
                  onClick={action.onClick}
                  leftIcon={action.icon}
                  disabled={action.disabled}
                  className={action.className}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Metadata */}
        {Object.keys(metadata).length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center gap-4 text-sm text-gray-500"
          >
            {/* Last Updated */}
            {metadata.lastUpdated && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Updated {lastUpdated.toLocaleDateString()}</span>
              </div>
            )}

            {/* Item Count */}
            {metadata.totalItems && (
              <div className="flex items-center gap-1">
                <span>{metadata.totalItems.toLocaleString()} items</span>
              </div>
            )}

            {/* Active Filters */}
            {metadata.filtersActive && (
              <div className="flex items-center gap-1">
                <span>{metadata.filtersActive} filter{metadata.filtersActive > 1 ? 's' : ''} active</span>
              </div>
            )}

            {/* Custom metadata */}
            {metadata.custom && metadata.custom.map((item, index) => (
              <div key={index} className="flex items-center gap-1">
                {item.icon && <item.icon className="w-4 h-4" />}
                <span>{item.label}</span>
                {item.value && <span className="font-medium">: {item.value}</span>}
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Contextual action bar with quick actions
 */
export function ActionBar({
  title,
  actions = [],
  filters = [],
  search = null,
  className = '',
  variant = 'default' // 'default', 'compact', 'floating'
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const variants = {
    default: 'bg-white border border-gray-200 rounded-lg p-4 shadow-sm',
    compact: 'bg-gray-50 border border-gray-200 rounded-md p-3',
    floating: 'bg-white border border-gray-200 rounded-lg p-4 shadow-lg'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${variants[variant]} ${className}`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Title */}
        {title && (
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900">{title}</h3>
            {filters.length > 0 && (
              <Badge variant="secondary" size="sm">
                {filters.length} filter{filters.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        )}

        {/* Search */}
        {search && (
          <div className="flex-1 max-w-md">
            {search}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {actions.slice(0, 3).map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'outline'}
              size={action.size || 'sm'}
              onClick={action.onClick}
              leftIcon={action.icon}
              disabled={action.disabled}
            >
              {action.label}
            </Button>
          ))}

          {actions.length > 3 && (
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 top-10 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-48"
                  >
                    {actions.slice(3).map((action, index) => (
                      <button
                        key={index + 3}
                        onClick={() => {
                          action.onClick();
                          setIsExpanded(false);
                        }}
                        disabled={action.disabled}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {action.icon && <action.icon className="w-4 h-4" />}
                        {action.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Active Filters */}
      {filters.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 pt-4 border-t border-gray-100"
        >
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-600">Active filters:</span>
            {filters.map((filter, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="cursor-pointer hover:bg-gray-200"
                onClick={filter.onRemove}
              >
                {filter.label}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    filter.onRemove();
                  }}
                  className="ml-1 text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => filters.forEach(f => f.onRemove())}
              className="text-gray-500 hover:text-gray-700"
            >
              Clear all
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

/**
 * Quick navigation menu for common actions
 */
export function QuickNav({
  items = [],
  className = '',
  compact = false
}) {
  return (
    <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-3'} gap-3 ${className}`}>
      {items.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          {item.href ? (
            <Link
              to={item.href}
              className="block p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-gray-300 transition-all group"
            >
              <div className="flex items-center gap-3">
                {item.icon && (
                  <div className="flex-shrink-0">
                    <item.icon className="w-6 h-6 text-gray-500 group-hover:text-blue-500 transition-colors" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                    {item.description}
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
              </div>
            </Link>
          ) : (
            <button
              onClick={item.onClick}
              className="w-full text-left p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-gray-300 transition-all group"
            >
              <div className="flex items-center gap-3">
                {item.icon && (
                  <div className="flex-shrink-0">
                    <item.icon className="w-6 h-6 text-gray-500 group-hover:text-blue-500 transition-colors" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>
            </button>
          )}
        </motion.div>
      ))}
    </div>
  );
}

/**
 * Tab navigation component
 */
export function TabNavigation({
  tabs = [],
  activeTab,
  onTabChange,
  className = '',
  variant = 'default' // 'default', 'pills', 'underline'
}) {
  return (
    <div className={`border-b border-gray-200 ${className}`}>
      <nav className="flex space-x-8">
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={index}
              onClick={() => onTabChange(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                isActive
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.icon && <tab.icon className="w-4 h-4 mr-2" />}
              {tab.label}
              {tab.badge && (
                <Badge variant="secondary" size="sm" className="ml-2">
                  {tab.badge}
                </Badge>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/**
 * Secondary navigation/sidebar
 */
export function SecondaryNav({
  title,
  items = [],
  className = '',
  compact = false
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {title && (
        <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {title}
        </h3>
      )}

      <nav className="space-y-1">
        {items.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            {item.href ? (
              <Link
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                  item.active
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.icon && <item.icon className="w-4 h-4 flex-shrink-0" />}
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" size="sm" className="flex-shrink-0">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            ) : (
              <button
                onClick={item.onClick}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left rounded-md transition-colors ${
                  item.active
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.icon && <item.icon className="w-4 h-4 flex-shrink-0" />}
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" size="sm" className="flex-shrink-0">
                    {item.badge}
                  </Badge>
                )}
              </button>
            )}
          </motion.div>
        ))}
      </nav>
    </div>
  );
}