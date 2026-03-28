"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServiceRoleClient = exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
// Singleton pattern to prevent multiple instances
let supabaseInstance = null;
exports.supabase = (() => {
    if (!supabaseInstance) {
        supabaseInstance = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: true,
                storageKey: 'tabeza-customer-auth',
                storage: typeof window !== 'undefined' ? window.localStorage : undefined,
            },
        });
    }
    return supabaseInstance;
})();
// Server-side client using secret key for API routes
const createServiceRoleClient = () => {
    // Support both legacy JWT service_role key and new sb_secret_ format
    const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SERVICE_ROLE_KEY;
    if (!secretKey) {
        throw new Error('SUPABASE_SECRET_KEY is not configured');
    }
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    return (0, supabase_js_1.createClient)(url, secretKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};
exports.createServiceRoleClient = createServiceRoleClient;
