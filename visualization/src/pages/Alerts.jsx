import { useEffect, useState } from 'react';
import { getAlerts, resolveAlert } from '../api/api';
import { SkeletonRows, EmptyState, ErrorState } from '../components/ui/States';
import { MdCheckCircle, MdFilterList } from 'react-icons/md';
import './Alerts.css';

const TYPE_LABEL = { 'low-stock': 'Low Stock', anomaly: 'Anomaly' };

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [showAll, setShowAll] = useState(false);

  const load = (all = showAll) => {
    setLoading(true); setError(null);
    getAlerts(all ? 'all' : 'active')
      .then(setAlerts)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(showAll); }, [showAll]); // eslint-disable-line

  const handleResolve = async (alertId) => {
    await resolveAlert(alertId);
    setAlerts(prev => prev.map(a => a.alertId === alertId ? { ...a, resolved: true } : a));
  };

  const visible = showAll ? alerts : alerts.filter(a => !a.resolved);

  return (
    <div className="page">
      <div className="alerts-header">
        <div className="page-title" style={{ marginBottom: 0 }}>Alerts</div>
        <button className="filter-toggle" onClick={() => setShowAll(v => !v)}>
          <MdFilterList /> {showAll ? 'Show active only' : 'Show all'}
        </button>
      </div>

      <div className="card alerts-list-wrap">
        {loading ? <SkeletonRows count={6} /> :
         error   ? <ErrorState message={error} onRetry={() => load()} /> :
         visible.length === 0 ? <EmptyState title="No alerts" desc="All clear — no active alerts at this time." /> :
         visible.map(a => (
          <div key={a.alertId} className={`alert-row${a.resolved ? ' resolved' : ''}`}>
            <div className={`alert-severity badge badge-${a.severity}`}>{a.severity}</div>
            <div className="alert-body">
              <div className="alert-product">{a.productName}</div>
              <div className="alert-msg">{a.message}</div>
              <div className="alert-meta">
                <span className="alert-type">{TYPE_LABEL[a.type] || a.type}</span>
                <span className="alert-time">{new Date(a.createdAt).toLocaleString()}</span>
              </div>
            </div>
            {!a.resolved && (
              <button className="btn-resolve" onClick={() => handleResolve(a.alertId)} title="Mark resolved">
                <MdCheckCircle /> Resolve
              </button>
            )}
            {a.resolved && <span className="resolved-tag">Resolved</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
