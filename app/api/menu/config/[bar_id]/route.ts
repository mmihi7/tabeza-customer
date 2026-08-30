/**
 * GET /api/menu/config/:bar_id
 * Public route — returns the venue's menu configuration:
 *   - menu_type (interactive | static)
 *   - static_menu_url / static_menu_type
 *   - bar_categories (user-defined menu categories, ordered by sort_order)
 *
 * Redis-first: reads from Upstash via getCachedOrFetch; on miss it fetches from
 * Supabase and writes the cache. Falls back to Supabase automatically when
 * Redis is unreachable.
 *
 * Cache key: menu:config:{bar_id}  (invalidated by the staff app when the menu
 * plan or bar categories change).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';
import { getCachedOrFetch } from '@/lib/cache';

const CACHE_TTL_S = 60;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ bar_id: string }> }
) {
  try {
    const { bar_id } = await params;

    if (!bar_id) {
      return NextResponse.json({ error: 'bar_id is required' }, { status: 400 });
    }

    const cacheKey = `menu:config:${bar_id}`;

    const result = await getCachedOrFetch(cacheKey, CACHE_TTL_S, async () => {
      const db = createServiceRoleClient();

      const { data: bar, error: barError } = await (db as any)
        .from('bars')
        .select('menu_type, static_menu_url, static_menu_type')
        .eq('id', bar_id)
        .maybeSingle();

      if (barError) {
        console.error('[menu/config customer GET] bars', barError);
      }

      const { data: categories, error: categoriesError } = await (db as any)
        .from('bar_categories')
        .select('id, name, kind, sort_order')
        .eq('bar_id', bar_id)
        .order('kind')
        .order('sort_order');

      if (categoriesError) {
        console.error('[menu/config customer GET] bar_categories', categoriesError);
      }

      return {
        menu_type: bar?.menu_type ?? 'interactive',
        static_menu_url: bar?.static_menu_url ?? null,
        static_menu_type: bar?.static_menu_type ?? null,
        bar_categories: categories ?? [],
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('[menu/config customer GET] unhandled', err);
    return NextResponse.json({
      menu_type: 'interactive',
      static_menu_url: null,
      static_menu_type: null,
      bar_categories: [],
    });
  }
}
