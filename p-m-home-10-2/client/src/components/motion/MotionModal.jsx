import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { IconButton } from '../ui/IconButton.jsx';
import { modalBackdrop, modalPanel } from './motionPresets.js';

/**
 * Modal wrapper: backdrop fade + panel scale. Exit animation when open becomes false.
 * Full-screen backdrop with blur, close button, and improved design.
 */
export function MotionModal({ open, onClose, children, title, className = '' }) {
  return (
    <AnimatePresence>
      {open && (
      <motion.div
        initial={modalBackdrop.initial}
        animate={modalBackdrop.animate}
        exit={modalBackdrop.exit}
        transition={modalBackdrop.transition}
        className="fixed inset-0 z-50 flex items-center justify-center cursor-default"
        style={{ 
          backgroundColor: 'var(--backdrop)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
        onClick={onClose}
        aria-modal="true"
        role="dialog"
        aria-label={title || "Dialog"}
      >
        <motion.div
          initial={modalPanel.initial}
          animate={modalPanel.animate}
          exit={modalPanel.exit}
          transition={modalPanel.transition}
          className={`relative bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-lg)] max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with title and close button */}
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--surface)]">
              <h2 className="text-lg font-semibold text-[var(--fg)]">{title}</h2>
              <IconButton
                icon={X}
                aria-label="Close"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="shrink-0"
              />
            </div>
          )}
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {title ? (
              <div className="p-6">
                {children}
              </div>
            ) : (
              children
            )}
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}
