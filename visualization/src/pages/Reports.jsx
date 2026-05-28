import './Reports.css';
import { MdDownload, MdTableChart, MdTrendingUp, MdInventory2 } from 'react-icons/md';

const TEMPLATES = [
  { id: 'sales',    label: 'Monthly Sales Summary',  icon: MdTrendingUp,  desc: 'Revenue, units, top products for the selected period.' },
  { id: 'stock',    label: 'Stock Status Report',    icon: MdInventory2,  desc: 'Current inventory levels, reorder flags, and supplier info.' },
  { id: 'forecast', label: 'Forecast Summary',       icon: MdTableChart,  desc: 'Demand predictions and model accuracy per product.' },
];

export default function Reports() {
  const downloadCsv = (id) => {
    // Client-side stub — generates a placeholder CSV
    const csv = `Report: ${id}\nGenerated: ${new Date().toISOString()}\n(Connect real data in adapter layer)`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${id}_report.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page">
      <div className="page-title">Reports &amp; Export</div>
      <div className="reports-grid">
        {TEMPLATES.map(({ id, label, icon: Icon, desc }) => (
          <div key={id} className="card report-card">
            <div className="report-icon"><Icon /></div>
            <div className="report-body">
              <div className="report-label">{label}</div>
              <div className="report-desc">{desc}</div>
            </div>
            <button className="btn-download" onClick={() => downloadCsv(id)}>
              <MdDownload /> CSV
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
