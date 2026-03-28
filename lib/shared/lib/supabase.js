import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseKey);
// Server-side client using secret key for API routes
export const createServiceRoleClient = () => {
    const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SERVICE_ROLE_KEY;
    if (!secretKey) {
        throw new Error('SUPABASE_SECRET_KEY is not configured');
    }
    return createClient(supabaseUrl, secretKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};
