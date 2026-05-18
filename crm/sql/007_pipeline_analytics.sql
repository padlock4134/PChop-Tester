-- Standalone CRM: Pipeline analytics views
-- Depends on: 001_sales_schema.sql, 006_core_table_rls.sql
--
-- These views inherit RLS from their base tables automatically.
-- Query them the same way you query the underlying tables.

-- ─── pipeline_view ───────────────────────────────────────────────────────────
-- One row per open/won deal with full context and weighted value.
-- Excludes closed_lost deals. Use for pipeline board and deal cards.

create or replace view revenue.pipeline_view as
select
  o.id                                             as opportunity_id,
  o.name                                           as opportunity_name,
  o.stage,
  o.amount,
  o.probability_pct,
  round(
    coalesce(o.amount, 0) * o.probability_pct / 100.0, 2
  )                                                as weighted_value,
  o.close_date_target,
  case
    when o.close_date_target < current_date
     and o.stage not in ('closed_won','closed_lost')
    then true else false
  end                                              as is_overdue,
  o.next_step,
  o.next_step_due_date,
  o.discipline_focus,
  o.source_channel,
  o.pilot_required,
  o.loss_reason,
  o.owner_user_id,
  a.id                                             as account_id,
  a.name                                           as account_name,
  a.account_type,
  a.estimated_students,
  a.state_region,
  c.first_name || ' ' || c.last_name              as primary_contact_name,
  c.email                                          as primary_contact_email,
  c.title                                          as primary_contact_title,
  c.role_in_deal                                   as primary_contact_role,
  o.created_at,
  o.updated_at
from revenue.sales_opportunities o
join revenue.sales_accounts a  on a.id = o.account_id
left join revenue.sales_contacts c on c.id = o.primary_contact_id
where o.stage <> 'closed_lost';

-- ─── pipeline_summary ────────────────────────────────────────────────────────
-- Aggregated by stage: deal counts, total ACV, weighted value, and close health.
-- Use for the funnel chart and forecast header cards.

create or replace view revenue.pipeline_summary as
select
  stage,
  count(*)                                                           as deal_count,
  sum(coalesce(amount, 0))                                          as total_value,
  round(
    sum(coalesce(amount, 0) * probability_pct / 100.0)::numeric, 2
  )                                                                  as weighted_value,
  round(avg(probability_pct)::numeric, 1)                           as avg_probability_pct,
  count(*) filter (
    where close_date_target is not null
      and close_date_target between current_date and current_date + interval '30 days'
      and stage not in ('closed_won','closed_lost')
  )                                                                  as closing_in_30_days,
  count(*) filter (
    where close_date_target < current_date
      and stage not in ('closed_won','closed_lost')
  )                                                                  as overdue_close_count,
  min(close_date_target) filter (
    where stage not in ('closed_won','closed_lost')
  )                                                                  as nearest_close_date
from revenue.sales_opportunities
group by stage;

-- ─── activity_timeline ───────────────────────────────────────────────────────
-- Recent activities enriched with opportunity, account, and contact context.
-- Use for the deal detail feed and admin overview panel.

create or replace view revenue.activity_timeline as
select
  act.id                                           as activity_id,
  act.activity_type,
  act.subject,
  act.outcome,
  act.next_step,
  act.activity_at,
  act.duration_minutes,
  act.external_event_id,
  act.owner_user_id,
  o.id                                             as opportunity_id,
  o.name                                           as opportunity_name,
  o.stage                                          as opportunity_stage,
  a.id                                             as account_id,
  a.name                                           as account_name,
  c.first_name || ' ' || c.last_name              as contact_name,
  c.title                                          as contact_title,
  c.email                                          as contact_email
from revenue.sales_activities act
join revenue.sales_opportunities o  on o.id = act.opportunity_id
join revenue.sales_accounts a       on a.id = act.account_id
left join revenue.sales_contacts c  on c.id = act.contact_id
order by act.activity_at desc;
