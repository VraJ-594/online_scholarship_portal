# Google OAuth Sign-In for Students (dau.ac.in) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let students sign in/register with their `dau.ac.in` Google Workspace account (domain verified server-side), restrict all *new* plain-form registrations to `@dau.ac.in` too, and guarantee neither path can ever create or reach an admin session.

**Architecture:** A new public backend endpoint (`POST /api/user/google-login`) verifies a Google ID token server-side via `google-auth-library`, enforces the domain, upserts a `osp.users` row keyed on the already-`UNIQUE` `email` column, and issues the same JWT shape `/api/user/login` already returns. The frontend adds one button to the existing login card that posts the token there and reuses the existing post-login handling. No new tables, no new session mechanism, no changes to the admin path at all.

**Tech Stack:** `google-auth-library` (backend, new), `@react-oauth/google` (frontend, new), the existing `pg`/`jsonwebtoken`/Express stack, `node-pg-migrate` (already set up).

**Spec:** `docs/superpowers/specs/2026-09-06-google-oauth-student-login-design.md`

## Global Constraints

- No automated test suite exists in this project (confirmed in the spec and every prior remediation this session) -- "tests" in this plan are manual verification via `curl`/`node -e` against the real local server and the live Supabase DB, matching how every other change this session was verified. Do not introduce a test framework as part of this plan.
- Migrations are applied manually (`npm run migrate up -- --schema osp`), never automated in CI -- do not add migration steps to `.github/workflows/ci.yml`.
- The admin login path (`authUser.js`, `/api/user/login`) is never touched by this plan.
- Every new/changed backend response must match the shape `{ role, username, email, pic, token }` that `/api/user/login` already returns, so the frontend's existing post-login handling works unmodified.
- Domain constant: `dau.ac.in`, checked via **both** `payload.hd === "dau.ac.in"` and `email.toLowerCase().endsWith("@dau.ac.in")` -- never rely on only one.

---

### Task 1: Database migration -- nullable `password` column

**Files:**
- Create: `OSP/server/migrations/3_nullable-password-for-google-accounts.sql`

**Interfaces:**
- Produces: `osp.users.password` becomes nullable. Every later task that inserts a Google-only user relies on this (they insert `password = NULL`).

- [ ] **Step 1: Write the migration**

```sql
-- Up Migration
--
-- Google-authenticated accounts (see googleAuth.js, Task 3) have no local
-- password -- there's nothing for a student to type if they only ever
-- sign in via their dau.ac.in Google account. This only removes a
-- constraint; no existing password values change.

ALTER TABLE osp.users ALTER COLUMN password DROP NOT NULL;

-- Down Migration
--
-- One-way in practice: if any Google-only account (password IS NULL)
-- exists by the time this runs, re-adding NOT NULL will fail on it.
-- That's expected -- write a forward migration to reverse this instead
-- of relying on down once real Google-only accounts exist.

ALTER TABLE osp.users ALTER COLUMN password SET NOT NULL;
```

- [ ] **Step 2: Dry-run against Supabase to preview it**

Run (from `OSP/server`):
```bash
npx node-pg-migrate up --schema osp --dry-run
```
Expected: output shows exactly the `ALTER TABLE osp.users ALTER COLUMN password DROP NOT NULL;` statement from Step 1, nothing else (migrations 1 and 2 are already tracked as applied).

- [ ] **Step 3: Apply it for real**

```bash
npx node-pg-migrate up --schema osp
```
Expected: `Migrations complete!`, and `osp.pgmigrations` gets a new row for `3_nullable-password-for-google-accounts`.

- [ ] **Step 4: Verify the column is nullable and no data changed**

```bash
node -e "
require('dotenv').config();
const pool = require('./config/db');
(async () => {
  const col = await pool.query(\`
    SELECT is_nullable FROM information_schema.columns
    WHERE table_schema = 'osp' AND table_name = 'users' AND column_name = 'password'
  \`);
  console.log('password is_nullable:', col.rows[0].is_nullable);
  const users = await pool.query('SELECT COUNT(*) FROM osp.users');
  console.log('user count (should be unchanged, 4):', users.rows[0].count);
  process.exit(0);
})();
"
```
Expected: `password is_nullable: YES` and `user count (should be unchanged, 4): 4`.

- [ ] **Step 5: Commit**

```bash
git add OSP/server/migrations/3_nullable-password-for-google-accounts.sql
git commit -m "Add migration: make users.password nullable for Google-only accounts"
```

---

### Task 2: Backend -- Google ID token verification helper

**Files:**
- Create: `OSP/server/config/googleClient.js`
- Modify: `OSP/server/package.json` (add `google-auth-library` dependency)

**Interfaces:**
- Produces: `verifyGoogleIdToken(idToken: string) => Promise<payload>` where `payload` has at least `email`, `email_verified`, `hd`, `name`, `picture`. Throws if the token is invalid, expired, or its `aud` doesn't match `GOOGLE_CLIENT_ID`. Task 3 imports this exact function name from this exact path.
- Consumes: `process.env.GOOGLE_CLIENT_ID`.

- [ ] **Step 1: Install the dependency**

```bash
cd OSP/server
npm install google-auth-library
```

- [ ] **Step 2: Write the helper**

Create `OSP/server/config/googleClient.js`:
```js
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Verifies a Google ID token and returns its payload, or throws if the
// token is invalid, expired, or wasn't issued for our GOOGLE_CLIENT_ID.
// Callers must still check payload.hd/email themselves -- this only
// proves the token is a real, unmodified token from Google.
const verifyGoogleIdToken = async (idToken) => {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
};

module.exports = { verifyGoogleIdToken };
```

- [ ] **Step 3: Verify it fails closed on garbage input (no real Google account needed for this)**

```bash
cd OSP/server
node -e "
require('dotenv').config();
const { verifyGoogleIdToken } = require('./config/googleClient');
(async () => {
  try {
    await verifyGoogleIdToken('not-a-real-token');
    console.log('FAIL: should have thrown');
  } catch (e) {
    console.log('OK, threw as expected:', e.message);
  }
})();
"
```
Expected: `OK, threw as expected: ...` (some token-parsing error message). If `GOOGLE_CLIENT_ID` isn't set yet in `.env` (it won't be until Task 7), this still throws correctly -- `verifyIdToken` fails on the malformed token before it ever needs a valid audience to compare against.

- [ ] **Step 4: Syntax-check and commit**

```bash
node --check config/googleClient.js
cd ../..
git add OSP/server/config/googleClient.js OSP/server/package.json OSP/server/package-lock.json
git commit -m "Add Google ID token verification helper (google-auth-library)"
```

---

### Task 3: Backend -- `googleLogin` controller, route, and env scaffolding

**Files:**
- Create: `OSP/server/controller/googleAuth.js`
- Modify: `OSP/server/Routes/userRoutes.js`
- Modify: `OSP/server/.env.example`

**Interfaces:**
- Consumes: `verifyGoogleIdToken` from `../config/googleClient` (Task 2), `generateToken` from `../config/generateToken` (existing), `pool` from `../config/db` (existing).
- Produces: `POST /api/user/google-login`, public route, body `{ credential }`, response `{ role, username, email, pic, token }` on success (same shape as `/api/user/login`) or `{ message }` with 400/401/403 on failure. Task 6 (frontend) calls this exact path and body shape.

- [ ] **Step 1: Write the controller**

Create `OSP/server/controller/googleAuth.js`:
```js
const pool = require("../config/db");
const generateToken = require("../config/generateToken");
const { verifyGoogleIdToken } = require("../config/googleClient");

const ALLOWED_DOMAIN = "dau.ac.in";

const googleLogin = async (req, res, next) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ message: "Missing Google credential." });
  }

  let payload;
  try {
    payload = await verifyGoogleIdToken(credential);
  } catch (error) {
    console.error("Google token verification failed:", error.message);
    return res.status(401).json({ message: "Invalid Google sign-in, please try again." });
  }

  const email = (payload.email || "").toLowerCase();
  const isAllowedDomain =
    payload.email_verified === true &&
    payload.hd === ALLOWED_DOMAIN &&
    email.endsWith(`@${ALLOWED_DOMAIN}`);

  if (!isAllowedDomain) {
    return res.status(403).json({
      message: `Please sign in with your official @${ALLOWED_DOMAIN} Google account.`,
    });
  }

  try {
    const existing = await pool.query("SELECT * FROM osp.users WHERE email = $1", [email]);

    let user;
    if (existing.rows.length > 0) {
      user = existing.rows[0];
      if (user.role !== "student") {
        return res.status(403).json({
          message: "This account uses password login. Please sign in with your password.",
        });
      }
    } else {
      const username = payload.name || email.split("@")[0];
      const inserted = await pool.query(
        `INSERT INTO osp.users (username, email, password, role, pic)
         VALUES ($1, $2, NULL, 'student', $3)
         RETURNING id, username, email, role, pic`,
        [username, email, payload.picture || null]
      );
      user = inserted.rows[0];
    }

    return res.status(200).json({
      role: user.role,
      username: user.username,
      email: user.email,
      pic: user.pic,
      token: generateToken({ email: user.email, role: user.role }),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { googleLogin };
```

- [ ] **Step 2: Wire the route**

In `OSP/server/Routes/userRoutes.js`, add the import next to the other controller imports:
```js
const { googleLogin } = require("../controller/googleAuth");
```
And add the route in the public section, right after `login`:
```js
router.route("/login").post(authUser);
router.route("/google-login").post(googleLogin);
```

- [ ] **Step 3: Add the env var to `.env.example`**

In `OSP/server/.env.example`, add after the `token_api` block:
```
# Google OAuth Client ID (Web application type), used to verify Google
# Sign-In ID tokens for student login. Create one at
# https://console.cloud.google.com/apis/credentials -- see Task 7 of
# docs/superpowers/plans/2026-09-07-google-oauth-student-login.md
GOOGLE_CLIENT_ID=
```

- [ ] **Step 4: Syntax-check and boot-test**

```bash
cd OSP/server
node --check controller/googleAuth.js
node --check Routes/userRoutes.js
timeout 6 npm start
```
Expected: `Server is running on port 8080` and `Database is successfully Connected`, no errors.

- [ ] **Step 5: Verify the failure paths (no real Google account needed yet)**

With the server running locally:
```bash
echo "--- missing credential ---"
curl -s -i -X POST "http://localhost:8080/api/user/google-login" \
  -H "Content-Type: application/json" -d '{}' | tail -3

echo "--- garbage credential ---"
curl -s -i -X POST "http://localhost:8080/api/user/google-login" \
  -H "Content-Type: application/json" -d '{"credential":"not-a-real-token"}' | tail -3
```
Expected: first returns `400 {"message":"Missing Google credential."}`; second returns `401 {"message":"Invalid Google sign-in, please try again."}`. (The success path needs a real Google ID token from a real `dau.ac.in` account -- verified in Task 7, once the OAuth Client ID exists.)

- [ ] **Step 6: Commit**

```bash
git add OSP/server/controller/googleAuth.js OSP/server/Routes/userRoutes.js OSP/server/.env.example
git commit -m "Add POST /api/user/google-login: domain-restricted Google Sign-In for students"
```

---

### Task 4: Backend -- restrict new plain registrations to `@dau.ac.in`

**Files:**
- Modify: `OSP/server/controller/registerUser.js`

**Interfaces:** none (self-contained change to an existing controller; no other task depends on this one).

- [ ] **Step 1: Add the domain check**

In `OSP/server/controller/registerUser.js`, right after the existing required-fields check (the block that currently ends `return;` around line 18-19), add:
```js
    if (!email.toLowerCase().endsWith("@dau.ac.in")) {
      return res.status(400).json({
        success: false,
        message: "Please register with your official @dau.ac.in email address.",
      });
    }
```
So the top of the function reads:
```js
    if (!username || !email || !password) {
      res.status(400).json({ success: false, message: "Please input all the fields" });
      console.error("Please input all the fields");
      return;
    }

    if (!email.toLowerCase().endsWith("@dau.ac.in")) {
      return res.status(400).json({
        success: false,
        message: "Please register with your official @dau.ac.in email address.",
      });
    }

    const userExist = await pool.query(
```

- [ ] **Step 2: Syntax-check**

```bash
cd OSP/server
node --check controller/registerUser.js
```

- [ ] **Step 3: Verify against the live backend (boot it locally first if not already running)**

```bash
timeout 6 npm start &
sleep 2
echo "--- non-institutional email: must be rejected ---"
curl -s -i -X POST "http://localhost:8080/api/user/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"Test","email":"nobody@gmail.com","password":"testpass123"}' | tail -3

echo "--- dau.ac.in email: must pass the domain check (may still 400 for other reasons, e.g. duplicate) ---"
curl -s -i -X POST "http://localhost:8080/api/user/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"Test","email":"a-brand-new-test-account@dau.ac.in","password":"testpass123"}' | tail -3
```
Expected: the `gmail.com` request returns `400 {"success":false,"message":"Please register with your official @dau.ac.in email address."}`. The `dau.ac.in` request does **not** return that message (it should succeed with `201` and a token, since that email shouldn't already exist -- if it does from a prior test run, you'll see "User already exists" instead, which still proves the domain check itself passed).

- [ ] **Step 4: Clean up the test account if it was created**

```bash
cd OSP/server
node -e "
require('dotenv').config();
const pool = require('./config/db');
pool.query(\"DELETE FROM osp.users WHERE email = 'a-brand-new-test-account@dau.ac.in'\")
  .then(() => { console.log('cleaned up'); process.exit(0); });
"
```

- [ ] **Step 5: Commit**

```bash
git add OSP/server/controller/registerUser.js
git commit -m "Restrict new plain-form registrations to @dau.ac.in emails"
```

---

### Task 5: Frontend -- `@react-oauth/google` dependency + provider wiring

**Files:**
- Modify: `OSP/client/package.json` (add `@react-oauth/google`)
- Modify: `OSP/client/src/index.js`
- Modify: `OSP/client/.env.example`

**Interfaces:**
- Produces: every component under `<App />` can use `@react-oauth/google`'s `GoogleLogin`/`useGoogleLogin` (the `GoogleOAuthProvider` context is available app-wide). Task 6 relies on this.
- Consumes: `process.env.REACT_APP_GOOGLE_CLIENT_ID`.

- [ ] **Step 1: Install the dependency**

```bash
cd OSP/client
npm install @react-oauth/google
```

- [ ] **Step 2: Wrap the app in `GoogleOAuthProvider`**

Replace `OSP/client/src/index.js`:
```js
// index.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import UserProvider from "./context/userProvider";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || ""}>
    <BrowserRouter>
      <UserProvider>
        <App />
      </UserProvider>
    </BrowserRouter>
  </GoogleOAuthProvider>,
);
```
(An empty/missing `clientId` doesn't crash the provider itself -- it just makes any `GoogleLogin` button inside it fail to render its real Google UI, which is exactly what happens before Task 7's env var is actually set. That's the correct fail-closed behavior, not a bug to guard against.)

- [ ] **Step 3: Add the env var to `.env.example`**

In `OSP/client/.env.example`, add:
```
# Google OAuth Client ID (same value as the backend's GOOGLE_CLIENT_ID) --
# see Task 7 of docs/superpowers/plans/2026-09-07-google-oauth-student-login.md
REACT_APP_GOOGLE_CLIENT_ID=
```

- [ ] **Step 4: Verify the app still builds**

```bash
cd OSP/client
rm -rf build
CI=true npm run build
```
Expected: `Compiled successfully.` (matches the exact CI condition from `.github/workflows/ci.yml`).

- [ ] **Step 5: Commit**

```bash
rm -rf OSP/client/build
git add OSP/client/package.json OSP/client/package-lock.json OSP/client/src/index.js OSP/client/.env.example
git commit -m "Add @react-oauth/google and wrap the app in GoogleOAuthProvider"
```

---

### Task 6: Frontend -- Google button on the login card

**Files:**
- Modify: `OSP/client/src/components/LoginRegister/LoginRegister.jsx`

**Interfaces:** none produced for later tasks -- this is the last code task.

- [ ] **Step 1: Import `GoogleLogin`**

Add to the top of `LoginRegister.jsx`, with the other imports:
```js
import { GoogleLogin } from "@react-oauth/google";
```

- [ ] **Step 2: Extract the shared post-login handling**

There are currently two near-identical "store session and navigate" blocks: `roleCheck`'s success branch (which stores `userInfo`/`roleChecked` and navigates, but never calls `setUser`) and `handleLoginSubmit`'s success branch (which does call `setUser`). Replace both with one helper, and use it from a new `handleGoogleLogin` too.

Replace this in `roleCheck`:
```js
      if (response.ok) {
        localStorage.setItem("userInfo", JSON.stringify(check));
        localStorage.setItem("roleChecked", "true");

        if (check.role === "student") {
          navigate("/student");
        } else if (check.role === "admin") {
          navigate("/admin");
        }
      } else {
```
with:
```js
      if (response.ok) {
        completeLogin(check);
      } else {
```

Replace this in `handleLoginSubmit`:
```js
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        localStorage.setItem("userInfo", JSON.stringify(data));
        localStorage.setItem("roleChecked", "true");

        setUser(data);

        if (data.role === "student") {
          navigate("/student");
        } else if (data.role === "admin") {
          navigate("/admin");
        }
      } else {
```
with:
```js
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        completeLogin(data);
      } else {
```

Add the helper itself right after `roleCheck` is declared (before `toggleForm`):
```js
  const completeLogin = (data) => {
    localStorage.setItem("userInfo", JSON.stringify(data));
    localStorage.setItem("roleChecked", "true");
    setUser(data);

    if (data.role === "student") {
      navigate("/student");
    } else if (data.role === "admin") {
      navigate("/admin");
    }
  };
```

- [ ] **Step 3: Add the Google sign-in handler**

Add this function next to `handleLoginSubmit`/`handleRegisterSubmit`:
```js
  const handleGoogleLogin = async (credential) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${baseURL}/api/user/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        completeLogin(data);
      } else {
        toast.error(data.message || "Google sign-in failed.");
      }
    } catch (error) {
      toast.error("An error occurred during Google sign-in.");
    } finally {
      setIsLoading(false);
    }
  };
```

- [ ] **Step 4: Add the button to the JSX**

In the return statement, add a divider and the button right after the closing `</form>` tag and before the "New to OSP? / Already have an account?" paragraph:
```jsx
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={(credentialResponse) => handleGoogleLogin(credentialResponse.credential)}
              onError={() => toast.error("Google sign-in failed. Please try again.")}
              text="continue_with"
            />
          </div>

          <p className="text-center text-sm text-slate-500 mt-6">
```
(Remove the old opening `<p className="text-center text-sm text-slate-500 mt-6">` line that's already there -- this replaces it, since the snippet above already includes it as its last line. Do not end up with two copies.)

- [ ] **Step 5: Verify the build**

```bash
cd OSP/client
rm -rf build
CI=true npm run build
```
Expected: `Compiled successfully.`, no unused-import or unused-variable warnings (they fail the build under `CI=true` -- confirm `GoogleLogin` and `handleGoogleLogin` are both actually referenced in the JSX/handlers above, or this step will fail).

- [ ] **Step 6: Commit**

```bash
rm -rf OSP/client/build
git add OSP/client/src/components/LoginRegister/LoginRegister.jsx
git commit -m "Add Google Sign-In button to the login/register card"
```

---

### Task 7: External setup + end-to-end verification (requires your Google Cloud account)

**Files:** none (configuration + verification only).

This task cannot be done by an agent alone -- creating the OAuth Client ID requires your own Google Cloud account.

- [ ] **Step 1: Create the OAuth Client ID**

Go to https://console.cloud.google.com/apis/credentials (create a project first if you don't have one for this). **Create Credentials → OAuth client ID**:
- Application type: **Web application**
- Authorized JavaScript origins: `http://localhost:3000` and `https://osp-silk.vercel.app`
- No redirect URI needed (leave blank) -- `@react-oauth/google`'s flow returns the token directly to the page.

Copy the generated Client ID (looks like `123456789-abc...apps.googleusercontent.com`).

- [ ] **Step 2: Set it locally on both sides**

In `OSP/server/.env`, set:
```
GOOGLE_CLIENT_ID=<paste the value from Step 1>
```
In `OSP/client/.env`, set:
```
REACT_APP_GOOGLE_CLIENT_ID=<the same value>
```

- [ ] **Step 3: Run both apps locally**

```bash
cd OSP/server && npm run dev
```
In a second terminal:
```bash
cd OSP/client && npm start
```

- [ ] **Step 4: Test with a real `dau.ac.in` Google account**

Open `http://localhost:3000`, click the Google button, and sign in with a real `dau.ac.in` account.
Expected: redirected to `/student` (or `/admin` only if that email happens to already be an admin row -- which Task 3's role check would then correctly reject with a 403 toast instead, per the spec).

- [ ] **Step 5: Test the domain rejection with a real personal Google account**

Sign out, click the Google button again, and sign in with a personal (non-`dau.ac.in`) Google account.
Expected: a toast reading "Please sign in with your official @dau.ac.in Google account." -- no session created.

- [ ] **Step 6: Confirm the new user row in the database**

```bash
cd OSP/server
node -e "
require('dotenv').config();
const pool = require('./config/db');
pool.query(\"SELECT id, email, username, role, password IS NULL AS password_is_null FROM osp.users WHERE email = '<the dau.ac.in email you tested with>'\")
  .then((r) => { console.log(r.rows); process.exit(0); });
"
```
Expected: one row, `role: 'student'`, `password_is_null: true`.

- [ ] **Step 7: Confirm signing in again with the same account reuses the same row**

Sign out and sign in again with the same `dau.ac.in` account from Step 4. Re-run the query from Step 6 -- expected: still exactly one row with the same `id` (no duplicate).

- [ ] **Step 7.5: Confirm a non-student row can never reach a session via Google**

This is the check that makes Goal #3 ("Google sign-in can never *reach* an admin session") actually true rather than just true of today's data. Temporarily flip the same test account's role, attempt Google sign-in, confirm it's rejected, then flip it back:
```bash
cd OSP/server
node -e "
require('dotenv').config();
const pool = require('./config/db');
pool.query(\"UPDATE osp.users SET role = 'admin' WHERE email = '<the dau.ac.in email you tested with>'\")
  .then(() => { console.log('flipped to admin for this test'); process.exit(0); });
"
```
Sign out and click the Google button again with that same account.
Expected: rejected with "This account uses password login. Please sign in with your password." -- no session created, despite it being a completely valid, verified `dau.ac.in` Google account.

Then flip it back so the account is usable again:
```bash
node -e "
require('dotenv').config();
const pool = require('./config/db');
pool.query(\"UPDATE osp.users SET role = 'student' WHERE email = '<the dau.ac.in email you tested with>'\")
  .then(() => { console.log('reverted to student'); process.exit(0); });
"
```

- [ ] **Step 8: Confirm existing accounts are unaffected**

Log in normally with password using one of the existing grandfathered accounts (`nishil@gmail.com` or `jainam@gmail.com`) and separately confirm the existing admin account still logs in with its password. Both should work exactly as before -- neither this plan's frontend nor backend changes touch their code paths.

- [ ] **Step 9: Set the env vars in production and deploy**

- **Render** (`osp-server` → Environment): add `GOOGLE_CLIENT_ID` with the value from Step 1. Saving triggers an auto-redeploy.
- **Vercel**: `vercel env add REACT_APP_GOOGLE_CLIENT_ID production` (paste the same value when prompted), then `vercel --prod` from `OSP/client` to rebuild with it baked in (CRA env vars are compiled in at build time, so just setting the variable isn't enough on its own).

- [ ] **Step 10: Repeat Steps 4-8 against the deployed URLs**

Same checks as above, but at `https://osp-silk.vercel.app` instead of `localhost:3000`.
