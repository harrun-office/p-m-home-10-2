import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MotionPage } from '../components/motion/MotionPage.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { requestForgotPassword } from '../api/auth.js';
import { FolderKanban, Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { prefersReducedMotion } from '../components/motion/motionPresets.js';

const tween = { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] };
const springSoft = { type: 'spring', stiffness: 300, damping: 28 };

const SUCCESS_MESSAGE = 'If an account exists, a reset link has been sent.';
const GENERIC_ERROR = 'Something went wrong. Please try again later.';

function isValidEmail(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return false;
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRe.test(trimmed);
}

/**
 * Forgot Password page — requests reset email via POST /auth/forgot-password.
 */
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const reduced = prefersReducedMotion();

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError('');
      const trimmed = (email || '').trim();
      if (!trimmed) {
        setError('Please enter your email address.');
        return;
      }
      if (!isValidEmail(trimmed)) {
        setError('Please enter a valid email address.');
        return;
      }
      setLoading(true);
      try {
        const { ok } = await requestForgotPassword(trimmed);
        setSuccess(true);
        if (!ok) {
          // Still show success for security: never reveal if email exists
          setError('');
        }
      } catch {
        setError(GENERIC_ERROR);
      } finally {
        setLoading(false);
      }
    },
    [email]
  );

  if (success) {
    return (
      <MotionPage className="h-screen flex flex-col items-center justify-center px-4 min-h-[100dvh] login-page-bg relative z-10">
        <motion.div
          className="w-full max-w-[400px] login-card login-card-focus rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden p-6 sm:p-8"
          initial={reduced ? {} : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={tween}
          style={{ boxShadow: 'var(--shadow-glow)' }}
        >
          <div className="h-2 shrink-0 relative overflow-hidden login-card-accent-bar login-shine-bar rounded-t-2xl mb-6" aria-hidden />
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--success-light)] text-[var(--success)] mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6" aria-hidden />
          </div>
          <h2 className="text-xl font-bold text-[var(--fg)] text-center mb-2">Check your email</h2>
          <p className="text-sm text-[var(--fg-muted)] text-center mb-6">{SUCCESS_MESSAGE}</p>
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-medium text-[var(--accent)] hover:text-[var(--primary)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            Back to Login
          </Link>
        </motion.div>
      </MotionPage>
    );
  }

  return (
    <MotionPage className="h-screen flex flex-col items-center justify-center px-4 min-h-[100dvh] login-page-bg relative z-10">
      <motion.div
        className="w-full max-w-[400px] login-card login-card-focus rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden focus-within:ring-2 focus-within:ring-[var(--ring)] focus-within:ring-offset-2"
        initial={reduced ? {} : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...tween, delay: 0.05 }}
        style={{ boxShadow: 'var(--shadow-glow)' }}
      >
        <div className="h-2 shrink-0 relative overflow-hidden login-card-accent-bar login-shine-bar rounded-t-2xl" aria-hidden />
        <div className="p-6 sm:p-8 relative login-card-inner">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] mb-6 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-1 rounded"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
            Back to Login
          </Link>
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--fg)] tracking-tight mb-1">Forgot password?</h2>
            <p className="text-sm text-[var(--fg-muted)] leading-relaxed">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error"
                  initial={reduced ? {} : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={reduced ? {} : { opacity: 0, height: 0 }}
                  transition={springSoft}
                  className="overflow-hidden rounded-[var(--radius)] border border-[var(--danger-muted)] bg-[var(--danger-light)] text-[var(--danger-muted-fg)] text-xs font-medium"
                  role="alert"
                  aria-live="polite"
                >
                  <p className="px-3 py-2.5">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label htmlFor="forgot-email" className="block text-xs font-medium text-[var(--fg-muted)] mb-1.5">
                Email
              </label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={Mail}
                disabled={loading}
                autoComplete="email"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={loading}
              className="login-btn-primary-glow w-full justify-center py-3.5 text-sm font-semibold rounded-xl mt-2"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden />
                  Sending…
                </span>
              ) : (
                'Send reset link'
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </MotionPage>
  );
}
