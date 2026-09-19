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
  loyalty_shadow_mode: false,
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
      const [settingsRes, loyaltyRes] = await Promise.all([
        (db as any).from('platform_settings').select(SELECT_FIELDS).eq('id', 1).maybeSingle(),
        (db as any).from('loyalty_system_config').select('is_shadow_mode').eq('id', true).maybeSingle(),
      ]);

      const base = (settingsRes.error || !settingsRes.data) ? SAFE_DEFAULTS : { ...SAFE_DEFAULTS, ...settingsRes.data };
      const loyalty_shadow_mode = loyaltyRes?.data?.is_shadow_mode ?? SAFE_DEFAULTS.loyalty_shadow_mode;
      return { ...base, loyalty_shadow_mode };
    });

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(SAFE_DEFAULTS);
  }
}
