import { useEffect, useState } from 'react';
import { getInventory, adjustInventory } from '../api/api';
import { SkeletonRows, EmptyState, ErrorState } from '../components/ui/States';
import { MdEdit, MdSearch } from 'react-icons/md';
import './Inventory.css';

function statusOf(stock, reorderPoint) {
  if (stock === 0)               return 'critical';
  if (stock <= reorderPoint)     return 'critical';
  if (stock <= reorderPoint * 1.3) return 'warning';
  return 'ok';
}

const STATUS_LABEL = { ok: 'OK', warning: 'Low', critical: stock => stock === 0 ? 'Out' : 'Critical' };

function StatusBadge({ stock, reorderPoint }) {
  const s = statusOf(stock, reorderPoint);
  const label = typeof STATUS_LABEL[s] === 'function' ? STATUS_LABEL[s](stock) : STATUS_LABEL[s];
  return <span className={`badge badge-${s}`}>{label}</span>;
}

function AdjustModal({ product, onClose, onSave }) {
  const [qty, setQty] = useState(product.stock);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    await onSave(product.productId, qty, reason);
    setSaving(false);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal card">
        <div className="modal-title">Adjust Stock — {product.name}</div>
        <label className="modal-label">New quantity</label>
        <input className="modal-input" type="number" min={0} value={qty} onChange={e => setQty(+e.target.value)} />
        <label className="modal-label">Reason</label>
        <input className="modal-input" type="text" placeholder="e.g. Stock receipt" value={reason} onChange={e => setReason(e.target.value)} />
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={submit} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

export default function Inventory() {
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);

  const load = () => {
    setLoading(true); setError(null);
    getInventory().then(setItems).catch(e => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSave = async (productId, newStock, reason) => {
    await adjustInventory(productId, newStock, reason);
    setItems(prev => prev.map(p => p.productId === productId ? { ...p, stock: newStock } : p));
  };

  const filtered = items.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <div className="page-title">Inventory</div>

      <div className="inv-toolbar card">
        <div className="inv-search">
          <MdSearch />
          <input placeholder="Search products or categories…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card inv-table-wrap">
        {loading ? <SkeletonRows count={8} /> :
         error   ? <ErrorState message={error} onRetry={load} /> :
         filtered.length === 0 ? <EmptyState title="No products found" /> :
        <table className="inv-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Stock</th>
              <th>Reorder Point</th>
              <th>Warehouse</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.productId}>
                <td className="inv-name">{p.name}</td>
                <td>{p.category}</td>
                <td className="inv-stock">{p.stock}</td>
                <td>{p.reorderPoint}</td>
                <td>{p.warehouse}</td>
                <td><StatusBadge stock={p.stock} reorderPoint={p.reorderPoint} /></td>
                <td>
                  <button className="icon-btn" onClick={() => setEditing(p)} title="Adjust stock">
                    <MdEdit />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>}
      </div>

      {editing && (
        <AdjustModal product={editing} onClose={() => setEditing(null)} onSave={handleSave} />
      )}
    </div>
  );
}
