import { useNavigate } from 'react-router-dom';
import { MdSearch, MdNotifications } from 'react-icons/md';
import { useRole } from '../../context/RoleContext';
import './TopBar.css';

export default function TopBar({ alertCount = 0 }) {
  const { user, effectiveRole, devRole, setDevRole, ROLES } = useRole();
  const navigate = useNavigate();

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  return (
    <header className="topbar">
      <div className="topbar-search">
        <MdSearch className="topbar-search-icon" />
        <input type="text" placeholder="Search products, alerts…" />
      </div>

      <div className="topbar-filters">
        <select className="topbar-select">
          <option>Last 30 days</option>
          <option>Last 7 days</option>
          <option>Last 90 days</option>
          <option>This year</option>
        </select>
        <select className="topbar-select">
          <option>All warehouses</option>
          <option>Main</option>
          <option>Branch1</option>
        </select>
        <select className="topbar-select">
          <option>All categories</option>
          <option>Grains</option>
          <option>Dairy</option>
          <option>Beverages</option>
        </select>
      </div>

      <div className="topbar-spacer" />

      {/* Dev-only role switcher */}
      <div className="dev-switcher" title="Dev only: switch role to preview access tiers">
        DEV
        <select value={devRole || effectiveRole} onChange={(e) => setDevRole(e.target.value)}>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <button className="topbar-bell" onClick={() => navigate('/alerts')} title="Alerts">
        <MdNotifications />
        {alertCount > 0 && <span className="topbar-bell-badge">{alertCount}</span>}
      </button>

      <div className="topbar-user">
        <div className="topbar-avatar">{initials}</div>
        <div className="topbar-user-info">
          <div className="topbar-user-name">{user?.name || 'Loading…'}</div>
          <div className="topbar-user-role">{effectiveRole}</div>
        </div>
      </div>
    </header>
  );
}
