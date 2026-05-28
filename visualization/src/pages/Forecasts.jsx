import { useEffect, useState } from 'react';
import { getForecast, getInventory } from '../api/api';
import { SkeletonCard, EmptyState, ErrorState } from '../components/ui/States';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import './Forecasts.css';

const HORIZONS = [7, 30, 90];

export default function Forecasts() {
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [horizon, setHorizon]   = useState(30);
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  useEffect(() => {
    getInventory().then(list => {
      setProducts(list);
      if (list.length) setSelectedId(list[0].productId);
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true); setError(null);
    getForecast(selectedId, horizon)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedId, horizon]);

  // Merge history + forecast for continuous chart
  const chartData = data
    ? [
        ...data.history.map(h => ({ date: h.date, actual: h.actual })),
        ...data.forecast.map(f => ({ date: f.date, predicted: f.predicted, lower: f.lower, upper: f.upper })),
      ]
    : [];

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="page">
      <div className="fc-header">
        <div className="page-title" style={{ marginBottom: 0 }}>Forecasts</div>
        <div className="fc-controls">
          <select className="topbar-select" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
            {products.map(p => <option key={p.productId} value={p.productId}>{p.name}</option>)}
          </select>
          <div className="gran-tabs">
            {HORIZONS.map(h => (
              <button key={h} className={`gran-tab${horizon === h ? ' active' : ''}`} onClick={() => setHorizon(h)}>
                {h}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {data && (
        <div className="fc-meta-row">
          <div className="fc-badge">
            <span className="fc-badge-label">Model</span>
            <strong>{data.model}</strong>
          </div>
          <div className="fc-badge">
            <span className="fc-badge-label">MAE</span>
            <strong>{data.metrics.mae}</strong>
          </div>
          <div className="fc-badge">
            <span className="fc-badge-label">RMSE</span>
            <strong>{data.metrics.rmse}</strong>
          </div>
          <div className="fc-badge">
            <span className="fc-badge-label">MAPE</span>
            <strong>{data.metrics.mape}%</strong>
          </div>
        </div>
      )}

      <div className="card chart-card">
        {loading ? <SkeletonCard rows={6} /> :
         error   ? <ErrorState message={error} onRetry={() => setSelectedId(s => s)} /> :
         !data   ? <EmptyState title="Select a product" /> :
        <>
          <div className="chart-card-title">Demand Forecast — <span className="fc-range-label">Likely range shaded</span></div>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} interval={Math.floor(chartData.length / 8)} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <ReferenceLine x={todayStr} stroke="var(--color-text-muted)" strokeDasharray="4 2" label={{ value: 'Today', fontSize: 10 }} />
              {/* Confidence band */}
              <Area type="monotone" dataKey="upper" fill="var(--color-primary)" stroke="transparent" fillOpacity={0.12} name="Upper bound" legendType="none" />
              <Area type="monotone" dataKey="lower" fill="var(--color-surface)"  stroke="transparent" fillOpacity={1}    name="Lower bound" legendType="none" />
              <Line type="monotone" dataKey="actual"    stroke="var(--color-text)"    strokeWidth={2} dot={false} name="Actual" connectNulls />
              <Line type="monotone" dataKey="predicted" stroke="var(--color-primary)" strokeWidth={2} dot={false} strokeDasharray="5 3" name="Forecast" connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        </>}
      </div>
    </div>
  );
}
