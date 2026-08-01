/**
 * GET    /api/customer/saved-bars?customerId=xxx   OR   ?userId=xxx
 * POST   /api/customer/saved-bars  { customerId, barId }   OR   { userId, barId }
 * DELETE /api/customer/saved-bars?customerId=xxx&barId=yyy   OR   ?userId=xxx&barId=yyy
 *
 * Manages customer's saved/favorite venues.
 * Accepts either customerId (direct) or userId (Supabase auth user ID - resolves to customer internally).
 * Uses service role client to bypass RLS on customer_saved_bars table.
 * GET is cached in Redis (TTL 60s); POST/DELETE invalidate the cache.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';
import { getCachedOrFetch, invalidateCache } from '@/lib/cache';

const CACHE_TTL_S = 60;

/** Resolve customer_id from Supabase auth user ID */
async function resolveCustomerId(userId: string): Promise<string | null> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  return data?.id ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let customerId = searchParams.get('customerId');
    const userId = searchParams.get('userId');

    if (!customerId && userId) {
      customerId = await resolveCustomerId(userId);
    }

    if (!customerId) {
      return NextResponse.json({ error: 'customerId or userId is required' }, { status: 400 });
    }

    const cacheKey = `saved_bars:${customerId}`;

    const result = await getCachedOrFetch(cacheKey, CACHE_TTL_S, async () => {
      const supabase = createServiceRoleClient();
      const { data, error } = await supabase
        .from('customer_saved_bars')
        .select(`
          id,
          saved_at,
          bar_id,
          bars!inner (
            id,
            name,
            slug,
            logo_url,
            city,
            neighborhood
          )
        `)
        .eq('customer_id', customerId)
        .order('saved_at', { ascending: false });

      if (error) {
        console.error('[saved-bars GET]', error);
        throw error;
      }

      return (data ?? []).map((row: any) => ({
        id: row.id,
        savedAt: row.saved_at,
        bar: {
          id: row.bars.id,
          name: row.bars.name,
          slug: row.bars.slug,
          logoUrl: row.bars.logo_url,
          city: row.bars.city,
          neighborhood: row.bars.neighborhood,
        },
      }));
    });

    return NextResponse.json({ savedBars: result });
  } catch (err) {
    console.error('[saved-bars GET] unhandled', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { customerId, barId, userId } = body;

    if (!customerId && userId) {
      customerId = await resolveCustomerId(userId);
    }

    if (!customerId || !barId) {
      return NextResponse.json({ error: 'customerId (or userId) and barId are required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('customer_saved_bars')
      .upsert(
        { customer_id: customerId, bar_id: barId, saved_at: new Date().toISOString() },
        { onConflict: 'customer_id,bar_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('[saved-bars POST]', error);
      return NextResponse.json({ error: 'Failed to save bar' }, { status: 500 });
    }

    // Invalidate cache for this customer
    invalidateCache(`saved_bars:${customerId}`);

    return NextResponse.json({ saved: { id: data.id, barId: data.bar_id, savedAt: data.saved_at } }, { status: 201 });
  } catch (err) {
    console.error('[saved-bars POST] unhandled', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let customerId = searchParams.get('customerId');
    const userId = searchParams.get('userId');
    const barId = searchParams.get('barId');

    if (!customerId && userId) {
      customerId = await resolveCustomerId(userId);
    }

    if (!customerId || !barId) {
      return NextResponse.json({ error: 'customerId (or userId) and barId are required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    const { error } = await supabase
      .from('customer_saved_bars')
      .delete()
      .eq('customer_id', customerId)
      .eq('bar_id', barId);

    if (error) {
      console.error('[saved-bars DELETE]', error);
      return NextResponse.json({ error: 'Failed to remove saved bar' }, { status: 500 });
    }

    // Invalidate cache for this customer
    invalidateCache(`saved_bars:${customerId}`);

    return NextResponse.json({ removed: true });
  } catch (err) {
    console.error('[saved-bars DELETE] unhandled', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}