# OSP — Online Scholarship Portal: Technical Map

**What it is:** A full-stack scholarship application portal, originally built for a database-systems course at DA-IICT (now DAU) by a 9-person team, since substantially hardened and deployed to production. Students register, build a detailed profile (10+ normalized tables), upload 8 required PDF documents, browse scholarships, apply, and track application status. Admins CRUD scholarships, review applicants, and update application statuses.

**This document reflects the codebase as of the security/stability/naming remediation pass described in §15 — before any Google OAuth work.** If you're reading this after OAuth lands, the auth sections need a fresh pass.

**Physical layout:**
```
OSP/
├── server/                    # Node/Express backend
│   ├── server.js              # entry point
│   ├── config/                # db pool, JWT, multer, cloudinary
│   ├── controller/            # ~25 controllers, one file per concern
│   ├── middleware/            # authMiddleware, adminMiddleware, logger, errorMiddleware
│   ├── Routes/                # userRoutes, scholarshipRoutes, resetPassRoutes
│   ├── migrations/            # node-pg-migrate, applied manually (never in CI)
│   ├── schema.sql             # reference snapshot only -- destructive, never run again
│   └── uploads/                # multer's transient disk buffer before Cloudinary
└── client/                    # React 18 SPA (CRA)
    └── src/
        ├── context/            # UserProvider (auth state)
        ├── hooks/              # shared useFetch
        ├── utils/              # getStoredUserInfo (safe localStorage read)
        └── components/{Admin, Apply, LoginRegister, Profile, Navbar, Faqs, middleware}
docs/superpowers/               # design specs + implementation plans (this remediation, future features)
.github/workflows/ci.yml        # builds + syntax-checks on every push/PR
render.yaml                     # Render Blueprint (backend)
Documentation/                  # SRS, black-box/UAT/non-functional PDFs, GUI .side files
Labs/                           # 6 lab PDFs
```

---

## 1. Frontend Architecture

**Stack:** React 18 + React Router v7 + Tailwind CSS (+ Flowbite, Material Tailwind) + react-toastify + `fetch`. CRA (`react-scripts`), no build customization.

**Entry chain:** `index.js` → `BrowserRouter` → `UserProvider` (context) → `App.js` (all `<Routes>`).

**Route table (`src/App.js`):**

| Path | Component | Guard |
|---|---|---|
| `/` | `LoginRegister.jsx` | none |
| `/forgot-password` | `ForgotPassword.jsx` | none |
| `/faqs` | `Faqs.jsx` | none |
| `/student` | `Scholarship.jsx` → `StudentDashboard.jsx` | `StudentRoute` |
| `/student/scholarship` | `ApplyDashboard.jsx` | `StudentRoute` |
| `/student/viewscholarship/:id` | `ViewScholarshipStudent.jsx` | `StudentRoute` |
| `/student/profile` | `Profile.jsx` | `StudentRoute` |
| `/admin` | `Admin.jsx` → `AdminDashboard.jsx` | `PrivateRoute` |
| `/admin/add-scholarship` | `AddScholarship.jsx` | `PrivateRoute` |
| `/admin/viewscholarship/:id` | `ViewScholarship.jsx` | `PrivateRoute` |
| `/admin/edit-scholarship/:id` | `AdminEditScholarship.jsx` | `PrivateRoute` |
| `/admin/list-scholarships` | `ListofScholarship.jsx` | `PrivateRoute` |
| `/scholarships/:id/applicants` | `ViewApplicants.jsx` | `PrivateRoute` |
| `/applicant-details/:id/:sid` | `ApplicantsData.jsx` | `PrivateRoute` |
| `/admin/profile` | `AdminProfile.jsx` | `PrivateRoute` |

**Component call graph:**
- `Scholarship.jsx` = `StudentNavbar` + `StudentDashboard`
- `Admin.jsx` = `AdminNavbar` + `AdminDashboard`
- `Profile.jsx` composes 7 sub-forms (`PersonalDetails`, `CommunicationAddress`, `BankDetails`, `CurrentAcademicDetails`, `Class10Details`, `Class12Details`, `CurrentEducationDetails`), all sharing one `FileUpload.jsx` widget and lifting state up to `Profile.jsx`'s single `formData` object. It also auto-saves a local draft to `localStorage` 2 seconds after typing stops, merged back in on next load (a local safety net, not synced to the server).

**Data-fetching pattern:** one shared `src/hooks/useFetch.js` hook reads the JWT via `getStoredUserInfo()` and adds `Authorization: Bearer`. The API base URL is `process.env.REACT_APP_API_URL`, read once in `UserProvider` — no more hardcoded production URLs scattered through components. There is still no axios client / API service layer; most calls are inline `fetch()`.

---

## 2. Backend Architecture

**Stack:** Express 4.21, `pg` Pool, JWT (`jsonwebtoken`), `bcryptjs`, `multer` + `cloudinary`, `nodemailer` (Gmail SMTP), `cors`, `dotenv`.

**Entry (`server.js`):**
```js
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" })); // env-driven, not hardcoded
app.use(requestLogger);            // logs every request, redacts req.body.password
app.use("/api/user", userRoutes);
app.use("/api/scholarship", scholarshipRoutes);
app.use("/api/passwordreset", resetPassRoute);
app.use(errorHandler);             // catches everything the controllers throw/pass to next()
app.listen(port || 8080);
```
Still no `helmet`, no rate limiting.

**Layering:** Routes → Controllers → `config/db.js` pool. No service/repository layer — controllers contain SQL directly.

---

## 3. Database Connection (`config/db.js`)

```js
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
pool.on("error", (err) => console.error("Unexpected error on idle PostgreSQL client:", err));
pool.connect().then((client) => { console.log("Database is successfully Connected"); client.release(); });
```
Single shared `pg.Pool`, imported by every controller. `pool.on('error')` matters here specifically: node-postgres documents that an error on an otherwise-idle client (e.g. Supabase's pooler dropping a stale connection) is an **uncaught event without this handler — it crashes the whole process**. The startup `.connect()` call now releases its client instead of holding one connection for the process's entire lifetime.

**Production quirk worth knowing:** `DATABASE_URL` points at Supabase's **session pooler** (`...pooler.supabase.com:5432`), not the direct `db.<ref>.supabase.co` host. The direct host resolves to an IPv6-only address, and Render's outbound network doesn't support it — this manifested as `ENETUNREACH` in production until traced to the pooler swap.

**Schema is now migration-managed**, not `schema.sql` (which starts with `DROP SCHEMA ... CASCADE` and would destroy production data if run again). `migrations/1_baseline_schema.sql` is an idempotent (`CREATE ... IF NOT EXISTS`) snapshot of what's already live; every change after it is its own numbered file. Run manually — `npm run migrate up -- --schema osp` — never automatically in CI, since there's no staging environment to catch a bad migration first.

---

## 4. Route Files

**`Routes/userRoutes.js`** (mounted at `/api/user`):

| Route | Auth | Notes |
|---|---|---|
| `POST /register` | public | domain/role validated server-side; role always `"student"` |
| `POST /login` | public | password checked *before* role, so a wrong-role attempt can't fingerprint an email's real role |
| `POST /authRole` | **JWT required** | re-confirms an existing session's role from a verified token (see §8 — this was a critical hole until fixed) |
| `GET /getuserprofile`, `POST /updateuserprofile` | JWT + admin | identity comes from `req.user`, not a client-supplied email |
| `GET /documents/view/:studentEmail/:documentType` | JWT | self-or-admin check in the controller; issues a 15-minute signed Cloudinary URL |
| `GET /getApplicantId`, `GET /getAppliedScholarships` | JWT | identity from `req.user.email`, not a client header |
| `GET /viewscholarship/:id`, `GET /getlistofscholarships`, `GET /getlistforApplyscholarships` | JWT | |
| `POST /applyForScholarship/:id` | JWT | `applicant_id` derived server-side from the token, never trusted from the body |
| `GET /getemail/:email`, `GET /getprofile/:email`, `GET /getpdfurls/:email`, `POST /clearpdf/:email/:id` | JWT | self-or-admin check (`req.user.role === "admin" \|\| req.user.email === email`) |
| `POST /profile` | JWT | same self-or-admin check, keyed on the body's `email` |
| `POST /pdf/:email/:key` | JWT | same check, plus real PDF content validation (see §9) |

**`Routes/scholarshipRoutes.js`** (mounted at `/api/scholarship`) — every route requires `protect`; admin-only ones also require `requireAdmin`: `addScholarship`, `editScholarship/:id`, `deleteScholarship/:id`, `getApplicantData`, `statusUpdate`, `:id/applicants`. `getScholarships` and `:scholarship_id` are shared (any logged-in role).

**`Routes/resetPassRoutes.js`** (mounted at `/api/passwordreset`) — all public, by design: `POST /` (request OTP), `POST /verify`, `POST /setnewpassword`.

**One remaining duplicate worth knowing:** `getScholarship` is reachable at both `GET /api/user/viewscholarship/:id` and `GET /api/scholarship/:id` — same handler, two URLs, harmless today since both just require a valid login, but a naming/maintenance smell (see §16).

---

## 5. Controller Files (`server/controller/`)

| Controller | Exports | Purpose |
|---|---|---|
| `registerUser.js` | `registerUser` | Signup, bcrypt hash, domain check, `RETURNING`-based insert, correct JWT claims |
| `authUser.js` | `authUser`, `authRole` | Login; session re-confirmation (now JWT-gated) |
| `resetPass.js` | `emailSender`, `validateOTP`, `setPassword` | OTP password reset, expiry enforced at both check points |
| `getUserProfile.js` | `getUserProfile`, `updateUserProfile` | Admin's own profile read/rename, identity from JWT |
| `addScholarship.js` / `getScholarships.js` / `getScholarship.js` / `editScholarship.js` / `deleteScholarship.js` | one each | Scholarship CRUD; delete is transactional |
| `scholarshipListings.js` | `getListOfScholarships`, `getApplicantsByScholarshipId` | Student list + admin applicant list (bundled in one file — a naming/organization leftover, see §16) |
| `getApplicantsData.js` | `getApplicantsData` | Full applicant detail (6-table join), admin-only |
| `getApplicantId.js` | `getApplicantId` | Applicant ID lookup, identity from JWT |
| `getAppliedScholarships.js` | `getAppliedScholarships` | Student's applied list (`NATURAL JOIN`, still fragile — see §16) |
| `getListforApplyScholarships.js` | `getListForApplyScholarships` | Simple scholarship list for the apply flow |
| `applyForScholarship.js` | `applyForScholarship` | Server-derives `applicant_id`; validates income/CGPA/education-level/eligible-courses |
| `statusUpdate.js` | `statusUpdate` | State-machine-guarded status transitions + email notification |
| `fetchprofile.js` | `fetchprofile` | 10-table JOIN to reconstruct a student profile, self-or-admin gated |
| `profileUpsert.js` | `handleProfileData` | Transactional multi-table profile upsert (see §9) |
| `uploadpdfs.js` | `handeluploads` | Multer → magic-byte check → Cloudinary → DB, orphan cleanup on replace |
| `handlePdfUrls.js` | `handlePdfUrls` | Read 8 document URLs, self-or-admin gated |
| `handleClearPdf.js` | `handleClearPdf` | Null a document column *and* delete the Cloudinary asset |
| `handleEmail.js` | `handleEmail` | Existence check for an applicant email, self-or-admin gated |
| `viewDocument.js` | `getSecureDocumentUrl` | Generates a 15-minute signed Cloudinary URL; the pattern the other IDOR fixes were modeled on |

---

## 6. Middleware

**`middleware/authMiddleware.js`** (`protect`):
1. Reads `Authorization: Bearer <token>`.
2. `jwt.verify(token, process.env.token_api)`.
3. `SELECT id, username, email, role, pic FROM osp.users WHERE email = $1` — **parameterized**, and explicitly excludes the password column.
4. Attaches the row to `req.user` and calls `next()`. Any authenticated route (student or admin) uses this; admin-only routes additionally chain `requireAdmin`.

**`middleware/adminMiddleware.js`** (`requireAdmin`) — one-liner: `req.user.role === "admin"` or `403`.

**`middleware/logger.js`** / **`middleware/errorMiddleware.js`** — request logging (redacts `password` in logged bodies) and a catch-all error handler that only includes stack traces when `NODE_ENV === "development"`.

**Client (`components/middleware/`)** — `protectRoute.js` (admin) and `studentRoute.js` (student), still near-identical: read `userInfo` from `localStorage`, and unless `roleChecked` is already cached, call `POST /api/user/authRole` with the JWT and check the *returned* role against what the guard expects.

---

## 7. Authentication

**Token:** `jwt.sign({ email, role }, process.env.token_api, { expiresIn: "30d" })`. 30-day expiry, no refresh, no server-side logout (client just clears `localStorage`).

**Password hashing:** `bcryptjs`, 10 salt rounds.

**Registration (`registerUser.js`):** validates fields → domain check → duplicate-email check (parameterized) → hash → `INSERT ... RETURNING id, username, role, email, pic` → signs the token from the *returned row* (`email`, not `id` — this used to be a real bug: the token's `email` claim was set to the new user's numeric ID, so `authMiddleware`'s `WHERE email = $1` lookup would fail on their very first session).

**Login (`authUser.js`):** parameterized lookup → **password checked before role** (previously role was checked first, which let a wrong-role attempt confirm which role an email was registered under before any password was verified) → returns `{role, username, email, pic, token}`.

**Session re-confirmation (`authRole`):** now requires the same `protect` middleware as everything else and reads only `req.user` — never the request body. **Until fixed, this endpoint was a complete authentication bypass:** it took `{email, role}` straight from an unauthenticated POST body and issued a real signed JWT if they matched a DB row, no password involved. Knowing (or guessing) an admin's email — such as the actual seeded `admin1@osp.local` — was enough to obtain a valid admin session. The frontend already sent the real JWT on every call; the fix was making the server actually check it.

**What's still true:** there is no self-service admin registration path (`registerUser.js` hardcodes `role: "student"`) — admin rows are provisioned by direct DB access, outside the app. `protect` grants access to *any* authenticated role; `requireAdmin` is what actually restricts to admins.

---

## 8. PostgreSQL Usage

- **Driver:** `pg` Pool, schema `osp`.
- **~16 tables**, 3NF-normalized: `users`, `scholarships`, `applicants`, `addresses`→`districts`→`states`, `bank_details`→`ifsc_details`, `education_details`→`departments_with_programs`, `class10_details`, `class12_details`, `applied_in`, `received_from`, `applicant_documents`, `forgot_pass`, plus `pgmigrations` (migration tracking).
- Indexed on every foreign key and on `applied_in.status` (see `migrations/1_baseline_schema.sql` for the full list).

**Queries worth being able to draw from memory:**

1. **Profile write (`profileUpsert.js`)** — all 7 dependent-table steps (state, district, address, IFSC, bank, department, education) are now single-round-trip `INSERT ... ON CONFLICT (unique_cols) DO UPDATE ... RETURNING id` upserts (states/districts/departments/education needed new `UNIQUE` constraints added via migration to support this; IFSC/bank were already keyed on their natural primary key). The whole thing runs inside one `BEGIN`/`COMMIT`/`ROLLBACK` transaction on a dedicated `client` from the pool — a partial failure can't leave a half-written profile. This used to be up to 14 sequential queries (2 per step, worst case); it's now 7.
2. **Profile read (`fetchprofile.js`)** — the single largest query: a 10-table `LEFT JOIN` reconstructing the whole profile in one round trip, gated so only the owning student or an admin can call it.
3. **Applicant detail (`getApplicantsData.js`)** — 6-table `LEFT JOIN` keyed by `applicant_id` + `scholarship_id`; admin-only, parameterized.
4. **Document upsert (`uploadpdfs.js`)** — `INSERT INTO applicant_documents (email, ${column}) VALUES ($1,$2) ON CONFLICT (email) DO UPDATE SET ${column}=EXCLUDED.${column}` — `${column}` is always resolved through a fixed whitelist object, never client input directly.
5. **Scholarship list with counts (`getScholarships.js`)** — paginated `LEFT JOIN applied_in ... GROUP BY ... COUNT() ORDER BY applicants_count DESC`; the count query and the data query run in parallel via `Promise.all` rather than sequentially.
6. **Applied list (`getAppliedScholarships.js`)** — still a `NATURAL JOIN` across 4 tables; works today but is fragile (auto-joins on *every* shared column name, so adding a same-named column to any of the 4 tables would silently change the join).
7. **Status update (`statusUpdate.js`)** — a state-machine (`Pending → Under Review → Documents Verified → Accepted/Rejected`) validated server-side before the `UPDATE`; the status-and-notification-details lookup was collapsed from 2 queries into 1 `JOIN`.
8. **Scholarship delete (`deleteScholarship.js`)** — now wrapped in an explicit transaction (`BEGIN`/delete from `applied_in`/delete the scholarship/`COMMIT`, `ROLLBACK` on any failure) — previously two independent `pool.query()` calls, so a failure between them could delete every application for a scholarship while the scholarship row itself survived.

---

## 9. File Upload Flow

**Client (`Profile.jsx` + `FileUpload.jsx`):** `<input type="file" accept="application/pdf">` → `FormData` → `POST /api/user/pdf/:email/:key` with the JWT attached.

**Server (`config/multer.js` + `uploadpdfs.js`):**
1. `multer.diskStorage` writes to an **absolute** `uploads/` path resolved relative to the server file (not the process's working directory), created automatically if missing — filenames sanitized and timestamp-prefixed.
2. The controller checks the requester is the account owner or an admin, then verifies the file actually **starts with the PDF magic bytes** (`%PDF-`) — multer's `fileFilter` alone only checks the client-supplied MIME type, which is trivially spoofed.
3. Uploads to Cloudinary as `resource_type: "image"`, `type: "private"` (inaccessible on the public internet by URL alone).
4. Whatever was previously stored for that document slot is looked up *before* the upload and deleted from Cloudinary *after* a successful replace — previously every re-upload orphaned the old file, a quietly growing storage cost.
5. **Viewing a document** goes through `viewDocument.js`'s `getSecureDocumentUrl`, which generates a 15-minute signed Cloudinary URL rather than exposing a permanent one.
6. **Clearing a document** (`handleClearPdf.js`) nulls the DB column *and* calls `cloudinary.uploader.destroy()` — previously only the DB pointer was cleared, permanently orphaning the file.

---

## 10. Password Reset Flow

1. **Request OTP** — `POST /api/passwordreset/` → verifies the user exists → generates a 6-digit OTP (`Math.random`, not a CSPRNG) → bcrypt-hashes it → upserts into `forgot_pass` → emails it via Nodemailer/Gmail SMTP.
2. **Verify OTP** — `POST /verify` → `bcrypt.compareSync` → **10-minute expiry now enforced here too** (previously commented out, so "verify" could report an expired OTP as valid even though the final step still rejected it).
3. **Set new password** — `POST /setnewpassword` → re-checks OTP + expiry → hashes → `UPDATE users SET password = $1`.

**Known operational gotcha:** Gmail SMTP requires an **App Password** (only issuable once 2-Step Verification is on the sending account) — a stale/regenerated one fails with `535-5.7.8 Username and Password not accepted`, and because it fails inside a `try/catch` around `sendMail`, the OTP row is still written to the DB even though no email goes out; worth checking `forgot_pass` for a recent row when debugging a "nothing happened" report.

**Still true:** no rate limiting on `/verify` or `/setnewpassword` (a 6-digit OTP is 1,000,000 combinations with unlimited guesses inside the 10-minute window), and `Math.random()` isn't cryptographically secure.

---

## 11. Frontend State Management

**Context API only** (`src/context/userProvider.js`): `user` state seeded from `localStorage.getItem("userInfo")` via the shared `getStoredUserInfo()` helper (try/catch-guarded — a corrupted localStorage value used to have a chance to crash whichever component read it first); `baseURL` fixed once from `process.env.REACT_APP_API_URL`.

**Persistence:** `localStorage` keys `userInfo` (`{role, username, email, pic, token}`) and `roleChecked`. Session is purely client-side — no server session store.

---

## 12. Deployment / Configuration

- **Frontend:** Vercel (`osp-silk.vercel.app`), deployed via CLI (`vercel --prod`) — not GitHub-auto-deployed, so a push to `main` alone does **not** update it; you redeploy explicitly.
- **Backend:** Render, provisioned from `render.yaml` (a Blueprint) — auto-deploys on every push to `main`. Free tier: the first request after inactivity takes 30-60s to wake up.
- **Database:** Supabase Postgres, accessed via the **session pooler** connection string (see §3).
- **CI:** GitHub Actions (`.github/workflows/ci.yml`) builds the frontend (`CI=true`, so ESLint warnings fail the build) and syntax-checks every backend file, on every push/PR to `main` — but doesn't gate either deploy; it runs in parallel, informationally.
- **Migrations:** manual only (`npm run migrate up -- --schema osp`), deliberately never automated — no staging environment exists to catch a bad one first.
- **No Docker.**

---

## 13. Environment Variables

| Var | Used by | Notes |
|---|---|---|
| `DATABASE_URL` | `config/db.js` | Supabase **session pooler** string, not the direct host |
| `token_api` | `generateToken.js`, `authMiddleware.js` | JWT signing/verify secret |
| `user` / `pass` | `resetPass.js` | Gmail address + App Password for Nodemailer |
| `PORT` | `server.js` | defaults to 8080 |
| `FRONTEND_URL` | `server.js` | CORS origin; must exactly match the deployed frontend's origin, no trailing slash |
| `NODE_ENV` | `errorMiddleware.js` | `"development"` includes stack traces in error responses |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | `config/cloud.js` | |
| `REACT_APP_API_URL` (client) | `userProvider.js` | backend base URL |

All of the above are documented (names only, no values) in each app's `.env.example`.

---

## 14. Dependencies

**Backend:** `express`, `pg`, `bcryptjs`, `jsonwebtoken`, `cors`, `dotenv`, `multer`, `cloudinary`, `nodemailer`. `nodemon` and `node-pg-migrate` are devDependencies (nodemon used to be a production dependency — harmless but wrong category). Still installed but unused: `multer-storage-cloudinary`, `moment`, `body-parser` (superseded by `express.json()`), `i` (an accidental package from a typo'd `npm i`).

**Frontend:** `react@18`, `react-router-dom@7`, `react-scripts@5`, `tailwindcss@3.4` + `flowbite-react` + `@material-tailwind/react`, `react-toastify`, `react-icons`. Unused: `axios` (only one component ever used it, and no longer does), `react-notifications-component`, `toastify`, `easymde`/`react-simplemde-editor`/`react-markdown` (no markdown editing feature exists in the app).

---

## Request → Controller → DB Flows (walk through these fluently)

### Flow 1 — Login
`LoginRegister.jsx` → `POST /api/user/login` → `authUser.js` → parameterized lookup → password check → role check → JWT issued → client stores it, navigates by role.

### Flow 2 — Admin reviews a student
`ViewApplicants.jsx` → `GET /api/scholarship/:id/applicants` (protect+admin) → `scholarshipListings.getApplicantsByScholarshipId` → `ApplicantsData.jsx` → `GET /api/scholarship/getApplicantData` (protect+admin) → `getApplicantsData` (6-table join) → status change → `PUT /api/scholarship/statusUpdate` (protect+admin) → state-machine-validated `UPDATE`.

### Flow 3 — Student applies
`ViewScholarshipStudent.jsx` → `POST /api/user/applyForScholarship/:id` (JWT) → server derives `applicant_id` from the token → fetches scholarship requirements + applicant profile → validates income/CGPA/education-level/eligible-courses → `INSERT INTO applied_in` → duplicate → Postgres `23505` → "already applied."

### Flow 4 — Profile save
`Profile.jsx` → `POST /api/user/profile` (JWT, self-or-admin gated) → `profileUpsert.handleProfileData` → one transaction: 7 upserts (state → district → address → IFSC → bank → department → education) → upsert into `applicants` → upsert `class10_details`/`class12_details` → `COMMIT` (or `ROLLBACK` on any failure).

### Flow 5 — Document upload
`FileUpload.jsx` → `POST /api/user/pdf/:email/:key` (JWT, self-or-admin gated) → multer disk buffer → magic-byte check → Cloudinary (private) → previous asset (if any) deleted → URL upserted into `applicant_documents`.

### Flow 6 — Password reset
`ForgotPassword.jsx` → request OTP (hashed, stored, emailed) → verify (expiry-checked) → set new password (expiry re-checked, hashed, `UPDATE users`).

---

## 15. What Changed in the Remediation Pass (good "tell me about improving a legacy codebase" material)

This was one continuous pass across a deployed, already-live application with real user data — everything below was verified against the actual production database, not assumed.

**Security (the critical-severity work):**
- Two live SQL-injection points (`authUser.js`, `registerUser.js`) — string-interpolated queries next to correctly parameterized ones in the same file.
- Nine broken-access-control (IDOR) endpoints where any authenticated user could read or modify another user's profile, bank details, or documents by changing an email in the URL — fixed by adding the self-or-admin check `viewDocument.js` already modeled correctly.
- Two endpoints trusting a client-supplied identity header/body instead of the verified JWT (`getApplicantId`, `getAppliedScholarships`, `applyForScholarship`'s `applicant_id`).
- **The most severe finding:** `authRole` was a complete authentication bypass — a public endpoint that minted a valid JWT for *any* `{email, role}` pair with zero password check, discovered while writing this document. Fixed by requiring the same JWT middleware every other route already used.

**Stability:** a leaked startup DB connection, a missing `pool.on('error')` handler (an unhandled version of which crashes the whole Node process on a dropped idle connection), and unbounded connection/idle timeouts.

**Data integrity:** non-atomic scholarship deletion, a commented-out OTP expiry check, and an eligibility-parsing bug verified against live data (14/15 scholarships fine, one legacy row silently disabling the check).

**Performance:** the profile-save path went from up to 14 sequential DB round trips to 7 single-round-trip upserts (backed by new `UNIQUE` constraints, added via a proper migration after checking live data for conflicts first).

**Storage:** orphaned Cloudinary files on every document re-upload/clear, now cleaned up; PDF uploads now checked by actual file content, not just the client-claimed MIME type.

**Naming & hygiene:** consistent file/function naming across both apps (typos, casing, a duplicated `useFetch.jsx`, two same-named `Navbar.jsx` files), all with zero changes to the actual API contract.

**Infrastructure added from nothing:** git version control (the project was an un-versioned folder), a GitHub repo, Render + Vercel deployment, a CI workflow, and `node-pg-migrate` schema-migration tooling (the schema previously had no safe way to evolve once real data existed).

---

## A. 30-Second Explanation

"OSP is a scholarship application portal — a React SPA on a Node/Express REST API backed by a normalized PostgreSQL database, deployed on Vercel, Render, and Supabase. Students register, fill a profile spanning about ten normalized tables, upload eight required PDFs to Cloudinary, and apply for scholarships; admins manage scholarships and review applications. Auth is JWT-based with role checks enforced server-side. I recently took it from a barely-secured course project — SQL injection, a complete auth bypass, broken access control on most student endpoints — through a full remediation pass, added CI and migration tooling, and got it properly deployed."

## B. 2-Minute Explanation

"The frontend is a React 18 SPA with role-specific dashboards (admin vs. student), auth state in a Context provider backed by localStorage. The backend is an Express REST API — three route modules, about twenty-five controllers, all sharing one `pg` connection pool — over a ~16-table 3NF Postgres schema under an `osp` schema.

The most interesting engineering is the profile subsystem: saving a student profile touches seven dependent tables (address, bank, education, etc.) before writing the applicant row itself, all inside one transaction, and each dependent-table write is a single `ON CONFLICT ... RETURNING` upsert rather than a check-then-insert round trip. Reading it back is a ten-table join. Document uploads go through multer to a private Cloudinary account, with the actual file content verified server-side, not just the claimed MIME type, and viewing a document issues a short-lived signed URL rather than a permanent one.

I did a full remediation pass on this: fixed two live SQL-injection points, closed nine IDOR endpoints, and found and fixed a complete authentication bypass in the session-refresh endpoint — it would mint a valid admin JWT for anyone who knew an admin's email, no password required. I also fixed the connection-pool config (a missing error handler that would crash the process on a dropped connection), added proper migration tooling since the schema previously had a destructive-only setup script, cut the profile-save query count roughly in half, and set up CI/CD from scratch. It's honest work on a real production app with real users, not a green-field toy."

## C. Architecture Deep-Dive

**Presentation tier:** CRA React 18. `index.js` mounts `BrowserRouter > UserProvider > App`. `App.js` declares the route table in §1, wrapping admin pages in `PrivateRoute` and student pages in `StudentRoute` — both re-confirm the role server-side via `authRole` (now JWT-gated) unless already cached this session. Pages split into `components/Admin`, `components/Apply`, `components/Profile` (the 7-section form), and shared `Navbar` variants. State is one Context (`user`, `setUser`, `baseURL`) plus localStorage, read through a single safe helper.

**Application tier:** Express 4. `server.js` wires JSON parsing, env-driven CORS, a request logger, three routers, and a catch-all error handler. Controllers are a flat function-per-file convention; no service/repository layer. The only auth middleware, `protect`, verifies the JWT and re-fetches the user from the DB on every request (so a role change takes effect immediately, not just at next login); `requireAdmin` layers on top for admin-only routes.

**Data tier:** PostgreSQL, `osp` schema, managed via `node-pg-migrate`. Roughly 16 tables: users, scholarships, applicants, normalized location/bank/education dimension tables, class-10/12 detail tables, `applied_in` (the application junction table), `applicant_documents` (8 Cloudinary public-ID columns keyed by email), `forgot_pass` (OTPs), and `pgmigrations` (migration tracking). Writes lean on `INSERT ... ON CONFLICT DO UPDATE` upserts; reads lean on multi-table `LEFT JOIN`s (up to 10 tables).

**Cross-cutting:** auth = bcrypt(10) + 30-day JWTs, role re-verified server-side on every protected request; files = multer → magic-byte check → private Cloudinary → signed-URL viewing; password reset = 6-digit OTP, bcrypt-hashed, emailed via Nodemailer, 10-minute expiry enforced at both check points; deployment = Vercel (manual `vercel --prod`) + Render (auto-deploy) + Supabase, fronted by a CI workflow that verifies builds but doesn't gate either deploy.

## D. Likely Interview Questions

1. **"Walk me through an admin changing a student's application status."** → `ApplicantsData.jsx` → `PUT /api/scholarship/statusUpdate` (protect+admin) → state-machine validation → `UPDATE applied_in`.
2. **"Tell me about a security issue you found and fixed."** → Lead with `authRole`: public endpoint, no password check, minted valid admin JWTs for a guessed email. Explain the fix (require `protect`, trust only `req.user`) and how you verified it (forged request before/after, against the live DB).
3. **"How is the profile saved, and what did you improve about it?"** → transactional upsert chain, cut from up to 14 round trips to 7, backed by new `UNIQUE` constraints added via a checked-against-live-data migration.
4. **"How does file upload work end-to-end, and what's actually secure about it?"** → multer → magic-byte content check (not just MIME type) → private Cloudinary → signed 15-minute URLs for viewing, not permanent public links.
5. **"How does the OTP password reset work, and what's still weak about it?"** → hashed OTP, expiry enforced at both steps now; still no rate limiting, still `Math.random()` not a CSPRNG.
6. **"How is authentication implemented?"** → bcrypt + 30-day JWT with `{email, role}`; `protect` re-queries the DB on every request rather than trusting stale claims.
7. **"What happens if a student applies twice?"** → Postgres unique-constraint violation (`23505`), surfaced as "already applied."
8. **"Why is `getAppliedScholarships` still using `NATURAL JOIN`, and what's the risk?"** → works today, but auto-joins on every shared column name across 4 tables — a future same-named column anywhere in that join would silently change behavior. Would replace with explicit `ON` clauses given more time.
9. **"How do you prevent one student from seeing another's data now?"** → self-or-admin check on every profile/document endpoint, matching the pattern `viewDocument.js` already used correctly; explain what it looked like before (email-in-URL, no check at all).
10. **"How would you further harden this?"** → rate limiting on login/OTP endpoints, a CSPRNG for OTP generation, splitting `scholarshipListings.js`'s two bundled handlers, replacing the `NATURAL JOIN`, wiring CI as an actual deploy gate instead of an informational check.
11. **"Why migrate to `node-pg-migrate` instead of just editing `schema.sql`?"** → `schema.sql` starts with `DROP SCHEMA ... CASCADE` — safe once, destructive forever after real data exists. Migrations are additive, tracked, and re-runnable.
12. **"Why keep migrations out of CI?"** → no staging environment to catch a bad migration before it touches the only database that exists — a deliberate, discussable trade-off, not an oversight.
13. **"What's the CORS setup, and what went wrong with it during deployment?"** → env-driven `FRONTEND_URL`; a stale/trailing-slash mismatch after a Vercel redeploy caused a real CORS outage, fixed by exactly matching the live origin.
14. **"How is the app deployed, and what's the split between auto and manual?"** → Render auto-deploys on push (Blueprint-based); Vercel is CLI-deployed and does *not* auto-update on push — a distinction worth knowing cold.
15. **"What would you add a test suite around first?"** → the auth flows (login, `authRole`, registration) and the profile-upsert transaction, since those are the highest-consequence and highest-complexity paths with zero coverage today.

## E. Parts to Know Deeply

- **Auth** (`authUser.js`, `registerUser.js`, `authMiddleware.js`, `generateToken.js`) — especially the `authRole` bypass and its fix; this is the single most likely deep-dive.
- **Profile subsystem** (`profileUpsert.js`, `fetchprofile.js`) — the transactional upsert chain and the 10-table read join.
- **The IDOR remediation** — what the self-or-admin pattern looks like, where it's applied, and why `viewDocument.js` was the reference implementation.
- **File upload** (`multer.js`, `uploadpdfs.js`, `handleClearPdf.js`, `viewDocument.js`) — the full pipeline including the magic-byte check and orphan cleanup.
- **The migration setup** — why it exists, how the baseline was made idempotent, how a new migration gets checked against live data before applying.
- **Route wiring** (`server.js`, all three route files) — which endpoints require what, and the one remaining duplicate (`getScholarship`).

## F. Parts You Can Describe at a High Level

- Styling/UI polish, animation classes, Tailwind config.
- The 7 profile sub-form components — know the shape (controlled inputs + validation callbacks + `FileUpload`), not every field.
- `Faqs.jsx` — static content.
- The Selenium `.side` GUI tests and UAT/black-box PDFs under `Documentation/` — summarize as "Selenium IDE GUI tests plus manual UAT for the course," and be ready to say plainly that there's still no automated test suite wired into the app.

One honest framing: since this started as a group project, lead with what you personally hardened and can defend in depth — auth, the profile write path, the document pipeline, the migration setup — and say plainly where you're describing a teammate's original work at a high level. Interviewers reward that distinction.
