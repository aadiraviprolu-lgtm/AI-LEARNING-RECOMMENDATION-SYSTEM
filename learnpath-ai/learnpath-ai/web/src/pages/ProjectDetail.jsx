import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useDebounced, useLoad } from '../hooks.js';
import { Alert, Badge, Empty, Spinner } from '../components/ui.jsx';
import TaskForm from '../components/TaskForm.jsx';
import ProjectForm from '../components/ProjectForm.jsx';

export default function ProjectDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [page, setPage] = useState(1);
  const [editingTask, setEditingTask] = useState(null);
  const [editingProject, setEditingProject] = useState(false);
  const [error, setError] = useState('');
  const q = useDebounced(search);

  const project = useLoad(() => api.project(id), [id]);
  const tasks = useLoad(() => api.tasks({ projectId: id, search: q, status, priority, sortBy, page, limit: 20 }),
    [id, q, status, priority, sortBy, page]);
  const reloadAll = () => { project.reload(); tasks.reload(); };

  const act = async (fn) => { setError(''); try { await fn(); reloadAll(); } catch (e) { setError(e.message); } };
  const saveTask = async (form) => {
    if (editingTask.id) await api.updateTask(editingTask.id, form); else await api.createTask({ ...form, projectId: id });
    setEditingTask(null); reloadAll();
  };
  const saveProject = async (form) => { await api.updateProject(id, form); setEditingProject(false); reloadAll(); };
  const deleteProject = async () => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try { await api.deleteProject(id); nav('/projects'); } catch (e) { setError(e.message); }
  };
  const toggle = (t) => act(() => api.updateTask(t.id, { status: t.status === 'Completed' ? 'Pending' : 'Completed' }));
  const resetPage = (fn) => (e) => { fn(e.target.value); setPage(1); };

  if (project.loading && !project.data) return <Spinner />;
  if (project.error) return <><Alert onRetry={project.reload}>{project.error}</Alert><Link to="/projects">← Back to projects</Link></>;
  const p = project.data.data;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <Link to="/projects" className="muted">← All projects</Link>
      <div className="page-head">
        <div><h1>{p.name}</h1><p className="muted">{p.description}</p>
          <div className="meta"><Badge value={p.status} /><span className="muted small">{p.startDate || '—'} → {p.endDate || '—'} · {p.completedTaskCount}/{p.taskCount} done</span></div></div>
        <div className="card-actions">
          <button className="btn btn-sm" onClick={() => setEditingProject(true)}>Edit</button>
          <button className="btn btn-sm btn-danger" onClick={deleteProject}>Delete</button>
          <button className="btn btn-primary" onClick={() => setEditingTask({})}>+ New task</button>
        </div>
      </div>

      <div className="toolbar">
        <input placeholder="Search tasks by name…" value={search} onChange={resetPage(setSearch)} />
        <select value={status} onChange={resetPage(setStatus)}><option value="">All statuses</option><option>Pending</option><option>In Progress</option><option>Completed</option></select>
        <select value={priority} onChange={resetPage(setPriority)}><option value="">All priorities</option><option>Low</option><option>Medium</option><option>High</option></select>
        <select value={sortBy} onChange={resetPage(setSortBy)}><option value="createdAt">Newest</option><option value="dueDate">Due date</option><option value="priority">Priority</option><option value="name">Name</option></select>
      </div>
      <Alert>{error}</Alert>
      <Alert onRetry={tasks.reload}>{tasks.error}</Alert>

      {tasks.loading && !tasks.data ? <Spinner /> : tasks.data && (tasks.data.data.length === 0 ? (
        <Empty title="No tasks found" hint="Add a task or adjust your filters." />
      ) : (
        <div className="card section">
          <ul className="list">
            {tasks.data.data.map((t) => (
              <li key={t.id} className={`list-item ${t.status === 'Completed' ? 'done' : ''}`}>
                <input type="checkbox" className="check" checked={t.status === 'Completed'} onChange={() => toggle(t)} aria-label="Mark completed" />
                <div className="grow">
                  <strong>{t.name}</strong>
                  {t.description && <div className="muted small clamp">{t.description}</div>}
                  <div className="meta">
                    <Badge value={t.priority} />
                    <select className="inline-select" value={t.status} onChange={(e) => act(() => api.updateTask(t.id, { status: e.target.value }))}>
                      <option>Pending</option><option>In Progress</option><option>Completed</option></select>
                    {t.dueDate && <span className={`small ${t.status !== 'Completed' && t.dueDate < today ? 'overdue' : 'muted'}`}>Due {t.dueDate}</span>}
                  </div>
                </div>
                <div className="card-actions">
                  <button className="btn btn-sm" onClick={() => setEditingTask(t)}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => window.confirm('Delete this task?') && act(() => api.deleteTask(t.id))}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
          <div className="pager">
            <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹ Prev</button>
            <span className="muted">Page {tasks.data.pagination.page} of {tasks.data.pagination.totalPages}</span>
            <button className="btn btn-sm" disabled={page >= tasks.data.pagination.totalPages} onClick={() => setPage(page + 1)}>Next ›</button>
          </div>
        </div>
      ))}
      {editingTask && <TaskForm task={editingTask.id ? editingTask : null} onSave={saveTask} onClose={() => setEditingTask(null)} />}
      {editingProject && <ProjectForm project={p} onSave={saveProject} onClose={() => setEditingProject(false)} />}
    </>
  );
}
