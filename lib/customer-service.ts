/**
 * Customer service for managing customer records
 * Handles the relationship between auth.users and customers table
 */

import { supabase } from './supabase';

// Cast to any to bypass generated type constraints for tables not yet in the schema types
const db = supabase as any;

export interface Customer {
  id: string;
  user_id: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get customer record for authenticated user
 * If no customer record exists, create one
 */
export async function getOrCreateCustomer(userId: string): Promise<Customer> {
  try {
    // First try to get existing customer
    const { data: existingCustomer, error: fetchError } = await db
      .from('customers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected
      console.error('Error fetching customer:', fetchError);
      throw fetchError;
    }

    if (existingCustomer) {
      console.log('✅ Found existing customer:', existingCustomer.id);
      return existingCustomer;
    }

    // Create new customer record
    console.log('👤 Creating new customer for user:', userId);
    const { data: newCustomer, error: createError } = await db
      .from('customers')
      .insert({
        id: userId,
        user_id: userId
      })
      .select('*')
      .single();

    if (createError) {
      console.error('Error creating customer:', createError);
      throw createError;
    }

    console.log('✅ Created new customer:', newCustomer.id);
    return newCustomer;

  } catch (error) {
    console.error('❌ Failed to get or create customer:', error);
    throw error;
  }
}

/**
 * Get customer ID for authenticated user
 * Convenience function that returns just the ID
 */
export async function getCustomerId(userId: string): Promise<string> {
  const customer = await getOrCreateCustomer(userId);
  return customer.id;
}
