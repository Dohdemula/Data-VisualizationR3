import {
  mockAuthMe,
  mockSummary,
  mockInventory,
  mockAlerts,
  mockSales,
  mockForecast,
  mockModelsComparison,
  mockReorderSuggestions,
  mockPurchaseOrders,
  mockUsers,
} from './mockData';

// Flip to false when real backends are available.
const MOCK = true;

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

const live = async (url, options) => {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
};

// --- Auth ---
export async function getAuthMe() {
  if (MOCK) { await delay(); return mockAuthMe; }
  return live('/api/auth/me');
}

// --- Overview ---
export async function getSummary(period = '30d') {
  if (MOCK) { await delay(); return mockSummary; }
  return live(`/api/summary?period=${period}`);
}

// --- Inventory ---
export async function getInventory() {
  if (MOCK) { await delay(); return mockInventory; }
  return live('/api/inventory');
}

export async function adjustInventory(productId, newStock, reason) {
  if (MOCK) { await delay(200); return { ok: true }; }
  return live(`/api/inventory/${productId}/adjust`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newStock, reason }),
  });
}

// --- Alerts ---
export async function getAlerts(status = 'active') {
  if (MOCK) {
    await delay();
    const items = status === 'all' ? mockAlerts : mockAlerts.filter((a) => !a.resolved);
    return items;
  }
  return live(`/api/alerts?status=${status}`);
}

export async function resolveAlert(alertId) {
  if (MOCK) { await delay(200); return { ok: true }; }
  return live(`/api/alerts/${alertId}/resolve`, { method: 'POST' });
}

// --- Sales Analytics ---
export async function getSales(from, to, granularity = 'daily') {
  if (MOCK) { await delay(); return mockSales(from, to, granularity); }
  return live(`/api/sales?from=${from}&to=${to}&granularity=${granularity}`);
}

// --- Forecasts ---
export async function getForecast(productId, horizon = 30) {
  if (MOCK) { await delay(); return mockForecast(productId, horizon); }
  return live(`/api/forecasts/${productId}?horizon=${horizon}`);
}

// --- Model Insights ---
export async function getModelsComparison() {
  if (MOCK) { await delay(); return mockModelsComparison; }
  return live('/api/models/comparison');
}

// --- Reorder & POs ---
export async function getReorderSuggestions() {
  if (MOCK) { await delay(); return mockReorderSuggestions; }
  return live('/api/reorder/suggestions');
}

export async function getPurchaseOrders() {
  if (MOCK) { await delay(); return mockPurchaseOrders; }
  return live('/api/purchase-orders');
}

export async function createPurchaseOrder(order) {
  if (MOCK) { await delay(300); return { poId: 'po_new', ...order, status: 'pending' }; }
  return live('/api/purchase-orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  });
}

// --- Users / Admin ---
export async function getUsers() {
  if (MOCK) { await delay(); return mockUsers; }
  return live('/api/users');
}

export async function updateUser(userId, data) {
  if (MOCK) { await delay(200); return { ok: true }; }
  return live(`/api/users/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}
