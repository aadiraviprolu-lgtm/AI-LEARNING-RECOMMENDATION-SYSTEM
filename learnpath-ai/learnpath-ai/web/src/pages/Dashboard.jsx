import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useLoad } from '../hooks.js';
import { Alert, Badge, Empty, Spinner } from '../components/ui.jsx';

const STATS = [
  ['totalProjects', 'Total Projects', '📁'], ['totalTasks', 'Total Tasks', '📝'],
  ['completedTasks', 'Completed Tasks', '✅'], ['pendingTasks', 'Pending Tasks', '⏳'],
  ['projectsInProgress', 'Projects In Progress', '🚀'],
];

export default function Dashboard() {
  const stats = useLoad(() => api.dashboard(), []);
  const recs = useLoad(() => api.recommendations(), []);
  const refresh = () => { stats.reload(); recs.reload(); };

  return (
    <>
      <div className="page-head"><h1>Dashboard</h1><button className="btn btn-ghost" onClick={refresh}>↻ Refresh</button></div>
      <Alert onRetry={stats.reload}>{stats.error}</Alert>
      {stats.loading && !stats.data ? <Spinner /> : stats.data && (
        <div className="stats">
          {STATS.map(([key, label, icon]) => (
            <div className="card stat" key={key}><div className="stat-icon">{icon}</div>
              <div className="stat-num">{stats.data.data[key]}</div><div className="muted">{label}</div></div>
          ))}
        </div>
      )}
      {stats.data?.data.overdueTasks > 0 && <Alert kind="warn">You have {stats.data.data.overdueTasks} overdue task(s).</Alert>}

      <section className="card section">
        <h2>🤖 Recommended next</h2>
        <p className="muted">Ranked by priority, deadline urgency and momentum.</p>
        <Alert onRetry={recs.reload}>{recs.error}</Alert>
        {recs.loading && !recs.data ? <Spinner /> : recs.data?.data.length === 0 ? (
          <Empty title="Nothing to recommend" hint="Add tasks to your projects to get suggestions." />
        ) : (
          <ul className="list">
            {recs.data?.data.map((t) => (
              <li key={t.id} className="list-item">
                <div><Link to={`/projects/${t.projectId}`}><strong>{t.name}</strong></Link>
                  <div className="muted small">{t.projectName} · {t.reason}</div></div>
                <Badge value={t.priority} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
