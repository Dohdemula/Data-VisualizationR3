import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdSearch, MdNotifications, MdClose, MdInventory2, MdWarning } from 'react-icons/md';
import { useRole } from '../../context/RoleContext';
import { useGlobalFilter, DATE_RANGE_OPTIONS } from '../../context/GlobalFilterContext';
import './TopBar.css';

export default function TopBar({ alertCount = 0 }) {
  const { user, effectiveRole, devRole, setDevRole, ROLES } = useRole();
  const {
    dateRange, setDateRange,
    warehouse, setWarehouse,
    category,  setCategory,
    warehouses, categories,
    allProducts, allAlerts,
  } = useGlobalFilter();
  const navigate = useNavigate();

  const [query, setQuery]             = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  const q = query.trim().toLowerCase();
  const matchProducts = q.length >= 2
    ? allProducts.filter(p =>
        p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
      ).slice(0, 5)
    : [];
  const matchAlerts = q.length >= 2
    ? allAlerts.filter(a =>
        a.productName.toLowerCase().includes(q) || a.message.toLowerCase().includes(q)
      ).slice(0, 3)
    : [];
  const hasResults = matchProducts.length > 0 || matchAlerts.length > 0;

  useEffect(() => {
    const close = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const pick = (path) => { navigate(path); setQuery(''); setShowResults(false); };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  return (
    <header className="topbar">
      {/* Search */}
      <div className="topbar-search" ref={searchRef}>
        <MdSearch className="topbar-search-icon" />
        <input
          type="text"
          placeholder="Search products, alerts…"
          value={query}
          onChange={e => { setQuery(e.target.value); setShowResults(true); }}
          onFocus={() => q.length >= 2 && setShowResults(true)}
          onKeyDown={e => e.key === 'Escape' && setShowResults(false)}
        />
        {query && (
          <button className="search-clear" onClick={() => { setQuery(''); setShowResults(false); }}>
            <MdClose />
          </button>
        )}

        {showResults && q.length >= 2 && (
          <div className="search-dropdown">
            {hasResults ? (
              <>
                {matchProducts.length > 0 && (
                  <>
                    <div className="search-group-label">Products</div>
                    {matchProducts.map(p => (
                      <div key={p.productId} className="search-result" onClick={() => pick('/inventory')}>
                        <MdInventory2 className="search-result-icon" />
                        <div>
                          <div className="search-result-name">{p.name}</div>
                          <div className="search-result-meta">{p.category} · {p.warehouse} · Stock: {p.stock}</div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {matchAlerts.length > 0 && (
                  <>
                    <div className="search-group-label">Alerts</div>
                    {matchAlerts.map(a => (
                      <div key={a.alertId} className="search-result" onClick={() => pick('/alerts')}>
                        <MdWarning className={`search-result-icon icon-${a.severity}`} />
                        <div>
                          <div className="search-result-name">{a.productName}</div>
                          <div className="search-result-meta">{a.message}</div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            ) : (
              <div className="search-no-results">No results for "{query}"</div>
            )}
          </div>
        )}
      </div>

      {/* Global filters */}
      <div className="topbar-filters">
        <select className="topbar-select" value={dateRange} onChange={e => setDateRange(e.target.value)}>
          {DATE_RANGE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select className="topbar-select" value={warehouse} onChange={e => setWarehouse(e.target.value)}>
          {warehouses.map(w => (
            <option key={w} value={w}>{w === 'all' ? 'All warehouses' : w}</option>
          ))}
        </select>
        <select className="topbar-select" value={category} onChange={e => setCategory(e.target.value)}>
          {categories.map(c => (
            <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>
          ))}
        </select>
      </div>

      <div className="topbar-spacer" />

      {/* Dev role switcher */}
      <div className="dev-switcher" title="Dev only: switch role">
        DEV
        <select value={devRole || effectiveRole} onChange={e => setDevRole(e.target.value)}>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
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
