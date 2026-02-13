import { useState, useCallback, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MotionPage } from '../components/motion/MotionPage.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { requestResetPassword } from '../api/auth.js';
import { Lock, Loader2, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { prefersReducedMotion } from '../components/motion/motionPresets.js';

const tween = { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] };
const springSoft = { type: 'spring', stiffness: 300, damping: 28 };

const MIN_PASSWORD_LENGTH = 8;
const GENERIC_ERROR = 'Something went wrong. Please try again later.';
const INVALID_LINK_MESSAGE = 'This reset link is invalid or has expired. Please request a new one.';

/**
 * Reset Password page — token from URL query; submits new password via POST /auth/reset-password.
 * Token kept only in component state (not localStorage).
 */
export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams]);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const reduced = prefersReducedMotion();

  const hasToken = Boolean(token && token.trim().length > 0);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError('');
      const newPwd = (newPassword || '').trim();
      const confirmPwd = (confirmPassword || '').trim();

      if (newPwd.length < MIN_PASSWORD_LENGTH) {
        setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
        return;
      }
      if (newPwd !== confirmPwd) {
        setError('Passwords do not match.');
        return;
      }

      setLoading(true);
      try {
        const { ok } = await requestResetPassword({ token, newPassword: newPwd });
        if (ok) {
          setSuccess(true);
          setTimeout(() => navigate('/login', { replace: true }), 2000);
        } else {
          setError(GENERIC_ERROR);
        }
      } catch {
        setError(GENERIC_ERROR);
      } finally {
        setLoading(false);
      }
    },
    [token, newPassword, confirmPassword, navigate]
  );

  if (!hasToken) {
    return (
      <MotionPage className="h-screen flex flex-col items-center justify-center px-4 min-h-[100dvh] login-page-bg relative z-10">
        <motion.div
          className="w-full max-w-[400px] login-card rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden p-6 sm:p-8"
          initial={reduced ? {} : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={tween}
          style={{ boxShadow: 'var(--shadow-glow)' }}
        >
          <div className="h-2 shrink-0 relative overflow-hidden login-card-accent-bar login-shine-bar rounded-t-2xl mb-6" aria-hidden />
          <div
            className="rounded-[var(--radius)] border border-[var(--danger-muted)] bg-[var(--danger-light)] text-[var(--danger-muted-fg)] text-sm font-medium px-4 py-3 mb-6"
            role="alert"
          >
            {INVALID_LINK_MESSAGE}
          </div>
          <Link
            to="/forgot-password"
            className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl font-medium text-[var(--accent)] hover:text-[var(--primary)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors"
          >
            Request new link
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 w-full py-3 mt-3 rounded-xl font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            Back to Login
          </Link>
        </motion.div>
      </MotionPage>
    );
  }

  if (success) {
    return (
      <MotionPage className="h-screen flex flex-col items-center justify-center px-4 min-h-[100dvh] login-page-bg relative z-10">
        <motion.div
          className="w-full max-w-[400px] login-card rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden p-6 sm:p-8"
          initial={reduced ? {} : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={tween}
          style={{ boxShadow: 'var(--shadow-glow)' }}
        >
          <div className="h-2 shrink-0 relative overflow-hidden login-card-accent-bar login-shine-bar rounded-t-2xl mb-6" aria-hidden />
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--success-light)] text-[var(--success)] mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6" aria-hidden />
          </div>
          <h2 className="text-xl font-bold text-[var(--fg)] text-center mb-2">Password reset</h2>
          <p className="text-sm text-[var(--fg-muted)] text-center mb-6">
            Your password has been updated. Redirecting you to login…
          </p>
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-medium text-[var(--accent)] hover:text-[var(--primary)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            Go to Login
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
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--fg)] tracking-tight mb-1">Set new password</h2>
            <p className="text-sm text-[var(--fg-muted)] leading-relaxed">
              Enter your new password below. Use at least {MIN_PASSWORD_LENGTH} characters.
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
              <label htmlFor="reset-new-password" className="block text-xs font-medium text-[var(--fg-muted)] mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Input
                  id="reset-new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  leftIcon={Lock}
                  disabled={loading}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  disabled={loading}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-fg)] hover:text-[var(--fg)] transition-colors duration-150 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-1 rounded p-1"
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="reset-confirm-password" className="block text-xs font-medium text-[var(--fg-muted)] mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  id="reset-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={Lock}
                  disabled={loading}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-fg)] hover:text-[var(--fg)] transition-colors duration-150 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-1 rounded p-1"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
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
                  Updating…
                </span>
              ) : (
                'Reset password'
              )}
            </Button>
          </form>

          <Link
            to="/login"
            className="inline-flex items-center gap-2 mt-6 text-xs font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-1 rounded"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
            Back to Login
          </Link>
        </div>
      </motion.div>
    </MotionPage>
  );
}
