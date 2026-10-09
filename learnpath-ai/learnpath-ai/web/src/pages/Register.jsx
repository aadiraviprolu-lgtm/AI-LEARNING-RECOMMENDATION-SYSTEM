import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { Alert, Field } from '../components/ui.jsx';
import { validateRegister } from '../validation.js';

export default function Register() {
  const { register } = useAuth();
  const [f, setF] = useState({ fullName: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const v = validateRegister(f); setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true); setApiError('');
    try { await register({ fullName: f.fullName.trim(), email: f.email.trim(), password: f.password }); }
    catch (err) { setApiError(err.message); setBusy(false); }
  };

  return (
    <div className="auth-page">
      <form className="card auth-card form" onSubmit={submit} noValidate>
        <div className="brand brand-lg">🎓 LearnPath <span>AI</span></div>
        <h2>Create your account</h2>
        <Alert>{apiError}</Alert>
        <Field label="Full name" error={errors.fullName}><input autoComplete="name" value={f.fullName} onChange={set('fullName')} /></Field>
        <Field label="Email" error={errors.email}><input type="email" autoComplete="email" value={f.email} onChange={set('email')} /></Field>
        <Field label="Password (8+ chars, letter and number)" error={errors.password}><input type="password" autoComplete="new-password" value={f.password} onChange={set('password')} /></Field>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Creating…' : 'Sign up'}</button>
        <p className="muted center">Already registered? <Link to="/login">Log in</Link></p>
      </form>
    </div>
  );
}
