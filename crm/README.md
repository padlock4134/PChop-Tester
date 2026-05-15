# Standalone CRM Workspace

This folder is intentionally **standalone** and separate from the existing application code.

## Scope
- No modifications to `src/App.tsx` or discipline modules.
- CRM planning, schema design, and future implementation live only under `crm/`.

## Contents
- `crm/docs/` → CRM specs and planning docs
- `crm/sql/` → Supabase SQL migrations/scripts for CRM tables and RLS
- `crm/storage/` → Storage bucket conventions/policies
- `crm/src/` → Future standalone CRM frontend/backend code (if needed)

## Immediate goal
Ship a sales-first CRM data model and storage policy without touching the learner app.
