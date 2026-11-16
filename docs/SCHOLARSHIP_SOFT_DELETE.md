# Scholarship soft deletion

## Design and implementation plan

The existing admin DELETE endpoint permanently deletes both `osp.applied_in`
rows and the scholarship. Replace this with an atomic update of a nullable
`osp.scholarships.deleted_at TIMESTAMPTZ`. Existing rows remain active (NULL).
A boolean would hide rows too, but a timestamp also records when deletion
happened. Reusing the deadline would lose its original meaning.

1. Add offline controller regression tests and observe failures.
2. Add migration 4 and replace destructive deletion with an UPDATE. Repeated
   deletion returns 404 without changing the original deletion time.
3. Exclude deleted rows from active lists, counts, detail reads and edits.
   Preserve application history, applicant review and existing status updates.
4. Lock the active scholarship FOR SHARE in the application transaction until
   insertion commits. Deletion then cannot race a new application: whichever
   locks first completes first; an application after deletion gets 404.
5. Run controller tests, existing database-tool tests and backend syntax checks.

No restore/purge API or frontend changes are included. Existing applications
and payment records remain linked to the original scholarship. Previous hard
deletions cannot be recovered by this migration.

## Production rollout

Do not deploy the dependent backend before migration 4 is applied. Render
auto-deploys main; migrations are manual, never part of startup or CI.

1. Ask the user to confirm the current Supabase project is resumed and approve
   applying migration 4. Confirm the configured project without exposing secrets.
2. Apply `npm run migrate up -- --schema osp` from `OSP/server` using the
   existing database configuration and TLS requirements. Review pending
   migrations first; do not seed, restore, or switch databases.
3. Verify the new nullable column and migration tracking through read-only SQL.
4. Push only the reviewed change to main, observe Render deployment and verify
   authenticated scholarship lists and retained application history.

If rolling the backend back, keep the column and deletion markers; the old
backend ignores them and would expose deleted rows and allow hard deletion
again. Prefer a forward fix. The migration Down deliberately refuses to drop
the column while any deletion markers exist.

## Local verification (2026-11-16)

- Confirmed local configuration still targets `xmyxlinkbcmdwoxwecom`, session
  pooler port 5432, TLS enabled. No database connection or mutation was made.
- All 15 controller regression tests passed (database boundary substituted).
  These cover soft deletion, missing/repeated deletion, failures, filtered
  lists/counts, details/edits, retained history and transaction cleanup.
- Existing four database-tool tests passed. Backend JavaScript syntax checked.

## Approved database rollout (2026-11-16)

- User confirmed the database was live and authorized migration/deployment.
- Confirmed the existing project and migrations 1–3 before applying only
  `4_scholarship-soft-delete` with the node-pg-migrate runner and the existing
  TLS configuration. Migration tracking and nullable TIMESTAMPTZ verified.
- Before and after: 3 scholarships, 6 applications, 1 payment; 0 deletion markers.
- Executed the real delete controller against PostgreSQL inside a transaction:
  it set the marker, retained all row counts, and returned 404 on repetition.
  Rolled back the transaction, preserving all original records.
- Verified a concurrent deletion waits on the application transaction's FOR SHARE
  lock, using a second connection with a bounded lock timeout. Both transactions
  rolled back; no lasting test changes were made.
- All 19 offline tests passed before deployment.
