import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'

// GET /api/venue/team/[barId]
// Returns a venue's active crew roster ("the team taking care of you").
// Used by the customer crew modal to show manager, chef and other rostered
// crew as clickable bubbles. Independent of marketplace_visible — a
// full-time employee who is private on the marketplace still appears here
// for the customers of the venue they work at.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ barId: string }> }
) {
  try {
    const { barId } = await params
    if (!barId) {
      return NextResponse.json({ error: 'Missing bar id' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    const { data: bar, error: barError } = await (supabase as any)
      .from('bars')
      .select('id, name')
      .eq('id', barId)
      .maybeSingle()

    if (barError || !bar?.id) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 })
    }

    const { data: roster, error } = await (supabase as any)
      .from('bar_crew_members')
      .select(`
        id,
        role,
        employment_type,
        sort_order,
        crew:crew_members(
          id,
          display_name,
          bio,
          face_photo_url,
          face_thumbnail_url,
          total_likes,
          total_shifts_completed,
          performance_score
        )
      `)
      .eq('bar_id', barId)
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[venue/team] roster error:', error.message)
      // Fall back to an empty team instead of failing the whole page.
      return NextResponse.json({ team: [] })
    }

    const team = (roster ?? [])
      .map((row: any) => ({
        id: row.crew?.id ?? row.id,
        role: row.role,
        employment_type: row.employment_type,
        display_name: row.crew?.display_name || '',
        bio: row.crew?.bio || null,
        face_photo_url: row.crew?.face_photo_url || null,
        face_thumbnail_url: row.crew?.face_thumbnail_url || null,
        total_likes: Number(row.crew?.total_likes) || 0,
        total_shifts_completed: Number(row.crew?.total_shifts_completed) || 0,
        performance_score: row.crew?.performance_score != null ? Number(row.crew.performance_score) : null,
      }))
      .filter((m: any) => m.id && m.display_name)

    return NextResponse.json({ team })
  } catch (err) {
    console.error('[venue/team] unexpected:', err)
    return NextResponse.json({ team: [] })
  }
}
