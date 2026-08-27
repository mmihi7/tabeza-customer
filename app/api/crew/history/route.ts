import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient, getUserFromRequest } from '@/lib/supabase'

// GET /api/crew/history
// Returns customer's past crew interactions across all venues
export async function GET(req: NextRequest) {
  const supabase = createServiceRoleClient()
  const user = await getUserFromRequest(req)
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get customer record
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (customerError || !customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
  }

  // Get all ratings with crew and venue info
  const { data: ratings, error: ratingsError } = await supabase
    .from('customer_crew_ratings')
    .select(`
      id,
      rating,
      comment,
      created_at,
      crew_members (
        id,
        display_name,
        face_photo_url,
        face_thumbnail_url,
        badge_tier,
        performance_score,
        total_shifts_completed
      ),
      bars (
        id,
        name,
        location
      )
    `)
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })

  if (ratingsError) {
    return NextResponse.json({ error: ratingsError.message }, { status: 500 })
  }

  // Get all tips with crew info
  const { data: tips, error: tipsError } = await supabase
    .from('crew_tips')
    .select(`
      id,
      amount,
      status,
      created_at,
      crew_members (
        id,
        display_name
      )
    `)
    .eq('customer_id', customer.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })

  if (tipsError) {
    return NextResponse.json({ error: tipsError.message }, { status: 500 })
  }

  // Group by crew member
  const crewMap = new Map<string, any>()

  // Process ratings
  for (const rating of ratings || []) {
    const crewId = (rating.crew_members as any)?.id
    if (!crewId) continue

    if (!crewMap.has(crewId)) {
      crewMap.set(crewId, {
        crew_member: {
          id: crewId,
          display_name: (rating.crew_members as any)?.display_name,
          face_photo_url: (rating.crew_members as any)?.face_photo_url,
          face_thumbnail_url: (rating.crew_members as any)?.face_thumbnail_url,
          badge_tier: (rating.crew_members as any)?.badge_tier,
          performance_score: (rating.crew_members as any)?.performance_score,
          total_shifts_completed: (rating.crew_members as any)?.total_shifts_completed,
        },
        interactions: [],
        total_ratings: 0,
        total_tips: 0,
        avg_rating: 0,
      })
    }

    const crewData = crewMap.get(crewId)
    crewData.interactions.push({
      type: 'rating',
      rating: rating.rating,
      comment: rating.comment,
      venue: rating.bars,
      date: rating.created_at,
    })
    crewData.total_ratings++
    crewData.avg_rating = (crewData.avg_rating * (crewData.total_ratings - 1) + rating.rating) / crewData.total_ratings
  }

  // Process tips
  for (const tip of tips || []) {
    const crewId = (tip.crew_members as any)?.id
    if (!crewId) continue

    if (!crewMap.has(crewId)) {
      crewMap.set(crewId, {
        crew_member: {
          id: crewId,
          display_name: (tip.crew_members as any)?.display_name,
        },
        interactions: [],
        total_ratings: 0,
        total_tips: 0,
        avg_rating: 0,
      })
    }

    const crewData = crewMap.get(crewId)
    crewData.interactions.push({
      type: 'tip',
      amount: tip.amount,
      date: tip.created_at,
    })
    crewData.total_tips += tip.amount
  }

  // Convert map to array and sort by most recent interaction
  const history = Array.from(crewMap.values()).sort((a, b) => {
    const aDate = a.interactions[0]?.date || ''
    const bDate = b.interactions[0]?.date || ''
    return new Date(bDate).getTime() - new Date(aDate).getTime()
  })

  return NextResponse.json({ history })
}
