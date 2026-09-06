# Google OAuth Sign-In for Students (dau.ac.in domain restriction)

## Context

Current auth (OSP/server, OSP/client): JWT-based. `generateToken.js` signs
`{email, role}`; `authMiddleware.js` verifies the JWT and re-fetches the
user from `osp.users` by email on every request. The `users` table is
`id, email (unique), username, password (NOT NULL), role ('student'|'admin'), pic`.

`registerUser.js` already hardcodes `role: "student"` on self-registration
today — there is no self-service admin path in the current system. Admin
rows (e.g. `admin1@osp.local`) are provisioned manually, directly in the
database, outside the app.

Live data also shows pre-existing student accounts registered with
personal email addresses (`nishil@gmail.com`, `jainam@gmail.com`), not an
institutional domain — these must keep working unchanged.

The institution's actual student/staff email domain is `dau.ac.in`
(recently renamed from DAIICT), and it is a Google Workspace domain — real
Google accounts exist for it, not just addresses.

## Goals

1. Let students sign in or register using their `dau.ac.in` Google
   Workspace account, with domain ownership verified **server-side**
   (never a client-side-only check).
2. Restrict all *future* plain email+password registrations to
   `@dau.ac.in` too, so Google sign-in isn't just a second front door next
   to an unlocked one. Existing non-`dau.ac.in` accounts are grandfathered
   (untouched, still able to log in with their password).
3. Guarantee Google sign-in can never create or reach an admin session —
   by construction, not by a checkable-but-forgettable condition.
4. Reuse the existing JWT/session mechanics unchanged — Google sign-in
   produces the same kind of token the rest of the app already trusts.

## Non-goals

- No changes to the admin login flow or admin provisioning.
- No migration of existing password accounts to Google-only.
- No "Sign in with Google" for admins.
- No account-merging UI. Linking to a pre-existing row happens implicitly
  because `users.email` is already `UNIQUE` — if a Google sign-in's email
  matches an existing row, that row is used; no explicit merge flow needed.

## Architecture / data flow

1. **Frontend**: a "Continue with your dau.ac.in account" button on
   `LoginRegister.jsx`, using `@react-oauth/google`'s `GoogleLogin`
   component, configured with `REACT_APP_GOOGLE_CLIENT_ID`. Shown in both
   login and register modes (Google sign-in handles first-time
   registration and subsequent login in one step, so the existing
   login/register toggle doesn't apply to it).
2. On success, the frontend receives a Google **ID token** (a JWT string,
   Google calls it `credential`) — not an access token, no scopes/consent
   beyond basic profile+email needed.
3. Frontend `POST`s `{ credential }` to a new endpoint,
   `POST /api/user/google-login` (public, no `Authorization` header — this
   call *is* the login).
4. New backend controller (`googleAuth.js`):
   - Verify the token via `google-auth-library`'s
     `OAuth2Client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID })`.
     This validates the signature against Google's public keys and the
     `aud` claim — this step alone rules out a forged/replayed token from
     anywhere else.
   - From the verified payload, require **all** of: `email_verified === true`,
     `hd === "dau.ac.in"`, and `email` ends with `@dau.ac.in` (belt-and-braces:
     `hd` and the email suffix are checked independently so a bug in either
     check alone doesn't become a bypass).
   - Any failure → `403 { message: "Please sign in with your official @dau.ac.in Google account." }`.
     No DB row is touched on this path.
   - `SELECT * FROM osp.users WHERE email = $1`.
     - **Found, `role = 'student'`** → use that row as-is. (This is what
       makes a pre-existing `dau.ac.in` password account "just work" with
       Google sign-in too, with no special-case code.)
     - **Found, `role != 'student'`** (i.e. an admin row happens to share
       this email) → reject with
       `403 { message: "This account uses password login. Please sign in with your password." }`.
       This is what makes Goal #3 ("can never *reach* an admin session")
       actually true, not just true of today's data — without this check,
       an admin whose email happened to match a `dau.ac.in` address could
       reach an admin session through the student-facing Google button.
     - **Not found** → `INSERT` a new row: `email`, `username` = the
       token's `name` claim (falling back to the email's local part if
       `name` is absent — `username` is `NOT NULL` in the schema, so this
       can never be allowed to insert `NULL`), `password = NULL`,
       `role = 'student'`, `pic` = the token's `picture` claim. `RETURNING`
       the new row.
   - Issue a JWT via the existing `generateToken({ email, role })` —
     identical shape to `/api/user/login`'s token.
   - Respond with the same shape `/api/user/login` already returns:
     `{ role, username, email, pic, token }`, so the frontend can reuse
     its existing post-login handling rather than branching on how the
     session was obtained.
5. **Frontend on success**: identical handling to the existing
   `handleLoginSubmit` success branch (`localStorage.setItem("userInfo", ...)`,
   `setUser(data)`, navigate to `/student` or `/admin` by `data.role`).
   This logic is currently duplicated between `roleCheck`'s success path
   and `handleLoginSubmit`'s success path in `LoginRegister.jsx`; adding a
   third copy for Google is the trigger to extract a small
   `completeLogin(data)` helper used by all three instead.

## Database changes (migration `3_*`)

```sql
ALTER TABLE osp.users ALTER COLUMN password DROP NOT NULL;
```

Down migration re-adds `NOT NULL` — noted as a one-way door in practice:
if any Google-only (`password IS NULL`) accounts exist by the time anyone
runs `down`, it will fail on that constraint. This is acceptable (matches
the existing baseline migration's stance that `down` is a rarely-used
escape hatch, not a guarantee) and will be called out in the migration's
own comment, not silently.

## Registration domain restriction (plain form)

In `registerUser.js`, after the existing required-fields check, add:

```js
if (!email.toLowerCase().endsWith("@dau.ac.in")) {
  return res.status(400).json({
    success: false,
    message: "Please register with your official @dau.ac.in email address.",
  });
}
```

Applies to new registrations only — no backfill or re-validation against
existing rows. This is the plain-form half of "only official emails";
Google sign-in enforces the same rule independently on its own path (see
above) — intentionally not sharing one code path between them, since a
bug in a shared helper would silently break both fronts at once.

## Environment / external setup

- **Backend**: new `GOOGLE_CLIENT_ID` env var (`.env` + `.env.example`),
  used as the `audience` for token verification.
- **Frontend**: new `REACT_APP_GOOGLE_CLIENT_ID` env var (`.env` + `.env.example`).
- **Manual step (outside this repo, on your Google Cloud account)**: create
  an OAuth 2.0 Client ID (type: Web application) in Google Cloud Console.
  Authorized JavaScript origins: `http://localhost:3000` and
  `https://osp-silk.vercel.app` (add any future custom domain later). No
  redirect URI is needed — `@react-oauth/google`'s `GoogleLogin` flow
  returns the ID token directly to the page via postMessage, not a
  server-side redirect.
- Client ID then gets added to: local `.env` (both sides), Render's
  `osp-server` environment variables, and Vercel's `REACT_APP_GOOGLE_CLIENT_ID`
  (same pattern already used for `REACT_APP_API_URL`).

## Error handling

| Condition | Response |
|---|---|
| Malformed/expired/forged Google token | `401 { message: "Invalid Google sign-in, please try again." }` |
| Valid token, wrong domain / unverified email | `403 { message: "Please sign in with your official @dau.ac.in Google account." }` |
| Valid token, matches an existing non-student row | `403 { message: "This account uses password login. Please sign in with your password." }` |
| DB error during lookup/insert | Falls through to the existing `errorMiddleware` via `next(error)`, same as every other controller |
| Plain registration with non-`dau.ac.in` email | `400`, existing error-response shape |

## Testing (manual -- no automated suite exists yet)

1. Google sign-in with a personal Gmail account → rejected (403).
2. Google sign-in with a `dau.ac.in` test account not yet in `users` → new
   row created, `role = 'student'`, `password IS NULL`.
3. Google sign-in again with the same account → same row (same `id`), no
   duplicate, still logs in successfully.
4. Plain registration with a non-`dau.ac.in` email → rejected (400).
5. Plain registration with a `dau.ac.in` email → succeeds, unchanged
   otherwise.
6. Existing `nishil@gmail.com` / `jainam@gmail.com` accounts can still log
   in with their password (grandfathered, unaffected by either change).
7. Existing admin login (`admin1@osp.local` + password) unaffected; no
   code path lets a Google sign-in reach or create an admin row.
8. A row with `role != 'student'` whose email happens to match a Google
   account's email → Google sign-in for that email is rejected (403),
   confirming the role check actually prevents reaching an admin session
   this way (not just that it doesn't happen to occur with today's data).

## Rollout notes

- Migration 3 is applied manually via `npm run migrate up -- --schema osp`,
  same manual-only workflow established for migrations 1-2 — reviewed
  before running, not part of CI/CD.
- The Google Cloud OAuth Client ID must exist, and both env vars must be
  set on Render + Vercel, before this is deployed — otherwise
  `verifyIdToken` fails closed (rejects everything) rather than failing
  open, which is the safe direction for a misconfiguration to fail in.
