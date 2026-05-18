-- Ensure opportunity notes are persisted in CRM
alter table if exists revenue.sales_opportunities
  add column if not exists notes text;
