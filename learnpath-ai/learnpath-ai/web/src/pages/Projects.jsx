import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useDebounced, useLoad } from '../hooks.js';
import { Alert, Badge, Empty, Spinner } from '../components/ui.jsx';
import ProjectForm from '../components/ProjectForm.jsx';

export default function Projects() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null); // null | {} (new) | project
  const [error, setError] = useState('');
  const q = useDebounced(search);
  const { data, loading, error: loadError, reload } = useLoad(
    () => api.projects({ search: q, status, page, limit: 9 }), [q, status, page]);

  const save = async (form) => {
    if (editing.id) await api.updateProject(editing.id, form); else await api.createProject(form);
    setEditing(null); reload();
  };
  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name}" and all its tasks? This cannot be undone.`)) return;
    try { await api.deleteProject(p.id); reload(); } catch (e) { setError(e.message); }
  };

  return (
    <>
      <div className="page-head"><h1>Projects</h1><button className="btn btn-primary" onClick={() => setEditing({})}>+ New project</button></div>
      <div className="toolbar">
        <input placeholder="Search projects by name…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option><option>Not Started</option><option>In Progress</option><option>Completed</option>
        </select>
      </div>
      <Alert>{error}</Alert>
      <Alert onRetry={reload}>{loadError}</Alert>
      {loading && !data ? <Spinner /> : data && (data.data.length === 0 ? (
        <Empty title="No projects found" hint="Create a project to start organizing your learning." />
      ) : (
        <>
          <div className="grid">
            {data.data.map((p) => {
              const pct = p.taskCount ? Math.round((p.completedTaskCount / p.taskCount) * 100) : 0;
              return (
                <div className="card project" key={p.id}>
                  <div className="project-head"><Link to={`/projects/${p.id}`}><h3>{p.name}</h3></Link><Badge value={p.status} /></div>
                  <p className="muted clamp">{p.description || 'No description'}</p>
                  <div className="progress"><div style={{ width: `${pct}%` }} /></div>
                  <div className="muted small">{p.completedTaskCount}/{p.taskCount} tasks · {pct}%</div>
                  <div className="muted small">{p.startDate || '—'} → {p.endDate || '—'}</div>
                  <div className="card-actions">
                    <button className="btn btn-sm" onClick={() => setEditing(p)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => remove(p)}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="pager">
            <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹ Prev</button>
            <span className="muted">Page {data.pagination.page} of {data.pagination.totalPages}</span>
            <button className="btn btn-sm" disabled={page >= data.pagination.totalPages} onClick={() => setPage(page + 1)}>Next ›</button>
          </div>
        </>
      ))}
      {editing && <ProjectForm project={editing.id ? editing : null} onSave={save} onClose={() => setEditing(null)} />}
    </>
  );
}
