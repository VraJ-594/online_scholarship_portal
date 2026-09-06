-- Up Migration
--
-- Backs the last 2 of 7 steps in profileUpsert.js's profile-save flow
-- that still do a SELECT-then-conditionally-INSERT instead of a single
-- ON CONFLICT ... RETURNING upsert (5 of 7 were already converted --
-- see the "Fix connection-pool stability issues and cut redundant DB
-- round trips" commit). Checked against live data first: 0 duplicate
-- groups on both, so this is safe to add without a backfill.

ALTER TABLE osp.addresses
    ADD CONSTRAINT addresses_street_pin_district_unique
    UNIQUE (street_address, pin_code, district_id);

ALTER TABLE osp.education_details
    ADD CONSTRAINT education_details_dept_fees_unique
    UNIQUE (department_name, tuition_fees, non_tuition_fees);

-- Down Migration

ALTER TABLE osp.education_details
    DROP CONSTRAINT education_details_dept_fees_unique;

ALTER TABLE osp.addresses
    DROP CONSTRAINT addresses_street_pin_district_unique;
