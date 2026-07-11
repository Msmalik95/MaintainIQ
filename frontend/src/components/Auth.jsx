import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { authAPI, isBackendOnline, setToken } from '../services/api';
import { 
  Wrench, 
  Mail, 
  Lock, 
  User, 
  ShieldAlert, 
  Key, 
  ArrowLeft, 
  Sparkles,
  CheckCircle,
  Eye,
  EyeOff,
  Briefcase,
  Wifi,
  WifiOff
} from 'lucide-react';

export default function Auth({ onLoginSuccess }) {
  const [view, setView] = useState('login'); // 'login', 'signup', 'reset-request', 'reset-verify'
  const [isShaking, setIsShaking] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [backendOnline, setBackendOnline] = useState(null); // null = checking, true/false

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('technician');
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status/Alert states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check backend connectivity on mount
  useEffect(() => {
    isBackendOnline().then(online => setBackendOnline(online));
  }, []);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  // ─── LOGIN ─────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!email || !password) { setError('Please fill in all fields.'); triggerShake(); return; }

    setIsLoading(true);
    try {
      if (backendOnline) {
        // ── Real backend ──
        const data = await authAPI.login(email, password);
        // Persist session so App.jsx getCurrentUser() works
        storage.loginUser(email, password).catch(() => {}); // best-effort local sync
        setSuccess(`Welcome back, ${data.user.name}!`);
        setTimeout(() => onLoginSuccess(data.user), 700);
      } else {
        // ── localStorage fallback ──
        const user = storage.loginUser(email, password);
        setSuccess(`Welcome back, ${user.name}! (Offline mode)`);
        setTimeout(() => onLoginSuccess(user), 700);
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  // ─── SIGNUP ────────────────────────────────────────────────────────────
  const handleSignup = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!name || !email || !password) { setError('Please fill in all fields.'); triggerShake(); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); triggerShake(); return; }

    setIsLoading(true);
    try {
      if (backendOnline) {
        const data = await authAPI.register(name, email, password, role);
        // Mirror to localStorage so the app's storage helpers work seamlessly
        try { storage.registerUser(name, email, password, role); } catch {}
        setSuccess('Account created! Logging you in...');
        setTimeout(() => onLoginSuccess(data.user), 800);
      } else {
        const newUser = storage.registerUser(name, email, password, role);
        const loggedUser = storage.loginUser(newUser.email, password);
        setSuccess('Account created! (Offline mode)');
        setTimeout(() => onLoginSuccess(loggedUser), 800);
      }
    } catch (err) {
      setError(err.message || 'Registration failed.');
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  // ─── RESET REQUEST ─────────────────────────────────────────────────────
  const handleResetRequest = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!resetEmail) { setError('Please enter your email address.'); triggerShake(); return; }

    setIsLoading(true);
    try {
      if (backendOnline) {
        await authAPI.forgotPassword(resetEmail);
      } else {
        // Validate email exists in localStorage
        const users = storage.getUsers();
        const exists = users.some(u => u.email.toLowerCase() === resetEmail.trim().toLowerCase());
        if (!exists) throw new Error('No account found with this email.');
      }
      setSuccess('Reset PIN generated! Use PIN: 1234');
      setTimeout(() => { setView('reset-verify'); setError(''); setSuccess(''); }, 1200);
    } catch (err) {
      setError(err.message || 'Could not process request.');
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  // ─── RESET VERIFY ──────────────────────────────────────────────────────
  const handleResetVerify = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!resetCode || !newPassword || !confirmPassword) { setError('Please fill in all fields.'); triggerShake(); return; }
    if (resetCode !== '1234') { setError('Invalid PIN. Use mock pin "1234".'); triggerShake(); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); triggerShake(); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); triggerShake(); return; }

    setIsLoading(true);
    try {
      if (backendOnline) {
        await authAPI.resetPassword(resetEmail, resetCode, newPassword);
      } else {
        storage.resetUserPassword(resetEmail, newPassword);
      }
      setSuccess('Password updated! Redirecting to login...');
      setTimeout(() => { setView('login'); setEmail(resetEmail); setPassword(''); setError(''); setSuccess(''); }, 1200);
    } catch (err) {
      setError(err.message || 'Reset failed.');
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  // ─── QUICK DEMO LOGIN ──────────────────────────────────────────────────
  const handleQuickDemoLogin = async (demoRole) => {
    setError(''); setSuccess('');
    const creds = {
      admin:      { email: 'admin@maintainiq.com',      password: 'admin123' },
      technician: { email: 'alice@maintainiq.com',      password: 'tech123' },
      supervisor: { email: 'supervisor@maintainiq.com', password: 'super123' },
    };
    const { email: dEmail, password: dPass } = creds[demoRole];

    setIsLoading(true);
    try {
      if (backendOnline) {
        const data = await authAPI.login(dEmail, dPass);
        setSuccess(`Logging in as ${data.user.name}...`);
        setTimeout(() => onLoginSuccess(data.user), 500);
      } else {
        const user = storage.loginUser(dEmail, dPass);
        setSuccess(`Logging in as ${user.name}... (Offline mode)`);
        setTimeout(() => onLoginSuccess(user), 500);
      }
    } catch (err) {
      setError(err.message || 'Quick login failed.');
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  const changeView = (v) => { setError(''); setSuccess(''); setView(v); };

  return (
    <div className="auth-page">
      <div className={`auth-card ${isShaking ? 'shake-shake' : ''}`}>

        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo-icon"><Wrench size={42} /></div>
          <h2 className="auth-title">MaintainIQ</h2>
          <p className="auth-subtitle">
            {view === 'login'         && 'Operations Console Access'}
            {view === 'signup'        && 'Register New Staff Profile'}
            {view === 'reset-request' && 'Recover Staff Credentials'}
            {view === 'reset-verify'  && 'Create New Password'}
          </p>
          {/* Backend status indicator */}
          {backendOnline !== null && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginTop: '8px', fontSize: '0.7rem', fontWeight: 600, color: backendOnline ? 'var(--accent)' : 'var(--text-muted)' }}>
              {backendOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              {backendOnline ? 'Connected to server' : 'Offline – using local storage'}
            </div>
          )}
        </div>

        {/* Alerts */}
        {error && (
          <div className="badge badge-critical mb-20" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <ShieldAlert size={16} style={{ flexShrink: 0 }} /><span>{error}</span>
          </div>
        )}
        {success && (
          <div className="badge badge-operational mb-20" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <CheckCircle size={16} style={{ flexShrink: 0 }} /><span>{success}</span>
          </div>
        )}

        {/* ── LOGIN ── */}
        {view === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                <input type="email" className="form-control" placeholder="name@maintainiq.com"
                  value={email} onChange={e => setEmail(e.target.value)} style={{ paddingLeft: '42px' }} required />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="form-label" style={{ margin: 0 }}>Password</label>
                <span onClick={() => changeView('reset-request')} style={{ fontSize: '0.78rem', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}>Forgot Password?</span>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                <input type={showPassword ? 'text' : 'password'} className="form-control" placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} style={{ paddingLeft: '42px', paddingRight: '42px' }} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '14px', top: '13px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary auth-btn-submit" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In to Console'}
            </button>

            <p className="auth-footer-link">New staff member? <span onClick={() => changeView('signup')}>Register Profile</span></p>

            {/* Quick Demo */}
            <div className="demo-accounts-box">
              <div className="demo-accounts-title">Quick Demo Logins</div>
              <div className="demo-accounts-grid">
                <button type="button" className="demo-btn admin" onClick={() => handleQuickDemoLogin('admin')} disabled={isLoading}>
                  <Sparkles size={14} /><span>Admin</span><span className="demo-role-label">admin123</span>
                </button>
                <button type="button" className="demo-btn tech" onClick={() => handleQuickDemoLogin('technician')} disabled={isLoading}>
                  <Wrench size={14} /><span>Technician</span><span className="demo-role-label">tech123</span>
                </button>
                <button type="button" className="demo-btn super" onClick={() => handleQuickDemoLogin('supervisor')} disabled={isLoading}>
                  <Briefcase size={14} /><span>Supervisor</span><span className="demo-role-label">super123</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ── SIGNUP ── */}
        {view === 'signup' && (
          <form onSubmit={handleSignup}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                <input type="text" className="form-control" placeholder="e.g. John Doe"
                  value={name} onChange={e => setName(e.target.value)} style={{ paddingLeft: '42px' }} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                <input type="email" className="form-control" placeholder="name@maintainiq.com"
                  value={email} onChange={e => setEmail(e.target.value)} style={{ paddingLeft: '42px' }} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                <input type={showPassword ? 'text' : 'password'} className="form-control" placeholder="Min 6 characters"
                  value={password} onChange={e => setPassword(e.target.value)} style={{ paddingLeft: '42px', paddingRight: '42px' }} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '14px', top: '13px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">System Access Role</label>
              <select className="form-control" value={role} onChange={e => setRole(e.target.value)}>
                <option value="admin">Administrator</option>
                <option value="technician">Technician</option>
                <option value="supervisor">Supervisor</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary auth-btn-submit" disabled={isLoading}>
              {isLoading ? 'Registering...' : 'Register Profile'}
            </button>
            <p className="auth-footer-link">Already have an account? <span onClick={() => changeView('login')}>Sign In</span></p>
          </form>
        )}

        {/* ── RESET REQUEST ── */}
        {view === 'reset-request' && (
          <form onSubmit={handleResetRequest}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.4' }}>
              Enter your registered email. A mock verification PIN will be generated (use <strong>1234</strong> in this prototype).
            </p>
            <div className="form-group" style={{ marginBottom: '25px' }}>
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                <input type="email" className="form-control" placeholder="name@maintainiq.com"
                  value={resetEmail} onChange={e => setResetEmail(e.target.value)} style={{ paddingLeft: '42px' }} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary auth-btn-submit" disabled={isLoading}
              style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
              <Key size={16} /> {isLoading ? 'Sending...' : 'Generate Reset Code'}
            </button>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => changeView('login')}
                style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <ArrowLeft size={12} /> Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* ── RESET VERIFY ── */}
        {view === 'reset-verify' && (
          <form onSubmit={handleResetVerify}>
            <div className="badge badge-operational mb-15" style={{ width: '100%', padding: '10px 12px', fontSize: '0.75rem', justifyContent: 'center' }}>
              Enter mock verification pin <strong style={{ marginLeft: '4px' }}>1234</strong>
            </div>
            <div className="form-group">
              <label className="form-label">Verification Code</label>
              <input type="text" className="form-control" placeholder="1234" maxLength="4"
                value={resetCode} onChange={e => setResetCode(e.target.value)}
                style={{ textAlign: 'center', letterSpacing: '4px', fontWeight: 'bold', fontSize: '1.1rem' }} required />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                <input type="password" className="form-control" placeholder="Min 6 characters"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ paddingLeft: '42px' }} required />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '25px' }}>
              <label className="form-label">Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                <input type="password" className="form-control" placeholder="Re-enter password"
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ paddingLeft: '42px' }} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary auth-btn-submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => changeView('login')}
                style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <ArrowLeft size={12} /> Back to Sign In
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
