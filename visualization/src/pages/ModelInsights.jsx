import { useEffect, useState } from 'react';
import { getModelsComparison } from '../api/api';
import { SkeletonRows, EmptyState, ErrorState } from '../components/ui/States';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './ModelInsights.css';

export default function ModelInsights() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [selected, setSelected] = useState(null);

  const load = () => {
    setLoading(true); setError(null);
    getModelsComparison().then(d => { setData(d); if (d.length) setSelected(d[0]); })
      .catch(e => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <div className="page">
      <div className="page-title">Model Insights</div>

      {loading ? <SkeletonRows count={8} /> :
       error   ? <ErrorState message={error} onRetry={load} /> :
       data.length === 0 ? <EmptyState title="No model data" /> :
      <div className="mi-layout">
        <div className="card mi-table-wrap">
          <div className="chart-card-title">Model per Product</div>
          <table className="mi-table">
            <thead><tr><th>Product</th><th>Selected Model</th><th>MAE</th><th>MAPE %</th></tr></thead>
            <tbody>
              {data.map(row => (
                <tr key={row.productId} className={selected?.productId === row.productId ? 'selected-row' : ''}
                  onClick={() => setSelected(row)} style={{ cursor: 'pointer' }}>
                  <td>{row.name}</td>
                  <td><span className="model-chip">{row.selectedModel}</span></td>
                  <td>{row.candidates.find(c => c.model === row.selectedModel)?.mae ?? '—'}</td>
                  <td>{row.candidates.find(c => c.model === row.selectedModel)?.mape ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selected && (
          <div className="card mi-detail">
            <div className="chart-card-title">Model Comparison — {selected.name}</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={selected.candidates} layout="vertical" margin={{ left: 60, right: 20, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="model" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="mae"  fill="var(--color-primary)" name="MAE"  />
                <Bar dataKey="mape" fill="var(--color-warning)"  name="MAPE" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mi-winner">
              Winner: <strong>{selected.selectedModel}</strong> (lowest error)
            </div>
          </div>
        )}
      </div>}
    </div>
  );
}
