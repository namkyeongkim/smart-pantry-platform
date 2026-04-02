import { NavLink } from 'react-router-dom';

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">Pantry Admin</div>

      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active-link' : '')}>
          Dashboard
        </NavLink>

        <NavLink to="/users" className={({ isActive }) => (isActive ? 'active-link' : '')}>
          Users
        </NavLink>

        <NavLink to="/recipes" className={({ isActive }) => (isActive ? 'active-link' : '')}>
          Recipes
        </NavLink>

        <NavLink to="/pantry" className={({ isActive }) => (isActive ? 'active-link' : '')}>
          Pantry
        </NavLink>

        <NavLink to="/analytics" className={({ isActive }) => (isActive ? 'active-link' : '')}>
          Analytics
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;