# CLAUDE.md — Project Context Primer

> Drop this file in the repo root. Claude Code reads it automatically on startup.
> It carries the *reasoning* behind the project; `Scope_of_Work_Dashboard_Frontend.docx`
> carries the *specification*. Read both before building.

---

## What this project is

**Intelligent Inventory Forecasting and Sales Analytics System** — a Year 4 BSc Computer
Technology project (BCT 2406), supervised by Mrs. Martha Gichuki.

It is a system for **small and medium retail businesses (SMEs), Kenya-focused**, that turns
historical sales data into demand forecasts and inventory insights. It **complements, does not
replace**, existing POS systems — it consumes their data for analysis and prediction.

The system has three decoupled components, one per team member.

## The team & who owns what

The project was restructured into three specialist roles. Ownership:

| Member | Reg. | Role | Produces |
|---|---|---|---|
| **Brian Simiyu** | SCT212-0188/2022 | Database & ETL | Relational data + REST read endpoints: products, inventory, sales_transactions, suppliers, purchase_orders, alerts. Owns EOQ/reorder logic and alert triggers. |
| **David Ngugi** | SCT212-0725/2022 | Forecasting / ML | Per-product demand forecasts, the *selected model per product*, accuracy metrics (MAE/RMSE/MAPE), confidence bands. |
| **Dennis Mbuno** | SCT212-0140/2022 | **Dashboard / Visualization (THIS REPO)** | The web frontend: navigation, screens, charts, tables, role-based access, alerts UI, exports. |

**This repo is Dennis's dashboard/frontend component.** (If the author name is wrong, correct it.)

## The single most important architectural idea

The frontend is being built **before the other two backends are ready**, on purpose. The whole
design is *"a frontend awaiting backends to plug into."*

- The frontend **never** talks to the database or the models directly — only to **REST endpoints**.
- Every screen's data need is expressed as a **proposed JSON shape** (a "plug point") naming the
  endpoint and its owner. These shapes are derived from the teammates' proposals but are
  **proposed & adjustable**, not demands.
- All data calls go through **one API-adapter layer** (e.g. `src/api.js`): one function per
  endpoint. A single `MOCK = true/false` flag switches the whole app between local mock data and
  live backends. When a real endpoint differs from the proposed shape, you fix **one mapping line
  in the adapter**, never the screens.

This is the key thing: build now against mock data, flip adapters to live as endpoints arrive.

## Why certain decisions were made (don't re-litigate these)

- **LSTM was dropped.** Deep learning needs large, clean datasets; SME sales data is small, noisy,
  irregular. David's module uses an **evaluation-driven hybrid**: train several models
  (Naïve, ARIMA/SARIMA, Prophet, Random Forest, XGBoost) and select the **best per product** by
  error metric. The "Model Insights" screen exists to visualize this selection.
- **Forecast uncertainty must be shown, never hidden.** Forecasts always render as a **shaded
  confidence band** (lower/upper bounds) with a plain-language label like "likely range" — never a
  bare number presented as certain. If a model returns point-only output, the band degrades
  gracefully to a dotted line.
- **Three user tiers, hierarchical/additive access:** Operational (clerks/warehouse — minimal,
  task-driven), Analytical (analysts/planners — rich exploration), Management (owners — KPI-first,
  drill-down, admin). Higher tiers see everything lower tiers see, plus more. Tabs the role can't
  access are **hidden, not greyed out**.

## Screens (full spec is in the SOW docx)

Overview · Inventory · Alerts · Sales Analytics · Forecasts · Model Insights ·
Reorder & Purchase Orders · Reports & Export · Settings/Admin.

Read the SOW for each screen's components, role-gating, and exact data shapes. Section 7 of the
SOW is the consolidated endpoint map; Section 9 explains the adapter layer.

## Proposed endpoints (all adjustable — see SOW for full JSON shapes)

| Screen | Endpoint | Owner |
|---|---|---|
| Auth / role | `GET /api/auth/me` → `{ userId, name, role }` | Database |
| Overview | `GET /api/summary` | Database |
| Inventory | `GET /api/inventory` · `POST /api/inventory/:id/adjust` | Database |
| Alerts | `GET /api/alerts` · `POST /api/alerts/:id/resolve` | Database |
| Sales Analytics | `GET /api/sales` | Database |
| Forecasts | `GET /api/forecasts/:productId` → `{ model, metrics, history, forecast[{date,predicted,lower,upper}] }` | Forecasting |
| Model Insights | `GET /api/models/comparison` | Forecasting |
| Reorder & POs | `GET /api/reorder/suggestions` · `POST /api/purchase-orders` | Database |
| Reports | client-side first; optional `/api/reports/:type` later | Dashboard |
| Settings/Admin | `GET/POST /api/users` | Database |

## Conventions

- **Status colours:** green = OK, amber = warning, red = critical/out-of-stock. Consistent across
  stock, alerts, KPI cards.
- **Every data component has 3 non-happy states:** loading skeleton, friendly empty state,
  retryable error. This is what makes "awaiting backend" look intentional, not broken.
- **Global filters** (date range, product/category, warehouse) live in the top bar and propagate
  to every data screen.
- **Responsive:** sidebar collapses to icons/drawer on narrow screens; tables become cards.
- **Dev role-switcher:** since auth is mocked initially, include a dev-only control to switch
  between the three roles so all tiers can be demoed.

## Suggested stack (open to change)

React, a charting lib (Recharts or Chart.js), client-side routing. Keep the adapter layer and
mock-data module as the first thing you build, before screens.

## Build order

1. Mock-data module returning the proposed shapes.
2. API-adapter layer (one fn per endpoint, `MOCK` flag).
3. App shell: sidebar, top bar, role context + gating.
4. Screens, starting with Overview → Inventory → Alerts (operational core), then the analytical
   screens (Sales Analytics → Forecasts → Model Insights), then Reorder, Reports, Settings.
5. Loading/empty/error states and responsive polish throughout.
6. As teammates ship endpoints, flip adapters from mock to live one at a time.
