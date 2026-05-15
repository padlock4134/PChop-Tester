# The Chop Shop: External Partner Deal Submission

Yes — we should have an external submission flow so partners can send deals without full CRM access.

## What this should do
- Let partners submit a referral deal from a public form/link.
- Create a tracked record in CRM pipeline.
- Route to an internal owner for follow-up.
- Prevent spam/abuse with basic controls.

## Recommended pattern
1. Public form endpoint (Netlify/Supabase Edge Function)
2. Server validates payload + anti-spam token
3. Insert into `revenue.partner_deal_submissions`
4. Auto-create linked `revenue.sales_opportunities` row (or queue for review)
5. Notify assigned owner (email/slack)

## Minimum fields for partner form
- Partner company name
- Partner contact name
- Partner contact email
- Referred org name
- Referred contact name
- Referred contact email
- Deal summary
- Estimated value (optional)
- Notes (optional)
- Consent checkbox

## Internal triage statuses
- `new`
- `qualified`
- `converted_to_opportunity`
- `rejected`

## Security / anti-spam
- CAPTCHA or Turnstile token required
- Rate limiting by IP
- Submission idempotency key support
- Basic email/domain validation

## Ownership rules
- `assigned_owner_user_id` required after triage
- Converted submissions should store `converted_opportunity_id`

## Why this matters
- Partners can submit deals quickly.
- Sales team keeps one source of truth.
- Attribution remains clean for partner-sourced revenue.
