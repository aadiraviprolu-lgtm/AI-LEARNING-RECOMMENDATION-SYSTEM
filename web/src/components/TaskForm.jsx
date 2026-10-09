import { useState } from 'react';
import { Alert, Field, Modal } from './ui.jsx';
import { validateTask } from '../validation.js';

export default function TaskForm({ task, onSave, onClose }) {
  const [f, setF] = useState({
    name: task?.name || '', description: task?.description || '', priority: task?.priority || 'Medium',
    status: task?.status || 'Pending', dueDate: task?.dueDate || '',
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const v = validateTask(f); setErrors(v);
    if (Object.keys(v).length) return;
    setSaving(true); setApiError('');
    try { await onSave({ ...f, name: f.name.trim() }); }
    catch (err) { setApiError(err.message); setSaving(false); }
  };

  return (
    <Modal title={task ? 'Edit task' : 'New task'} onClose={onClose}>
      <form onSubmit={submit} noValidate className="form">
        <Alert>{apiError}</Alert>
        <Field label="Task name *" error={errors.name}><input value={f.name} onChange={set('name')} maxLength={150} autoFocus /></Field>
        <Field label="Description"><textarea rows={3} value={f.description} onChange={set('description')} maxLength={2000} /></Field>
        <div className="row">
          <Field label="Priority"><select value={f.priority} onChange={set('priority')}><option>Low</option><option>Medium</option><option>High</option></select></Field>
          <Field label="Status"><select value={f.status} onChange={set('status')}><option>Pending</option><option>In Progress</option><option>Completed</option></select></Field>
        </div>
        <Field label="Due date"><input type="date" value={f.dueDate} onChange={set('dueDate')} /></Field>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save task'}</button>
        </div>
      </form>
    </Modal>
  );
}
