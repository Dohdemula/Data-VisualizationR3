import { useEffect, useState } from 'react';
import { getUsers, updateUser } from '../api/api';
import { SkeletonRows, ErrorState } from '../components/ui/States';
import './Settings.css';

const ROLES = ['operational', 'analytical', 'management'];

export default function Settings() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = () => {
    setLoading(true); setError(null);
    getUsers().then(setUsers).catch(e => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleRoleChange = async (userId, role) => {
    setUsers(prev => prev.map(u => u.userId === userId ? { ...u, role } : u));
    await updateUser(userId, { role });
  };

  return (
    <div className="page">
      <div className="page-title">Settings &amp; Admin</div>

      <div className="card" style={{ maxWidth: 640 }}>
        <div className="chart-card-title">User Management</div>
        {loading ? <SkeletonRows count={4} /> :
         error   ? <ErrorState message={error} onRetry={load} /> :
        <table className="settings-table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.userId}>
                <td>{u.name}</td>
                <td className="settings-email">{u.email}</td>
                <td>
                  <select
                    className="topbar-select"
                    value={u.role}
                    onChange={e => handleRoleChange(u.userId, e.target.value)}
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>}
      </div>

      <div className="card settings-prefs" style={{ maxWidth: 640, marginTop: '.875rem' }}>
        <div className="chart-card-title">Preferences</div>
        <div className="pref-row">
          <label>Default period</label>
          <select className="topbar-select"><option>Last 30 days</option><option>Last 7 days</option></select>
        </div>
        <div className="pref-row">
          <label>Warning buffer above reorder point</label>
          <input className="modal-input" type="number" defaultValue={30} style={{ width: 80 }} /> %
        </div>
        <div className="pref-row">
          <label>Currency</label>
          <select className="topbar-select"><option>KES</option><option>USD</option></select>
        </div>
      </div>
    </div>
  );
}
