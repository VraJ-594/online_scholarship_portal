# OSP — Online Scholarship Portal: Complete Documentation

---

## 1. Project Overview

**OSP (Online Scholarship Portal)** is a full-stack web application built with **React + Node.js + Express + PostgreSQL**. It enables students to register, build profiles, upload documents, browse scholarships, and apply. Admins manage scholarships (CRUD), review applications, and update applicant statuses. The project was developed by a team of 9 contributors as a database systems course project at DA-IICT.

---

## 2. Technology Stack (Implementation Details)

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, React Router v6, Axios/Fetch, Tailwind CSS, Flowbite React, Material Tailwind, React Icons, React Toastify | SPA UI |
| **Backend** | Node.js, Express 4.21, JSON Web Token, Bcryptjs, Nodemailer, Multer, Cloudinary SDK | REST API |
| **Database** | PostgreSQL (via `pg` npm package), schema `osp` | Persistent storage |
| **Auth** | JWT (30-day expiry), bcrypt password hashing, role-based guards | Authentication |
| **File Uploads** | Multer (disk storage) → Cloudinary (cloud storage, `raw` type) | Document management |
| **Email** | Nodemailer with Gmail SMTP | OTP for password reset |
| **Deployment** | Backend: Render, Frontend: Vercel, DB: PostgreSQL cloud | Hosting |

### Key environment variables:
- `DATABASE_URL` — PostgreSQL connection string
- `token_api` — JWT secret
- `user` / `pass` — Gmail credentials for Nodemailer
- `PORT` — Server port (default 8080)

---

## 3. Architecture

```
Browser (React SPA, port 3000 dev / Vercel)
    ↕ HTTP/JSON (CORS)
Express REST API (port 8080 dev / Render)
    ↕ pg pool (SSL)
PostgreSQL (schema: osp)
```

**Frontend:** `client/` — React app with BrowserRouter, UserProvider context
**Backend:** `server/` — Express app with 3 route modules

---

## 4. Database Schema (Complete)

All tables live under the `osp` schema.

### Core Tables

#### `osp.users`
| Column | Type | Constraints |
|---|---|---|
| `id` | SERIAL | PRIMARY KEY |
| `username` | TEXT | NOT NULL |
| `email` | TEXT | UNIQUE, NOT NULL |
| `password` | TEXT | bcrypt hashed |
| `role` | TEXT | 'student' or 'admin' |
| `pic` | TEXT | Profile picture URL |

#### `osp.Scholarships`
| Column | Type | Constraints |
|---|---|---|
| `scholarship_id` | SERIAL | PRIMARY KEY |
| `scholarship_name` | TEXT | NOT NULL |
| `amount` | NUMERIC | NOT NULL |
| `end_date` | DATE | NOT NULL |
| `description` | TEXT | |
| `education_level` | TEXT | e.g. B.Tech, M.Tech |
| `eligible_courses` | JSON/TEXT | Array of course names |
| `min_percentage` | NUMERIC | CPI/percentage |
| `annual_family_income` | NUMERIC | Income cap |
| `benefits` | TEXT | |
| `note` | TEXT | |
| `start_date` | DATE | |

### Applicant-Related Tables

#### `osp.applicants`
| Column | Type | FK |
|---|---|---|
| `applicant_id` | SERIAL PK | |
| `first_name`, `middle_name`, `last_name` | TEXT | |
| `dob` | DATE | |
| `gender` | TEXT | |
| `category` | TEXT | |
| `email` | TEXT | FK → `users.email` (UNIQUE) |
| `mobile_number` | TEXT | |
| `parent_name`, `occupation`, `income`, `parent_mobile` | TEXT/NUMERIC | |
| `current_semester` | INT | |
| `year_of_admission` | INT | |
| `current_cgpa_obtained`, `current_cgpa_total` | NUMERIC | |
| `address_id` | INT | FK → `addresses.address_id` |
| `bank_account_no` | TEXT | FK → `bank_details.bank_account_no` |
| `college_id` | INT | FK → `education_details.college_id` |

#### `osp.addresses`
| Column | Type | FK |
|---|---|---|
| `address_id` | SERIAL PK | |
| `street_address` | TEXT | |
| `pin_code` | TEXT | |
| `district_id` | INT | FK → `districts.district_id` |

#### `osp.districts`
| Column | Type | FK |
|---|---|---|
| `district_id` | SERIAL PK | |
| `district_name` | TEXT | |
| `state_id` | INT | FK → `states.state_id` |

#### `osp.states`
| Column | Type |
|---|---|
| `state_id` | SERIAL PK |
| `state_name` | TEXT |

#### `osp.Bank_Details`
| Column | Type | FK |
|---|---|---|
| `bank_account_no` | TEXT PK | |
| `ifsc_code` | TEXT | FK → `ifsc_details.ifsc_code` |

#### `osp.IFSC_Details`
| Column | Type |
|---|---|
| `ifsc_code` | TEXT PK |
| `bank_name` | TEXT |
| `branch_name` | TEXT |

#### `osp.Education_Details`
| Column | Type | FK |
|---|---|---|
| `college_id` | SERIAL PK | |
| `department_name` | TEXT | FK → `departments_with_programs` |
| `tuition_fees` | NUMERIC | |
| `non_tuition_fees` | NUMERIC | |

#### `osp.Departments_with_Programs`
| Column | Type |
|---|---|
| `department_name` | TEXT |
| `program_name` | TEXT |

#### `osp.class10_details` / `osp.class12_details`
| Column | Type | FK |
|---|---|---|
| `(class10_id / class12_id)` | SERIAL PK | |
| `applicant_id` | INT | UNIQUE, FK → `applicants` |
| `institute_name` | TEXT | |
| `passing_date` | DATE | |
| `marks_obtained` | NUMERIC | |
| `total_marks` | NUMERIC | |

### Relationship Tables

#### `osp.Applied_in`
| Column | Type | FK |
|---|---|---|
| `scholarship_id` | INT | FK → `scholarships` (CASCADE) |
| `applicant_id` | INT | FK → `applicants` |
| `applied_date` | DATE | |
| `status` | TEXT | Pending / Under Review / Documents Verified / Accepted / Rejected |

### Document Storage

#### `osp.applicant_documents`
| Column | Type | FK |
|---|---|---|
| `email` | TEXT | PK, FK → `users.email` |
| `income_certificate` | TEXT | Cloudinary URL |
| `bank_passbook` | TEXT | Cloudinary URL |
| `aadhar_card` | TEXT | Cloudinary URL |
| `tuition_fee_receipt` | TEXT | Cloudinary URL |
| `non_tuition_fee_receipt` | TEXT | Cloudinary URL |
| `class_10_mark_sheet` | TEXT | Cloudinary URL |
| `class_12_mark_sheet` | TEXT | Cloudinary URL |
| `current_education_mark_sheet` | TEXT | Cloudinary URL |

### Miscellaneous

#### `osp.forgot_pass`
| Column | Type |
|---|---|
| `email` | TEXT | PK (with ON CONFLICT upsert) |
| `otp` | TEXT | bcrypt hashed |
| `created_at` | TIMESTAMP |

---

## 5. Entity-Relationships

```
users (1) ──< applicants (1)          via email
users (1) ──< forgot_pass (1)         via email
applicants (1) ──< applied_in (>1)    via applicant_id
scholarships (1) ──< applied_in (>1)  via scholarship_id
applicants (1) ──< class10_details (1) via applicant_id
applicants (1) ──< class12_details (1) via applicant_id
applicants (1) ──< applicant_documents (1) via email
applicants (1) ──< addresses (1)      via address_id
applicants (1) ──< bank_details (1)   via bank_account_no
applicants (1) ──< education_details (1) via college_id
addresses (>1) ──< districts (1)      via district_id
districts (>1) ──< states (1)         via state_id
bank_details (>1) ──< ifsc_details (1) via ifsc_code
education_details (>1) ──< departments_with_programs (1) via department_name
```

---

## 6. API Endpoints (Implementation)

### User Routes — `/api/user` (most public, no auth middleware)

| Method | Path | Controller | SQL/Logic |
|---|---|---|---|
| `POST` | `/register` | `registerUser.js` | `INSERT INTO osp.users (username, email, password, role)` — bcrypt hash, default role='student', returns JWT |
| `POST` | `/login` | `authUser.js` | `SELECT * FROM osp.users WHERE email=...` — bcrypt compare, role check, returns JWT |
| `POST` | `/authRole` | `authUser.js` | Verifies token & role match from JWT payload; used by frontend guards |
| `GET` | `/getuserprofile` | `getUserProfile.js` | `SELECT email, username FROM osp.users WHERE email=$1 AND role='admin'` |
| `POST` | `/updateuserprofile` | `getUserProfile.js` | `UPDATE osp.users SET username=$1 WHERE email=$2` |
| `GET` | `/viewscholarship/:id` | `getScholarship.js` | `SELECT * FROM osp.Scholarships WHERE scholarship_id = $1` |
| `GET` | `/getlistofscholarships` | `ApplicantController.js` | LEFT JOIN scholarships → applied_in, GROUP BY with COUNT(applicant_id) and MAX(status) |
| `GET` | `/getlistforApplyscholarships` | `getListforApplyScholarships.js` | Simple `SELECT scholarship_id, name, end_date, amount FROM osp.Scholarships` |
| `POST` | `/applyForScholarship/:id` | `applyForScholarship.js` | `INSERT INTO osp.applied_in (scholarship_id, applicant_id, applied_date, status)` |
| `GET` | `/getAppliedScholarships` | `getAppliedScholarships.js` | NATURAL JOIN across scholarships → applied_in → applicants → users; filtered by email from header |
| `GET` | `/getApplicantId` | `getApplicantId.js` | `SELECT applicant_id FROM osp.applicants WHERE email = $1` |
| `GET` | `/getemail/:email` | `handelemail.js` | Checks if email exists in applicants table |
| `GET` | `/getprofile/:email` | `fetchprofile.js` | **Massive JOIN query** across 10 tables (applicants, users, addresses, districts, states, bank_details, ifsc_details, education_details, departments_with_programs, class10, class12) |
| `POST` | `/profile` | `userprofile.js` | **Upsert logic**: insert-or-select for states/districts/addresses/IFSC/bank/education/departments; then `INSERT ... ON CONFLICT (email) DO UPDATE` for applicants; same pattern for class10/12 |
| `POST` | `/pdf/:email/:key` | `uploadpdfs.js` | Multer saves to disk → Cloudinary upload (raw type) → `INSERT ... ON CONFLICT (email) DO UPDATE` into applicant_documents |
| `POST` | `/clearpdf/:email/:id` | `handelclearpdf.js` | `UPDATE osp.applicant_documents SET {column} = null WHERE email = $1` |
| `GET` | `/getpdfurls/:email` | `handelpdfurls.js` | `SELECT 8 document columns FROM osp.applicant_documents WHERE email = $1` → maps to camelCase keys |

### Scholarship Routes — `/api/scholarship` (all require `protect` admin middleware)

| Method | Path | Controller | SQL/Logic |
|---|---|---|---|
| `POST` | `/addScholarship` | `addScholarship.js` | `INSERT INTO osp.Scholarships (...) VALUES ($1..$10) RETURNING scholarship_id` |
| `GET` | `/getScholarships` | `getScholarships.js` | LEFT JOIN scholarships → applied_in, GROUP BY with COUNT(applicant_id), ORDER BY count DESC |
| `GET` | `/:scholarship_id` | `getScholarship.js` | `SELECT * FROM osp.Scholarships WHERE scholarship_id = $1` |
| `PUT` | `/editScholarship/:scholarship_id` | `editScholarship.js` | `UPDATE osp.Scholarships SET ... WHERE scholarship_id = $11` |
| `DELETE` | `/deleteScholarship/:scholarship_id` | `deleteScholarship.js` | First `DELETE FROM osp.applied_in WHERE scholarship_id = ...` then `DELETE FROM osp.Scholarships WHERE scholarship_id = ...` |
| `GET` | `/getApplicantData` | `getApplicantsData.js` | **Complex JOIN**: applicants LEFT JOIN addresses, districts, education_details, applied_in, applicant_documents — filtered by applicant_id and scholarship_id |
| `PUT` | `/statusUpdate` | `statusUpdate.js` | `UPDATE osp.applied_in SET status = $1 WHERE applicant_id = $2 AND scholarship_id = $3` |
| `GET` | `/:id/applicants` | `ApplicantController.js` | INNER JOIN applicants → applied_in → scholarships; filtered by scholarship_id; returns id, student_name, applied_date, end_date, status |

### Password Reset Routes — `/api/passwordreset` (public)

| Method | Path | Controller | Logic |
|---|---|---|---|
| `POST` | `/` | `emailSender` | Verifies user exists → generates 6-digit OTP → bcrypt hashes it → `INSERT ... ON CONFLICT (email) DO UPDATE` in forgot_pass → sends via Nodemailer (Gmail) |
| `POST` | `/verify` | `validateOTP` | Fetches stored OTP + created_at → bcrypt.compare — 10-minute expiry check (currently commented) |
| `POST` | `/setnewpassword` | `setPassword` | Validates OTP + 10-min expiry → bcrypt hashes new password → `UPDATE osp.users SET password = ... WHERE email = ...` |

---

## 7. Authentication & Authorization Flow

### Backend (JWT + Middleware)

**Token generation** (`config/generateToken.js`):
```javascript
jwt.sign({ email: user.email, role: user.role }, process.env.token_api, { expiresIn: '30d' })
```

**Admin middleware** (`middleware/authMiddleware.js`):
1. Extract `Bearer <token>` from `Authorization` header
2. `jwt.verify(token, process.env.token_api)` → decoded payload
3. `SELECT * FROM osp.users WHERE email = decoded.email`
4. Verify `req.user.email == decoded.email && req.user.role == decoded.role && req.user.role == 'admin'`
5. If all match → `next()`, else 401

### Frontend (Route Guards)

**`PrivateRoute` (admin)**: Checks localStorage for userInfo → calls `POST /api/user/authRole` to verify admin role server-side → sets `roleChecked` flag → if invalid, clears storage and redirects to `/`

**`StudentRoute`**: Same pattern but checks for `role == 'student'`

### Login/Register Page

- Toggle between login and register forms
- Role selection radio buttons (student/admin) — only on login
- Numeric CAPTCHA (4-digit random, refresh button)
- Password visibility toggle
- Forgot password link → `/forgot-password` page
- On successful login: stores userInfo + token in localStorage → `roleCheck()` → navigates to `/student` or `/admin`

### Password Reset Flow
1. Enter email → server sends OTP to email
2. Enter OTP → server validates (bcrypt compare)
3. Enter new password → server hashes and updates

---

## 8. Frontend Routes & Components

| Path | Component | Auth | Description |
|---|---|---|---|
| `/` | `LoginRegister` | None | Login/Register page with role selection |
| `/faqs` | `Faqs` | None | FAQ page |
| `/forgot-password` | `ForgotPassword` | None | OTP-based password reset (3-step) |
| `/student` | `Scholarship` | StudentRoute | Student dashboard (applied scholarships) |
| `/student/scholarship` | `Apply_Dashboard` | StudentRoute | Browse all available scholarships |
| `/student/viewscholarship/:id` | `ViewScholarshipStudent` | StudentRoute | View scholarship details + apply |
| `/student/profile` | `Profile` | StudentRoute | Multi-section profile form + document uploads |
| `/admin` | `Admin` | PrivateRoute | Admin dashboard (all scholarships) |
| `/admin/add-scholarship` | `AddScholarship` | PrivateRoute | Add scholarship form |
| `/admin/viewscholarship/:id` | `ViewScholarship` | PrivateRoute | Scholarship details (admin) |
| `/admin/edit-scholarship/:id` | `editScholarship` | PrivateRoute | Edit scholarship form |
| `/admin/list-scholarships` | `ListofScholarship` | PrivateRoute | List scholarships with applicant counts |
| `/scholarships/:id/applicants` | `ViewApplicants` | PrivateRoute | Applicants for a specific scholarship |
| `/applicant-details/:id/:sid` | `ApplicantsData` | PrivateRoute | Full applicant details + status update |
| `/admin/profile` | `AdminProfile` | PrivateRoute | Admin profile view/edit |

---

## 9. Key Implementation Details by Feature

### Feature 1: User Registration & Login (`server/controller/registerUser.js`, `authUser.js`)
- **Registration**: Validates fields → checks duplicate email → bcrypt hash password (salt rounds 10) → INSERT with role='student' → returns JWT
- **Login**: SELECT user by email → checks if role matches requested role → bcrypt.compare password → returns JWT with email + role embedded
- **Role auth**: `authRole` endpoint re-verifies token and returns fresh JWT (used by frontend guards)

### Feature 2: Scholarship CRUD (Admin) (`server/controller/addScholarship.js`, `editScholarship.js`, `deleteScholarship.js`)
- **Add**: Validates all required fields → parameterized INSERT → returns scholarship_id
- **Edit**: Parameterized UPDATE on all 10 fields keyed by scholarship_id
- **Delete**: Cascade manually — first delete from `applied_in`, then from `Scholarships` (note: uses `${}` string interpolation instead of parameterized for IDs)

### Feature 3: Student Profile Management (`server/controller/userprofile.js`)
- **Upsert pattern**: For each dependent entity (states, districts, addresses, IFSC, bank, education), first SELECT to check existence, then INSERT if not found → returns the ID
- **Main upsert**: `INSERT INTO osp.applicants ... ON CONFLICT (email) DO UPDATE SET ... RETURNING applicant_id`
- **Class 10/12**: Same INSERT ON CONFLICT (applicant_id) pattern
- **Profile fetch** (`fetchprofile.js`): 10-table JOIN query to reconstruct complete profile

### Feature 4: Document Upload (`server/controller/uploadpdfs.js`)
- Client uses `<input type="file">` → FormData → POST to backend
- Multer saves to `uploads/` directory with timestamped filename
- Cloudinary SDK uploads with `resource_type: "raw"` (for PDFs)
- Local file deleted via `fs.unlinkSync` after upload
- DB upsert: `INSERT INTO osp.applicant_documents (email, {column}) VALUES (...) ON CONFLICT (email) DO UPDATE SET {column} = ...`
- Document clearing: UPDATE specific column to null

### Feature 5: Scholarship Application (`server/controller/applyForScholarship.js`, `getAppliedScholarships.js`)
- **Apply**: INSERT into `applied_in` with scholarship_id, applicant_id, applied_date, status ('Pending')
- **Fetch applied**: NATURAL JOIN across 4 tables (scholarships → applied_in → applicants → users) filtered by email header
- **Duplicate prevention**: DB-level UNIQUE constraint expected (error code 23505 caught)

### Feature 6: Application Review & Status Update (Admin) (`server/controller/getApplicantsData.js`, `statusUpdate.js`)
- **View applicant**: LEFT JOIN across applicants, addresses, districts, education_details, applied_in, applicant_documents
- **Update status**: `UPDATE osp.applied_in SET status = $1 WHERE applicant_id = $2 AND scholarship_id = $3`
- **Status options**: Accepted, Rejected, Under Review, Documents Verified, Pending

### Feature 7: Password Reset (`server/controller/resetPass.js`)
- Generates 6-digit OTP → bcrypt hash → store in `forgot_pass` with timestamp
- Sends HTML email via Nodemailer (Gmail SMTP)
- OTP verification: bcrypt.compare + 10-minute expiry check
- New password: bcrypt hash → UPDATE users table

### Feature 8: Frontend Context & State Management (`client/src/context/userProvider.js`)
- React Context provides `user`, `setUser`, `baseURL` globally
- User persisted in `localStorage` under key `userInfo`
- `baseURL` defaults to `https://group7-osp.onrender.com`

---

## 10. Data Integrity & Normalization

- **3NF**: All non-key attributes depend only on the primary key. Transitive dependencies removed (e.g., district → state via separate tables).
- **Foreign Keys**: Proper FK relationships maintained across all tables (applicants → addresses/districts/states, bank_details → ifsc_details, education_details → departments_with_programs)
- **Composite keys**: `Applied_in` uses composite (scholarship_id + applicant_id)
- **Upsert pattern**: `ON CONFLICT ... DO UPDATE` prevents duplicate entries for unique columns (email, applicant_id)
- **Cascade deletion**: Manual cascade in `deleteScholarship` — deletes `applied_in` rows first, then the scholarship
- **Parameterized queries**: Most queries use `$1, $2` parameterized syntax to prevent SQL injection. Some queries (deleteScholarship, getScholarship) use string interpolation for IDs (potential improvement area)

---

## 11. Challenges & Solutions (Implementation Level)

| Challenge | Solution |
|---|---|
| Complex profile data across 10+ tables | Used a single large JOIN query in `fetchprofile.js` for reads; upsert pattern per entity in `userprofile.js` for writes |
| Document upload to cloud storage | Multer → disk → Cloudinary upload → `fs.unlinkSync` → DB upsert |
| Preventing duplicate applications | DB catches unique constraint violation (errCode 23505), returns error to client |
| Role-based access control | JWT embeds email + role; backend middleware checks admin role; frontend guards re-verify via `authRole` API |
| Cascading scholarship deletion | Manual 2-step DELETE: first child rows in `applied_in`, then parent row in `Scholarships` |
| Cross-origin requests | CORS configured for production origin `https://group7-osp.vercel.app` |
| Password reset without email service | Nodemailer with Gmail app password + bcrypt-hashed OTP stored in DB with timestamp |

---

## 12. Frontend-Backend Data Flow Example (Application)

1. **Student browses scholarships** → `GET /api/user/getlistforApplyscholarships` → displays cards
2. **Student clicks "View Details"** → `GET /api/user/viewscholarship/:id` → full scholarship info
3. **Student clicks "Apply"** → frontend checks if profile is complete (all 8 docs uploaded + profile saved + validation errors clear) → `POST /api/user/applyForScholarship/:id` with `{scholarship_id, applicant_id, applied_date, status: "Pending"}`
4. **Student views applied** → `GET /api/user/getAppliedScholarships` with email in header → NATURAL JOIN returns status per scholarship
5. **Admin views applicants** → `GET /api/scholarship/:id/applicants` → table with student names + statuses
6. **Admin views full details** → `GET /api/scholarship/getApplicantData?id=X&scholarship_id=Y` → LEFT JOIN across 6 tables
7. **Admin updates status** → `PUT /api/scholarship/statusUpdate` with `{applicant_id, s_id, statusToUpdate}`

---

## 13. Contributors

- Vraj Dobariya
- Akshat Joshi
- Kashvi Bhanderi
- Nishil Patel
- Om Patel
- Dip Baldha
- Krisha Bramhbhat
- Dhruv Suri
- Vidhan (Black Box Testing)