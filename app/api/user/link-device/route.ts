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

    // Get the current authenticated user from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ No authorization header found');
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify the JWT token using service role client
    const serviceClient = createServiceRoleClient();
    const { data: { user }, error: authError } = await serviceClient.auth.getUser(token);
    if (authError || !user) {
      console.error('❌ Invalid token:', authError);
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const userId = user.id;
    console.log('🔗 Linking device', deviceId.substring(0, 12), 'to user', userId.substring(0, 8));

    // Ensure user profile exists (create if not)
    const { error: profileError } = await (serviceClient as any)
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
    const { error: deviceError } = await (serviceClient as any)
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