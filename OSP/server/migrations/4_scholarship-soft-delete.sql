-- Up Migration

-- NULL means active. Existing scholarships and all related records survive.
ALTER TABLE osp.scholarships ADD COLUMN deleted_at TIMESTAMPTZ;

-- Down Migration

-- Dropping deletion markers would silently resurrect archived scholarships.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM osp.scholarships WHERE deleted_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Cannot remove deleted_at while soft-deleted scholarships exist; use a forward migration';
  END IF;
END;
$$;
ALTER TABLE osp.scholarships DROP COLUMN deleted_at;
