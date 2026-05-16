# Sales-Only CRM Schema (Standalone)

This standalone CRM supports direct sales only.

## Required tables
- `sales_accounts`
- `sales_contacts`
- `sales_opportunities`
- `sales_activities`
- `sales_files` (optional in v1, recommended in v1.1)

## Required storage
- one private Supabase bucket: `sales-files`
