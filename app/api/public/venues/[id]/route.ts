// GET /api/public/venues/[id]
// Public, no-auth venue intelligence surface (customer mirror).
// Same shape as tabeza-staff's canonical /api/public/venues/[id] — each app
// reads the shared Supabase separately. Used by the customer app for the
// pre-login venue modal (venue facts + menu preview).
//
// Returns ONLY business-visible fields — no staff internals and only the
// aggregated venue_crew_metrics rollup (never raw review rows).

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';
import { getCachedOrFetch } from '@/lib/cache';

const CACHE_TTL_S = 60;
const CACHE_PREFIX = 'public:venue:';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Venue id is required' }, { status: 400 });
    }

    const cacheKey = `${CACHE_PREFIX}${id}`;

    const result = await getCachedOrFetch(cacheKey, CACHE_TTL_S, async () => {
      const db = createServiceRoleClient() as any;

      const { data: bar, error: barError } = await db
        .from('bars')
        .select(
          'id, name, address, location, area, latitude, longitude, ' +
          'logo_url, phone, business_hours_simple, business_hours_mode, ' +
          'qr_code_url, show_customer_menu, menu_plan'
        )
        .eq('id', id)
        .single();

      if (barError || !bar) return null;

      const menuLimit = bar.menu_plan === 'standard' ? 30 : 15;
      const { data: menu } = await db
        .from('bar_products')
        .select('id, name, description, category, image_url, sale_price, is_promo')
        .eq('bar_id', id)
        .eq('active', true)
        .order('is_promo', { ascending: false })
        .order('name', { ascending: true })
        .limit(menuLimit);

      const { data: metrics } = await db
        .from('venue_crew_metrics')
        .select('avg_payout_reliability, avg_treatment, avg_shifts_available, review_count')
        .eq('bar_id', id)
        .single();

      return {
        venue: {
          id: bar.id,
          name: bar.name,
          address: bar.address,
          location: bar.location,
          area: bar.area,
          latitude: bar.latitude,
          longitude: bar.longitude,
          logo_url: bar.logo_url,
          phone: bar.phone,
          business_hours_mode: bar.business_hours_mode,
          business_hours_simple: bar.business_hours_simple,
          qr_code_url: bar.qr_code_url,
          show_customer_menu: bar.show_customer_menu,
          menu_plan: bar.menu_plan,
        },
        menu: (menu ?? []).map((m: any) => ({
          id: m.id,
          name: m.name,
          description: m.description,
          category: m.category,
          image_url: m.image_url,
          sale_price: m.sale_price,
          is_promo: m.is_promo,
        })),
        crew: metrics
          ? {
              avg_payout_reliability: metrics.avg_payout_reliability,
              avg_treatment: metrics.avg_treatment,
              avg_shifts_available: metrics.avg_shifts_available,
              review_count: metrics.review_count,
            }
          : {
              avg_payout_reliability: 0,
              avg_treatment: 0,
              avg_shifts_available: 0,
              review_count: 0,
            },
      };
    });

    if (!result) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('Unhandled error in customer public venue read:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}