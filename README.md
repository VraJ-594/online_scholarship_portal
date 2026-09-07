# Scholarship Portal  

## Table of Contents  
* [Introduction](#introduction)  
* [Installation Guide](#installation-guide)  
  * [Front-end](#front-end)  
  * [Back-end](#back-end)  
* [Features](#features)  
* [Tech Stack](#tech-stack)  
* [Functionalities](#functionalities)  
  * [Student Features](#student-features)  
  * [Admin Features](#admin-features)  
* [Future Enhancements](#future-enhancements)  
* [Deployment](#deployment)  
* [Contributors](#contributors)  

---

# Introduction  
The *Online Scholarship Portal* is a modern web application designed to simplify the scholarship process for students and administrators. It offers a seamless platform for students to register, apply for scholarships, track their application statuses, and upload required documents, while administrators can efficiently manage scholarships and applications.  

# Installation Guide  

## Prerequisites
- [Node.js](https://nodejs.org/) 20+ and npm
- A PostgreSQL database (the deployed app uses [Supabase](https://supabase.com/))

## Clone the repository
```bash
git clone git@github.com:VraJ-594/online_scholarship_portal.git
cd online_scholarship_portal
```

## Back-end
```bash
cd OSP/server
npm install
cp .env.example .env   # fill in DATABASE_URL, token_api, user/pass, Cloudinary keys -- see .env.example for what each one is
npm run dev             # nodemon, restarts on file changes (use `npm start` for a plain run)
```

### Database setup
The schema lives in versioned migrations, not a single script you re-run:
```bash
npm run migrate up -- --schema osp
```
This applies `migrations/1_baseline_schema.sql` (creates every table) followed by
any migrations after it, tracked in `osp.pgmigrations` so re-running is always
safe. `schema.sql` in this folder is kept only as a human-readable reference
snapshot -- it is destructive (`DROP SCHEMA ... CASCADE`) and should never be
run against a database that already has data.

## Front-end
```bash
cd OSP/client
npm install
cp .env.example .env   # set REACT_APP_API_URL to your backend's URL
npm start
```


# Features  

- *Student Login:*  
  - One-click Google Sign-In, restricted to official `@dau.ac.in` accounts and verified server-side -- the same click creates the account on a student's first sign-in, no separate registration step.  

- *Admin Login:*  
  - Traditional email + password, with "Forgot Password" (OTP-based) for account recovery. Admin accounts are provisioned directly in the database, not self-registered.  

- *Scholarship Application Management:*  
  - Students can view available scholarships and apply with required details and documents.  
  - Real-time updates on application statuses (e.g., Under Review, Accepted, Rejected).  

- *Profile and Document Management:*  
  - Update personal details and securely upload documents.  
  - Validate file size and format during uploads.  

- *Admin Dashboard and Controls:*  
  - Add, update, and delete scholarships.  
  - Review applications and update statuses.  
  - View analytics on active users and applications.  

- *Notifications:*  
  - Notify students about application updates and deadlines.  

---

# Tech Stack  

- *Frontend:*  
  - React 18, React Router, Tailwind CSS, `@react-oauth/google`

- *Backend:*  
  - Node.js, Express.js, JSON Web Tokens (auth), bcrypt (password hashing), Google OAuth (`google-auth-library`, domain-restricted sign-in for students)

- *Database:*  
  - PostgreSQL, managed with [node-pg-migrate](https://github.com/salsita/node-pg-migrate)

- *File Storage:*
  - Cloudinary (documents uploaded via Multer, verified server-side, then stored privately)

- *Email:*
  - Nodemailer (Gmail SMTP) for OTP-based password reset

- *CI:*
  - GitHub Actions builds the frontend and syntax-checks the backend on every push/PR

- *Testing:*
  - Manual GUI (Selenium), black-box, and UAT testing performed for the course and documented under `Documentation/` -- no automated test suite is wired into the app yet

---

# Functionalities  

## Student Features  

- *Account Management:*  
  - Sign in with a `@dau.ac.in` Google account -- first-time sign-in creates the account automatically, no separate registration form. This is the only login method shown on the student-facing UI.  
  - A small number of accounts predating Google Sign-In still use email + password with OTP-based "Forgot Password" recovery; new password-based signups are also restricted to `@dau.ac.in`, though the form for them isn't surfaced to students in the UI.  

- *Scholarship Application:*  
  - Browse available scholarships and apply with necessary documents.  
  - Edit applications before submission and track their statuses.  

- *Profile Management:*  
  - Update personal details and securely upload documents.  

## Admin Features  

- *Scholarship Management:*  
  - Add, update, or delete scholarships.  

- *Application Review:*  
  - Review student applications and change statuses.  

- *Analytics:*  
  - View analytics on total users and active scholarships.  

---

# Future Enhancements  

- *Payment Gateway Integration:*  
  - Enable online payment for application fees or premium scholarships.  

- *Enhanced Document Validation:*  
  - Automate document verification for accuracy and completeness.  

- *Mobile App Development:*  
  - Develop a mobile-friendly app for easier access.  

- *Personalized Scholarship Recommendations:*  
  - Suggest scholarships based on student profiles.  

- *Multi-language Support:*  
  - Enable access to the portal in multiple languages.  

---

# Deployment  
- *Frontend:* [Vercel](https://osp-silk.vercel.app) -- deployed via the Vercel CLI (`vercel --prod` from `OSP/client`). Not connected to GitHub auto-deploy, so a push to `main` alone does **not** update it -- redeploy explicitly after frontend changes.
- *Backend:* [Render](https://osp-server.onrender.com) -- auto-deploys on push to `main` (free tier: the first request after inactivity can take 30-60s to wake up)
- *Database:* PostgreSQL on Supabase, accessed via its session pooler (Render's outbound network doesn't support the direct connection's IPv6-only address)
- *File Storage:* Cloudinary  

### Required environment variables
Both `OSP/server/.env.example` and `OSP/client/.env.example` list every variable needed, including `GOOGLE_CLIENT_ID` / `REACT_APP_GOOGLE_CLIENT_ID` for Google Sign-In -- see [Google Cloud Console](https://console.cloud.google.com/apis/credentials) to create your own OAuth Client ID (Web application type; add your dev and deployed origins under "Authorized JavaScript origins").

---

# Contributors  
[Vraj Dobariya](https://github.com/VraJ-594/)  
