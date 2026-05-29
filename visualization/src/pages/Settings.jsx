import { useEffect, useState } from 'react';
import { getUsers, updateUser } from '../api/api';
import { useGlobalFilter, DATE_RANGE_OPTIONS } from '../context/GlobalFilterContext';
import { SkeletonRows, ErrorState } from '../components/ui/States';
import { MdCheckCircle } from 'react-icons/md';
import './Settings.css';

const ROLES = ['operational', 'analytical', 'management'];

export default function Settings() {
  const { prefs, setPrefs } = useGlobalFilter();
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [saved,   setSaved]   = useState(false);

  const load = () => {
    setLoading(true); setError(null);
    getUsers().then(setUsers).catch(e => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleRoleChange = async (userId, role) => {
    setUsers(prev => prev.map(u => u.userId === userId ? { ...u, role } : u));
    await updateUser(userId, { role });
  };

  const handlePrefChange = (key, value) => {
    setPrefs({ [key]: value });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="page">
      <div className="page-title">Settings &amp; Admin</div>

      <div className="card" style={{ maxWidth: 640, marginBottom: '.875rem' }}>
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

      <div className="card settings-prefs" style={{ maxWidth: 640 }}>
        <div className="settings-prefs-header">
          <div className="chart-card-title" style={{ marginBottom: 0 }}>Preferences</div>
          {saved && (
            <span className="saved-indicator"><MdCheckCircle /> Saved</span>
          )}
        </div>

        <div className="pref-row">
          <label>Default date range</label>
          <select
            className="topbar-select"
            value={prefs.defaultPeriod}
            onChange={e => handlePrefChange('defaultPeriod', e.target.value)}
          >
            {DATE_RANGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="pref-row">
          <label>
            Warning buffer above reorder point
            <span className="pref-hint">Stock within this % above reorder point shows as "Warning"</span>
          </label>
          <div className="pref-number-wrap">
            <input
              className="modal-input"
              type="number"
              min={0}
              max={100}
              value={prefs.warningBuffer}
              onChange={e => handlePrefChange('warningBuffer', Math.max(0, Math.min(100, +e.target.value)))}
              style={{ width: 70 }}
            />
            <span style={{ fontSize: '.8rem', color: 'var(--color-text-muted)' }}>%</span>
          </div>
        </div>

        <div className="pref-row">
          <label>Currency</label>
          <select
            className="topbar-select"
            value={prefs.currency}
            onChange={e => handlePrefChange('currency', e.target.value)}
          >
            <option value="KES">KES — Kenyan Shilling</option>
            <option value="USD">USD — US Dollar</option>
            <option value="EUR">EUR — Euro</option>
          </select>
        </div>
      </div>
    </div>
  );
}
