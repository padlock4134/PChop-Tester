# Gmail Connect Checklist

Step-by-step guide to wire a Gmail inbox into The Chop Shop CRM.
The DB schema (`004_gmail_outreach.sql`) is already in place.
This doc covers the app-layer wiring.

---

## 1. Google Cloud Console setup

- [ ] Go to console.cloud.google.com → APIs & Services → Credentials
- [ ] Create an **OAuth 2.0 Client ID** (Web application type)
- [ ] Add authorized redirect URI:
  ```
  https://<your-netlify-domain>/.netlify/functions/gmail-oauth-callback
  ```
- [ ] Enable these APIs in the project:
  - Gmail API
  - Google People API (for `userinfo.email`)
- [ ] Copy **Client ID** and **Client Secret** to your `.env`:
  ```
  GOOGLE_OAUTH_CLIENT_ID=...
  GOOGLE_OAUTH_CLIENT_SECRET=...
  GOOGLE_OAUTH_REDIRECT_URI=https://<your-netlify-domain>/.netlify/functions/gmail-oauth-callback
  ```

---

## 2. Token encryption key

Tokens must be encrypted before writing to `revenue.gmail_accounts`.
Never store raw access/refresh tokens.

- [ ] Add an encryption secret to `.env`:
  ```
  CRM_TOKEN_ENCRYPTION_KEY=<32-byte hex string>
  ```
- [ ] Generate one with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] Use `aes-256-gcm` (Node built-in `crypto`) for encrypt/decrypt.
  The Netlify function does all encryption server-side.

---

## 3. Netlify functions to build

### `netlify/functions/gmail-oauth-start.js`
Redirects the user to Google's OAuth consent screen.

```js
// Required scopes
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.email',
  'openid',
].join(' ');

exports.handler = async () => {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id',     process.env.GOOGLE_OAUTH_CLIENT_ID);
  url.searchParams.set('redirect_uri',  process.env.GOOGLE_OAUTH_REDIRECT_URI);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope',         SCOPES);
  url.searchParams.set('access_type',   'offline');
  url.searchParams.set('prompt',        'consent');  // force refresh_token on every connect
  return { statusCode: 302, headers: { Location: url.toString() } };
};
```

### `netlify/functions/gmail-oauth-callback.js`
Exchanges the auth code for tokens, encrypts them, and upserts into Supabase.

Steps inside the handler:
1. Receive `?code=` from Google
2. POST to `https://oauth2.googleapis.com/token` to exchange code → `{ access_token, refresh_token, expires_in }`
3. Fetch `https://www.googleapis.com/oauth2/v1/userinfo` to get `email` and `sub`
4. Encrypt both tokens with `CRM_TOKEN_ENCRYPTION_KEY`
5. Upsert into `revenue.gmail_accounts` using Supabase **service role** key:
   ```js
   await supabase.from('gmail_accounts').upsert({
     owner_user_id:           <wristband_user_id_from_session>,
     email_address:           userinfo.email,
     google_sub:              userinfo.sub,
     access_token_encrypted:  encryptedAccessToken,
     refresh_token_encrypted: encryptedRefreshToken,
     token_expires_at:        new Date(Date.now() + expires_in * 1000).toISOString(),
     scope:                   SCOPES,
     is_primary:              true,
     is_active:               true,
   }, { onConflict: 'owner_user_id,email_address' });
   ```
6. Redirect back to CRM with `?connected=true`

### `netlify/functions/gmail-send.js`
Sends an outbound email and logs it to `revenue.email_outreach` + `revenue.sales_activities`.

Steps:
1. Validate session (Wristband cookie)
2. Fetch + decrypt tokens from `revenue.gmail_accounts` for `owner_user_id`
3. If `token_expires_at < now`, refresh via `https://oauth2.googleapis.com/token`
   - Update encrypted tokens in DB after refresh
4. Build RFC 2822 message, base64url-encode it
5. POST to `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`
6. On success:
   - Update `revenue.email_outreach` row: `status='sent'`, `sent_at`, `gmail_message_id`
   - Insert `revenue.sales_activities` row: `activity_type='email'`
7. On failure:
   - Update `revenue.email_outreach` row: `status='failed'`, `error_message`

---

## 4. CRM UI — minimum needed

- [ ] **Connect Gmail button** → calls `/.netlify/functions/gmail-oauth-start`
- [ ] **Connected inboxes list** → reads `revenue.gmail_accounts` where `owner_user_id = me`
  - Primary toggle (enforced by DB unique partial index)
  - Disconnect (set `is_active = false`, no delete)
- [ ] **Compose drawer** on opportunity/contact detail
  - To (pre-filled from contact), Subject, Body (plain text + optional HTML)
  - Send → calls `/.netlify/functions/gmail-send`
- [ ] **Activity feed** shows sent emails inline via `revenue.activity_timeline` view

---

## 5. Environment variables summary

Add these to Netlify environment settings (not committed to git):

```
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=
CRM_TOKEN_ENCRYPTION_KEY=
```

The existing Supabase vars (`VITE_SUPABASE_URL`, service role key) are reused.

---

## 6. Security checklist before going live

- [ ] Tokens never touch the browser — encrypt/decrypt in Netlify functions only
- [ ] Service role key never exposed client-side
- [ ] RLS on `revenue.gmail_accounts` blocks cross-user reads
- [ ] Token column select blocked for `authenticated` role (server-role reads only)
  ```sql
  -- Run once to lock down raw token columns
  revoke select (access_token_encrypted, refresh_token_encrypted)
  on revenue.gmail_accounts from authenticated;
  ```
- [ ] Rate limit `gmail-send` function (e.g. 50 sends/hour/user)
- [ ] Log all send attempts to `revenue.email_outreach` regardless of outcome
