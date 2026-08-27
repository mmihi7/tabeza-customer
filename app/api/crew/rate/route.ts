import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { getUserFromRequest } from '@/lib/auth-server'

// POST /api/crew/rate
// Rate a crew member after tab closure.
// Note: customer_crew_ratings table is not yet in the generated types.
// This route uses `as any` casts until the Supabase types are regenerated.
export async function POST(req: NextRequest) {
  const supabase = createServiceRoleClient()
  const user = await getUserFromRequest(req)

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { crew_member_id, tab_id, rating, comment } = body

  if (!crew_member_id || !tab_id || !rating) {
    return NextResponse.json({ error: 'Missing required fields: crew_member_id, tab_id, rating' }, { status: 400 })
  }

  if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    return NextResponse.json({ error: 'Rating must be an integer between 1 and 5' }, { status: 400 })
  }

  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (customerError || !customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
  }

  const { data: tab, error: tabError } = await supabase
    .from('tabs')
    .select('id, status, bar_id')
    .eq('id', tab_id)
    .eq('customer_id', customer.id)
    .single()

  if (tabError || !tab) {
    return NextResponse.json({ error: 'Tab not found' }, { status: 404 })
  }

  if (tab.status !== 'closed' && tab.status !== 'paid') {
    return NextResponse.json({ error: 'Can only rate after tab is closed or paid' }, { status: 400 })
  }

  // Check for existing rating — use any cast since table may not be in types yet
  const { data: existingRating } = await (supabase as any)
    .from('customer_crew_ratings')
    .select('id')
    .eq('customer_id', customer.id)
    .eq('tab_id', tab_id)
    .single()

  if (existingRating) {
    return NextResponse.json({ error: 'You have already rated this tab' }, { status: 409 })
  }

  const { data: ratingRecord, error: ratingError } = await (supabase as any)
    .from('customer_crew_ratings')
    .insert({
      customer_id: customer.id,
      crew_member_id,
      tab_id,
      bar_id: tab.bar_id,
      rating,
      comment: comment || null,
    })
    .select()
    .single()

  if (ratingError) {
    return NextResponse.json({ error: ratingError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, rating: ratingRecord })
}
