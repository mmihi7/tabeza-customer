// app/api/platform/settings/route.ts
// Public, read-only endpoint — exposes non-sensitive platform feature flags.
// Read via service-role client (platform_settings RLS blocks anon reads).
// Used by the customer hook at startup to gate UI features.

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';
import { getCachedOrFetch } from '@/lib/cache';

const SELECT_FIELDS = [
  'early_access_enabled',
  'maintenance_mode',
  'crew_marketplace_enabled',
  'pos_printer_enabled',
  'global_products_enabled',
  'customer_ordering_enabled',
  'loyalty_enabled',
  'promotions_ai_enabled',
  'media_system_enabled',
  'mpesa_enabled',
  'webhooks_enabled',
  'admob_ads_enabled',
  'meta_ads_enabled',
].join(', ');

const SAFE_DEFAULTS = {
  early_access_enabled: true,
  maintenance_mode: false,
  crew_marketplace_enabled: true,
  pos_printer_enabled: true,
  global_products_enabled: true,
  customer_ordering_enabled: true,
  loyalty_enabled: true,
  promotions_ai_enabled: false,
  media_system_enabled: true,
  mpesa_enabled: true,
  webhooks_enabled: true,
  admob_ads_enabled: false,
  meta_ads_enabled: false,
};

export async function GET(_req: NextRequest) {
  try {
    const payload = await getCachedOrFetch('platform:settings:public', 60, async () => {
      const db = createServiceRoleClient();
      const { data, error } = await (db as any)
        .from('platform_settings')
        .select(SELECT_FIELDS)
        .eq('id', 1)
        .maybeSingle();

      if (error || !data) return SAFE_DEFAULTS;
      return { ...SAFE_DEFAULTS, ...data };
    });

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(SAFE_DEFAULTS);
  }
}
