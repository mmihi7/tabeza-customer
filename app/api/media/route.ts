import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/media?barId=<id>
// Resolves the single platform-controlled customer media entry targeted at the
// given venue. Media is targeted by venue area (bars.area): an entry with
// target_all=true matches every venue; otherwise the venue matches only when
// its area is in the entry's target_areas list.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const barId = searchParams.get('barId');

    if (!barId) {
      return NextResponse.json({ error: 'barId is required' }, { status: 400 });
    }

    const service: any = createServiceRoleClient();

    const { data: bar, error: barError } = await service
      .from('bars')
      .select('area')
      .eq('id', barId)
      .maybeSingle();

    if (barError) {
      return NextResponse.json({ error: barError.message }, { status: 500 });
    }

    const area = ((bar as any)?.area || '').trim().toLowerCase();

    const { data: media, error: mediaError } = await service
      .from('customer_media')
      .select('id, title, media_type, url, slide_urls, target_all, target_areas, active, display_order')
      .eq('active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(10);

    if (mediaError) {
      return NextResponse.json({ error: mediaError.message }, { status: 500 });
    }

    const rows: any[] = media ?? [];

    // Honest targeting: prefer an area-specific entry, fall back to target_all.
    const areaMatch = rows.find((m: any) => !m.target_all && (m.target_areas || []).some((a: string) => a.trim().toLowerCase() === area));
    const anyMatch = rows.find((m: any) => m.target_all);

    const chosen = areaMatch || anyMatch || null;

    if (!chosen) {
      return NextResponse.json({ media: null });
    }

    return NextResponse.json({
      media: {
        id: chosen.id,
        title: chosen.title,
        media_type: chosen.media_type,
        url: chosen.url,
        slide_urls: chosen.slide_urls || [],
      },
    });
  } catch (error: any) {
    console.error('media route error:', error);
    return NextResponse.json({ error: 'Failed to load media' }, { status: 500 });
  }
}
