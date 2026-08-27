import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { getUserFromRequest } from '@/lib/auth-server'

// GET /api/crew/profile/[id]
// Returns public crew profile for customer view.
// customer_crew_ratings is not yet in the generated types — uses `as any` casts.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createServiceRoleClient()
  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: 'Missing crew member id' }, { status: 400 })
  }

  const { data: crew, error: crewError } = await supabase
    .from('crew_members')
    .select(`
      id,
      display_name,
      bio,
      performance_score,
      total_shifts_completed,
      total_approved_orders,
      total_likes,
      preferred_roles,
      preferred_locations,
      face_photo_url,
      face_thumbnail_url,
      half_body_photo_url
    `)
    .eq('id', id)
    .single()

  if (crewError || !crew) {
    return NextResponse.json({ error: 'Crew member not found' }, { status: 404 })
  }

  // Ratings table not yet in generated types — cast to any
  const { data: recentRatings } = await (supabase as any)
    .from('customer_crew_ratings')
    .select('rating, comment, created_at')
    .eq('crew_member_id', id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: ratingDist } = await (supabase as any)
    .from('customer_crew_ratings')
    .select('rating')
    .eq('crew_member_id', id)

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const r of (ratingDist as any[]) || []) {
    const key = r.rating as keyof typeof distribution
    if (key in distribution) distribution[key]++
  }

  const totalRatings = ((ratingDist as any[]) ?? []).length
  const avgRating = totalRatings > 0
    ? ((ratingDist as any[]) ?? []).reduce((sum: number, r: any) => sum + r.rating, 0) / totalRatings
    : null

  return NextResponse.json({
    profile: {
      id: crew.id,
      display_name: crew.display_name,
      bio: crew.bio,
      performance_score: crew.performance_score,
      total_shifts_completed: crew.total_shifts_completed,
      total_approved_orders: crew.total_approved_orders,
      total_likes: crew.total_likes,
      preferred_roles: crew.preferred_roles,
      preferred_locations: crew.preferred_locations,
      face_photo_url: crew.face_photo_url,
      face_thumbnail_url: crew.face_thumbnail_url,
      half_body_photo_url: crew.half_body_photo_url,
      average_rating: avgRating,
      total_ratings: totalRatings,
      recent_ratings: (recentRatings as any[]) || [],
      rating_distribution: distribution,
    }
  })
}
