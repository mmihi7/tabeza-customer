import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient, getUserFromRequest } from '@/lib/supabase'

// POST /api/crew/tip
// Tip a crew member via M-Pesa
export async function POST(req: NextRequest) {
  const supabase = createServiceRoleClient()
  const user = await getUserFromRequest(req)
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { crew_member_id, tab_id, amount } = body

  // Validate required fields
  if (!crew_member_id || !tab_id || !amount) {
    return NextResponse.json({ error: 'Missing required fields: crew_member_id, tab_id, amount' }, { status: 400 })
  }

  // Validate amount
  if (amount <= 0 || typeof amount !== 'number') {
    return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 })
  }

  // Get customer record
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id, phone_number')
    .eq('user_id', user.id)
    .single()

  if (customerError || !customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
  }

  // Verify tab belongs to customer
  const { data: tab, error: tabError } = await supabase
    .from('tabs')
    .select('id, bar_id')
    .eq('id', tab_id)
    .eq('customer_id', customer.id)
    .single()

  if (tabError || !tab) {
    return NextResponse.json({ error: 'Tab not found' }, { status: 404 })
  }

  // Verify crew member exists
  const { data: crew, error: crewError } = await supabase
    .from('crew_members')
    .select('id')
    .eq('id', crew_member_id)
    .single()

  if (crewError || !crew) {
    return NextResponse.json({ error: 'Crew member not found' }, { status: 404 })
  }

  // Create tip record (pending status)
  const { data: tipRecord, error: tipError } = await supabase
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

  // Initiate M-Pesa STK push for tip
  // Note: This is a placeholder for the actual M-Pesa integration
  // The real implementation would call the M-Pesa API here
  // For now, we'll simulate a successful payment
  
  try {
    // TODO: Integrate with actual M-Pesa STK push
    // const mpesaResponse = await initiateMpesaStkPush({
    //   phone: customer.phone_number,
    //   amount: amount,
    //   accountReference: `tip-${tipRecord.id}`,
    //   transactionDesc: `Tip for crew member`,
    // })

    // For demo purposes, mark as completed immediately
    // In production, this would be handled by the M-Pesa callback
    const { error: updateError } = await supabase
      .from('crew_tips')
      .update({ 
        status: 'completed',
        mpesa_transaction_code: `demo-${Date.now()}`,
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', tipRecord.id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ 
      success: true, 
      tip: { ...tipRecord, status: 'completed' },
      message: 'Tip processed successfully'
    })
  } catch (error: any) {
    // Mark tip as failed
    await supabase
      .from('crew_tips')
      .update({ status: 'failed' })
      .eq('id', tipRecord.id)

    return NextResponse.json({ error: 'Payment failed: ' + error.message }, { status: 500 })
  }
}
