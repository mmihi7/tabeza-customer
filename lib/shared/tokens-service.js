import { createClient } from '@supabase/supabase-js';

export const TOKENS_CONFIG = {
  BASE_TOKENS: 10,
  VALUE_TIERS: [
    { min: 10000, bonus: 50 },
    { min: 5000, bonus: 30 },
    { min: 2500, bonus: 20 },
    { min: 1000, bonus: 10 },
    { min: 500, bonus: 5 },
  ],
  FREQUENCY_MULTIPLIERS: [
    { minOrders: 20, multiplier: 2.0 },
    { minOrders: 10, multiplier: 1.8 },
    { minOrders: 5, multiplier: 1.5 },
    { minOrders: 2, multiplier: 1.2 },
  ],
  FIRST_CONNECT_TOKENS: 50,
  REFERRAL_TOKENS: 50,
};

export class TokensService {
  constructor(supabase) {
    this.supabase = supabase;
  }

  /**
   * Get user's token balance
   */
  async getBalance(userId) {
    const { data, error } = await this.supabase
      .from('token_balances')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching token balance:', error);
      return null;
    }

    return data;
  }

  /**
   * Get user's transaction history
   */
  async getTransactions(userId, limit = 20) {
    const { data, error } = await this.supabase
      .from('token_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }

    return data;
  }

  /**
   * Award tokens to user
   */
  async awardTokens(userId, amount, reason, metadata = {}) {
    const { data, error } = await this.supabase
      .from('token_transactions')
      .insert({
        user_id: userId,
        amount,
        type: 'earned',
        reason,
        metadata,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error awarding tokens:', error);
      return null;
    }

    // Update balance
    await this.updateBalance(userId, amount);

    return data;
  }

  /**
   * Update user's token balance
   */
  async updateBalance(userId, amount) {
    const currentBalance = await this.getBalance(userId);
    
    if (currentBalance) {
      const { error } = await this.supabase
        .from('token_balances')
        .update({
          balance: currentBalance.balance + amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating balance:', error);
      }
    } else {
      // Create new balance record
      const { error } = await this.supabase
        .from('token_balances')
        .insert({
          user_id: userId,
          balance: amount,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error creating balance:', error);
      }
    }
  }

  /**
   * Redeem tokens
   */
  async redeemTokens(userId, amount, redemptionType, metadata = {}) {
    const currentBalance = await this.getBalance(userId);
    
    if (!currentBalance || currentBalance.balance < amount) {
      throw new Error('Insufficient token balance');
    }

    // Create redemption record
    const { data, error } = await this.supabase
      .from('token_redemptions')
      .insert({
        user_id: userId,
        amount,
        type: redemptionType,
        metadata,
        status: 'completed',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating redemption:', error);
      throw error;
    }

    // Update balance (subtract tokens)
    await this.updateBalance(userId, -amount);

    return data;
  }
}

export default TokensService;
