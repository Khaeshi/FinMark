-- Finmark Materialized Views
-- These pre-compute heavy dashboard queries so the dashboard
-- never runs expensive aggregations on every request.
-- Refresh is handled by report-svc on a schedule.

-- ─── Financial summary per client per period ──────────────────────────────────

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_financial_summary AS
SELECT
  f.client_id,
  f.period,
  c.name          AS client_name,
  c.industry,
  f.revenue,
  f.expenses,
  f.net_profit,
  f.order_count,
  f.updated_at    AS last_updated
FROM financials f
JOIN sme_clients c ON c.id = f.client_id
WHERE c.is_active = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_financial_summary
  ON mv_financial_summary (client_id, period);

-- ─── Order status counts per client ──────────────────────────────────────────

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_order_counts AS
SELECT
  client_id,
  COUNT(*)                                          AS total_orders,
  COUNT(*) FILTER (WHERE status = 'PENDING')        AS pending,
  COUNT(*) FILTER (WHERE status = 'PROCESSING')     AS processing,
  COUNT(*) FILTER (WHERE status = 'FULFILLED')      AS fulfilled,
  COUNT(*) FILTER (WHERE status = 'CANCELLED')      AS cancelled,
  SUM(amount)                                       AS total_amount,
  MAX(created_at)                                   AS last_order_at
FROM orders
GROUP BY client_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_order_counts
  ON mv_order_counts (client_id);

-- ─── Dashboard summary (all clients combined — for superadmin) ────────────────

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_dashboard_summary AS
SELECT
  COUNT(DISTINCT c.id)                              AS active_clients,
  COUNT(o.id)                                       AS total_orders,
  COUNT(o.id) FILTER (WHERE o.status = 'PENDING')  AS pending_orders,
  SUM(o.amount)                                     AS total_revenue,
  NOW()                                             AS generated_at
FROM sme_clients c
LEFT JOIN orders o ON o.client_id = c.id
WHERE c.is_active = true;

-- ─── Refresh function (called by report-svc scheduler) ───────────────────────

CREATE OR REPLACE FUNCTION refresh_dashboard_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_financial_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_order_counts;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_summary;
END;
$$ LANGUAGE plpgsql;
