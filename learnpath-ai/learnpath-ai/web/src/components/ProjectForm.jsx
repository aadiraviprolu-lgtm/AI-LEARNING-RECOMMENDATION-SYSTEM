import { useState } from 'react';
import { Alert, Field, Modal } from './ui.jsx';
import { validateProject } from '../validation.js';

export default function ProjectForm({ project, onSave, onClose }) {
  const [f, setF] = useState({
    name: project?.name || '', description: project?.description || '', status: project?.status || 'Not Started',
    startDate: project?.startDate || '', endDate: project?.endDate || '',
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const v = validateProject(f); setErrors(v);
    if (Object.keys(v).length) return;
    setSaving(true); setApiError('');
    try { await onSave({ ...f, name: f.name.trim() }); }
    catch (err) { setApiError(err.message); setSaving(false); }
  };

  return (
    <Modal title={project ? 'Edit project' : 'New project'} onClose={onClose}>
      <form onSubmit={submit} noValidate className="form">
        <Alert>{apiError}</Alert>
        <Field label="Project name *" error={errors.name}><input value={f.name} onChange={set('name')} maxLength={150} autoFocus /></Field>
        <Field label="Description"><textarea rows={3} value={f.description} onChange={set('description')} maxLength={2000} /></Field>
        <Field label="Status">
          <select value={f.status} onChange={set('status')}>
            <option>Not Started</option><option>In Progress</option><option>Completed</option>
          </select>
        </Field>
        <div className="row">
          <Field label="Start date"><input type="date" value={f.startDate} onChange={set('startDate')} /></Field>
          <Field label="End date" error={errors.endDate}><input type="date" value={f.endDate} onChange={set('endDate')} /></Field>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save project'}</button>
        </div>
      </form>
    </Modal>
  );
}
