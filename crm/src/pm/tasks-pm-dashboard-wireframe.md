# Tasks / PM Dashboard Wireframe

## Top row cards
- Open Tasks (todo + in_progress)
- Overdue (past due_date, not done/cancelled)
- Due Next 7 Days
- Completed This Week

## Left column
- My Tasks table (default: excludes cancelled)
  - Title
  - Account
  - Opportunity
  - Priority
  - Due Date
  - Status
  - [ ] Show cancelled toggle (off by default)

## Right column
- Team Kanban (5 columns covering all DB statuses)
  - To Do       → status = 'todo'
  - In Progress  → status = 'in_progress'
  - Blocked      → status = 'blocked' (show blocked_reason on card)
  - Done         → status = 'done'
  - Cancelled    → status = 'cancelled' (collapsed/grey by default)

## Bottom section
- Overdue list (due_date < today, status not in done/cancelled)
- Blocked tasks with `blocked_reason` displayed inline
