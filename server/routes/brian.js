const router = require('express').Router();
const { v4: uuid } = require('uuid');
const { requireAuth, requireRole } = require('../middleware/auth');

const BRIAN = () => process.env.BRIAN_URL || 'http://localhost:8001';

async function brianFetch(path) {
  const r = await fetch(`${BRIAN()}${path}`, { signal: AbortSignal.timeout(15000) });
  return r.json();
}

async function proxy(brianPath, req, res) {
  const qs  = new URLSearchParams(req.query).toString();
  const url = `${BRIAN()}${brianPath}${qs ? `?${qs}` : ''}`;
  try {
    const r    = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const body = await r.json().catch(() => ({}));
    res.status(r.status).json(body);
  } catch {
    res.status(503).json({ error: 'Analytics service is currently unavailable.' });
  }
}

// ── Overview summary — built from Brian's real analytics ─────────────────────
router.get('/summary', requireAuth, async (req, res) => {
  try {
    const [txSummary, monthly, topProds] = await Promise.all([
      brianFetch('/api/v1/transactions/summary'),
      brianFetch('/api/v1/analytics/sales-by-month'),
      brianFetch('/api/v1/analytics/top-products?n=5'),
    ]);

    const salesTrend = (monthly.monthly_trend || []).map(row => ({
      date:  `${row.year}-${String(row.month_number).padStart(2, '0')}-01`,
      value: Number(row.total_revenue),
    }));

    const topMovers = (topProds.top_products || []).map(p => ({
      productId: p.product_line,
      name:      p.product_line,
      changePct: 0,
    }));

    res.json({
      kpis: {
        totalSkus:         0,
        lowStock:          0,
        outOfStock:        0,
        revenue:           Number(txSummary.total_revenue  || 0),
        revenuePrevPeriod: 0,
        openAlerts:        0,
      },
      stockHealth: { ok: 0, warning: 0, critical: 0 },
      salesTrend,
      topMovers,
    });
  } catch {
    res.status(503).json({ error: 'Analytics service is currently unavailable.' });
  }
});

// ── Inventory — proxy to Brian's stub (returns empty for now) ────────────────
router.get('/inventory', requireAuth, async (req, res) => {
  try {
    const body = await brianFetch('/api/v1/inventory/');
    res.json(body.inventory || []);
  } catch {
    res.json([]);
  }
});

router.post('/inventory/:productId/adjust', requireAuth, (req, res) => {
  res.json({ ok: true });
});

// ── Alerts — stub (Brian has no alerts endpoint yet) ─────────────────────────
router.get('/alerts', requireAuth, (req, res) => res.json([]));
router.post('/alerts/:alertId/resolve', requireAuth, (req, res) => res.json({ ok: true }));

// ── Analytics (analytical+ role) ─────────────────────────────────────────────
router.get('/analytics/sales-by-product',   requireAuth, requireRole('analytical'), (req, res) => proxy('/api/v1/analytics/sales-by-product',   req, res));
router.get('/analytics/sales-by-month',     requireAuth, requireRole('analytical'), (req, res) => proxy('/api/v1/analytics/sales-by-month',     req, res));
router.get('/analytics/sales-by-store',     requireAuth, requireRole('analytical'), (req, res) => proxy('/api/v1/analytics/sales-by-store',     req, res));
router.get('/analytics/sales-by-payment',   requireAuth, requireRole('analytical'), (req, res) => proxy('/api/v1/analytics/sales-by-payment',   req, res));
router.get('/analytics/sales-by-gender',    requireAuth, requireRole('analytical'), (req, res) => proxy('/api/v1/analytics/sales-by-gender',    req, res));
router.get('/analytics/top-products',       requireAuth, requireRole('analytical'), (req, res) => proxy('/api/v1/analytics/top-products',       req, res));
router.get('/analytics/weekend-vs-weekday', requireAuth, requireRole('analytical'), (req, res) => proxy('/api/v1/analytics/weekend-vs-weekday', req, res));

// ── Supply Risk (all authenticated roles) ────────────────────────────────────
router.get('/supply-risk/today',  requireAuth, (req, res) => proxy('/api/v1/supply-risk/today',  req, res));
router.get('/supply-risk/stats',  requireAuth, (req, res) => proxy('/api/v1/supply-risk/stats',  req, res));
router.get('/supply-risk/events', requireAuth, (req, res) => proxy('/api/v1/supply-risk/',        req, res));

// ── Transactions summary (management only) ───────────────────────────────────
router.get('/transactions/summary', requireAuth, requireRole('management'), (req, res) => proxy('/api/v1/transactions/summary', req, res));

// ── Reorder & Purchase Orders — stubs (Brian has no endpoint yet) ────────────
router.get('/reorder/suggestions',  requireAuth, (req, res) => res.json([]));
router.get('/purchase-orders',      requireAuth, (req, res) => res.json([]));
router.post('/purchase-orders',     requireAuth, (req, res) => {
  res.status(201).json({ poId: uuid(), ...req.body, status: 'pending' });
});

module.exports = router;
