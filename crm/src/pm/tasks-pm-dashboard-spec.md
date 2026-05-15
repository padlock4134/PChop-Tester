# Tasks / PM Dashboard (Standalone CRM)

This is a basic project-management layer for the standalone CRM workspace.

## Goal
Track execution tasks tied to sales opportunities and owners.

## Minimum dashboard views
1. **My Tasks** (by current owner)
2. **Team Board** (To Do / In Progress / Blocked / Done)
3. **Due Soon** (next 7 days)
4. **Overdue** (past due and not done)

## Core KPIs
- Open tasks by owner
- Overdue tasks count
- Tasks completed this week
- Average days to completion

## Task statuses
- `todo`
- `in_progress`
- `blocked`
- `done`
- `cancelled`

## Task priorities
- `low`
- `medium`
- `high`
- `urgent`

## Required fields
- `id` (uuid)
- `title` (text)
- `description` (text, nullable)
- `status` (enum-like text)
- `priority` (enum-like text)
- `owner_user_id` (uuid, fk -> auth.users)
- `created_by_user_id` (uuid, fk -> auth.users)
- `account_id` (uuid, nullable)
- `opportunity_id` (uuid, nullable)
- `due_date` (date, nullable)
- `completed_at` (timestamptz, nullable)
- `blocked_reason` (text, nullable)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

## Optional fields
- `estimate_hours` (numeric)
- `actual_hours` (numeric)
- `tags` (text[])
