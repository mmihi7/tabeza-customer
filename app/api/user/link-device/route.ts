import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { deviceId } = await request.json();

    if (!deviceId || typeof deviceId !== 'string') {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      );
    }

    // Get the current authenticated user from the session
    const serviceClient = createServiceRoleClient();
    const { data: { session }, error: sessionError } = await serviceClient.auth.getSession();
    if (sessionError || !session) {
      console.error('❌ No authenticated session:', sessionError);
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    console.log('🔗 Linking device', deviceId.substring(0, 12), 'to user', userId.substring(0, 8));

    // Ensure user profile exists (create if not)
    const { error: profileError } = await serviceClient
      .from('user_profiles')
      .upsert({
        user_id: userId,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false,
      });

    if (profileError) {
      console.error('❌ Failed to upsert user profile:', profileError);
      // Continue anyway, not critical
    }

    // Link device to user (upsert)
    const { error: deviceError } = await serviceClient
      .from('user_devices')
      .upsert({
        user_id: userId,
        device_id: deviceId,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,device_id',
        ignoreDuplicates: false,
      });

    if (deviceError) {
      console.error('❌ Failed to link device:', deviceError);
      return NextResponse.json(
        { error: 'Failed to link device', details: deviceError.message },
        { status: 500 }
      );
    }

    console.log('✅ Device linked successfully');
    return NextResponse.json({
      success: true,
      message: 'Device linked to user',
      userId,
      deviceId,
    });

  } catch (error: any) {
    console.error('❌ Link device API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}