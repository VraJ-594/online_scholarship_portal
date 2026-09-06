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
