import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { getUserFromRequest } from '@/lib/auth-server'

// GET /api/crew/history
// Returns customer's past crew tip interactions.
// Note: customer_crew_ratings table is not yet in the schema;
// history is derived from crew_tips only until the ratings table is added.
export async function GET(req: NextRequest) {
  const supabase = createServiceRoleClient()
  const user = await getUserFromRequest(req)

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (customerError || !customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
  }

  const { data: tips, error: tipsError } = await (supabase as any)
    .from('crew_tips')
    .select(`
      id,
      amount,
      status,
      created_at,
      crew_member_id,
      crew_members (
        id,
        display_name,
        face_photo_url,
        face_thumbnail_url
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

  for (const tip of tips || []) {
    const crewId = tip.crew_members?.id || tip.crew_member_id
    if (!crewId) continue

    if (!crewMap.has(crewId)) {
      crewMap.set(crewId, {
        crew_member: {
          id: crewId,
          display_name: tip.crew_members?.display_name,
          face_photo_url: tip.crew_members?.face_photo_url,
          face_thumbnail_url: tip.crew_members?.face_thumbnail_url,
        },
        interactions: [],
        total_tips: 0,
      })
    }

    const entry = crewMap.get(crewId)
    entry.interactions.push({
      type: 'tip',
      amount: tip.amount,
      date: tip.created_at,
    })
    entry.total_tips += tip.amount
  }

  const history = Array.from(crewMap.values()).sort((a, b) => {
    const aDate = a.interactions[0]?.date || ''
    const bDate = b.interactions[0]?.date || ''
    return new Date(bDate).getTime() - new Date(aDate).getTime()
  })

  return NextResponse.json({ history })
}
