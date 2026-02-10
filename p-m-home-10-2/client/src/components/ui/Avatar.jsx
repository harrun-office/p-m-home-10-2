import { useMemo } from 'react';

/**
 * Avatar component for user profiles and project icons
 */
export function Avatar({
  src,
  alt = '',
  fallback,
  size = 'md',
  className = '',
  ...props
}) {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl'
  };

  const initials = useMemo(() => {
    if (fallback) return fallback;
    if (alt) {
      return alt
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');
    }
    return '?';
  }, [fallback, alt]);

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`rounded-full object-cover ${sizeClasses[size]} ${className}`}
        {...props}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-[var(--muted)] flex items-center justify-center font-medium text-[var(--fg)] ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {initials}
    </div>
  );
}