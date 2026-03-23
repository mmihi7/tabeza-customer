/**
 * Mode Configuration Service
 * Task 2: Mode Configuration Service
 * 
 * Fetches and manages venue mode configuration from the database.
 * Provides feature availability checks based on mode configuration.
 */

import { createClient } from '@supabase/supabase-js';

// CORE TRUTH: Manual service always exists.
// Digital authority is singular.
// Tabeza adapts to the venue — never the reverse.

// Export constants instead of types for JavaScript compatibility
export const VENUE_MODES = {
  BASIC: 'basic',
  VENUE: 'venue'
};

export const AUTHORITY_MODES = {
  POS: 'pos',
  TABEZA: 'tabeza'
};

// Create a simple interface for the mode configuration
export const ModeConfiguration = {
  venue_mode: 'string',
  authority_mode: 'string'
};

export class ModeConfigurationService {
  constructor(supabase) {
    this.supabase = supabase;
  }

  async getModeConfiguration(barId) {
    try {
      const { data, error } = await this.supabase
        .from('bar_settings')
        .select('venue_mode, authority_mode')
        .eq('bar_id', barId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching mode configuration:', error);
      // Return default configuration
      return {
        venue_mode: VENUE_MODES.BASIC,
        authority_mode: AUTHORITY_MODES.POS
      };
    }
  }

  isVenueMode(mode, expectedMode) {
    return mode === expectedMode;
  }

  isAuthorityMode(mode, expectedMode) {
    return mode === expectedMode;
  }
}

// Create a singleton instance function
export const fetchModeConfig = async (supabase, barId) => {
  const service = new ModeConfigurationService(supabase);
  return await service.getModeConfiguration(barId);
};

export default ModeConfigurationService;
