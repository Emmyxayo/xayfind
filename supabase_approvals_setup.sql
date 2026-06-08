-- =====================================================================
-- XayFind — Vendor edit approvals
-- Run this in: Supabase Dashboard -> SQL Editor -> New query
-- =====================================================================

-- Holds a vendor's proposed (not-yet-approved) edit as JSON.
-- While this is NOT null, the listing has an edit waiting in the
-- admin Approvals queue. The public site keeps showing the live
-- columns until the admin approves.
alter table public.spots
  add column if not exists pending_changes jsonb;

-- No RLS changes: the spots table stays as-is, so anonymous reviews
-- and the admin panel keep working exactly as before.
