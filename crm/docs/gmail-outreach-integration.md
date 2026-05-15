# The Chop Shop Gmail Outreach Integration (Supabase + Google OAuth)

This adds Gmail connectivity for sales outreach in the standalone CRM.

## What this enables
- Connect one or more Gmail accounts per user
- Store OAuth tokens securely (encrypted at rest)
- Send outreach emails from connected inboxes
- Log outbound email activity back to CRM opportunities/tasks

---

## Architecture (simple)

1. User clicks **Connect Gmail** in The Chop Shop
2. App redirects to Google OAuth consent screen
3. OAuth callback stores encrypted tokens in Supabase (`revenue.gmail_accounts`)
4. Send action calls edge function / server function
5. Function refreshes token as needed and sends via Gmail API
6. Result is logged to `revenue.sales_activities`

---

## Required Google OAuth scopes
- `https://www.googleapis.com/auth/gmail.send`
- `https://www.googleapis.com/auth/userinfo.email`
- `openid`

Optional (if you want read/sync):
- `https://www.googleapis.com/auth/gmail.readonly`

---

## New tables

## `revenue.gmail_accounts`
- `id` uuid pk
- `owner_user_id` uuid fk -> auth.users(id)
- `email_address` text not null
- `google_sub` text not null
- `access_token_encrypted` text not null
- `refresh_token_encrypted` text not null
- `token_expires_at` timestamptz not null
- `scope` text not null
- `is_primary` boolean default false
- `is_active` boolean default true
- `last_sync_at` timestamptz null
- `created_at` timestamptz default now()
- `updated_at` timestamptz default now()

Constraints:
- unique (`owner_user_id`, `email_address`)
- unique (`owner_user_id`) where `is_primary = true`

## `revenue.email_outreach`
- `id` uuid pk
- `owner_user_id` uuid fk -> auth.users(id)
- `gmail_account_id` uuid fk -> `revenue.gmail_accounts(id)`
- `account_id` uuid fk -> `revenue.sales_accounts(id)` null
- `opportunity_id` uuid fk -> `revenue.sales_opportunities(id)` null
- `contact_id` uuid fk -> `revenue.sales_contacts(id)` null
- `subject` text not null
- `body_text` text null
- `body_html` text null
- `to_recipients` jsonb not null
- `cc_recipients` jsonb null
- `bcc_recipients` jsonb null
- `gmail_message_id` text null
- `status` text not null (`draft|queued|sent|failed`)
- `error_message` text null
- `sent_at` timestamptz null
- `created_at` timestamptz default now()
- `updated_at` timestamptz default now()

---

## Security requirements
- Never store tokens in plaintext in browser localStorage
- Encrypt tokens before writing to DB
- Restrict token columns to server role only
- RLS: users can only access rows where `owner_user_id = auth.uid()`

---

## Operational flow
- Sender picks connected Gmail account
- Compose email using contact/opportunity context
- Send invokes backend function only
- On success:
  - update `email_outreach.status='sent'`
  - set `gmail_message_id`, `sent_at`
  - insert `sales_activities` row with `activity_type='email'`
- On failure:
  - update status `failed` + `error_message`

---

## Minimum UI needed
- Connect Gmail button
- Connected inbox list (primary toggle)
- Compose drawer (to, subject, body)
- Send status + retry
- Timeline entry on opportunity/activity feed
