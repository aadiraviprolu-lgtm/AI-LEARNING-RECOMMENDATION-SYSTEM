import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { Alert, Field } from '../components/ui.jsx';
import { validateLogin } from '../validation.js';

export default function Login() {
  const { login, notice } = useAuth();
  const [f, setF] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const v = validateLogin(f); setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true); setApiError('');
    try { await login({ email: f.email.trim(), password: f.password }); }
    catch (err) { setApiError(err.message); setBusy(false); }
  };

  return (
    <div className="auth-page">
      <form className="card auth-card form" onSubmit={submit} noValidate>
        <div className="brand brand-lg">🎓 LearnPath <span>AI</span></div>
        <h2>Welcome back</h2>
        <p className="muted">Log in to continue your learning journey.</p>
        <Alert kind="warn">{notice}</Alert>
        <Alert>{apiError}</Alert>
        <Field label="Email" error={errors.email}><input type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Password" error={errors.password}><input type="password" autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
        <p className="muted center">No account? <Link to="/register">Create one</Link></p>
      </form>
    </div>
  );
}
