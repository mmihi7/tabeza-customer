import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient, getUserFromRequest } from '@/lib/supabase'

// POST /api/crew/rate
// Rate a crew member after tab closure
export async function POST(req: NextRequest) {
  const supabase = createServiceRoleClient()
  const user = await getUserFromRequest(req)
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { crew_member_id, tab_id, rating, comment } = body

  // Validate required fields
  if (!crew_member_id || !tab_id || !rating) {
    return NextResponse.json({ error: 'Missing required fields: crew_member_id, tab_id, rating' }, { status: 400 })
  }

  // Validate rating range
  if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    return NextResponse.json({ error: 'Rating must be an integer between 1 and 5' }, { status: 400 })
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

  // Verify tab belongs to customer and is closed/paid
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
    return NextResponse.json({ error: 'Can only rate after tab is closed/paid' }, { status: 400 })
  }

  // Check if rating already exists for this tab
  const { data: existingRating } = await supabase
    .from('customer_crew_ratings')
    .select('id')
    .eq('customer_id', customer.id)
    .eq('tab_id', tab_id)
    .single()

  if (existingRating) {
    return NextResponse.json({ error: 'You have already rated this tab' }, { status: 409 })
  }

  // Insert rating
  const { data: ratingRecord, error: ratingError } = await supabase
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

  return NextResponse.json({ 
    success: true, 
    rating: ratingRecord 
  })
}
