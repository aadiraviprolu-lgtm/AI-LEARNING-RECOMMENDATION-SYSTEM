import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">🎓 LearnPath <span>AI</span></div>
        <nav>
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/projects">Projects</NavLink>
        </nav>
        <div className="user">
          <span className="user-name">{user.fullName}</span>
          <button className="btn btn-sm btn-ghost" onClick={logout}>Log out</button>
        </div>
      </header>
      <main className="container"><Outlet /></main>
    </div>
  );
}
