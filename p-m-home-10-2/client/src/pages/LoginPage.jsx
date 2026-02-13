import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { login as loginApi, getCurrentUser } from '../api/auth.js';
import { setToken } from '../utils/authToken.js';
import { setSession } from '../store/sessionStore.js';
import { MotionPage } from '../components/motion/MotionPage.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { listStagger, listItem, prefersReducedMotion } from '../components/motion/motionPresets.js';
import { FolderKanban, Mail, Lock, CheckCircle2, Zap, Users, BarChart3, Loader2, Eye, EyeOff } from 'lucide-react';

const spring = { type: 'spring', stiffness: 400, damping: 30 };
const springSoft = { type: 'spring', stiffness: 300, damping: 28 };
const tween = { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] };

const FEATURES = [
  { icon: CheckCircle2, title: 'Real-time Sync', sub: 'Live collaboration' },
  { icon: Zap, title: 'Smart Automation', sub: 'Intelligent workflows' },
  { icon: Users, title: 'Permissions', sub: 'Role-based access' },
  { icon: BarChart3, title: 'Analytics', sub: 'Data insights' },
];

const TRUST = ['Secure', 'Fast', 'Reliable'];

const DEMO_HINT = 'Sign in with your account email and password.';

/**
 * Root / Login page — Backend JWT authentication.
 */
export function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const reduced = prefersReducedMotion();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isMountedRef = useRef(true);
  useEffect(() => () => { isMountedRef.current = false; }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError('');
      const emailTrim = (email || '').trim().toLowerCase();
      const pass = (password || '').trim();
      if (!emailTrim) {
        setError('Please enter your email.');
        return;
      }
      if (!pass) {
        setError('Please enter your password.');
        return;
      }
      setLoading(true);
      try {
        const data = await loginApi(emailTrim, pass);
        setToken(data.token);
        const user = await getCurrentUser();
        setSession(user);
        if (user.role === 'ADMIN') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/app', { replace: true });
        }
      } catch {
        if (isMountedRef.current) {
          setError('Invalid email or password.');
        }
      } finally {
        if (isMountedRef.current) setLoading(false);
      }
    },
    [email, password, navigate]
  );

  const anyLoading = loading === true;

  return (
    <MotionPage
      className="h-screen flex flex-col md:flex-row relative overflow-hidden min-h-[100dvh] login-page-bg"
    >
      {/* Decorative orbs — soft, two only */}
      {!reduced && (
        <>
          <div
            className="login-orb absolute -left-16 top-1/3 w-64 h-64 rounded-full pointer-events-none z-0"
            style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)', filter: 'blur(48px)' }}
            aria-hidden
          />
          <div
            className="login-orb absolute right-0 bottom-1/3 w-80 h-80 rounded-full pointer-events-none z-0"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', filter: 'blur(56px)', animationDelay: '-5s' }}
            aria-hidden
          />
        </>
      )}

      {/* Left: Brand + value (desktop) */}
      <aside className="hidden md:flex md:w-[min(52%,560px)] md:shrink-0 flex-col justify-center px-8 lg:px-12 py-10 relative z-10">
        <div className="max-w-md">
          <motion.div
            className="flex items-center gap-3 mb-7"
            initial={reduced ? {} : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={tween}
          >
            <motion.div
              className="flex items-center justify-center w-14 h-14 rounded-2xl text-white transition-smooth"
              style={{ background: 'var(--primary-gradient)', boxShadow: 'var(--shadow-glow-primary)' }}
              whileHover={reduced ? {} : { scale: 1.06, boxShadow: '0 8px 24px -4px rgba(37,99,235,0.45), 0 0 0 1px rgba(37,99,235,0.15)' }}
              whileTap={reduced ? {} : { scale: 0.98 }}
              transition={spring}
            >
              <FolderKanban className="w-7 h-7 drop-shadow-sm" aria-hidden />
            </motion.div>
            <div>
              <span className="text-xl font-semibold tracking-tight text-[var(--fg)] block leading-tight">
                Project Management
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--fg-muted)] mt-1 block">
                Enterprise
              </span>
            </div>
          </motion.div>

          <motion.h1
            className="login-headline text-2xl lg:text-[2rem] xl:text-[2.25rem] font-bold tracking-tight leading-[1.2] text-[var(--fg)] mb-4 max-w-[28ch]"
            initial={reduced ? {} : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...tween, delay: 0.05 }}
          >
            Intelligent project management for modern teams
          </motion.h1>
          <motion.p
            className="text-sm text-[var(--fg-secondary)] leading-relaxed mb-7 max-w-[32ch]"
            initial={reduced ? {} : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...tween, delay: 0.1 }}
          >
            Streamline workflows, enhance collaboration, and deliver exceptional results.
          </motion.p>

          <motion.div
            className="grid grid-cols-2 gap-3"
            variants={listStagger.animate(reduced)}
            initial="initial"
            animate="animate"
          >
            {FEATURES.map(({ icon: Icon, title, sub }, index) => (
              <motion.div
                key={title}
                variants={listItem}
                transition={{ ...springSoft, delay: reduced ? 0 : index * 0.04 }}
                className="login-feature-card flex items-start gap-2.5 p-3.5 rounded-xl bg-[var(--card)] border border-[var(--border)] group relative overflow-hidden"
                whileHover={reduced ? {} : { scale: 1.02, y: -3 }}
                whileTap={reduced ? {} : { scale: 0.99 }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.07) 0%, rgba(59,130,246,0.05) 100%)' }}
                  aria-hidden
                />
                <div
                  className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0 transition-all duration-300 group-hover:scale-110 relative z-10 shadow-[0_2px_6px_-2px_rgba(37,99,235,0.2)]"
                  style={{ background: 'linear-gradient(145deg, var(--accent-light) 0%, var(--primary-muted) 100%)' }}
                >
                  <Icon className="w-4 h-4 text-[var(--accent)]" aria-hidden />
                </div>
                <div className="min-w-0 pt-0.5 relative z-10">
                  <span className="block text-xs font-semibold text-[var(--fg)] mb-0.5">{title}</span>
                  <span className="text-[10px] text-[var(--fg-muted)] leading-tight">{sub}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="mt-6 pt-5 border-t border-[var(--border)]/60 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-[var(--fg-muted)]"
            initial={reduced ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.35 }}
          >
            <span className="flex items-center gap-2 font-medium">
              <Lock className="w-3.5 h-3.5 text-[var(--primary)]/70 shrink-0" aria-hidden />
              Use demo credentials to sign in
            </span>
            <span className="text-[var(--border)]" aria-hidden>·</span>
            <span className="font-medium">{TRUST.join(' · ')}</span>
          </motion.div>
        </div>
      </aside>

      {/* Subtle divider line (desktop) */}
      <div className="hidden md:block absolute left-[min(52%,560px)] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[var(--border)] to-transparent z-10 pointer-events-none" aria-hidden />

      {/* Right: Sign-in card */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 md:py-10 relative z-10 min-h-0 login-right-bg">
        {/* Mobile: short hero */}
        <motion.div
          className="w-full max-w-[380px] mb-6 md:hidden flex flex-col items-center gap-4"
          initial={reduced ? {} : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            className="relative flex items-center justify-center w-14 h-14 rounded-2xl text-white shadow-[var(--shadow-glow-primary)]"
            style={{ background: 'var(--primary-gradient)' }}
            initial={reduced ? {} : { scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, ...springSoft }}
          >
            <FolderKanban className="w-7 h-7 drop-shadow-sm" aria-hidden />
          </motion.div>
          <p className="text-base font-bold text-[var(--fg)] text-center tracking-tight">Intelligent project management</p>
          <p className="text-xs text-[var(--fg-muted)] text-center max-w-[80%]">Sign in below to get started</p>
        </motion.div>

        <div className="w-full max-w-[400px]">
          <motion.div
            className="login-card login-card-focus rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden focus-within:ring-2 focus-within:ring-[var(--ring)] focus-within:ring-offset-2"
            initial={reduced ? {} : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...tween, delay: 0.05 }}
            whileHover={reduced ? {} : { y: -3 }}
            style={{ boxShadow: 'var(--shadow-glow)' }}
          >
            <div className="h-2 shrink-0 relative overflow-hidden login-card-accent-bar login-shine-bar rounded-t-2xl" aria-hidden />
            <div className="p-6 sm:p-8 relative login-card-inner">
              <div className="flex items-center gap-3 mb-5 md:hidden">
                <motion.div
                  className="flex items-center justify-center w-10 h-10 rounded-xl text-white transition-smooth"
                  style={{ background: 'var(--primary-gradient)', boxShadow: 'var(--shadow-glow-primary)' }}
                  whileTap={reduced ? {} : { scale: 0.97 }}
                  transition={spring}
                >
                  <FolderKanban className="w-5 h-5 drop-shadow-sm" aria-hidden />
                </motion.div>
                <div>
                  <span className="text-base font-semibold text-[var(--fg)] block leading-tight">Project Management</span>
                  <span className="text-[10px] text-[var(--fg-muted)] uppercase tracking-wider">Enterprise</span>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--fg)] tracking-tight mb-1">Welcome back</h2>
                <p className="text-sm text-[var(--fg-muted)] leading-relaxed">Sign in to access your workspace</p>
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
                  <label htmlFor="login-email" className="block text-xs font-medium text-[var(--fg-muted)] mb-1.5">
                    Email
                  </label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    leftIcon={Mail}
                    disabled={anyLoading}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                <div>
                  <label htmlFor="login-password" className="block text-xs font-medium text-[var(--fg-muted)] mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      leftIcon={Lock}
                      disabled={anyLoading}
                      autoComplete="current-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={anyLoading}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-fg)] hover:text-[var(--fg)] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-1 rounded p-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      tabIndex={0}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-[var(--accent)] hover:text-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-1 rounded px-1 py-0.5 disabled:opacity-50 disabled:pointer-events-none"
                    tabIndex={anyLoading ? -1 : 0}
                  >
                    Forgot Password?
                  </Link>
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={anyLoading}
                  className="login-btn-primary-glow w-full justify-center py-3.5 text-sm font-semibold rounded-xl mt-2"
                >
                  {anyLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden />
                      Signing in…
                    </span>
                  ) : (
                    'Login'
                  )}
                </Button>
              </form>

              <div className="pt-5 mt-5 border-t border-[var(--border)]/80">
                <p className="text-[10px] text-[var(--fg-muted)] text-center leading-relaxed" id="login-demo-hint">
                  {DEMO_HINT}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.p
            className="mt-6 text-center text-[11px] text-[var(--fg-muted)] font-medium tracking-wide"
            initial={reduced ? {} : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...tween, delay: 0.5 }}
          >
            {TRUST.join(' • ')}
          </motion.p>
        </div>
      </main>
    </MotionPage>
  );
}
