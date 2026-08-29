/**
 * PATCH /api/auth/profile
 *
 * Updates optional profile fields on the customer's consent_records row.
 * Currently supports birthday fields added in migration 20260828010000.
 *
 * Body: {
 *   userId: string            — Supabase auth user ID
 *   birthday_month?: number   — 1–12
 *   birthday_day?:   number   — 1–31
 *   birthday_year?:  number | null   — optional, 1900–current year
 * }
 *
 * Upserts on user_id so the row is created if it doesn't exist yet.
 * Uses service role to bypass RLS.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, birthday_month, birthday_day, birthday_year } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Validate ranges when provided
    if (birthday_month !== undefined && (birthday_month < 1 || birthday_month > 12)) {
      return NextResponse.json({ error: 'birthday_month must be 1–12' }, { status: 400 });
    }
    if (birthday_day !== undefined && (birthday_day < 1 || birthday_day > 31)) {
      return NextResponse.json({ error: 'birthday_day must be 1–31' }, { status: 400 });
    }
    if (birthday_year !== null && birthday_year !== undefined) {
      const currentYear = new Date().getFullYear();
      if (birthday_year < 1900 || birthday_year > currentYear) {
        return NextResponse.json(
          { error: `birthday_year must be between 1900 and ${currentYear}` },
          { status: 400 },
        );
      }
    }

    const supabase = createServiceRoleClient();

    // Build only the fields that were provided
    const updates: Record<string, unknown> = { user_id: userId };
    if (birthday_month !== undefined) updates.birthday_month = birthday_month;
    if (birthday_day !== undefined)   updates.birthday_day   = birthday_day;
    if ('birthday_year' in body)      updates.birthday_year  = birthday_year ?? null;

    const { data, error } = await (supabase as any)
      .from('consent_records')
      .upsert(updates, { onConflict: 'user_id' })
      .select('user_id, birthday_month, birthday_day, birthday_year')
      .single();

    if (error) {
      console.error('[auth/profile PATCH]', error);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ profile: data });
  } catch (err) {
    console.error('[auth/profile PATCH] unhandled', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
