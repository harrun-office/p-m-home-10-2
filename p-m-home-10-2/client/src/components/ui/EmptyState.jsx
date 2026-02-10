import { motion } from 'framer-motion';
import { Button } from './Button.jsx';

/**
 * Enhanced empty state with illustrations, multiple actions, and contextual guidance
 */
export function EmptyState({
  icon: Icon = null,
  iconColor = 'text-[var(--fg-muted)]',
  iconBg = 'bg-[var(--muted)]',
  title,
  subtitle,
  message,
  actions = [],
  variant = 'default',
  size = 'default',
  className = ''
}) {
  const sizeClasses = {
    sm: 'py-8 px-4',
    default: 'py-16 px-6',
    lg: 'py-24 px-8'
  };

  const maxWidthClasses = {
    sm: 'max-w-sm',
    default: 'max-w-md',
    lg: 'max-w-lg'
  };

  // Default icon if none provided
  const DefaultIcon = () => (
    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-5.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  );

  const DisplayIcon = Icon || DefaultIcon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`${sizeClasses[size]} text-center ${maxWidthClasses[size]} mx-auto ${className}`}
      role="status"
      aria-live="polite"
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex justify-center mb-6"
      >
        <div className={`flex items-center justify-center w-20 h-20 rounded-full ${iconBg} ${iconColor}`}>
          <DisplayIcon />
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {title && (
          <h3 className="text-xl font-semibold text-[var(--fg)] mb-2">
            {title}
          </h3>
        )}

        {subtitle && (
          <p className="text-lg text-[var(--fg-muted)] mb-3 font-medium">
            {subtitle}
          </p>
        )}

        {message && (
          <p className="text-sm text-[var(--fg-muted)] leading-relaxed mb-6 max-w-sm mx-auto">
            {message}
          </p>
        )}

        {/* Actions */}
        {actions && actions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center items-center"
          >
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || (index === 0 ? 'primary' : 'outline')}
                size={action.size || 'md'}
                onClick={action.onClick}
                leftIcon={action.icon}
                disabled={action.disabled}
                className={action.className}
              >
                {action.label}
              </Button>
            ))}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

/**
 * Pre-configured empty states for common scenarios
 */
export const EmptyStates = {
  // Projects
  NoProjects: ({ onCreateProject }) => (
    <EmptyState
      icon={() => (
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )}
      iconColor="text-[var(--info)]"
      iconBg="bg-[var(--info-light)]"
      title="No projects yet"
      subtitle="Let's create your first project"
      message="Projects help you organize tasks, track progress, and collaborate with your team. Start by creating a project for your current work."
      actions={[
        {
          label: 'Create Project',
          onClick: onCreateProject,
          icon: () => <span>➕</span>
        }
      ]}
    />
  ),

  NoFilteredProjects: ({ onClearFilters }) => (
    <EmptyState
      icon={() => (
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
      )}
      iconColor="text-[var(--fg-muted)]"
      iconBg="bg-[var(--muted)]"
      title="No projects found"
      message="Try adjusting your search terms or clearing some filters to see more projects."
      actions={[
        {
          label: 'Clear Filters',
          onClick: onClearFilters,
          variant: 'outline'
        }
      ]}
    />
  ),

  // Tasks
  NoTasks: ({ onCreateTask }) => (
    <EmptyState
      icon={() => (
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )}
      iconColor="text-[var(--success)]"
      iconBg="bg-[var(--success-light)]"
      title="No tasks yet"
      subtitle="Ready to get started?"
      message="Tasks help you break down projects into manageable work items. Create your first task to begin tracking progress."
      actions={[
        {
          label: 'Create Task',
          onClick: onCreateTask,
          icon: () => <span>✅</span>
        }
      ]}
    />
  ),

  AllTasksComplete: () => (
    <EmptyState
      icon={() => <span className="text-4xl">🎉</span>}
      iconColor="text-[var(--warning)]"
      iconBg="bg-[var(--warning-light)]"
      title="All caught up!"
      subtitle="Great job completing your tasks"
      message="You've completed all your current tasks. Take a moment to celebrate, then create new tasks to keep moving forward."
    />
  ),

  // Team/Users
  NoTeamMembers: ({ onInviteUsers }) => (
    <EmptyState
      icon={() => (
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      )}
      iconColor="text-[var(--purple-fg)]"
      iconBg="bg-[var(--purple-light)]"
      title="No team members yet"
      subtitle="Build your team"
      message="Add team members to collaborate on projects, assign tasks, and share responsibilities. Start by inviting your colleagues."
      actions={[
        {
          label: 'Invite Team Members',
          onClick: onInviteUsers,
          icon: () => <span>👥</span>
        }
      ]}
    />
  ),

  // Notifications
  NoNotifications: () => (
    <EmptyState
      icon={() => (
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 17h5l-5 5v-5zM4.868 12.683A17.925 17.925 0 012 21.6V19.8c0-1.1.9-2 2-2h1.152l.488-3.686A2.028 2.028 0 017.65 12.3l1.152-1.152 1.152 1.152a2.028 2.028 0 011.524.614l.488 3.686H12c1.1 0 2 .9 2 2v1.8c7.2-1.6 12.6-8.1 12.6-15.4 0-.7-.1-1.4-.3-2.1L21.9 9.4c-.6 0-1.1.5-1.1 1.1s.5 1.1 1.1 1.1h2.8c.3 0 .5-.2.5-.5 0-10.2-8.3-18.5-18.5-18.5C4.3 2.5 0 10.8 0 21.5c0 .3.2.5.5.5h2.8c.6 0 1.1-.5 1.1-1.1s-.5-1.1-1.1-1.1H2.6c.7-5.7 4.3-10.7 9.3-12.9l-.7-.7z" />
        </svg>
      )}
      iconColor="text-[var(--info)]"
      iconBg="bg-[var(--info-light)]"
      title="No notifications yet"
      message="You'll receive notifications for task assignments, deadline reminders, and project updates here."
    />
  ),

  // Generic empty states
  SearchNoResults: ({ searchTerm, onClearSearch }) => (
    <EmptyState
      icon={() => (
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )}
      iconColor="text-[var(--fg-muted)]"
      iconBg="bg-[var(--muted)]"
      title="No results found"
      subtitle={`for "${searchTerm}"`}
      message="Try adjusting your search terms or check for typos. You can also browse all items without filters."
      actions={[
        {
          label: 'Clear Search',
          onClick: onClearSearch,
          variant: 'outline'
        }
      ]}
    />
  ),

  ErrorState: ({ onRetry, errorMessage = 'Something went wrong' }) => (
    <EmptyState
      icon={() => (
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )}
      iconColor="text-[var(--danger)]"
      iconBg="bg-[var(--danger-light)]"
      title="Oops! Something went wrong"
      message={errorMessage}
      actions={[
        {
          label: 'Try Again',
          onClick: onRetry,
          variant: 'outline'
        }
      ]}
    />
  ),

  LoadingState: ({ message = 'Loading...' }) => (
    <EmptyState
      icon={() => (
        <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      iconColor="text-[var(--info)]"
      iconBg="bg-[var(--info-light)]"
      title={message}
      message="Please wait while we load your content."
    />
  )
};
