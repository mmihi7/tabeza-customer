import { SupabaseClient } from '@supabase/supabase-js';
import type { TokenTransaction, TokenBalance, Redemption, Reward } from './types';
export declare const TOKENS_CONFIG: {
    BASE_TOKENS: number;
    VALUE_TIERS: {
        min: number;
        bonus: number;
    }[];
    FREQUENCY_MULTIPLIERS: {
        minOrders: number;
        multiplier: number;
    }[];
    FIRST_CONNECT_TOKENS: number;
    REFERRAL_TOKENS: number;
};
export declare class TokensService {
    private supabase;
    constructor(supabase: SupabaseClient);
    /**
     * Get user's token balance
     */
    getBalance(userId: string): Promise<TokenBalance | null>;
    /**
     * Get user's transaction history
     */
    getTransactions(userId: string, limit?: number): Promise<TokenTransaction[]>;
    /**
     * Award tokens for first-time venue connection
     */
    awardFirstConnectionTokens(userId: string, venueId: string): Promise<boolean>;
    /**
     * Award tokens for completed order (with frequency algorithm)
     */
    awardOrderTokens(userId: string, venueId: string, // Required for RLS security
    orderId: string, orderValue: number): Promise<{
        success: boolean;
        tokensAwarded?: number;
    }>;
    /**
     * Get all active rewards
     */
    getActiveRewards(): Promise<Reward[]>;
    /**
     * Redeem a reward
     */
    redeemReward(userId: string, rewardId: string): Promise<{
        success: boolean;
        code?: string;
        error?: string;
    }>;
    /**
     * Get user's redemptions
     */
    getUserRedemptions(userId: string): Promise<Redemption[]>;
}
