# OSP — Online Scholarship Portal: Technical Map

**What it is:** A full-stack scholarship application portal built for a database-systems course at DA-IICT by a 9-person team. Students register, build a detailed profile (10+ normalized tables), upload 8 required PDF documents, browse scholarships, apply, and track application status. Admins CRUD scholarships, review applicants, and update application statuses.

**Physical layout:**
```
OSP/
├── server/                 # Node/Express backend
│   ├── server.js           # entry point
│   ├── config/             # db pool, JWT, multer
│   ├── controller/         # 25 controllers
│   ├── middleware/         # admin auth guard
│   ├── Routes/             # 3 route modules
│   └── uploads/            # multer disk temp
└── client/            # React 18 SPA
    └── src/context, components/{Admin, Apply, LoginRegister, Profile, Navbar, Faqs, middleware}
Documentation/              # SRS, black-box/UAT/non-functional PDFs, GUI .side files, unit tests
Labs/                       # 6 lab PDFs
```

---

## 1. Frontend Architecture

**Stack:** React 18 + React Router v6 + Tailwind CSS (with Flowbite & Material Tailwind) + react-toastify + fetch/axios. CRA (`react-scripts`), no build customization.

**Entry chain:** `index.js` → `BrowserRouter` → `UserProvider` (context) → `App.js` (all `<Routes>`).

**Route table (`src/App.js`):**

| Path | Component | Guard |
|---|---|---|
| `/` | `LoginRegister.jsx` | none |
| `/forgot-password` | `ForgotPassword.jsx` | none |
| `/faqs` | `faqs.jsx` | none |
| `/student` | `Scholarship.jsx` → `StudentDashboard.jsx` | `StudentRoute` |
| `/student/scholarship` | `Apply_Dashboard.jsx` | `StudentRoute` |
| `/student/viewscholarship/:id` | `viewScholarshipStudent.jsx` | `StudentRoute` |
| `/student/profile` | `Profile.jsx` | `StudentRoute` |
| `/admin` | `Admin.jsx` → `Admin_Dashboard.jsx` | `PrivateRoute` |
| `/admin/add-scholarship` | `AddScholarship.jsx` | `PrivateRoute` |
| `/admin/viewscholarship/:id` | `viewScholarship.jsx` | `PrivateRoute` |
| `/admin/edit-scholarship/:id` | `editScholarship.jsx` | `PrivateRoute` |
| `/admin/list-scholarships` | `ListofScholarship.jsx` | `PrivateRoute` |
| `/scholarships/:id/applicants` | `viewapplicants.jsx` | `PrivateRoute` |
| `/applicant-details/:id/:sid` | `ApplicantsData.jsx` | `PrivateRoute` |
| `/admin/profile` | `AdminProfile.jsx` | `PrivateRoute` |

**Component call graph:**
- `Scholarship.jsx` = Navbar + `StudentDashboard`
- `Admin.jsx` = NavbarAdmin + `Admin_Dashboard`
- `Profile.jsx` composes 7 sub-forms: `PersonalDetails`, `CommunicationAddress`, `BankDetails`, `CurrentAcademicDetails`, `Class10Details`, `Class12Details`, `CurrentEducationDetails`, all sharing one `FileUpload.jsx` widget and lifting state up to `Profile.jsx`.

**Data-fetching pattern:** a hand-rolled `useFetch.js` hook (copied twice, identical, in `Admin/` and `Apply/`) reads the JWT from localStorage and adds `Authorization: Bearer`. But most components bypass it and call `fetch()` directly with hardcoded URLs (`https://group7-osp.onrender.com/...`). There is no axios client config, no API service layer — API calls are scattered inline.

---

## 2. Backend Architecture

**Stack:** Express 4.21, `pg` Pool, JWT (`jsonwebtoken`), `bcryptjs`, `multer` + `cloudinary`, `nodemailer` (Gmail SMTP), `cors`, `dotenv`.

**Entry (`server.js`):**
```js
app.use(express.json());
app.use(cors({ origin: "https://group7-osp.vercel.app" }));  // locked to prod frontend
app.use("/api/user", userRoutes);
app.use("/api/scholarship", scholarshipRoutes);
app.use("/api/passwordreset", resetPassRoute);
app.listen(port || 8080)
```
No `helmet`, no rate limiting, no error-handling middleware, no request logging beyond `console.log`.

**Layering:** Routes → Controllers → `config/db.js` pool. Middleware (`protect`) only on the scholarship route module. The `user` routes are almost entirely unprotected (see §7).

---

## 3. Database Connection (`config/db.js`)

```js
const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,          // required for Render-managed Postgres
});
```
- A single shared `pg.Pool` singleton; every controller imports it. One connection pool, no `searchPath` set (all SQL hardcodes the `osp.` schema prefix).
- A `.connect()` is fired at import time just to log "Database is successfully Connected" — a wasted connection but harmless.
- The file still contains a commented-out block of hardcoded college-VPN credentials (`10.100.71.21`, user/password) — should not be in a shared repo.
- **No connection pooling config, no idle timeout tuning, no `pool.on('error')` handler** — if the DB drops the connection, the process has no recovery path.

---

## 4. Route Files

**`Routes/userRoutes.js`** (mounted at `/api/user`) — largely **no auth middleware**. Maps:
- `POST /register` → `registerUser`
- `POST /login` → `authUser`
- `POST /authRole` → `authRole`
- `GET /getuserprofile` → `getUserProfile` (query param email)
- `POST /updateuserprofile` → `updateUserProfile`
- `GET /viewscholarship/:scholarship_id` → `getScholarship`
- `GET /getlistofscholarships` → `getListOfScholarships`
- `GET /getlistforApplyscholarships` → `getListforApplyscholarships`
- `POST /applyForScholarship/:scholarship_id` → `applyForScholarship`
- `GET /getAppliedScholarships` → `getAppliedScholarships` (email from **header**)
- `GET /getApplicantId` → `getApplicantId` (email from **header**)
- `GET /getemail/:email`, `GET /getprofile/:email`, `GET /getpdfurls/:email`, `POST /profile`, `POST /clearpdf/:email/:id`, `POST /pdf/:email/:key` (with `upload.single("file")`)

**`Routes/scholarshipRoutes.js`** (mounted at `/api/scholarship`) — **all protected** by `protect`:
- `POST /addScholarship`, `GET /getScholarships`, `GET /:scholarship_id`, `PUT /editScholarship/:scholarship_id`, `DELETE /deleteScholarship/:scholarship_id`
- `GET /getApplicantData`, `PUT /statusUpdate`
- **Exception:** `GET /:id/applicants` → `getApplicantsByScholarshipId` has **no** `protect` (line 35).

**`Routes/resetPassRoute.js`** (mounted at `/api/passwordreset`):
- `POST /` → `emailSender`, `POST /verify` → `validateOTP`, `POST /setnewpassword` → `setPassword`. All public.

Note the duplicated controller imports across route files (e.g., `getScholarship` imported in both `userRoutes.js` and `scholarshipRoutes.js`) — the same handler is reachable under two URLs with different auth levels. That's an accidental **privilege inconsistency**: `GET /api/user/viewscholarship/:id` is public while `GET /api/scholarship/:id` is admin-only.

---

## 5. Controller Files (all in `server/controller/`)

| Controller | Function | Purpose |
|---|---|---|
| `registerUser.js` | `registerUser` | Signup, bcrypt hash, default role `student`, returns JWT |
| `authUser.js` | `authUser`, `authRole` | Login; role re-verification used by frontend guards |
| `resetPass.js` | `emailSender`, `validateOTP`, `setPassword` | OTP password reset |
| `getUserProfile.js` | `getUserProfile`, `updateUserProfile` | Admin profile read/rename |
| `addScholarship.js` | `addScholarship` | Insert scholarship |
| `getScholarships.js` | `getScholarships` | List with applicant counts |
| `getScholarship.js` | `getScholarship` | Detail by id |
| `editScholarship.js` | `editScholarship` | Update scholarship |
| `deleteScholarship.js` | `deleteScholarship` | Manual cascade delete |
| `ApplicantController.js` | `getListOfScholarships`, `getApplicantsByScholarshipId` | Student list + admin applicant list |
| `getApplicantsData.js` | `getApplicantData` | Full applicant detail (6-table join) |
| `getApplicantId.js` | `getApplicantId` | Lookup applicant_id by email header |
| `getAppliedScholarships.js` | `getAppliedScholarships` | Student's applied list (NATURAL JOIN) |
| `getListforApplyScholarships.js` | `getListforApplyScholarships` | Simple scholarship list |
| `applyForScholarship.js` | `applyForScholarship` | Insert into `applied_in` |
| `statusUpdate.js` | `statusUpdate` | Update application status |
| `fetchprofile.js` | `fetchprofile` | 10-table JOIN to reconstruct student profile |
| `userprofile.js` | `handelprofiledata` | Massive multi-upsert profile save |
| `uploadpdfs.js` | `handeluploads` | Multer→Cloudinary→DB document upload |
| `handelpdfurls.js` | `handelpdfurls` | Read 8 document URLs |
| `handelclearpdf.js` | `handelclearpdf` | Null-out a document column |
| `handelemail.js` | `handelemail` | Does an applicant row exist for email |
| `cloud.js` | `cloudinary` | **Dead code** — unused second Cloudinary config with hardcoded secrets |

---

## 6. Middleware

**Server (`middleware/authMiddleware.js`)** — the only middleware, `protect`:
1. Reads `Authorization: Bearer <token>`.
2. `jwt.verify(token, process.env.token_api)`.
3. Runs `SELECT * FROM osp.users WHERE email = '${decoded.email}'` — **string-interpolated** (SQLi surface).
4. Grants access **only if** `req.user.role === "admin"` (so `protect` = *admin-only*; there is no student variant on the server).

**Client (`components/middleware/`)** — `protectRoute.js` (admin) and `studentRoute.js` (student) are **near-identical copies**. Both:
- Read `userInfo` from localStorage; if absent → redirect `/`.
- If the `roleChecked` localStorage flag isn't set, call `POST /api/user/authRole` with `{email, role}` from localStorage and the JWT in the header, set `roleChecked=true` on success, else clear storage and redirect.

**Critical flaw:** the server `authRole` controller **ignores the JWT entirely** — it only does `SELECT * FROM osp.users WHERE email='${body.email}'` and checks whether the body `role` equals the DB role. It then issues a fresh signed JWT. So route protection fundamentally reduces to "does the attacker know an admin's email and guess `role:"admin"`." Combined with the "no admin registration anywhere in the app" fact (admins must be seeded manually in SQL), this is a real auth design weakness.

---

## 7. Authentication

**Token:** `jwt.sign({ email, role }, process.env.token_api, { expiresIn: "30d" })` (`config/generateToken.js`). 30-day expiry, no refresh, no logout/blacklist server-side (logout just deletes localStorage).

**Password hashing:** `bcryptjs` with salt rounds = 10.

**Registration (`registerUser.js`):** validates fields → checks duplicate email (`SELECT ... WHERE email=$1` parameterized) → hashes → `INSERT INTO osp.users (username, email, password, role) VALUES ($1,$2,$3,$4)` with role hardcoded `"student"` → then re-selects the user **by username using string interpolation** (`WHERE username='${username}'`) and returns a token.

> **Bug (token payload):** `registerUser.js:56` signs `generateToken({ email: user.rows[0].id, role })` — the "email" claim is actually the numeric user `id`. The `authMiddleware` then does `WHERE email = '${decoded.email}'` (id vs email) → the token from *registration* is unusable against `protect`. In practice the client discards it (forces re-login after signup), so it's latent, but it's a genuine contract bug.

**Login (`authUser.js`):** interpolated `SELECT * FROM osp.users WHERE email='${email}'` → verifies requested `role` matches DB row → `bcrypt.compare`. Returns `{role, username, email, pic, token}`.

**Role checks:** every protected admin endpoint is gated by `protect`. The entire student API surface is ungated.

---

## 8. PostgreSQL Usage

- **Driver:** `pg` Pool, schema `osp.`.
- **~15 tables** (documented in `OSP_Documentation.md` §4): `users`, `Scholarships`, `applicants`, `addresses`, `districts`, `states`, `Bank_Details`, `IFSC_Details`, `Education_Details`, `Departments_with_Programs`, `class10_details`, `class12_details`, `Applied_in`, `applicant_documents`, `forgot_pass`.
- **Normalized to ~3NF:** addresses→districts→states, bank→IFSC, education→departments, applicants referencing all of them.

**Notable SQL worth memorizing:**

1. **Applicant detail join** (`getApplicantsData.js:10-63`) — 6-table LEFT JOIN (applicants → addresses → districts → education_details → applied_in → applicant_documents) keyed by applicant_id + scholarship_id. This is the "admin sees everything about a student" query.

2. **Profile reconstruction** (`fetchprofile.js:8-71`) — the single largest query: 10-table JOIN (applicants, users, addresses, districts, states, Bank_Details, IFSC_Details, Education_Details, Departments_with_Programs, class10, class12).

3. **Profile write** (`userprofile.js`) — *insert-or-select* pattern per entity (states → districts → addresses → IFSC → bank → dept → education), then `INSERT INTO osp.applicants ... ON CONFLICT (email) DO UPDATE SET ... RETURNING applicant_id`, then same upsert pattern for class10/class12.

4. **Document upsert** (`uploadpdfs.js:67-72`) — `INSERT INTO osp.applicant_documents (email, ${column}) VALUES ($1,$2) ON CONFLICT (email) DO UPDATE SET ${column} = EXCLUDED.${column}`.

5. **Scholarship list with counts** (`getScholarships.js:8-24`) — `LEFT JOIN applied_in ... GROUP BY ... COUNT(applicant_id) ORDER BY applicants_count DESC`.

6. **Applied list** (`getAppliedScholarships.js:8-26`) — `NATURAL JOIN` across 4 tables filtered by `u.email = $1`. NATURAL JOIN auto-joins on every shared column name, which is fragile.

7. **Status update** (`statusUpdate.js:13-16`) — simple `UPDATE osp.applied_in SET status = $1 WHERE applicant_id = $2 AND scholarship_id = $3`.

8. **Manual cascade delete** (`deleteScholarship.js:19-22`) — delete `applied_in` rows first, then the scholarship (no FK `ON DELETE CASCADE` relied on).

---

## 9. File Upload Flow

**Client (`Profile.jsx` `handlePdfUpload` + `FileUpload.jsx`):**
1. `<input type="file" accept="application/pdf">` → `new FormData().append("file", file)`.
2. `POST /api/user/pdf/${email}/${key}` with the raw FormData, **no auth header**.
3. On success, stores the returned `cloudinaryUrl` into local state (`cloudinaryUrls`).

**Server (`config/multer.js` + `controller/uploadpdfs.js`):**
1. `multer.diskStorage` writes to `uploads/` with filename `` `${Date.now()}-${file.originalname}` `` — **no file type filter, no size limit, no filename sanitization**.
2. `uploadOnCloudinary` uploads the local path with `resource_type: "raw"`, then `fs.unlinkSync(localFilePath)`.
3. Maps the URL-param `key` → DB column via a whitelist object (good — prevents column-injection).
4. Upserts the Cloudinary URL into `applicant_documents`.
5. **Clear flow:** `POST /clearpdf/:email/:id` → `UPDATE ... SET column = null`.

**Why two Cloudinary configs exist:** `uploadpdfs.js` configures account `ospproject7` (used); `cloud.js` configures a *different* account `dx5gwfetc` and is never imported — leftover/dead code with secrets hardcoded in both.

---

## 10. Password Reset Flow

1. **Request OTP** — `ForgotPassword.jsx` → `POST /api/passwordreset/` `{email}` → `emailSender`: verifies user exists → `generateOTP()` (6-digit `Math.random`) → bcrypt-hashes OTP → upsert into `forgot_pass (email, otp, created_at)` → sends styled HTML email via Nodemailer Gmail SMTP.
2. **Verify OTP** — `POST /api/passwordreset/verify` `{email, otp}` → `validateOTP`: fetches hashed OTP + `created_at`, `bcrypt.compareSync`. **The 10-minute expiry check is commented out here** (`resetPass.js:104-107`) — only enforced in step 3.
3. **Set new password** — `POST /api/passwordreset/setnewpassword` `{email, otp, newPassword}` → `setPassword`: re-checks OTP + **10-min expiry** (`timeDifference > 600000`), hashes the new password, `UPDATE osp.users SET password = $1 WHERE email = $2`.

**Weaknesses:** no rate limiting/lockout on `/verify` or `/setnewpassword` (6-digit OTP = 1M combos, unlimited guesses for 10 minutes), no token/session invalidation after reset, and `Math.random()` for OTP generation (not CSPRNG).

---

## 11. Frontend State Management

**Context API only** (`src/context/userProvider.js`):
- `user` state initialized from `localStorage.getItem("userInfo")`.
- `baseURL` state = `"https://group7-osp.onrender.com"` (overrides the context's value in many components).
- `setUser` exposed; `useContextState()` hook used throughout.

**Persistence:** `localStorage` keys `userInfo` (JSON: `{role, username, email, pic, token}`) and `roleChecked` (bool). Session is a *client-side* concept; there's no server session. The `roleChecked` flag exists solely to avoid re-hitting `authRole` on every route change — but it's set to `"true"` after *login* too, so guards rarely re-verify.

**Component-level state:** `Profile.jsx` holds one giant `formData` object and `cloudinaryUrls`/`pdfFiles` maps, passing setters down to 7 sub-forms. Validation state is 5 booleans threaded down as `setValidationErrorStatus` callbacks.

---

## 12. Deployment / Configuration

- **Frontend:** Vercel → `https://group7-osp.vercel.app` (CRA build). No `vercel.json`, no env handling beyond CRA defaults.
- **Backend:** Render → `https://group7-osp.onrender.com`. Runs `node server.js` (no `start` script in `package.json` — start command is set in Render's dashboard).
- **Database:** cloud PostgreSQL (Render), `ssl: true`, `DATABASE_URL`.
- **CORS** is hardcoded to the Vercel origin (`server.js:18`). Any other origin (including localhost dev) is blocked — you must edit and redeploy to develop locally.
- **No Docker, no CI, no `.env.example`, no migration/seeding scripts** — the schema presumably lives in a lab PDF (see `Labs/`).
- **README inconsistency worth knowing:** `README.md:154-157` claims *"Backend on AWS EC2, Database MongoDB on Atlas"* — this is stale/wrong; the actual stack is Render + Vercel + **PostgreSQL** (`OSP_Documentation.md` is the accurate source).

---

## 13. Environment Variables

| Var | Used by | Notes |
|---|---|---|
| `DATABASE_URL` | `config/db.js` | pg connection string, `ssl:true` |
| `token_api` | `generateToken.js`, `authMiddleware.js` | JWT signing/verify secret |
| `user` / `pass` | `resetPass.js` | Gmail SMTP app-password for Nodemailer |
| `PORT` | `server.js` | defaults to 8080 |

**Not env vars (hardcoded secrets — should be flagged):** Cloudinary `cloud_name/api_key/api_secret` in `uploadpdfs.js:7-9` and `cloud.js:5-7`; commented DB credentials in `db.js:8-13`.

---

## 14. Important Dependencies

**Backend (`server/package.json`):** `express`, `pg`, `bcryptjs`, `jsonwebtoken`, `cors`, `dotenv`, `multer`, `cloudinary`, `nodemailer`, `nodemon`. **Installed but unused:** `multer-storage-cloudinary` (uploads do manual `cloudinary.uploader.upload`), `moment`, `body-parser` (uses `express.json()`), `i` (the accidental npm package from running `npm i`). No `scripts` block at all.

**Frontend (`client/package.json`):** `react@18`, `react-router-dom@6`, `react-scripts@5`, `tailwindcss@3.4` + `flowbite-react` + `@material-tailwind/react`, `react-toastify`, `axios` (only used in `AdminProfile.jsx`), `react-icons`, `react-notifications-component` (unused), `toastify` (unused). No lint/typecheck scripts beyond CRA defaults.

---

## Request → Controller → DB Flows (the 6 you must be able to walk through)

### Flow 1 — Login
`LoginRegister.jsx handleLoginSubmit` → `POST /api/user/login` → `authUser.js` → `SELECT * FROM osp.users WHERE email='...'` → role-match check → `bcrypt.compare` → returns JWT → client stores in localStorage, sets `roleChecked=true`, navigates by role.

### Flow 2 — Admin reviews a student
`viewapplicants.jsx` → `GET /api/scholarship/:id/applicants` (no protect) → `ApplicantController.getApplicantsByScholarshipId` (INNER JOIN 3 tables) → `ApplicantsData.jsx` → `GET /api/scholarship/getApplicantData?id=&scholarship_id=` (protect) → `getApplicantsData` (6-table LEFT JOIN) → admin changes status → `PUT /api/scholarship/statusUpdate` (protect) → `UPDATE applied_in SET status=$1 WHERE applicant_id=$2 AND scholarship_id=$3`.

### Flow 3 — Student applies
`viewScholarshipStudent.jsx handleApply` → (client-side completeness check: profile saved + all 8 docs present) → `GET /api/user/getApplicantId` (email in header) → `SELECT applicant_id FROM osp.applicants WHERE email=$1` → `POST /api/user/applyForScholarship/:id` `{scholarship_id, applicant_id, applied_date, status:"Pending"}` → `INSERT INTO osp.applied_in (...) VALUES (...)` → duplicate → DB `23505` → client shows "already applied."

### Flow 4 — Profile save (biggest write path)
`Profile.jsx handleSave` → `POST /api/user/profile` (no auth) → `userprofile.js handelprofiledata` → for each of states/districts/addresses/IFSC/bank/dept/education: `SELECT` then conditional `INSERT ... RETURNING id` → `INSERT INTO osp.applicants ... ON CONFLICT (email) DO UPDATE ...` → same upsert for `class10_details`/`class12_details`.

### Flow 5 — Document upload
`FileUpload.jsx` → FormData → `POST /api/user/pdf/:email/:key` → `multer` disk → `cloudinary.uploader.upload(resource_type:'raw')` → `fs.unlinkSync` → `INSERT ... ON CONFLICT (email) DO UPDATE` into `applicant_documents`.

### Flow 6 — Password reset
`ForgotPassword.jsx` → `POST /api/passwordreset/` → OTP gen/hash/store/send → `POST /verify` → bcrypt compare → `POST /setnewpassword` → expiry check + hash + `UPDATE osp.users SET password`.

---

## Bugs / Issues Inventory (the most important part for interviews)

### Security (critical)
1. **SQL injection via string interpolation** in `authUser.js:9,58`, `registerUser.js:47`, `getScholarship.js:7`, `deleteScholarship.js:19,22`, `getApplicantsData.js:61-62`, `authMiddleware.js:21`. Many queries *are* parameterized, but these aren't.
2. **Hardcoded secrets:** Cloudinary keys/secrets in `uploadpdfs.js` + `cloud.js`, DB creds in `db.js` comments.
3. **`authRole` ignores the JWT** — trusts body `email`+`role`; role-based access effectively depends on knowing an admin email. (`authUser.js:49-94`)
4. **Whole student API is unauthenticated** — `applyForScholarship`, `getAppliedScholarships`, `getApplicantId`, `fetchprofile`, `handelpdfurls`, `clearpdf`, `pdf` all key off email in URL params or headers → **IDOR**: any user can read/overwrite any other student's profile and documents, or apply on their behalf.
5. **No rate limiting anywhere** (login brute force, OTP brute force), no account lockout.
6. **CAPTCHA is client-side only** (`generateCaptcha` in `LoginRegister.jsx`) — cosmetic.
7. **No file-type/size validation** on upload (`multer.js`) — the `accept="application/pdf"` is client-only.
8. **`protect` middleware only admits admins** — there's no server-side student guard at all.
9. **Public exposure** of applicant names/statuses via `GET /api/scholarship/:id/applicants` (unprotected).
10. **Token `email` claim bug** in `registerUser.js:56` (signs user id as email).

### Correctness bugs
11. **Profile pre-fill broken (~20 fields):** backend `fetchprofile.js` returns camelCase keys (`mobileNumber`, `parentMobile`, `bankAccount`, `ifscCode`, `courseLevel`, `courseName`, `tuitionFees`, `class10Institute`, …) but `Profile.jsx:169-197` reads all-lowercase versions (`mobilenumber`, `parentmobile`, `bankaccount`, `ifsccode`, `tuitionfees`, …) → those fields come back empty on load.
12. **`userprofile.js` swallows failures:** outer `catch {}` (line 362) and the inner async IIFE catch returns without sending any HTTP response → client fetch hangs until timeout; no transaction (the `BEGIN` is commented out, line 8) despite ~10 dependent writes → partial writes possible.
13. **`MAX(ai.status)`** in `ApplicantController.js:13` returns lexicographically-highest status, not "latest" — wrong semantics.
14. **NATURAL JOIN** (`getAppliedScholarships.js`) is fragile — silently joins on all shared column names.
15. **OTP expiry check commented out** in `validateOTP` (`resetPass.js:104-107`).
16. **`App.test.js`** is the CRA template test asserting the string "learn react" that doesn't exist → fails if run. The Jest/Mocha tests in `Documentation/Unit_Testing/` are not wired into any package.json and use imports that won't resolve from their location — demo artifacts, effectively non-runnable.
17. **Duplicate `useFetch.jsx`** files (Admin + Apply) — identical copy-paste.
18. **Hardcoded prod URLs** in ~10 components instead of the context `baseURL`; some components use the baseURL, others hardcode — inconsistent, breaks local dev.

### Scalability
19. **No pagination** on any list (scholarships, applicants, applied).
20. **N+1-ish chatty writes** in profile save (15 sequential queries per save; no transaction, no batch).
21. Heavy `COUNT`/`GROUP BY` over `applied_in` with no documented indexes.
22. Single `pg.Pool` with no pool tuning; per-request SQL without caching.
23. Disk-based multer temp files on a serverless/hosted platform — no cleanup on crash.

---

## A. 30-Second Project Explanation

"OSP is a scholarship application portal I built in a 9-person course team. It's a React SPA talking to a Node/Express REST API backed by a normalized PostgreSQL database. Students register, fill a multi-section profile spanning about 10 normalized tables, upload eight required PDFs to Cloudinary, browse and apply for scholarships, and track application status. Admins manage scholarships with full CRUD, review applicant details, and flip application statuses. Auth is JWT-based with role-guarded admin routes, and password resets use email OTPs."

## B. 2-Minute Project Explanation

"OSP is a full-stack scholarship portal. On the frontend, a React 18 app with React Router and Tailwind CSS renders separate admin and student dashboards; auth state lives in a Context provider backed by localStorage. The backend is a classic Express REST API with three route modules — user, scholarship, and password-reset — backed by about twenty-five controller files that all talk to a single `pg` connection pool. The database is PostgreSQL under an `osp` schema with roughly fifteen 3NF tables: users, scholarships, applicants, and supporting tables for addresses, banks/IFSC, education, class-10/12 records, plus junction tables for applications and document storage.

The interesting engineering is in the profile subsystem: saving a student profile requires insert-or-select logic across seven dependent tables followed by upserts into applicants and class-10/12 tables, while reading it back needs a ten-table join. Document uploads go through multer to local disk, then to Cloudinary, with URLs upserted into a per-email documents table. Admins are authorized by a JWT middleware that re-checks the role in the database; students get a lighter client-side guard. Applications are insertions into an `applied_in` table, with duplicates prevented by a database unique constraint. Deployment is Vercel for the frontend, Render for the API, and managed Postgres. It was a course project, so it has real gaps — scattered SQL injection spots, hardcoded cloud secrets, and no rate limiting — which I can talk through honestly."

## C. Complete Architecture Explanation

The system is a three-tier web app.

**Presentation tier** (`client/`): CRA React 18 SPA. `index.js` mounts `BrowserRouter > UserProvider > App`. `App.js` declares 15 routes, wrapping admin pages in `PrivateRoute` and student pages in `StudentRoute`. Guards read `userInfo` from localStorage and call `POST /api/user/authRole` to re-confirm the role. Pages are split into `components/Admin` (dashboard, scholarship CRUD, applicant review), `components/Apply` (browse/apply), `components/Profile` (the 7-section form + file uploads), and shared `Navbar`. State is a single React Context (`user`, `setUser`, `baseURL`) plus localStorage. Data fetching is inline `fetch` calls (with one shared `useFetch` hook), URLs hardcoded to `https://group7-osp.onrender.com`.

**Application tier** (`server/`): Express 4. `server.js` registers JSON body parsing, CORS locked to the Vercel origin, and three routers. Controllers follow a flat function-per-file convention, each importing the shared `pg` pool. Two mid-tier helpers exist: `config/generateToken.js` (JWT) and `config/multer.js` (disk upload). The only middleware, `protect`, is admin-only and used exclusively on `/api/scholarship`. There is no service/repository layer — controllers contain SQL directly.

**Data tier**: PostgreSQL, `osp` schema. The pool (`config/db.js`) uses `connectionString` + `ssl:true`. Schema is documented in `OSP_Documentation.md` and includes users, scholarships, applicants, normalized location/bank/education dimension tables, class-10/12 detail tables, the `applied_in` junction table, `applicant_documents` (8 Cloudinary URL columns keyed by email), and `forgot_pass` for OTPs. Writes lean on `INSERT ... ON CONFLICT DO UPDATE` upserts; reads lean on multi-table `LEFT JOIN`s (up to 10 tables).

**Cross-cutting flows**: auth = bcrypt(10) hashes + 30-day JWTs; files = multer→disk→Cloudinary(raw)→URL-in-DB; password reset = 6-digit OTP, bcrypt-hashed in DB, sent over Gmail SMTP via Nodemailer, verified with a 10-minute window; roles = DB-stored `role` column enforced server-side only for admin, client-side for students.

## D. 20 Likely Interview Questions (specific to this repo)

1. **"Walk me through the request path for an admin changing a student's application status."** → `ApplicantsData.jsx` → `PUT /api/scholarship/statusUpdate` → `protect` middleware → `statusUpdate.js` → `UPDATE applied_in`.
2. **"Where are the SQL injection risks, and which queries are parameterized?"** → cite `authUser.js:9`, `getScholarship.js:7`, `deleteScholarship.js:19/22`, `getApplicantsData.js:61` vs parameterized `registerUser.js:21`, `uploadpdfs.js:77`.
3. **"How is the profile saved, and what's wrong with it?"** → insert-or-select chain, upserts, no transaction, swallowed errors, no response on failure.
4. **"Explain the fetchprofile 10-table JOIN and why it's needed."** → normalization forces it; alternative would be multiple queries or denormalization.
5. **"How does the file upload work end-to-end?"** → multer disk → Cloudinary raw → fs.unlinkSync → upsert URL.
6. **"How does the OTP password reset work, and what are its flaws?"** → hashed OTP, expiry commented out in validateOTP, no rate limiting.
7. **"How is authentication implemented?"** → bcrypt + JWT 30d, role in token, `protect` re-queries DB and requires admin.
8. **"What happens if a student applies twice?"** → DB unique constraint 23505 surfaced to client as "already applied."
9. **"Why did you use NATURAL JOIN in getAppliedScholarships, and what's the risk?"** → auto-join on shared columns is fragile.
10. **"How do you prevent a student from seeing another student's data?"** → honest answer: you mostly can't — email-based routes with no auth = IDOR.
11. **"How would you add a student-level backend guard?"** → new middleware verifying `req.user.role === 'student'` from a decoded token, or role check inside each controller.
12. **"What's the bug in the register token?"** → `email` claim is set to `user.rows[0].id`.
13. **"Explain the authRole endpoint and its security implications."** → ignores token, trusts body email+role.
14. **"How is state managed on the frontend?"** → Context + localStorage, no Redux; why that's sufficient for this app.
15. **"What are the hardcoded secrets and how would you fix them?"** → Cloudinary creds, commented DB creds → move to env vars / secrets manager.
16. **"How would you make the profile save atomic?"** → wrap in `BEGIN`/`COMMIT` with `ROLLBACK` on error, or use a single CTE.
17. **"Where is CORS configured and what's the implication?"** → locked to prod origin; local dev needs an edit.
18. **"How is the app deployed?"** → Vercel + Render + managed Postgres; note README's stale MongoDB/AWS claim.
19. **"What's wrong with MAX(status) in ApplicantController?"** → lexicographic, not chronological.
20. **"What scalability limits do you see?"** → no pagination, 15 sequential writes per profile save, COUNT/GROUP BY without indexes, single pool.

## E. Parts You Must Understand Deeply

- **Auth & middleware** (`authUser.js`, `registerUser.js`, `authMiddleware.js`, `generateToken.js`) — including the token-email bug, the admin-only `protect`, and the `authRole` design flaw. This is the most likely interview focus.
- **Profile subsystem** (`userprofile.js`, `fetchprofile.js`) — the upsert chain, the 10-table join, the missing transaction, the frontend camelCase mismatch bug.
- **The `applyForScholarship` + `getAppliedScholarships` + `getApplicantId` trio** — header-based email, duplicate handling via 23505.
- **File upload** (`multer.js`, `uploadpdfs.js`, `handelpdfurls.js`, `handelclearpdf.js`) — the full multer→Cloudinary→DB pipeline and the key→column whitelist.
- **Password reset** (`resetPass.js`) — OTP lifecycle and its expiry/rate-limit gaps.
- **The database schema** in `OSP_Documentation.md` §4-5 — be ready to draw the ER diagram and explain normalization choices.
- **Route wiring** (`server.js`, all three route files) — which endpoints are protected vs public, and the double-registration of `getScholarship`.

## F. Parts You Can Describe at a High Level (likely not your primary contribution)

- **Styling/UI polish** (`AdminProfile.css`, `Navbar.css`, `index.css`, tailwind config animations, `App.css`, the `animate-pulse-grow` keyframes) — pure presentation, safe to hand-wave.
- **The 7 profile sub-form components** (`PersonalDetails`, `CommunicationAddress`, `BankDetails`, `Class10Details`, `Class12Details`, `CurrentAcademicDetails`, `CurrentEducationDetails`) — know the *shape* (controlled inputs + validation callbacks + `FileUpload`) but not every field.
- **`faqs.jsx`** — static content page.
- **The GUI Selenium `.side` files and the UAT/black-box PDFs** in `Documentation/` — testing artifacts; summarize as "we did Selenium IDE GUI tests and manual UAT."
- **The Jest/Mocha test files** — mention that unit tests were written for controllers with mocked `pool.query`/`bcrypt`, but be ready to admit they weren't wired into CI.
- **`mermaid-diagram.png`** and the lab PDFs — supplementary documentation.

One honest framing tip: since this is a group project, lead with what you *can* defend (auth flaws, the profile write path, the document pipeline, the schema), and for the rest say "my teammate owned the styling/faqs/testing, so I know it at a high level." Interviewers generally reward that self-awareness.