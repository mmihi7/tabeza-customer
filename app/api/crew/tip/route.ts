import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { getUserFromRequest } from '@/lib/auth-server'

// POST /api/crew/tip
// Tip a crew member. M-Pesa integration is a stub pending full implementation.
export async function POST(req: NextRequest) {
  const supabase = createServiceRoleClient()
  const user = await getUserFromRequest(req)

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { crew_member_id, tab_id, amount } = body

  if (!crew_member_id || !tab_id || !amount) {
    return NextResponse.json({ error: 'Missing required fields: crew_member_id, tab_id, amount' }, { status: 400 })
  }

  if (typeof amount !== 'number' || amount <= 0) {
    return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 })
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
    .select('id, bar_id')
    .eq('id', tab_id)
    .eq('customer_id', customer.id)
    .single()

  if (tabError || !tab) {
    return NextResponse.json({ error: 'Tab not found' }, { status: 404 })
  }

  const { data: crew, error: crewError } = await supabase
    .from('crew_members')
    .select('id')
    .eq('id', crew_member_id)
    .single()

  if (crewError || !crew) {
    return NextResponse.json({ error: 'Crew member not found' }, { status: 404 })
  }

  const { data: tipRecord, error: tipError } = await (supabase as any)
    .from('crew_tips')
    .insert({
      customer_id: customer.id,
      crew_member_id,
      tab_id,
      amount,
      status: 'pending',
    })
    .select()
    .single()

  if (tipError) {
    return NextResponse.json({ error: tipError.message }, { status: 500 })
  }

  // TODO: Integrate actual M-Pesa STK push here.
  // For now mark completed immediately so the flow is testable end-to-end.
  const { error: updateError } = await (supabase as any)
    .from('crew_tips')
    .update({
      status: 'completed',
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', tipRecord.id)

  if (updateError) {
    await (supabase as any).from('crew_tips').update({ status: 'failed' }).eq('id', tipRecord.id)
    return NextResponse.json({ error: 'Payment failed: ' + updateError.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    tip: { ...tipRecord, status: 'completed' },
    message: 'Tip processed successfully',
  })
}
