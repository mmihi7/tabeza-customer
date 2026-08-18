import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const { notificationsEnabled, soundEnabled, vibrationEnabled } = await request.json();

    const supabase = createServiceRoleClient();

    const updates: Record<string, any> = {};

    if (typeof soundEnabled === 'boolean') updates.sound_enabled = soundEnabled;
    if (typeof vibrationEnabled === 'boolean') updates.vibration_enabled = vibrationEnabled;

    if (typeof notificationsEnabled === 'boolean') {
      const { data: tab } = await supabase
        .from('tabs')
        .select('notes')
        .eq('id', id)
        .single();

      let notes: Record<string, any> = {};
      if (tab?.notes) {
        try { notes = JSON.parse(tab.notes); } catch {}
      }
      notes.notifications_enabled = notificationsEnabled;
      updates.notes = JSON.stringify(notes);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No settings provided' }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('tabs')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
