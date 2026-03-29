import { supabase } from '@/lib/supabase'

export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0'

export interface ConsentRecord {
  id: string
  user_id: string
  decision: 'agreed' | 'skipped' | 'withdrawn'
  consented_at: string
  withdrawn_at: string | null
  app_version: string
}

/**
 * Upserts a consent record for the given user.
 * Uses onConflict: 'user_id' so repeated calls are idempotent.
 * Throws if the Supabase operation returns an error.
 */
export async function persistConsentRecord({
  userId,
  decision,
  appVersion,
}: {
  userId: string
  decision: 'agreed' | 'skipped'
  appVersion: string
}): Promise<ConsentRecord> {
  const { data, error } = await supabase
    .from('consent_records')
    .upsert(
      {
        user_id: userId,
        decision,
        consented_at: new Date().toISOString(),
        app_version: appVersion,
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) throw error
  return data as ConsentRecord
}

/**
 * Fetches the consent record for a user.
 * Returns the row or null if no record exists.
 * Throws on unexpected Supabase errors.
 */
export async function getConsentRecord(userId: string): Promise<ConsentRecord | null> {
  const { data, error } = await supabase
    .from('consent_records')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data as ConsentRecord | null
}

/**
 * Updates the consent record to decision = 'withdrawn' and records the timestamp.
 * Does not delete the row — the record is preserved for audit purposes.
 * Throws on Supabase errors.
 */
export async function withdrawConsent(userId: string): Promise<ConsentRecord> {
  const { data, error } = await supabase
    .from('consent_records')
    .update({
      decision: 'withdrawn',
      withdrawn_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data as ConsentRecord
}
