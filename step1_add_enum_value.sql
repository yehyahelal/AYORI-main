-- ==============================================================================
-- STEP 1: Run this query FIRST in Supabase SQL Editor and click "Run".
-- PostgreSQL requires new enum values to be committed on their own
-- before they can be used in functions and tables.
-- ==============================================================================

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'superadmin';
