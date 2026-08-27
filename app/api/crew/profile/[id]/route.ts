import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'

// GET /api/crew/profile/[id]
// Returns public crew profile for customer view
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServiceRoleClient()
  const { id } = params

  if (!id) {
    return NextResponse.json({ error: 'Crew member ID required' }, { status: 400 })
  }

  // Get crew member public profile
  const { data: crew, error: crewError } = await supabase
    .from('crew_members')
    .select(`
      id,
      display_name,
      bio,
      badge_tier,
      performance_score,
      total_shifts_completed,
      total_approved_orders,
      total_likes,
      preferred_roles,
      preferred_locations,
      face_photo_url,
      face_thumbnail_url,
      half_body_photo_url,
      average_rating,
      total_ratings
    `)
    .eq('id', id)
    .single()

  if (crewError || !crew) {
    return NextResponse.json({ error: 'Crew member not found' }, { status: 404 })
  }

  // Get recent ratings (last 5)
  const { data: recentRatings } = await supabase
    .from('customer_crew_ratings')
    .select('rating, comment, created_at')
    .eq('crew_member_id', id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Get rating distribution
  const { data: ratingDist } = await supabase
    .from('customer_crew_ratings')
    .select('rating')
    .eq('crew_member_id', id)

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const r of ratingDist || []) {
    distribution[r.rating as keyof typeof distribution]++
  }

  return NextResponse.json({
    profile: {
      id: crew.id,
      display_name: crew.display_name,
      bio: crew.bio,
      badge_tier: crew.badge_tier,
      performance_score: crew.performance_score,
      total_shifts_completed: crew.total_shifts_completed,
      total_approved_orders: crew.total_approved_orders,
      total_likes: crew.total_likes,
      preferred_roles: crew.preferred_roles,
      preferred_locations: crew.preferred_locations,
      face_photo_url: crew.face_photo_url,
      face_thumbnail_url: crew.face_thumbnail_url,
      half_body_photo_url: crew.half_body_photo_url,
      average_rating: crew.average_rating,
      total_ratings: crew.total_ratings,
      recent_ratings: recentRatings || [],
      rating_distribution: distribution,
    }
  })
}
