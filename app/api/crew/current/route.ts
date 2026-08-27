import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { getUserFromRequest } from '@/lib/auth-server'

// GET /api/crew/current
// Returns the crew member assigned to the customer's active tab
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

  // Find customer's active tab (open or pending)
  const { data: tab, error: tabError } = await supabase
    .from('tabs')
    .select('id, current_crew_id, bar_id')
    .eq('customer_id', customer.id)
    .in('status', ['open', 'pending'])
    .order('opened_at', { ascending: false })
    .limit(1)
    .single()

  if (tabError || !tab || !(tab as any).current_crew_id) {
    return NextResponse.json({ crew: null })
  }

  const crewId = (tab as any).current_crew_id as string

  // Get crew member details
  const { data: crew, error: crewError } = await supabase
    .from('crew_members')
    .select('id, display_name, face_photo_url, face_thumbnail_url, performance_score, total_shifts_completed')
    .eq('id', crewId)
    .single()

  if (crewError || !crew) {
    return NextResponse.json({ crew: null })
  }

  return NextResponse.json({
    crew: {
      id: crew.id,
      display_name: crew.display_name,
      face_photo_url: crew.face_photo_url,
      face_thumbnail_url: crew.face_thumbnail_url,
      performance_score: crew.performance_score,
      total_shifts_completed: crew.total_shifts_completed,
      bar_id: tab.bar_id,
      tab_id: tab.id,
    }
  })
}
