import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';
import webpush from 'web-push';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:hello@tabeza.co.ke';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export async function POST(request: NextRequest) {
  try {
    const { title, body, tag, data, deviceIds } = await request.json();

    if (!title || !deviceIds || !deviceIds.length) {
      return NextResponse.json(
        { error: 'Missing required fields: title, deviceIds' },
        { status: 400 }
      );
    }

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.error('❌ VAPID keys not configured');
      return NextResponse.json(
        { error: 'Push notifications not configured' },
        { status: 500 }
      );
    }

    const supabase = createServiceRoleClient();

    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions' as any)
      .select('endpoint, p256dh, auth_secret')
      .in('device_id', deviceIds);

    if (error) {
      console.error('❌ Database error fetching subscriptions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      );
    }

    if (!subscriptions || (subscriptions as any[]).length === 0) {
      return NextResponse.json({
        message: 'No push subscriptions found for devices',
        success: false,
        sent: 0
      });
    }

    const payload = JSON.stringify({
      title,
      body: body || '',
      tag: tag || 'tabeza-notification',
      data: data || {}
    });

    const results = await Promise.allSettled(
      (subscriptions as any[]).map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_secret } },
            payload
          );
          return { success: true };
        } catch (err: any) {
          if (err.statusCode === 410) {
            await supabase
              .from('push_subscriptions' as any)
              .delete()
              .eq('endpoint', sub.endpoint);
          }
          return { success: false, error: err.message };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && (r as any).value.success).length;

    return NextResponse.json({
      message: `Push notifications sent to ${successful} device(s)`,
      success: successful > 0,
      sent: successful
    });
  } catch (error) {
    console.error('❌ Push notification send error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
