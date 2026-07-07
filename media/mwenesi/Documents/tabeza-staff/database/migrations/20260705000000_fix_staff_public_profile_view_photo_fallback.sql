-- Migration: 20260705000000_fix_staff_public_profile_view_photo_fallback
-- The crew app writes photos directly to staff_members.face_photo_url
-- but v_staff_public_profile only reads from staff_profile_photos table.
-- This fix falls back to the direct columns when the relation table is empty.

CREATE OR REPLACE VIEW public.v_staff_public_profile AS
SELECT
  sm.id,
  sm.display_name,
  sm.bio,
  sm.performance_score,
  sm.total_shifts_completed,
  sm.total_approved_orders,
  sm.total_tips_received,
  sm.total_likes,
  sm.preferred_roles,
  sm.preferred_locations,
  sm.marketplace_visible,
  public.get_staff_badge_tier(sm.id) AS badge_tier,
  COALESCE(pp.url, sm.face_photo_url)             AS face_photo_url,
  COALESCE(pp.thumbnail_url, sm.face_thumbnail_url) AS face_thumbnail_url,
  COALESCE(hp.url, sm.half_body_photo_url)          AS half_body_photo_url
FROM public.staff_members sm
LEFT JOIN public.staff_profile_photos pp
  ON pp.staff_member_id = sm.id
  AND pp.photo_type      = 'face'
  AND pp.is_primary      = true
  AND pp.is_public       = true
LEFT JOIN public.staff_profile_photos hp
  ON hp.staff_member_id = sm.id
  AND hp.photo_type      = 'half_body'
  AND hp.is_public       = true
WHERE sm.marketplace_visible = true;
