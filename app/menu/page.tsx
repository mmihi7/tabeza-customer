'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Plus, Search, X, CreditCard, Clock, CheckCircle, Minus, User, UserCog, ThumbsUp, ChevronDown, ChevronUp, Eye, EyeOff, Phone, CreditCardIcon, DollarSign, MessageCircle, Send, AlertCircle, FileText, ZoomIn, ZoomOut, Maximize2, Package,
  Coffee, Utensils, Pizza, Sandwich, Cookie, IceCream, Apple, Beef, Fish, Wine, Beer, Sunrise, Sunset, Moon, Star, Heart, Flame, Zap, Droplets, Leaf, Wheat, Milk, Egg, ChefHat, Cake, Candy, Popcorn, IceCream2, Glasses, Martini, LayoutGrid,
  Crown, Shield, Circle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/formatUtils';
import { useVibrate } from '@/hooks/useVibrate';
import { useSound } from '@/hooks/useSound';
import { MessageAlert, InitiatedBy } from '@/lib/shared/types';
import { useRealtimeSubscription } from '@/lib/shared/hooks/useRealtimeSubscription';
import { ConnectionStatusIndicator } from '@/lib/shared/components/ConnectionStatus';
import { calculateResponseTime, formatResponseTime, type ResponseTimeResult, validateMpesaPhoneNumber, formatPhoneNumberInput } from '@/lib/shared';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks/useAuth';
import { validatePaymentContext, logPaymentDebugInfo } from '@/lib/payment-debug';
import { TokenNotifications, useTokenNotifications } from '../../components/TokenNotifications';
import PWAInstallPrompt from '../../components/PWAInstallPrompt';
import PWAUpdateManager from '../../components/PWAUpdateManager';
import MessagePanel from './MessagePanel';
import { playCustomerNotification } from '@/lib/notifications'; 
import { updateOrderInList, addOrderToList, removeOrderFromList, type TabOrder } from '@/lib/order-state-helpers';

// Temporary format function to bypass import issue
const tempFormatCurrency = (amount: number | string, decimals = 0): string => {
  const number = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(number)) return 'KSh 0';
  return `KSh ${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number)}`;
};

export const dynamic = 'force-dynamic';

// Guard against missing Supabase client during build
if (typeof window !== 'undefined' && !supabase) {
  throw new Error('Supabase client not initialized. Check environment variables.');
}

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  image_url?: string;
}

interface BarProduct {
  id: string;
  bar_id: string;
  product_id: string;
  sale_price: number;
  active: boolean;
  product?: Product;
}

interface Tab {
  id: string;
  status: string;
  bar_id: string;
  tab_number?: number;
  notes?: string;
  customer_id?: string;
  notifications_enabled?: boolean;
  sound_enabled?: boolean;
  vibration_enabled?: boolean;
  bar?: {
    id: string;
    name: string;
    location?: string;
  };
}

interface OrderResponseData {
  created_at: string;
  confirmed_at: string;
  status: string;
  initiated_by: string;
}

interface MessageResponseData {
  created_at: string;
  staff_acknowledged_at: string;
  status: string;
  initiated_by: string;
}

type SpendTierLabel = 'bronze' | 'silver' | 'gold';
const DEFAULT_TIER_DISCOUNTS: Record<SpendTierLabel, number> = {
  bronze: 1.5,
  silver: 3.0,
  gold: 5.0,
};

interface BadgeDisplay {
  badge_level: 'bronze' | 'silver' | 'gold' | 'platinum' | null;
  awarded_at: string;
  earned_at_bar_id: string;
  earned_at_bar_name: string;
  spend_amount_at_venue: number;
}

function applyDiscount(price: number, pct: number): number {
  return Math.round(price * (1 - pct / 100));
}

export default function MenuPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { buzz } = useVibrate(); 
  const playAcceptanceSound = useSound();
  const { showToast } = useToast();
  
  // Authentication check
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('🔐 Unauthenticated user - redirecting to login');
      router.push('/login');
      return;
    }
  }, [authLoading, user, router]);
  
  // State declarations
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [tab, setTab] = useState<Tab | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('Your Tab');
  const [barName, setBarName] = useState('Loading...');
  const [crewMember, setCrewMember] = useState<{ display_name: string; face_photo_url?: string; face_thumbnail_url?: string } | null>(null);
  const [barProducts, setBarProducts] = useState<BarProduct[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [approvingOrder, setApprovingOrder] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [scrollY, setScrollY] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [processedOrders, setProcessedOrders] = useState<Set<string>>(new Set());
  const [acceptanceModal, setAcceptanceModal] = useState<{
    show: boolean;
    orderTotal: string;
    message: string;
  }>({ show: false, orderTotal: '', message: '' });

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [selectedRejectionReason, setSelectedRejectionReason] = useState<string>('');

  const rejectionReasons = [
    { value: 'wrong_items', label: 'Wrong items ordered' },
    { value: 'already_ordered', label: 'Already ordered this' },
    { value: 'change_mind', label: 'Changed my mind' }
  ];

  const [activePaymentMethod, setActivePaymentMethod] = useState<'mpesa' | 'cards' | 'cash'>('mpesa');
  const [paymentSettings, setPaymentSettings] = useState({
    mpesa_enabled: true,
    card_enabled: true,
    cash_enabled: true
  });
  const [loadingPaymentSettings, setLoadingPaymentSettings] = useState(true);
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);

  const handleBalanceChange = (newBalance: number, previousBalance: number) => {
    console.log('💰 Balance changed:', { newBalance, previousBalance });
    const change = previousBalance - newBalance;
    if (change > 0) {
      showToast({
        type: 'success',
        title: '💳 Payment Applied',
        message: `Balance reduced by ${tempFormatCurrency(change)}`,
        duration: 4000
      });
    }
  };

  const handleAutoClose = (tabId: string, finalBalance: number) => {
    console.log('🔒 Tab auto-closing:', { tabId, finalBalance });
    showToast({
      type: 'success',
      title: '🎉 Tab Closing!',
      message: 'Your tab has been paid in full and will close automatically',
      duration: 8000
    });
    if (notificationPrefs.soundEnabled) {
      playAcceptanceSound();
    }
    if (notificationPrefs.vibrationEnabled) {
      buzz([200, 100, 200, 100, 200]);
    }
  };

  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageSentModal, setMessageSentModal] = useState(false);
  const [telegramMessages, setTelegramMessages] = useState<any[]>([]);
  const [newMessageAlert, setNewMessageAlert] = useState<any>(null);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [showMessagePanel, setShowMessagePanel] = useState(false);
  
  const [menuType, setMenuType] = useState<'interactive' | 'static'>('interactive');
  const [staticMenuUrl, setStaticMenuUrl] = useState<string | null>(null);
  const [staticMenuType, setStaticMenuType] = useState<'pdf' | 'image' | 'slideshow' | null>(null);
  const [showStaticMenu, setShowStaticMenu] = useState(false);
  const [imageScale, setImageScale] = useState(1);

  const [slideshowImages, setSlideshowImages] = useState<string[]>([]);
  const [slideshowSettings, setSlideshowSettings] = useState<Record<string, any> | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isSlideshowPlaying, setIsSlideshowPlaying] = useState(false);

  const [averageResponseTime, setAverageResponseTime] = useState<number | null>(null);
  const [responseTimeLoading, setResponseTimeLoading] = useState(false);
  const [showConnectionStatus, setShowConnectionStatus] = useState(false);

  const [loyaltyData, setLoyaltyData] = useState<{
    visitTier: 'new' | 'bronze' | 'silver' | 'gold';
    spendTier: SpendTierLabel | null;
    totalVisits: number;
    totalSpend: number;
    weeklyVisits: number;
  } | null>(null);
  
  const [globalBadge, setGlobalBadge] = useState<BadgeDisplay | null>(null);
  const [badgeLoading, setBadgeLoading] = useState(false);
  const [venueDiscounts, setVenueDiscounts] = useState<Record<SpendTierLabel, number>>(DEFAULT_TIER_DISCOUNTS);
  const [visitBonuses, setVisitBonuses] = useState<Record<string, number>>({
    once_per_week: 1.0,
    twice_per_week: 2.0,
    thrice_per_week: 3.0,
  });
  const [venueThresholds, setVenueThresholds] = useState<Record<SpendTierLabel, number>>({
    bronze: 3000,
    silver: 10000,
    gold: 25000,
  });
  const [spendTier, setSpendTier] = useState<SpendTierLabel | null>(null);
  const [spendPrompt, setSpendPrompt] = useState<string | null>(null);
  const previousTier = useRef<SpendTierLabel | null>(null);

  const [notificationPrefs, setNotificationPrefs] = useState({
    notificationsEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true
  });

  const [showTableModal, setShowTableModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [barTables, setBarTables] = useState<number[]>([]);
  const [tableSelectionRequired, setTableSelectionRequired] = useState(false);
  const [notColdPreferences, setNotColdPreferences] = useState<Record<string | number, boolean>>({});
  
  const drinkCategories = ['Beer & Cider', 'Wine & Champagne', 'Spirits', 'Liqueurs & Specialty', 'Non-Alcoholic'];
  const loadAttempted = useRef(false);

  // Refs for scrolling
  const menuRef = useRef<HTMLDivElement>(null);
  const ordersRef = useRef<HTMLDivElement>(null);
  const paymentRef = useRef<HTMLDivElement>(null);

  // Helper functions - memoized for performance
  const getDisplayImage = useCallback((product: any) => {
    if (!product || typeof product !== 'object') return null;
    if (product.image_url) {
      console.log('📸 Customer using product image:', product.image_url);
      return product.image_url;
    }
    console.log('❌ Customer no product image found for:', product.category);
    return null;
  }, []);

  const getCategoryIcon = useCallback((categoryName: string) => {
    const category = categoryName.toLowerCase();
    const iconMap: Record<string, any> = {
      'beer & cider': Beer,
      'beer': Beer,
      'cider': Beer,
      'wine & champagne': Wine,
      'wine': Wine,
      'champagne': Wine,
      'spirits': Glasses,
      'whiskey': Glasses,
      'gin': Glasses,
      'vodka': Glasses,
      'rum': Glasses,
      'tequila': Glasses,
      'liqueurs & specialty': Martini,
      'liqueur': Martini,
      'brandy': Martini,
      'cocktail': Martini,
      'non-alcoholic': Droplets,
      'soft drink': Droplets,
      'juice': Droplets,
      'water': Droplets,
      'energy': Droplets,
      'coffee': Droplets,
      'tea': Droplets,
      'pizza': Pizza,
      'bbq': Flame,
      'choma': Flame,
      'grill': Flame,
      'starters': Leaf,
      'appetizers': Leaf,
      'salad': Leaf,
      'main courses': Utensils,
      'main': Utensils,
      'meal': Utensils,
      'dish': Utensils,
      'side dishes': Wheat,
      'side': Wheat,
      'accompaniment': Wheat,
      'bakery': Egg,
      'breakfast': Egg,
      'bread': Egg,
      'egg': Egg,
      'desserts': Cake,
      'snacks': Cake,
      'cake': Cake,
      'ice cream': Cake,
      'popcorn': Cake,
      'convenience': Package,
      'other': Package,
      'traditional': Package,
      'smoking': Package,
      'tobacco': Package,
      'vape': Package,
    };
    
    const matchedKey = Object.keys(iconMap).find(key => category.includes(key));
    return matchedKey ? iconMap[matchedKey] : LayoutGrid;
  }, []);

  const isDrinkItem = useCallback((item: any): boolean => {
    return item.category ? drinkCategories.includes(item.category) : false;
  }, []);

  const isDrinkProduct = useCallback((product: any): boolean => {
    if (!product?.category) return false;
    return drinkCategories.includes(product.category);
  }, []);

  const isFoodProduct = useCallback((product: any): boolean => {
    if (!product?.category) return false;
    return !drinkCategories.includes(product.category);
  }, []);

  const toggleNotCold = useCallback((itemId: string | number) => {
    setNotColdPreferences(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  }, []);

  // Timer for real-time updates
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handle scroll for parallax effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load cart from sessionStorage
  useEffect(() => {
    const cartData = sessionStorage.getItem('cart');
    if (cartData) {
      try {
        const parsedCart = JSON.parse(cartData);
        setCart(parsedCart);
        console.log('🛒 Cart loaded from sessionStorage:', parsedCart);
      } catch (error) {
        console.error('Error parsing cart data:', error);
        setCart([]);
      }
    }
  }, []);

  // Load user's token balance - DISABLED (kept for future use)
  useEffect(() => {
    console.log('🪙 Token balance loading disabled');
    setCurrentBalance(null);
  }, [tab?.id]);

  // Calculate average response time
  const calculateAverageResponseTime = useCallback(async (barId: string) => {
    console.log('🔍 [CUSTOMER] Starting response time calculation for bar:', barId);
    setResponseTimeLoading(true);
    
    try {
      const result = await calculateResponseTime(barId, {
        timeframe: '24h',
        includeMessages: true,
        includeOrders: true
      });
      
      if (result.error) {
        console.error('❌ [CUSTOMER] Error calculating response time:', result.error);
        setAverageResponseTime(null);
        return;
      }
      
      const roundedAvg = Math.round(result.averageMinutes);
      setAverageResponseTime(roundedAvg);
      
      console.log('✅ [CUSTOMER] Average response time calculated:', {
        average: result.formattedString,
        roundedMinutes: roundedAvg,
        totalSamples: result.sampleCount,
        breakdown: result.breakdown
      });
      
    } catch (error) {
      console.error('[CUSTOMER] Error calculating average response time:', error);
      setAverageResponseTime(null);
    } finally {
      setResponseTimeLoading(false);
    }
  }, []);

  // Helper: compare tier levels
  const tierRank = useCallback((tier: SpendTierLabel | null): number => {
    if (!tier) return 0;
    if (tier === 'bronze') return 1;
    if (tier === 'silver') return 2;
    if (tier === 'gold') return 3;
    return 0;
  }, []);

  // Helper: build spend prompt
  const buildSpendPrompt = useCallback((
    currentSpend: number,
    discounts: Record<SpendTierLabel, number>,
    earnedTier: SpendTierLabel | null,
    thresholds: Record<SpendTierLabel, number>,
  ): string | null => {
    if (earnedTier === 'gold') return null;

    const nextTier: SpendTierLabel = earnedTier === 'silver' ? 'gold' : earnedTier === 'bronze' ? 'silver' : 'bronze';
    const gap = thresholds[nextTier] - currentSpend;
    if (gap <= 0) return null;

    const pct = discounts[nextTier];
    return `Spend KES ${gap.toLocaleString('en-KE')} more to unlock ${nextTier.charAt(0).toUpperCase() + nextTier.slice(1)} — ${pct}% off every order here.`;
  }, []);

  // Load loyalty data
  const loadLoyaltyData = useCallback(async () => {
    if (!tab?.customer_id || !tab?.bar_id) return;

    try {
      console.log('🏆 [LOYALTY] Starting loyalty data load:', {
        customer_id: tab.customer_id,
        bar_id: tab.bar_id,
        timestamp: new Date().toISOString()
      });

      const [badgeRes, visitsRes, discountsRes] = await Promise.all([
        fetch(`/api/loyalty/badge/${tab.customer_id}`),
        fetch(`/api/loyalty/visits/${tab.customer_id}?bar_id=${tab.bar_id}`),
        fetch(`/api/loyalty/venue-discounts/${tab.bar_id}`),
      ]);

      const badgeData = badgeRes.ok ? await badgeRes.json() : null;
      const visitsData = visitsRes.ok ? await visitsRes.json() : null;
      const discountsData = discountsRes.ok ? await discountsRes.json() : null;

      console.log('🏆 [LOYALTY] API responses received:', {
        badgeData: badgeData ? { badge_level: badgeData.badge_level } : null,
        visitsData: visitsData ? { 
          completedVisits: visitsData.completedVisits, 
          averageSpend: visitsData.averageSpend,
          weeklyVisits: visitsData.weeklyVisits 
        } : null,
        discountsData: discountsData ? 'loaded' : null
      });

      if (badgeData && badgeData.badge_level) {
        setGlobalBadge(badgeData as BadgeDisplay);
        console.log('🏆 [LOYALTY] Global badge loaded:', badgeData);
      } else {
        setGlobalBadge(null);
        console.log('🏆 [LOYALTY] No global badge found for customer');
      }

      if (discountsData?.spend_tiers) {
        setVenueDiscounts(discountsData.spend_tiers as Record<SpendTierLabel, number>);
      }
      if (discountsData?.visit_bonuses) {
        setVisitBonuses(discountsData.visit_bonuses);
      }

      if (!visitsData || visitsData.error) return;

      const completedVisits: number = visitsData.completedVisits ?? 0;
      const averageSpend: number = visitsData.averageSpend ?? 0;
      const weeklyVisits: number = visitsData.weeklyVisits ?? 0;
      const thresholds = visitsData.thresholds ?? { bronze: 3000, silver: 10000, gold: 25000 };

      setVenueThresholds(thresholds);

      let visitTier: 'new' | 'bronze' | 'silver' | 'gold' = 'new';
      if (completedVisits >= 3) visitTier = 'gold';
      else if (completedVisits >= 2) visitTier = 'silver';
      else if (completedVisits >= 1) visitTier = 'bronze';

      let earnedSpendTier: SpendTierLabel | null = null;
      if (averageSpend >= thresholds.gold) earnedSpendTier = 'gold';
      else if (averageSpend >= thresholds.silver) earnedSpendTier = 'silver';
      else if (averageSpend >= thresholds.bronze) earnedSpendTier = 'bronze';

      setLoyaltyData({
        visitTier,
        spendTier: earnedSpendTier,
        totalVisits: completedVisits,
        totalSpend: averageSpend * completedVisits,
        weeklyVisits,
      });

      console.log('📊 Loyalty data set:', {
        visitTier,
        earnedSpendTier,
        completedVisits,
        weeklyVisits,
        averageSpend,
        thresholds
      });

      const globalBadgeLevel = badgeData?.badge_level as SpendTierLabel | null;
      
      console.log('🎉 [LOYALTY] Checking for badge upgrade:', {
        currentBadge: globalBadgeLevel || 'none',
        earnedTier: earnedSpendTier || 'none',
        averageSpend,
        thresholds
      });
      
      const currentBadgeRank = tierRank(globalBadgeLevel);
      const earnedTierRank = tierRank(earnedSpendTier);
      
      if (earnedSpendTier && earnedTierRank > currentBadgeRank) {
        console.log('🎉 [LOYALTY] Badge upgrade detected:', {
          current: globalBadgeLevel || 'none',
          earned: earnedSpendTier,
          currentRank: currentBadgeRank,
          earnedRank: earnedTierRank
        });
        
        try {
          console.log('🎉 [LOYALTY] Calling badge award API:', {
            customer_id: tab.customer_id,
            bar_id: tab.bar_id,
            badge_level: earnedSpendTier,
            spend_amount: averageSpend,
            timestamp: new Date().toISOString()
          });

          let awardResponse;
          let retryAttempt = 0;
          const maxRetries = 1;
          
          while (retryAttempt <= maxRetries) {
            try {
              awardResponse = await fetch('/api/loyalty/badge/award', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  customer_id: tab.customer_id,
                  bar_id: tab.bar_id,
                  badge_level: earnedSpendTier,
                  spend_amount: averageSpend,
                }),
              });
              
              if (awardResponse.ok || awardResponse.status === 400) {
                break;
              }
              
              if (awardResponse.status >= 500 && retryAttempt < maxRetries) {
                console.warn(`⚠️ [LOYALTY] Badge award API failed (attempt ${retryAttempt + 1}/${maxRetries + 1}), retrying in 3 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 3000));
                retryAttempt++;
              } else {
                break;
              }
            } catch (networkError) {
              if (retryAttempt < maxRetries) {
                console.warn(`⚠️ [LOYALTY] Network error (attempt ${retryAttempt + 1}/${maxRetries + 1}), retrying in 3 seconds...`, networkError);
                await new Promise(resolve => setTimeout(resolve, 3000));
                retryAttempt++;
              } else {
                throw networkError;
              }
            }
          }

          if (awardResponse?.ok) {
            const awardResult = await awardResponse.json();
            
            console.log('✅ [LOYALTY] Badge award API response:', {
              upgraded: awardResult.upgraded,
              newBadge: awardResult.newBadge ? {
                badge_level: awardResult.newBadge.badge_level,
                awarded_at: awardResult.newBadge.awarded_at
              } : null,
              timestamp: new Date().toISOString()
            });
            
            if (awardResult.upgraded && awardResult.newBadge) {
              setGlobalBadge({
                badge_level: awardResult.newBadge.badge_level,
                awarded_at: awardResult.newBadge.awarded_at,
                earned_at_bar_id: awardResult.newBadge.earned_at_bar_id,
                earned_at_bar_name: barName,
                spend_amount_at_venue: awardResult.newBadge.spend_amount_at_venue,
              });
              
              const tierName = earnedSpendTier.charAt(0).toUpperCase() + earnedSpendTier.slice(1);
              showToast({
                type: 'success',
                title: `Congratulations! You've earned ${tierName} status`,
                message: `at ${barName}`,
                duration: 8000
              });
              
              if (notificationPrefs.soundEnabled) {
                playAcceptanceSound();
              }
              if (notificationPrefs.vibrationEnabled) {
                buzz([200, 100, 200, 100, 200]);
              }
              
              console.log('✅ Badge upgrade successful:', awardResult);
            } else {
              console.log('ℹ️ Badge award API returned no upgrade:', awardResult);
            }
          } else if (awardResponse) {
            const errorText = await awardResponse.text();
            console.error('❌ Badge award API failed:', {
              customer_id: tab.customer_id,
              bar_id: tab.bar_id,
              badge_level: earnedSpendTier,
              status: awardResponse.status,
              error: errorText
            });
            
            showToast({
              type: 'error',
              title: 'Unable to update loyalty status',
              message: 'Please refresh the page to see your current status.',
              duration: 5000
            });
          }
        } catch (error) {
          console.error('❌ Error awarding badge:', {
            customer_id: tab.customer_id,
            bar_id: tab.bar_id,
            badge_level: earnedSpendTier,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          });
          
          showToast({
            type: 'error',
            title: 'Unable to update loyalty status',
            message: 'Please refresh the page to see your current status.',
            duration: 5000
          });
        }
      }

      if (globalBadgeLevel) {
        setSpendTier(globalBadgeLevel);
        console.log('💳 Using global badge for discount:', globalBadgeLevel);
      } else if (earnedSpendTier) {
        setSpendTier(earnedSpendTier);
        console.log('💳 Using locally earned tier for discount:', earnedSpendTier);
      } else {
        setSpendTier(null);
        console.log('💳 No badge tier - normal pricing');
      }

      console.log('✅ Loyalty data loading complete:', {
        globalBadge: globalBadgeLevel,
        spendTier: globalBadgeLevel || earnedSpendTier,
        weeklyVisits,
        venueDiscounts,
        visitBonuses
      });

    } catch (error) {
      console.error('❌ Error loading loyalty data:', error);
    }
  }, [tab?.customer_id, tab?.bar_id, barName, notificationPrefs.soundEnabled, notificationPrefs.vibrationEnabled, buzz, playAcceptanceSound, showToast, tierRank]);

  // Render loyalty icons
  const renderLoyaltyIcons = useCallback(() => {
    if (!globalBadge && (!loyaltyData || loyaltyData.visitTier === 'new')) return null;
    
    const badgeLevel = globalBadge?.badge_level || loyaltyData?.spendTier;
    
    let IconComponent = null;
    let iconColor = 'text-white';
    
    if (badgeLevel === 'platinum') {
      IconComponent = Crown;
      iconColor = 'text-purple-300';
    } else if (badgeLevel === 'gold') {
      IconComponent = Crown;
      iconColor = 'text-yellow-300';
    } else if (badgeLevel === 'silver') {
      IconComponent = Shield;
      iconColor = 'text-gray-300';
    } else if (badgeLevel === 'bronze') {
      IconComponent = Circle;
      iconColor = 'text-amber-400';
    }
    
    if (!IconComponent) return null;
    
    const visitTier = loyaltyData?.visitTier || 'new';
    const iconCount = visitTier === 'gold' ? 3 : visitTier === 'silver' ? 2 : 1;
    
    return (
      <div className="flex gap-0.5 items-center">
        {Array.from({ length: iconCount }).map((_, i) => (
          <IconComponent 
            key={i} 
            className={`w-3.5 h-3.5 ${iconColor} drop-shadow`}
            size={14} 
            strokeWidth={2.5}
            fill={badgeLevel === 'silver' ? 'currentColor' : 'none'}
          />
        ))}
      </div>
    );
  }, [globalBadge, loyaltyData]);

  // Load loyalty data and venue discounts when tab changes
  useEffect(() => {
    if (!tab?.bar_id) return;
    calculateAverageResponseTime(tab.bar_id);
    loadLoyaltyData();
  }, [tab?.bar_id, tab?.customer_id, calculateAverageResponseTime, loadLoyaltyData]);

  // Load notification preferences
  const loadNotificationPrefs = useCallback(async () => {
    if (!tab) return;

    try {
      const tabData = tab as {
        sound_enabled?: boolean;
        vibration_enabled?: boolean;
        notes?: string;
      };

      const soundEnabled = tabData.sound_enabled ?? true;
      const vibrationEnabled = tabData.vibration_enabled ?? true;

      let notificationsEnabled = true;
      if (tabData.notes) {
        try {
          const notes = JSON.parse(tabData.notes);
          if (typeof notes.notifications_enabled !== 'undefined') {
            notificationsEnabled = notes.notifications_enabled;
          } else {
            notificationsEnabled = soundEnabled || vibrationEnabled;
          }
        } catch (e) {
          notificationsEnabled = soundEnabled || vibrationEnabled;
        }
      } else {
        notificationsEnabled = soundEnabled || vibrationEnabled;
      }

      setNotificationPrefs({
        notificationsEnabled,
        soundEnabled,
        vibrationEnabled
      });
      
      console.log('🔔 Loaded notification preferences:', {
        notificationsEnabled,
        soundEnabled,
        vibrationEnabled,
        fromNotes: !!tabData.notes
      });
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      setNotificationPrefs({
        notificationsEnabled: true,
        soundEnabled: true,
        vibrationEnabled: true
      });
    }
  }, [tab]);

  useEffect(() => {
    if (tab?.id) {
      loadNotificationPrefs();
    }
  }, [tab?.id, loadNotificationPrefs]);

  // Real-time subscription handlers
  const handleOrderUpdate = useCallback((payload: any) => {
    console.log('📦 [REALTIME] Order UPDATE received:', {
      eventType: payload.eventType,
      orderId: payload.new?.id,
      oldStatus: payload.old?.status,
      newStatus: payload.new?.status,
      initiatedBy: payload.new?.initiated_by,
      timestamp: new Date().toISOString()
    });

    try {
      if (!payload.new || !payload.new.id) {
        console.error('❌ [REALTIME] Invalid order update payload:', payload);
        return;
      }

      const updatedOrder = payload.new as TabOrder;

      setOrders(prevOrders => {
        console.log('🔄 [REALTIME] Updating orders state:', {
          previousCount: prevOrders.length,
          updatedOrderId: updatedOrder.id
        });

        const newOrders = updateOrderInList(prevOrders, updatedOrder);

        console.log('✅ [REALTIME] Orders state updated:', {
          newCount: newOrders.length,
          updatedOrder: {
            id: updatedOrder.id,
            status: updatedOrder.status,
            initiatedBy: updatedOrder.initiated_by
          }
        });

        return newOrders;
      });

      const isCustomerApproval = (
        payload.new?.status === 'confirmed' && 
        payload.old?.status === 'pending' && 
        payload.new?.initiated_by === 'staff'
      );

      if (isCustomerApproval && !processedOrders.has(payload.new.id)) {
        console.log('✅ [REALTIME] Customer approved staff order:', payload.new.id);
        setProcessedOrders(prev => new Set([...prev, payload.new.id]));
        
        showToast({
          type: 'success',
          title: 'Order Approved!',
          message: 'Staff order has been approved and will be prepared'
        });
        
        setShowRejectModal(false);
      }

      const isCustomerRejection = (
        payload.new?.status === 'cancelled' && 
        payload.old?.status === 'pending' && 
        payload.new?.initiated_by === 'staff' &&
        payload.new?.cancelled_by === 'customer'
      );

      if (isCustomerRejection && !processedOrders.has(payload.new.id)) {
        console.log('❌ [REALTIME] Customer rejected staff order:', payload.new.id);
        setProcessedOrders(prev => new Set([...prev, payload.new.id]));
        
        showToast({
          type: 'info',
          title: 'Order Rejected',
          message: 'Staff order has been rejected'
        });
        
        setShowRejectModal(false);
      }

      const isStaffAcceptance = (
        payload.new?.status === 'confirmed' && 
        payload.old?.status === 'pending' && 
        payload.new?.initiated_by === 'customer'
      );

      if (isStaffAcceptance && !processedOrders.has(payload.new.id)) {
        console.log('🎉 [REALTIME] Staff accepted customer order:', payload.new.id);
        setProcessedOrders(prev => new Set([...prev, payload.new.id]));
        
        buzz([200, 100, 200]);
        playAcceptanceSound();
        
        setAcceptanceModal({
          show: true,
          orderTotal: payload.new.total,
          message: 'Your order has been accepted and is being prepared'
        });

        setLoyaltyData(prev => {
          if (!prev) return prev;
          const prompt = buildSpendPrompt(prev.totalSpend, venueDiscounts, prev.spendTier, venueThresholds);
          if (prompt) setSpendPrompt(prompt);
          return prev;
        });
      }

    } catch (error) {
      console.error('❌ [REALTIME] Error handling order update:', error);
      if (tab?.id) {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        fetch(`${baseUrl}/api/tabs/${tab.id}/orders`)
          .then(res => res.ok ? res.json() : Promise.reject(res.status))
          .then(({ orders }) => {
            setOrders(orders || []);
            console.log('✅ [REALTIME] Orders refetched successfully via API route');
          })
          .catch(err => console.error('❌ [REALTIME] Fallback refetch failed:', err));
      }
    }
  }, [tab?.id, processedOrders, buzz, playAcceptanceSound, showToast, buildSpendPrompt, venueDiscounts, venueThresholds]);

  const handleOrderInsert = useCallback((payload: any) => {
    console.log('➕ [REALTIME] Order INSERT received:', {
      eventType: payload.eventType,
      orderId: payload.new?.id,
      status: payload.new?.status,
      initiatedBy: payload.new?.initiated_by,
      timestamp: new Date().toISOString()
    });

    try {
      if (!payload.new || !payload.new.id) {
        console.error('❌ [REALTIME] Invalid order insert payload:', payload);
        return;
      }

      const newOrder = payload.new as TabOrder;

      setOrders(prevOrders => {
        console.log('🔄 [REALTIME] Adding order to state:', {
          previousCount: prevOrders.length,
          newOrderId: newOrder.id
        });

        const updatedOrders = addOrderToList(prevOrders, newOrder);

        console.log('✅ [REALTIME] Order added to state:', {
          newCount: updatedOrders.length,
          newOrder: {
            id: newOrder.id,
            status: newOrder.status,
            initiatedBy: newOrder.initiated_by
          }
        });

        return updatedOrders;
      });

      if (newOrder.initiated_by === 'staff' && newOrder.status === 'pending') {
        console.log('📢 [REALTIME] New staff order requires approval:', newOrder.id);
        
        showToast({
          type: 'info',
          title: 'New Order from Staff',
          message: 'Please review and approve the order',
          duration: 8000
        });

        buzz([200, 100, 200]);
        playAcceptanceSound();
      }

    } catch (error) {
      console.error('❌ [REALTIME] Error handling order insert:', error);
      if (tab?.id) {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        fetch(`${baseUrl}/api/tabs/${tab.id}/orders`)
          .then(res => res.ok ? res.json() : Promise.reject(res.status))
          .then(({ orders }) => {
            setOrders(orders || []);
            console.log('✅ [REALTIME] Orders refetched successfully via API route');
          })
          .catch(err => console.error('❌ [REALTIME] Fallback refetch failed:', err));
      }
    }
  }, [tab?.id, buzz, playAcceptanceSound, showToast]);

  const handleOrderDelete = useCallback((payload: any) => {
    console.log('🗑️ [REALTIME] Order DELETE received:', {
      eventType: payload.eventType,
      orderId: payload.old?.id,
      timestamp: new Date().toISOString()
    });

    try {
      if (!payload.old || !payload.old.id) {
        console.error('❌ [REALTIME] Invalid order delete payload:', payload);
        return;
      }

      const deletedOrderId = payload.old.id;

      setOrders(prevOrders => {
        console.log('🔄 [REALTIME] Removing order from state:', {
          previousCount: prevOrders.length,
          deletedOrderId
        });

        const updatedOrders = removeOrderFromList(prevOrders, deletedOrderId);

        console.log('✅ [REALTIME] Order removed from state:', {
          newCount: updatedOrders.length
        });

        return updatedOrders;
      });

    } catch (error) {
      console.error('❌ [REALTIME] Error handling order delete:', error);
      if (tab?.id) {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        fetch(`${baseUrl}/api/tabs/${tab.id}/orders`)
          .then(res => res.ok ? res.json() : Promise.reject(res.status))
          .then(({ orders }) => {
            setOrders(orders || []);
            console.log('✅ [REALTIME] Orders refetched successfully via API route');
          })
          .catch(err => console.error('❌ [REALTIME] Fallback refetch failed:', err));
      }
    }
  }, [tab?.id]);

  // Set up real-time subscriptions
  const realtimeConfigs = useMemo(() => {
    if (!tab?.id) return [];
    
    return [
      {
        channelName: `tab-orders-${tab.id}`,
        table: 'tab_orders',
        filter: `tab_id=eq.${tab.id}`,
        event: '*' as const,
        handler: async (payload: any) => {
          if (payload.eventType === 'UPDATE') {
            handleOrderUpdate(payload);
          } else if (payload.eventType === 'INSERT') {
            handleOrderInsert(payload);
          } else if (payload.eventType === 'DELETE') {
            handleOrderDelete(payload);
          }
        }
      },
      {
        channelName: `tab-status-${tab.id}`,
        table: 'tabs',
        filter: `id=eq.${tab.id}`,
        event: '*' as const,
        handler: async (payload: any) => {
          console.log('📋 Real-time tab update:', payload);
          if (payload.eventType === 'UPDATE') {
            const updatedTab = payload.new as Tab;
            
            if (updatedTab.status === 'closed') {
              console.log('🛑 Tab was closed, redirecting to home');
              sessionStorage.removeItem('currentTab');
              sessionStorage.removeItem('cart');
              router.replace('/');
              return;
            }
            
            if (!supabase) return;
            
            const { data: fullTab, error } = await supabase
              .from('tabs')
              .select('*, bar:bars(id, name, location)')
              .eq('id', tab.id)
              .maybeSingle();
            
            if (!error && fullTab) {
              setTab(fullTab as Tab);
              setBarName((fullTab as any).bar?.name || 'Bar');
              
              let name = 'Your Tab';
              if ((fullTab as any).notes) {
                try {
                  const notes = JSON.parse((fullTab as any).notes);
                  if (notes.has_nickname && notes.display_name) {
                    name = notes.display_name;
                  } else {
                    name = notes.display_name || `Tab ${(fullTab as any).tab_number || ''}`;
                  }
                } catch (e) {
                  name = (fullTab as any).tab_number ? `Tab ${(fullTab as any).tab_number}` : 'Your Tab';
                }
              } else if ((fullTab as any).tab_number) {
                name = `Tab ${(fullTab as any).tab_number}`;
              }
              setDisplayName(name);
            }
          }
        }
      },
      {
        channelName: `tab-payments-${tab.id}`,
        table: 'tab_payments',
        filter: `tab_id=eq.${tab.id}`,
        event: '*' as const,
        handler: async (payload: any) => {
          if (payload.eventType === 'SUBSCRIPTION_READY') {
            console.log('💳 Payment subscription established:', { 
              tabId: tab.id, 
              channelName: `tab-payments-${tab.id}`,
              timestamp: new Date().toISOString()
            });
          }
          
          console.log('💳 Real-time payment update:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const payment = payload.new;
            const previousPayment = payload.old;
            
            console.log('💳 Customer payment subscription update:', {
              eventType: payload.eventType,
              paymentId: payment?.id,
              status: payment?.status,
              previousStatus: previousPayment?.status,
              amount: payment?.amount,
              method: payment?.method
            });
            
            if ((payment?.status === 'success' || payment?.status === 'completed') && 
                (!previousPayment || (previousPayment.status !== 'success' && previousPayment.status !== 'completed'))) {
              
              console.log('✅ Payment successful - processing customer confirmation:', payment);
              
              const paymentAmount = parseFloat(payment.amount);
              const paymentMethod = payment.method || 'unknown';
              let mpesaReceipt = null;
              let transactionDate = null;
              
              if (paymentMethod === 'mpesa' && payment.metadata) {
                try {
                  const metadata = payment.metadata;
                  if (metadata.Body?.stkCallback?.CallbackMetadata?.Item) {
                    const items = metadata.Body.stkCallback.CallbackMetadata.Item;
                    const receiptItem = items.find((item: any) => item.Name === 'MpesaReceiptNumber');
                    const dateItem = items.find((item: any) => item.Name === 'TransactionDate');
                    
                    if (receiptItem) mpesaReceipt = receiptItem.Value.toString();
                    if (dateItem) {
                      const dateStr = dateItem.Value.toString();
                      const year = parseInt(dateStr.substring(0, 4));
                      const month = parseInt(dateStr.substring(4, 6)) - 1;
                      const day = parseInt(dateStr.substring(6, 8));
                      const hour = parseInt(dateStr.substring(8, 10));
                      const minute = parseInt(dateStr.substring(10, 12));
                      const second = parseInt(dateStr.substring(12, 14));
                      transactionDate = new Date(year, month, day, hour, minute, second);
                    }
                  }
                } catch (error) {
                  console.error('Error parsing M-Pesa metadata:', error);
                }
              }
              
              console.log('Payment processed, balance will update via real-time subscriptions:', {
                paymentId: payment.id,
                tabId: tab.id,
                amount: paymentAmount,
                method: paymentMethod
              });
              
              const confirmationMessage = [
                `${tempFormatCurrency(paymentAmount)} payment successful`,
                mpesaReceipt ? `Receipt: ${mpesaReceipt}` : null
              ].filter(Boolean).join(' • ');
              
              showToast({
                type: 'success',
                title: '✅ Payment Confirmed!',
                message: confirmationMessage,
                duration: 8000
              });
              
              if (notificationPrefs.soundEnabled) {
                playAcceptanceSound();
              }
              if (notificationPrefs.vibrationEnabled) {
                buzz([200, 100, 200]);
              }
              
              console.log('🏆 Payment completed - scheduling badge recalculation in 2 seconds');
              setTimeout(() => {
                console.log('🏆 Executing delayed badge recalculation');
                loadLoyaltyData();
              }, 2000);
            }
            
            else if (payment?.status === 'failed' && 
                     (!previousPayment || previousPayment.status !== 'failed')) {
              
              console.log('❌ Payment failed - showing customer error:', payment);
              
              const paymentAmount = parseFloat(payment.amount);
              let failureReason = 'Payment was declined';
              
              if (payment.metadata) {
                try {
                  if (payment.metadata.Body?.stkCallback?.ResultDesc) {
                    failureReason = payment.metadata.Body.stkCallback.ResultDesc;
                  } else if (payment.metadata.failure_reason) {
                    failureReason = payment.metadata.failure_reason;
                  }
                } catch (error) {
                  console.error('Error parsing failure metadata:', error);
                }
              }
              
              showToast({
                type: 'error',
                title: '❌ Payment Failed',
                message: `${tempFormatCurrency(paymentAmount)} payment failed: ${failureReason}. Please try again or use a different payment method.`,
                duration: 10000
              });
              
              if (notificationPrefs.vibrationEnabled) {
                buzz([100, 50, 100, 50, 100]);
              }
            }
            
            else if (payment?.status === 'pending' && 
                     (!previousPayment || previousPayment.status !== 'pending')) {
              
              console.log('⏳ Payment processing - showing customer status:', payment);
              
              const paymentAmount = parseFloat(payment.amount);
              
              showToast({
                type: 'info',
                title: '⏳ Payment Processing',
                message: `${tempFormatCurrency(paymentAmount)} payment is being processed. Please wait for confirmation.`,
                duration: 5000
              });
            }
            
            else if ((payment?.status === 'cancelled' || payment?.status === 'timeout') && 
                     previousPayment && previousPayment.status !== payment.status) {
              
              console.log('⏰ Payment cancelled/timeout - showing customer notification:', payment);
              
              const paymentAmount = parseFloat(payment.amount);
              const statusText = payment.status === 'timeout' ? 'timed out' : 'was cancelled';
              
              showToast({
                type: 'error',
                title: '❌ Payment Not Completed',
                message: `${tempFormatCurrency(paymentAmount)} payment ${statusText}. Please try again.`,
                duration: 8000
              });
            }
          }
          
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
          const paymentsRes = await fetch(`${baseUrl}/api/tabs/${tab.id}/payments`);
          if (paymentsRes.ok) {
            const { payments: paymentsData } = await paymentsRes.json();
            setPayments(paymentsData || []);
          }
        }
      },
      {
        channelName: `tab-messages-${tab.id}`,
        table: 'tab_telegram_messages',
        filter: `tab_id=eq.${tab.id}`,
        event: '*' as const,
        handler: async (payload: any) => {
          console.log('📩 Telegram message real-time update:', {
            event: payload.eventType,
            new: payload.new,
            old: payload.old
          });

          const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
          try {
            const res = await fetch(`${baseUrl}/api/tabs/${tab.id}/messages`);
            if (!res.ok) return;
            const { messages } = await res.json();
            if (messages) {
              const messagesWithBarName = messages.map((msg: any) => ({
                ...msg,
                bar_name: msg.tab?.bars?.name || null
              }));
              setTelegramMessages(messagesWithBarName);

              const unreadCount = messages.filter((msg: any) => {
                if (msg.initiated_by !== 'staff') return false;
                const lastRead = sessionStorage.getItem('messages_last_read');
                if (!lastRead) return true;
                return new Date(msg.created_at) > new Date(lastRead);
              }).length;
              setUnreadMessagesCount(unreadCount);
            }
          } catch (err) {
            console.error('❌ Error refreshing messages after realtime event:', err);
          }

          if (payload.new?.initiated_by === 'staff' && 
              payload.eventType === 'INSERT') {
            playCustomerNotification(notificationPrefs.soundEnabled, notificationPrefs.vibrationEnabled);
            setNewMessageAlert({
              type: 'acknowledged',
              message: 'Staff responded to your message',
              timestamp: new Date().toISOString(),
              messageContent: payload.new.message
            });
            setTimeout(() => setNewMessageAlert(null), 5000);
          }

          if (payload.new?.status === 'acknowledged' && 
              payload.old?.status === 'pending' &&
              payload.new?.staff_acknowledged_at) {
            buzz([200, 100, 200]);
            playAcceptanceSound();
            setNewMessageAlert({
              type: 'acknowledged',
              message: 'Staff has acknowledged your message',
              timestamp: new Date().toISOString()
            });
            setTimeout(() => setNewMessageAlert(null), 5000);
          }
        }
      }
    ];
  }, [tab, handleOrderUpdate, handleOrderInsert, handleOrderDelete, router, showToast, playAcceptanceSound, buzz, notificationPrefs.soundEnabled, notificationPrefs.vibrationEnabled, loadLoyaltyData]);

  const { connectionStatus, retryCount, reconnect, isConnected } = useRealtimeSubscription(
    supabase ? realtimeConfigs : [],
    [tab?.id],
    {
      maxRetries: 10,
      retryDelay: [1000, 2000, 5000, 10000, 30000, 60000],
      debounceMs: 300,
      onConnectionChange: (status) => {
        console.log('📡 Connection status changed:', status);
        setShowConnectionStatus(status !== 'connected');
      }
    }
  );

  // Image zoom handlers
  const handleImageZoomIn = useCallback(() => {
    setImageScale(prev => Math.min(prev + 0.25, 3));
  }, []);

  const handleImageZoomOut = useCallback(() => {
    setImageScale(prev => Math.max(prev - 0.25, 0.5));
  }, []);

  const handleImageFitWidth = useCallback(() => {
    setImageScale(1);
  }, []);

  const toggleCart = useCallback(() => {
    if (paymentRef.current) {
      paymentRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const toggleStaticMenu = useCallback(() => {
    setShowStaticMenu(prev => !prev);
  }, []);

  const getPendingOrderTime = useCallback(() => {
    const pendingCustomerOrders = orders.filter(o => o.status === 'pending' && o.initiated_by === 'customer');
    if (pendingCustomerOrders.length === 0) {
      sessionStorage.removeItem('oldestPendingCustomerOrderTime');
      return null;
    }
    const oldestPendingOrder = pendingCustomerOrders.reduce((oldest, current) => {
      return new Date(current.created_at) < new Date(oldest.created_at) ? current : oldest;
    }, pendingCustomerOrders[0]);
    const storedSubmissionTimeStr = sessionStorage.getItem('oldestPendingCustomerOrderTime');
    let orderTime;
    if (storedSubmissionTimeStr) {
      orderTime = new Date(storedSubmissionTimeStr).getTime();
    } else {
      orderTime = new Date(oldestPendingOrder.created_at).getTime();
      sessionStorage.setItem('oldestPendingCustomerOrderTime', new Date(orderTime).toISOString());
    }
    const currentTimeNow = Date.now();
    const elapsedSeconds = Math.floor((currentTimeNow - orderTime) / 1000);
    return {
      elapsed: elapsedSeconds,
      orderTime: orderTime,
      submissionTime: new Date(orderTime).toISOString()
    };
  }, [orders]);

  // Load payment settings
  const loadPaymentSettings = useCallback(async (barId: string) => {
    if (!supabase) return;
    
    try {
      console.log('💳 Loading payment settings for bar:', barId);
      const { data, error } = await supabase
        .from('bars')
        .select('mpesa_enabled, payment_cash_enabled, payment_card_enabled')
        .eq('id', barId)
        .single();

      if (error) {
        console.error('Error loading payment settings:', error);
        setPaymentSettings({
          mpesa_enabled: false,
          card_enabled: false,
          cash_enabled: true
        });
      } else if (data) {
        console.log('✅ Payment settings loaded:', data);
        const paymentData = data as {
          mpesa_enabled?: boolean;
          payment_cash_enabled?: boolean;
          payment_card_enabled?: boolean;
        };
        setPaymentSettings({
          mpesa_enabled: paymentData.mpesa_enabled ?? false,
          card_enabled: paymentData.payment_card_enabled ?? false,
          cash_enabled: paymentData.payment_cash_enabled ?? true
        });

        if (paymentData.mpesa_enabled) {
          setActivePaymentMethod('mpesa');
        } else if (paymentData.payment_card_enabled) {
          setActivePaymentMethod('cards');
        } else if (paymentData.payment_cash_enabled ?? true) {
          setActivePaymentMethod('cash');
        }
      }
    } catch (error) {
      console.error('Error in loadPaymentSettings:', error);
      setPaymentSettings({
        mpesa_enabled: false,
        card_enabled: false,
        cash_enabled: true
      });
    } finally {
      setLoadingPaymentSettings(false);
    }
  }, []);

  // Load tab data
  const loadTabData = useCallback(async () => {
    console.log('📋 Menu page: loadTabData called');
    const tabData = sessionStorage.getItem('currentTab');
    console.log('📦 Menu page: Retrieved tab data from sessionStorage:', tabData ? 'Found' : 'Not found');
    if (!tabData) {
      console.error('❌ Menu page: No tab data found in sessionStorage');
      router.replace('/');
      return;
    }
    let currentTab;
    try {
      currentTab = JSON.parse(tabData);
      console.log('✅ Menu page: Parsed tab data:', currentTab.id);
      if (!currentTab?.id) {
        throw new Error('Invalid tab data - missing ID');
      }
    } catch (error) {
      console.error('❌ Menu page: Invalid session data', error);
      sessionStorage.removeItem('currentTab');
      sessionStorage.removeItem('cart');
      router.replace('/');
      return;
    }
    try {
      console.log('🔍 Menu page: Fetching full tab data via API...');

      const tabResponse = await fetch(`/api/tabs/${currentTab.id}`);
      const tabBody = await tabResponse.json().catch(() => ({}));

      if (!tabResponse.ok && tabResponse.status !== 404) {
        throw new Error(tabBody.error || 'Failed to fetch tab');
      }

      const fullTab = tabResponse.ok ? (tabBody.tab ?? null) : null;

      if (!fullTab) {
        console.error('❌ Menu page: Tab not found in database');
        sessionStorage.removeItem('currentTab');
        sessionStorage.removeItem('cart');
        router.replace('/');
        return;
      }

      if (fullTab.status === 'closed') {
        console.log('🛑 Tab is closed, redirecting to home');
        sessionStorage.removeItem('currentTab');
        sessionStorage.removeItem('cart');
        router.replace('/');
        return;
      }

      console.log('✅ Menu page: Full tab loaded:', fullTab);
      setTab(fullTab as Tab);
      setBarName((fullTab as any).bar?.name || 'Bar');
      setCrewMember((fullTab as any).crew_member || null);
      
      if ((fullTab as any).bar?.id) {
        loadPaymentSettings((fullTab as any).bar.id);
      }
      
      let name = 'Your Tab';
      if ((fullTab as any).notes) {
        try {
          const notes = JSON.parse((fullTab as any).notes);
          if (notes.has_nickname && notes.display_name) {
            name = notes.display_name;
          } else {
            name = notes.display_name || `Tab ${(fullTab as any).tab_number || ''}`;
          }
        } catch (e) {
          name = (fullTab as any).tab_number ? `Tab ${(fullTab as any).tab_number}` : 'Your Tab';
        }
      } else if ((fullTab as any).tab_number) {
        name = `Tab ${(fullTab as any).tab_number}`;
      }
      setDisplayName(name);

      if ((fullTab as any).bar?.id) {
        try {
          const { data: categoriesData, error: categoriesError } = await supabase
            .from('categories')
            .select('name')
            .order('name');
          if (categoriesError) {
            console.error('Error loading categories:', categoriesError);
            const uniqueCategories = Array.from(new Set(
              barProducts.map(bp => bp.product?.category).filter(Boolean)
            )).sort().map(catName => ({ name: catName }));
            setCategories(uniqueCategories);
          } else {
            console.log('📊 Customer loaded categories:', categoriesData);
            setCategories(categoriesData || []);
          }
        } catch (error) {
          console.error('Error loading categories:', error);
        }

        try {
          const { data: barProductsData, error: barProductsError } = await supabase
            .from('bar_products')
            .select('id, bar_id, product_id, custom_product_id, name, description, category, image_url, sale_price, active')
            .eq('bar_id', (fullTab as any).bar.id)
            .eq('active', true);

          if (barProductsError) {
            console.error('Error loading bar products:', barProductsError);
          } else if (barProductsData && barProductsData.length > 0) {
            const transformedProducts = barProductsData.map((bp: any) => ({
              id: bp.id,
              bar_id: bp.bar_id,
              product_id: bp.product_id || bp.custom_product_id,
              sale_price: bp.sale_price,
              active: bp.active,
              product: {
                id: bp.product_id || bp.custom_product_id,
                name: bp.name,
                description: bp.description || '',
                category: bp.category || 'Uncategorized',
                image_url: bp.image_url
              }
            }));
            setBarProducts(transformedProducts as BarProduct[]);
          }
        } catch (error) {
          console.error('Error loading products:', error);
        }
        
        try {
          console.log('🏢 Loading bar table configuration for bar:', (fullTab as any).bar.id);
          const { data: barData, error: barError } = await supabase
            .from('bars')
            .select('table_count, table_setup_enabled')
            .eq('id', (fullTab as any).bar.id)
            .single();

          console.log('📊 Bar data result:', { barData, barError });

          if (!barError && barData) {
            const tableCount = (barData as any).table_count || 0;
            const tableSetupEnabled = (barData as any).table_setup_enabled || false;
            
            console.log('🔧 Table setup config:', { tableCount, tableSetupEnabled });
            
            if (tableSetupEnabled && tableCount > 0) {
              const tables = Array.from({ length: tableCount }, (_, i) => i + 1);
              console.log('🪑 Generated tables array:', tables);
              setBarTables(tables);
              setTableSelectionRequired(true);
              
              const tabNotes = (fullTab as any).notes;
              let hasTableAssigned = false;
              console.log('📝 Tab notes:', tabNotes);
              if (tabNotes) {
                try {
                  const notes = JSON.parse(tabNotes);
                  if (notes.table_number) {
                    console.log('✅ Table already assigned:', notes.table_number);
                    setSelectedTable(notes.table_number);
                    hasTableAssigned = true;
                  }
                } catch (e) {
                  console.log('❌ Error parsing tab notes:', e);
                }
              }
              
              const isNewTab = sessionStorage.getItem('just_created_tab') === 'true';
              if (!hasTableAssigned && isNewTab) {
                console.log('⏰ New tab — setting up table selection modal with delay...');
                const modalTimeout = setTimeout(() => {
                  console.log('🪑 Showing table selection modal');
                  setShowTableModal(true);
                }, 2000);
                (window as any).tableSelectionTimeouts = [modalTimeout];
              }
            } else {
              console.log('❌ Table setup not enabled or no tables configured');
            }
          } else {
            console.log('❌ Error loading bar data or no data found');
          }
        } catch (error) {
          console.error('Error loading bar table configuration:', error);
        }
      }

      try {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const ordersResponse = await fetch(`${baseUrl}/api/tabs/${currentTab.id}/orders`);
        if (ordersResponse.ok) {
          const { orders } = await ordersResponse.json();
          setOrders(orders || []);
        } else {
          console.error('Error loading orders via API route:', ordersResponse.status);
        }
      } catch (error) {
        console.error('Error loading orders:', error);
      }

      try {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const paymentsResponse = await fetch(`${baseUrl}/api/tabs/${currentTab.id}/payments`);
        if (paymentsResponse.ok) {
          const { payments: paymentsData } = await paymentsResponse.json();
          setPayments(paymentsData || []);
        } else {
          console.error('Error loading payments via API route:', paymentsResponse.status);
        }
      } catch (error) {
        console.error('Error loading payments:', error);
      }
      
      if ((fullTab as any).bar?.id) {
        try {
          const { data: barData, error: barError } = await supabase
            .from('bars')
            .select('menu_type, static_menu_url, static_menu_type')
            .eq('id', (fullTab as any).bar.id)
            .single();

          if (!barError && barData) {
            setMenuType((barData as any).menu_type || 'interactive');
            setStaticMenuUrl((barData as any).static_menu_url);
            setStaticMenuType((barData as any).static_menu_type);
            
            if ((barData as any).menu_type === 'static' && ((barData as any).static_menu_url || (barData as any).static_menu_type === 'slideshow')) {
              setShowStaticMenu(true);
            }

            if ((barData as any).static_menu_type === 'slideshow') {
              try {
                const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
                const apiUrl = `${baseUrl}/api/get-slideshow?barId=${(fullTab as any).bar.id}`;
                console.log('🔄 Calling slideshow API:', apiUrl);

                const resp = await fetch(apiUrl);
                console.log('📊 API Response status:', resp.status, resp.ok);

                if (resp.ok) {
                  const json = await resp.json();
                  console.log('✅ Slideshow API response:', json);
                  setSlideshowImages(json.images || []);
                  setSlideshowSettings(json.settings ?? null);
                  setCurrentSlideIndex(0);
                  setIsSlideshowPlaying(false);

                  if (json.images && json.images.length > 0) {
                    setShowStaticMenu(true);
                  }
                  return;
                }

                console.warn('Failed to fetch slideshow images', resp.status, await resp.text());

                try {
                  const altUrl = `${baseUrl}/api/admin/slideshow-status?barId=${(fullTab as any).bar.id}`;
                  console.log('🔁 Trying admin fallback:', altUrl);
                  const altResp = await fetch(altUrl);
                  console.log('📊 Admin fallback status:', altResp.status, altResp.ok);
                  if (altResp.ok) {
                    const altJson = await altResp.json();
                    if (altJson?.images) {
                      setSlideshowImages(altJson.images.map((img: any) => img.image_url));
                      setShowStaticMenu(true);
                    }
                  }
                } catch (altErr) {
                  console.warn('Alternative fetch also failed:', altErr);
                }
              } catch (err) {
                console.warn('Error fetching slideshow images', err);

                try {
                  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
                  const altUrl = `${baseUrl}/api/admin/slideshow-status?barId=${(fullTab as any).bar.id}`;
                  console.log('🔁 Trying admin fallback (catch):', altUrl);
                  const altResp = await fetch(altUrl);
                  if (altResp.ok) {
                    const altJson = await altResp.json();
                    if (altJson?.images) {
                      setSlideshowImages(altJson.images.map((img: any) => img.image_url));
                      setShowStaticMenu(true);
                    }
                  }
                } catch (altErr) {
                  console.warn('Alternative fetch also failed:', altErr);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error loading bar settings:', error);
        }
      }
    } catch (error) {
      console.error('Error loading tab:', error);
    } finally {
      setLoading(false);
    }
    getPendingOrderTime();
  }, [router, loadPaymentSettings, barProducts, getPendingOrderTime]);

  useEffect(() => {
    if (loadAttempted.current) {
      console.log('⏭️ Load already attempted, skipping...');
      return;
    }
    loadAttempted.current = true;
    console.log('🔄 Menu page: Starting loadTabData...');
    loadTabData();
  }, [loadTabData]);

  // Select table
  const selectTable = useCallback(async (tableNumber: number | null) => {
    console.log('🪑 selectTable called with:', tableNumber);
    if (!tab) {
      console.log('❌ No tab available');
      return;
    }
    
    try {
      const response = await fetch('/api/tabs/update-notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tabId: tab.id,
          notes: { table_number: tableNumber }
        })
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        console.error('❌ Error updating table number:', body);
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to assign table number'
        });
        return;
      }

      const { notes: updatedNotes } = await response.json();
      
      console.log('✅ Table number updated successfully');
      setSelectedTable(tableNumber);
      setShowTableModal(false);
      
      setTab(prev => prev ? { ...prev, notes: JSON.stringify(updatedNotes) } : null);
      sessionStorage.removeItem('just_created_tab');
      
      const tableText = tableNumber ? `Table ${tableNumber}` : 'No table selected';
      showToast({
        type: 'success',
        title: 'Table Selected',
        message: `You've been assigned to ${tableText}`
      });
      
    } catch (error) {
      console.error('❌ Error in selectTable:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to assign table number'
      });
    }
  }, [tab, showToast]);

  // Handle close tab
  const handleCloseTab = useCallback(async () => {
    try {
      if (!tab) {
        console.error('No tab to close');
        showToast({
          type: 'error',
          title: 'Error',
          message: 'No active tab found'
        });
        return;
      }

      const tabTotal = orders
        .filter(order => order.status === 'confirmed')
        .reduce((sum, order) => sum + parseFloat(order.total), 0);
      const paidTotal = payments
        .filter(payment => payment.status === 'success')
        .reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
      const currentBalance = tabTotal - paidTotal;

      if (currentBalance > 0) {
        showToast({
          type: 'error',
          title: 'Cannot Close Tab',
          message: `You have ${formatCurrency(currentBalance)} outstanding balance. Please pay at the bar before closing your tab.`
        });
        return;
      }

      const deviceId = document.cookie
        .split('; ')
        .find(row => row.startsWith('tabeza_device_id_v2=') || row.startsWith('tabeza_device_id='))
        ?.split('=')[1];

      console.log('🔒 Closing tab:', { tabId: tab.id, deviceId });

      const response = await fetch('/api/tabs/close', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-ID': deviceId || '',
        },
        body: JSON.stringify({
          tabId: tab.id,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('❌ Close tab failed:', { status: response.status, data: responseData });

        if (response.status === 400) {
          if (responseData.details?.balance) {
            showToast({
              type: 'error',
              title: 'Cannot Close Tab',
              message: `Outstanding balance: ${formatCurrency(responseData.details.balance)}. Please pay before closing.`
            });
          } else if (responseData.details?.pendingStaffOrders) {
            showToast({
              type: 'error',
              title: 'Cannot Close Tab',
              message: responseData.details.message || 'You have pending staff orders awaiting approval'
            });
          } else if (responseData.details?.pendingCustomerOrders) {
            showToast({
              type: 'error',
              title: 'Cannot Close Tab',
              message: responseData.details.message || 'You have pending orders not yet served'
            });
          } else {
            showToast({
              type: 'error',
              title: 'Cannot Close Tab',
              message: responseData.error || 'Please ensure all orders are confirmed and paid'
            });
          }
          return;
        }

        if (response.status === 401) {
          showToast({
            type: 'error',
            title: 'Unauthorized',
            message: 'This tab does not belong to your device'
          });
          return;
        }

        if (response.status === 404) {
          showToast({
            type: 'error',
            title: 'Tab Not Found',
            message: 'This tab no longer exists'
          });
          sessionStorage.removeItem('currentTab');
          sessionStorage.removeItem('cart');
          router.replace('/');
          return;
        }

        if (response.status === 503) {
          showToast({
            type: 'error',
            title: 'Connection Error',
            message: 'Unable to connect. Please check your internet connection and try again.'
          });
          return;
        }

        if (response.status === 500) {
          showToast({
            type: 'error',
            title: 'Server Error',
            message: responseData.message || 'An error occurred. Please try again or contact support.'
          });
          return;
        }

        showToast({
          type: 'error',
          title: 'Error',
          message: responseData.error || 'Failed to close tab. Please try again.'
        });
        return;
      }

      console.log('✅ Tab closed successfully');
      
      sessionStorage.removeItem('currentTab');
      sessionStorage.removeItem('cart');
      sessionStorage.removeItem('oldestPendingCustomerOrderTime');

      showToast({
        type: 'success',
        title: 'Tab Closed',
        message: responseData.message || 'Tab closed successfully. Thank you!'
      });

      router.replace('/');
      
    } catch (error: any) {
      console.error('❌ Error in handleCloseTab:', error);
      
      if (error.message?.includes('fetch') || error.name === 'TypeError') {
        showToast({
          type: 'error',
          title: 'Connection Error',
          message: 'Unable to connect. Please check your internet connection and try again.'
        });
      } else {
        showToast({
          type: 'error',
          title: 'Error',
          message: 'An unexpected error occurred while closing the tab'
        });
      }
    }
  }, [tab, orders, payments, showToast, router]);

  // Approve order
  const handleApproveOrder = useCallback(async (orderId: string) => {
    if (!tab?.id) return;

    setApprovingOrder(orderId);
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const response = await fetch(`${baseUrl}/api/tabs/${tab.id}/orders`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: 'confirmed' }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        console.error('Error approving order:', body.error);
        showToast({
          type: 'error',
          title: 'Failed to Approve Order',
          message: 'Please try again'
        });
        return;
      }

      showToast({
        type: 'success',
        title: 'Order Approved!',
        message: 'Staff order has been approved'
      });

      await loadTabData();

    } catch (error) {
      console.error('Error in handleApproveOrder:', error);
      showToast({
        type: 'error',
        title: 'Failed to Approve Order',
        message: 'An error occurred while approving the order'
      });
    } finally {
      setApprovingOrder(null);
    }
  }, [tab?.id, showToast, loadTabData]);

  // Reject order
  const handleRejectOrder = useCallback((orderId: string) => {
    console.log('🚫 handleRejectOrder called with orderId:', orderId);
    setRejectingOrderId(orderId);
    setSelectedRejectionReason('');
    setShowRejectModal(true);
  }, []);

  const confirmRejectOrder = useCallback(async () => {
    if (!rejectingOrderId || !selectedRejectionReason) {
      showToast({
        type: 'error',
        title: 'Missing Reason',
        message: 'Please select a reason for rejection'
      });
      return;
    }

    if (!tab?.id) return;

    setApprovingOrder(rejectingOrderId);
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const response = await fetch(`${baseUrl}/api/tabs/${tab.id}/orders`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: rejectingOrderId,
          status: 'cancelled',
          rejectionReason: selectedRejectionReason,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to reject order');
      }

      showToast({
        type: 'success',
        title: 'Order Rejected',
        message: 'The staff order has been rejected'
      });

      setShowRejectModal(false);
      setRejectingOrderId(null);
      setSelectedRejectionReason('');
      setProcessedOrders(prev => new Set([...prev, rejectingOrderId]));

      await loadTabData();

    } catch (error) {
      console.error('Error in confirmRejectOrder:', error);
      showToast({
        type: 'error',
        title: 'Rejection Failed',
        message: 'An error occurred while rejecting order'
      });
    } finally {
      setApprovingOrder(null);
    }
  }, [rejectingOrderId, selectedRejectionReason, tab?.id, showToast, loadTabData]);

  // Add to cart
  const addToCart = useCallback((barProduct: BarProduct, priceOverride?: number) => {
    const product = barProduct.product;
    if (!product) return;
    
    const newItem = {
      bar_product_id: barProduct.id,
      product_id: barProduct.product_id,
      name: product.name,
      price: priceOverride ?? barProduct.sale_price,
      category: product.category,
      image_url: product.image_url,
      quantity: 1
    };
    
    setCart(prev => {
      const newCart = [...prev, newItem];
      sessionStorage.setItem('cart', JSON.stringify(newCart));
      return newCart;
    });
    
    showToast({
      type: 'success',
      title: 'Added to Cart! 🛒',
      message: `${product.name} has been added to your cart`
    });
  }, [showToast]);

  // Update cart quantity
  const updateCartQuantity = useCallback((itemIndex: number, delta: number) => {
    setCart(prev => {
      const newCart = prev.map((item, idx) => {
        if (idx === itemIndex) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      }).filter(item => item.quantity > 0);
      sessionStorage.setItem('cart', JSON.stringify(newCart));
      return newCart;
    });
  }, []);

  // Confirm order
  const confirmOrder = useCallback(async () => {
    if (cart.length === 0 || !tab?.id) return;

    setSubmittingOrder(true);
    try {
      const orderItems = cart.map((item, index) => ({
        product_id: item.product_id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
        category: item.category,
        ...(isDrinkItem(item) && notColdPreferences[`cart-item-${index}`] && { not_cold: true })
      }));
      const orderTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const orderSubmissionTime = new Date().toISOString();

      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const response = await fetch(`${baseUrl}/api/tabs/${tab.id}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: orderItems, total: orderTotal, initiated_by: 'customer' }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to create order');
      }

      sessionStorage.setItem('oldestPendingCustomerOrderTime', orderSubmissionTime);
      sessionStorage.removeItem('cart');
      setCart([]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error('Error creating order:', error);
      showToast({
        type: 'error',
        title: 'Failed to Create Order',
        message: error.message || 'Please try again'
      });
    } finally {
      setSubmittingOrder(false);
    }
  }, [cart, tab?.id, isDrinkItem, notColdPreferences, showToast]);

  // These must be declared before processPayment which references them in its dependency array
  const tabTotal = useMemo(() => orders
    .filter(order => order.status === 'confirmed' && order.status !== 'cancelled')
    .reduce((sum, order) => sum + parseFloat(order.total), 0), [orders]);
  const paidTotal = useMemo(() => payments.filter(payment => payment.status === 'success').reduce((sum, payment) => sum + parseFloat(payment.amount), 0), [payments]);
  const balance = useMemo(() => tabTotal - paidTotal, [tabTotal, paidTotal]);

  // Computed values
  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const pendingStaffOrders = useMemo(() => orders.filter(o => o.status === 'pending' && o.initiated_by === 'staff').length, [orders]);

  // Process payment
  const processPayment = useCallback(async () => {
    if (activePaymentMethod === 'mpesa') {
      if (!tab?.id) {
        showToast({
          type: 'error',
          title: 'Tab Not Ready',
          message: 'Please wait for tab data to load before making payment'
        });
        return;
      }

      if (!phoneNumber.trim()) {
        showToast({
          type: 'error',
          title: 'Phone Number Required',
          message: 'Please enter your M-Pesa phone number'
        });
        return;
      }

      if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
        showToast({
          type: 'error',
          title: 'Amount Required',
          message: 'Please enter a valid payment amount'
        });
        return;
      }

      if (parseFloat(paymentAmount) > balance) {
        showToast({
          type: 'error',
          title: 'Amount Too High',
          message: 'Payment amount cannot exceed outstanding balance'
        });
        return;
      }

      const validation = validateMpesaPhoneNumber(phoneNumber);
      if (!validation.isValid) {
        showToast({
          type: 'error',
          title: 'Invalid Phone Number',
          message: validation.error || 'Please enter a valid M-Pesa phone number'
        });
        return;
      }

      try {
        setIsProcessing(true);
        
        const contextValidation = await validatePaymentContext();
        if (!contextValidation.isValid) {
          console.error('Menu payment context validation failed:', contextValidation.error);
          await logPaymentDebugInfo();
          throw new Error(contextValidation.error || 'Unable to initialize payment. Please refresh and try again.');
        }
        
        const { resolveCustomerIdentifier } = await import('../../lib/database-customer-identifier');
        const identifierResult = await resolveCustomerIdentifier();
        
        if (!identifierResult.success) {
          console.error('Failed to resolve customer identifier:', identifierResult.error);
          await logPaymentDebugInfo();
          throw new Error(identifierResult.error || 'Unable to find your active tab. Please refresh and try again.');
        }
        
        const { customerIdentifier, barId } = identifierResult;
        
        const paymentAmountNum = parseFloat(paymentAmount);
        if (isNaN(paymentAmountNum) || paymentAmountNum <= 0) {
          throw new Error('Invalid payment amount. Please enter a valid number.');
        }
        
        const phoneNumberToUse = validation.normalized;
        if (!phoneNumberToUse) {
          throw new Error('Invalid phone number format. Please check and try again.');
        }
        
        const paymentData = {
          barId,
          customerIdentifier,
          phoneNumber: phoneNumberToUse,
          amount: paymentAmountNum
        };
        
        if (!paymentData.barId || !paymentData.customerIdentifier || !paymentData.phoneNumber || !paymentData.amount) {
          console.error('Missing required payment fields:', paymentData);
          await logPaymentDebugInfo();
          throw new Error('Payment data incomplete. Please check all fields and try again.');
        }
        
        console.log('Menu payment context (from database):', { 
          barId, 
          customerIdentifier, 
          phoneNumber: phoneNumberToUse,
          amount: paymentAmountNum,
          tabId: identifierResult.tabId,
          tabNumber: identifierResult.tabNumber
        });
        
        const response = await fetch('/api/payments/mpesa', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tabId: identifierResult.tabId,
            phoneNumber: paymentData.phoneNumber,
            amount: paymentData.amount
          }),
        });

        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error('Failed to parse menu payment API response:', jsonError);
          throw new Error('Invalid response from payment service. Please try again.');
        }

        if (!response.ok) {
          console.error('Menu payment API error:', {
            status: response.status,
            statusText: response.statusText,
            error: data.error,
            details: data.details,
            paymentData
          });
          
          if (response.status === 400 && data.error?.includes('Missing required fields')) {
            await logPaymentDebugInfo();
          }
          
          throw new Error(data.error || `Payment failed with status ${response.status}`);
        }

        showToast({
          type: 'success',
          title: 'Payment Initiated',
          message: 'Check your phone for M-Pesa prompt and enter your PIN',
          duration: 8000
        });

        setPhoneNumber('');
        setPaymentAmount('');
        
        setTimeout(() => {
          loadTabData();
        }, 3000);

      } catch (error: any) {
        console.error('M-Pesa payment error:', error);
        showToast({
          type: 'error',
          title: 'Payment Failed',
          message: error.message || 'Unable to process M-Pesa payment. Please try again.'
        });
      } finally {
        setIsProcessing(false);
      }
    } else if (activePaymentMethod === 'cash') {
      showToast({
        type: 'info',
        title: 'Cash Payment',
        message: `Please pay ${tempFormatCurrency(balance)} at the bar. Staff will update your tab.`,
        duration: 8000
      });
    } else {
      showToast({
        type: 'info',
        title: 'Payment Method',
        message: 'Please pay at the bar using your preferred method',
        duration: 5000
      });
    }
  }, [activePaymentMethod, tab?.id, phoneNumber, paymentAmount, balance, showToast, loadTabData]);

  // Send telegram message
  const sendTelegramMessage = useCallback(async () => {
    if (!messageInput.trim() || !tab) {
      console.error('❌ No message or tab');
      return;
    }
    
    if (!supabase) return;
    
    setSendingMessage(true);
    
    try {
      console.log('📤 Sending telegram message:', {
        tabId: tab.id,
        message: messageInput.trim(),
        length: messageInput.trim().length
      });
      
      const { error: contextError } = await (supabase as any).rpc('set_bar_context', { p_bar_id: tab.bar_id });
      
      if (contextError) {
        console.warn('⚠️ Failed to set bar context:', contextError);
      }
      
      const { data, error: functionError } = await (supabase as any).rpc(
        'create_telegram_message',
        {
          p_tab_id: tab.id,
          p_message: messageInput.trim(),
          p_initiated_by: 'customer',
          p_metadata: {
            type: 'general',
            urgency: 'normal',
            character_count: messageInput.trim().length,
            platform: 'customer-web'
          }
        }
      );
      
      if (functionError) {
        console.warn('⚠️ Function failed, trying direct insert:', functionError);
        
        const { data: insertData, error: insertError } = await supabase
          .from('tab_telegram_messages')
          .insert({
            tab_id: tab.id,
            message: messageInput.trim(),
            order_type: 'telegram',
            status: 'pending',
            message_metadata: {
              type: 'general',
              urgency: 'normal',
              character_count: messageInput.trim().length,
              platform: 'customer-web'
            },
            customer_notified: true,
            customer_notified_at: new Date().toISOString(),
            initiated_by: 'customer'
          })
          .select()
          .single();
        
        if (insertError) {
          console.error('❌ Direct insert failed:', insertError);
          throw insertError;
        }
        
        console.log('✅ Message sent via direct insert:', insertData);
      } else {
        console.log('✅ Message sent via function:', data);
      }
      
      setMessageInput('');
      setShowMessageModal(false);
      setMessageSentModal(true);
      
      buzz([100]);
      
      setTimeout(() => {
        setMessageSentModal(false);
      }, 3000);
      
      await loadTelegramMessages();
      
    } catch (error: any) {
      console.error('❌ Error sending message:', error);
      showToast({
        type: 'error',
        title: 'Failed to Send Message',
        message: error.message || 'Please try again.'
      });
    } finally {
      setSendingMessage(false);
    }
  }, [messageInput, tab, buzz, showToast]);

  // Load telegram messages
  const loadTelegramMessages = useCallback(async () => {
    if (!tab) return;

    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const res = await fetch(`${baseUrl}/api/tabs/${tab.id}/messages`);
      if (!res.ok) {
        console.error('Error loading messages via API route:', res.status);
        return;
      }
      const { messages } = await res.json();
      if (messages) {
        const messagesWithBarName = messages.map((msg: any) => ({
          ...msg,
          bar_name: msg.tab?.bars?.name || null
        }));
        setTelegramMessages(messagesWithBarName);

        const unreadCount = messages.filter((msg: any) => {
          if (msg.initiated_by !== 'staff') return false;
          const lastRead = sessionStorage.getItem('messages_last_read');
          if (!lastRead) return true;
          return new Date(msg.created_at) > new Date(lastRead);
        }).length;
        setUnreadMessagesCount(unreadCount);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [tab]);

  useEffect(() => {
    if (tab?.id) {
      loadTelegramMessages();
    }
  }, [tab?.id, loadTelegramMessages]);

  // Format time
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Time ago
  const timeAgo = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    const seconds = Math.floor((currentTime - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  }, [currentTime]);

    // Category options
  const categoryOptions = useMemo(() => {
    return ['All', ...new Set(
      barProducts
        .map(bp => bp.product?.category)
        .filter((cat): cat is string => cat !== undefined && cat !== null && cat.trim() !== '')
    )];
  }, [barProducts]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    let products = selectedCategory === 'All'
      ? barProducts
      : barProducts.filter(bp => bp.product?.category === selectedCategory);

    if (searchQuery.trim()) {
      products = products.filter(bp =>
        bp.product?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return products.sort((a, b) => {
      const nameA = a.product?.name || '';
      const nameB = b.product?.name || '';
      return nameA.localeCompare(nameB);
    });
  }, [barProducts, selectedCategory, searchQuery]);

  // Sorted products (food first, then drinks)
  const sortedProducts = useMemo(() => {
    return [...barProducts].sort((a, b) => {
      const aIsDrink = isDrinkProduct(a.product);
      const bIsDrink = isDrinkProduct(b.product);
      if (aIsDrink !== bIsDrink) return aIsDrink ? 1 : -1;
      return (a.product?.name ?? '').localeCompare(b.product?.name ?? '');
    });
  }, [barProducts, isDrinkProduct]);

  // Last order
  const lastOrder = useMemo(() => orders.filter(order => order.status !== 'cancelled')[0], [orders]);
  const lastOrderTotal = useMemo(() => lastOrder ? parseFloat(lastOrder.total).toFixed(0) : '0', [lastOrder]);
  const lastOrderTime = useMemo(() => lastOrder ? timeAgo(lastOrder.created_at) : '', [lastOrder, timeAgo]);

  // Pending order timer
  const pendingOrderTime = useMemo(() => getPendingOrderTime(), [getPendingOrderTime]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--ink)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--amber)' }}></div>
          <p className="text-gray-600">Loading your tab...</p>
        </div>
      </div>
    );
  }

  if (!tab) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Tab Not Found</h2>
          <p className="text-gray-600 mb-6">This tab may have been closed, expired, or is no longer accessible.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-[#FF4F00] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#FF4F00]"
          >
            Start New Tab
          </button>
        </div>
      </div>
    );
  }

  const parallaxOffset = scrollY * 0.5;

  return (
    <>
      <PWAInstallPrompt />
      <PWAUpdateManager />
      {process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_MPESA_MOCK_MODE === 'true' && (
        <div className="bg-yellow-400 text-yellow-900 px-4 py-2 text-center text-sm font-medium">
          🧪 M-Pesa Mock Mode Active - Payments will be simulated
        </div>
      )}
      <div className="min-h-screen" style={{ background: 'var(--ink)' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-[#FF4F00] to-[#CC3F00] text-white sticky top-0 z-20 shadow-lg">
        <div className="px-4 py-3 border-b border-white border-opacity-20">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{displayName}</h1>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-white text-opacity-90">{barName}</p>
                {crewMember && (
                  <>
                    <span className="text-xs text-white text-opacity-60">•</span>
                    <div className="flex items-center gap-1">
                      {crewMember.face_thumbnail_url || crewMember.face_photo_url ? (
                        <img
                          src={crewMember.face_thumbnail_url || crewMember.face_photo_url}
                          alt={crewMember.display_name}
                          className="w-5 h-5 rounded-full object-cover border border-white border-opacity-30"
                        />
                      ) : null}
                      <p className="text-xs text-white text-opacity-90">Your waiter: {crewMember.display_name}</p>
                    </div>
                  </>
                )}
                {selectedTable && (
                  <>
                    <span className="text-xs text-white text-opacity-60">•</span>
                    <button
                      onClick={() => setShowTableModal(true)}
                      className="text-xs bg-white bg-opacity-20 px-2 py-0.5 rounded-full hover:bg-opacity-30 transition-colors"
                    >
                      Table {selectedTable}
                    </button>
                  </>
                )}

                {!selectedTable && selectedTable !== null && tableSelectionRequired && (
                  <>
                    <span className="text-xs text-white text-opacity-60">•</span>
                    <button
                      onClick={() => setShowTableModal(true)}
                      className="text-xs bg-yellow-400 bg-opacity-80 text-yellow-900 px-2 py-0.5 rounded-full hover:bg-opacity-90 transition-colors animate-pulse"
                    >
                      Select Table
                    </button>
                  </>
                )}
                {tableSelectionRequired && (
                  <button
                    onClick={() => setShowTableModal(true)}
                    className="text-xs text-white text-opacity-70 hover:text-white transition-colors ml-2"
                  >
                    Change Table
                  </button>
                )}
              </div>
            </div>
            
            {averageResponseTime !== null && !responseTimeLoading && (
              <div className="bg-white bg-opacity-20 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5">
                <Clock size={14} />
                ~{averageResponseTime}m response
              </div>
            )}
            {responseTimeLoading && (
              <div className="bg-white bg-opacity-20 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                Loading...
              </div>
            )}
            
            {showConnectionStatus && (
              <div className="bg-white bg-opacity-20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <ConnectionStatusIndicator 
                  status={connectionStatus} 
                  retryCount={retryCount}
                  className="text-xs"
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="px-4 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <button 
              onClick={() => menuRef.current?.scrollIntoView({ behavior: 'smooth' })} 
              className="flex-1 bg-white bg-opacity-20 backdrop-blur-sm hover:bg-opacity-30 rounded-lg px-4 py-2 text-sm font-medium transition-all"
            >
              Menu
            </button>
            <button 
              onClick={() => ordersRef.current?.scrollIntoView({ behavior: 'smooth' })} 
              className="flex-1 bg-white bg-opacity-20 backdrop-blur-sm hover:bg-opacity-30 rounded-lg px-4 py-2 text-sm font-medium transition-all relative"
            >
              Orders
              {(pendingStaffOrders > 0 || pendingOrderTime !== null) && (
                <span className={`absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 flex items-center justify-center rounded-full text-[9px] font-bold leading-none shadow ${
                  pendingStaffOrders > 0 ? 'bg-yellow-400 text-gray-900' : 'bg-white text-red-600'
                }`}>
                  {pendingStaffOrders > 0 ? pendingStaffOrders : '!'}
                </span>
              )}
            </button>
            <button 
              onClick={() => paymentRef.current?.scrollIntoView({ behavior: 'smooth' })} 
              className="flex-1 bg-white bg-opacity-20 backdrop-blur-sm hover:bg-opacity-30 rounded-lg px-4 py-2 text-sm font-medium transition-all"
            >
              Pay
            </button>
            <button 
              onClick={() => { 
                setShowMessagePanel(true); 
                setUnreadMessagesCount(0);
                sessionStorage.setItem('messages_last_read', new Date().toISOString());
              }}
              className="flex-1 bg-white bg-opacity-20 backdrop-blur-sm hover:bg-opacity-30 rounded-lg px-4 py-2 text-sm font-medium transition-all relative"
            >
              Messages
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 flex items-center justify-center rounded-full text-[9px] font-bold leading-none shadow bg-yellow-400 text-gray-900">
                  {unreadMessagesCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Prominent Badge Display Section */}
      {(globalBadge || (loyaltyData && loyaltyData.visitTier !== 'new')) && (
        <div className="bg-black px-4 py-6 border-b border-gray-800">
          <div className="max-w-md mx-auto text-center">
            <div className="mb-3 flex justify-center">
              {globalBadge?.badge_level === 'platinum' && (
                <img 
                  src="/gold.png" 
                  alt="Platinum Badge" 
                  className="w-24 h-auto drop-shadow-2xl"
                  style={{ filter: 'hue-rotate(270deg) saturate(1.5)', maxWidth: '96px' }}
                />
              )}
              {globalBadge?.badge_level === 'gold' && (
                <img 
                  src="/gold.png" 
                  alt="Gold Badge" 
                  className="w-24 h-auto drop-shadow-2xl"
                  style={{ maxWidth: '96px' }}
                />
              )}
              {globalBadge?.badge_level === 'silver' && (
                <img 
                  src="/silver.png" 
                  alt="Silver Badge" 
                  className="w-24 h-auto drop-shadow-2xl"
                  style={{ maxWidth: '96px' }}
                />
              )}
              {(globalBadge?.badge_level === 'bronze' || (!globalBadge && loyaltyData?.spendTier === 'bronze')) && (
                <img 
                  src="/bronze.png" 
                  alt="Bronze Badge" 
                  className="w-24 h-auto drop-shadow-2xl"
                  style={{ maxWidth: '96px' }}
                />
              )}
            </div>

            <h2 className="text-lg font-bold text-white mb-1">
              {globalBadge?.badge_level === 'platinum' && 'Platinum Status'}
              {globalBadge?.badge_level === 'gold' && 'Gold Status'}
              {globalBadge?.badge_level === 'silver' && 'Silver Status'}
              {(globalBadge?.badge_level === 'bronze' || (!globalBadge && loyaltyData?.spendTier === 'bronze')) && 'Bronze Status'}
            </h2>

            {globalBadge && (
              <p className="text-xs text-gray-400 mb-3">
                Earned at {globalBadge.earned_at_bar_name}
              </p>
            )}

            {loyaltyData && loyaltyData.visitTier !== 'new' && (
              <div className="flex justify-center gap-2 mb-3">
                {Array.from({ 
                  length: loyaltyData.visitTier === 'gold' ? 3 : loyaltyData.visitTier === 'silver' ? 2 : 1 
                }).map((_, i) => (
                  <div 
                    key={i} 
                    className="w-2 h-2 rounded-full bg-[#FF4F00]"
                  />
                ))}
              </div>
            )}

            {spendTier && (
              <div className="inline-block bg-[#FF4F00] bg-opacity-20 border border-[#FF4F00] border-opacity-30 rounded-full px-3 py-1.5">
                <p className="text-[#FF7040] text-xs font-medium">
                  {(() => {
                    const badgePct = venueDiscounts[spendTier] ?? 0;
                    const weekly = loyaltyData?.weeklyVisits ?? 0;
                    const bonusPct = weekly >= 3
                      ? (visitBonuses.thrice_per_week ?? 0)
                      : weekly >= 2
                      ? (visitBonuses.twice_per_week ?? 0)
                      : weekly >= 1
                      ? (visitBonuses.once_per_week ?? 0)
                      : 0;
                    const totalDiscountPct = badgePct + bonusPct;
                    return `${totalDiscountPct.toFixed(1)}% off every order`;
                  })()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Menu Section */}
      {loading ? (
        <div className="px-4 mt-4">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF4F00] mx-auto mb-3"></div>
              <p className="text-gray-500 text-sm">Loading menu...</p>
            </div>
          </div>
        </div>
      ) : sortedProducts.length === 0 ? (
        <div className="px-4 mt-4">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-gray-500 text-sm">No products available</p>
            </div>
          </div>
        </div>
      ) : (
        <div ref={menuRef} className="px-4 mt-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">MENU</h2>
            {spendTier && (
              <span className="text-xs text-gray-500">
                🥉 Your prices · <span className="text-[#FFF5F0]0 font-medium">visit more, pay less</span>
              </span>
            )}
          </div>

          {(() => {
            const adImages: string[] = slideshowImages.length > 0
              ? slideshowImages.slice(0, 5)
              : staticMenuUrl
              ? [staticMenuUrl]
              : [];

            const nodes: React.ReactNode[] = [];
            let adIndex = 0;
            let drinkDividerInserted = false;

            const hasFoodItems = sortedProducts.some(bp => !isDrinkProduct(bp.product));
            if (hasFoodItems) {
              nodes.push(
                <div key="divider-food" className="col-span-2 mb-1" />
              );
            }

            sortedProducts.forEach((bp, idx) => {
              let totalDiscountPct = 0;
              if (spendTier) {
                const badgePct = venueDiscounts[spendTier] ?? 0;
                const weekly = loyaltyData?.weeklyVisits ?? 0;
                const bonusPct = weekly >= 3
                  ? (visitBonuses.thrice_per_week ?? 0)
                  : weekly >= 2
                  ? (visitBonuses.twice_per_week ?? 0)
                  : weekly >= 1
                  ? (visitBonuses.once_per_week ?? 0)
                  : 0;
                totalDiscountPct = badgePct + bonusPct;
              }
              const displayPrice = totalDiscountPct > 0
                ? applyDiscount(bp.sale_price, totalDiscountPct)
                : bp.sale_price;
              const showStrikethrough = totalDiscountPct > 0 && displayPrice !== bp.sale_price;
              const imageUrl = getDisplayImage(bp.product);
              const IconComponent = getCategoryIcon(bp.product?.category || '');
              const isThisDrink = isDrinkProduct(bp.product);

              if (isThisDrink && !drinkDividerInserted) {
                drinkDividerInserted = true;
                if (idx % 2 !== 0) {
                  nodes.push(<div key="pad-before-divider" />);
                }
                nodes.push(
                  <div key="divider-drinks" className="col-span-2 mt-4" />
                );
              }

              nodes.push(
                <button
                  key={bp.id}
                  onClick={() => addToCart(bp, displayPrice)}
                  className="flex flex-col rounded-lg overflow-hidden bg-white border border-gray-100 shadow-sm active:scale-95 transition-transform text-left"
                >
                  <div className="w-full aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                    {imageUrl ? (
                      <img src={imageUrl} alt={bp.product?.name} className="w-full h-full object-cover" />
                    ) : (
                      <IconComponent className="w-10 h-10 text-gray-300" />
                    )}
                  </div>
                  <div className="p-2 flex flex-col gap-0.5">
                    <span className="text-gray-800 text-sm font-medium leading-tight line-clamp-2">
                      {bp.product?.name}
                    </span>
                    <div className="flex items-baseline gap-1.5 flex-wrap mt-0.5">
                      {showStrikethrough && (
                        <span className="text-gray-400 text-xs line-through">
                          {tempFormatCurrency(bp.sale_price)}
                        </span>
                      )}
                      <span className="text-[#FFF5F0]0 text-sm font-semibold">
                        {tempFormatCurrency(displayPrice)}
                      </span>
                    </div>
                  </div>
                </button>
              );

              const isEndOfRow = (idx + 1) % 2 === 0;
              if (isEndOfRow && adIndex < adImages.length) {
                const src = adImages[adIndex];
                nodes.push(
                  <div
                    key={`ad-${adIndex}`}
                    className="col-span-2 flex justify-center"
                    aria-label="Advertisement"
                  >
                    <img
                      src={src}
                      alt="Ad"
                      style={{ width: 320, height: 50, objectFit: 'contain', display: 'block' }}
                    />
                  </div>
                );
                adIndex++;
              }
            });

            return <div className="grid grid-cols-2 gap-3">{nodes}</div>;
          })()}
        </div>
      )}

      {/* Cart Section */}
      {cart.length > 0 && (
        <div className="p-4 mb-4 bg-gradient-to-br from-[#FFF5F0] to-[#FFE8DF] border-t border-[#FFCDB8]">
          <div className="mb-3">
            <h2 className="text-xs font-semibold text-[#FF4F00] uppercase tracking-wide">YOUR CART</h2>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-[#FFCDB8] overflow-hidden">
            <div className="bg-gradient-to-r from-[#FF4F00] to-[#FF4F00] text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingCart size={20} />
                  <div>
                    <h3 className="font-bold text-lg">Cart Items</h3>
                    <p className="text-sm text-[#FFE8DF]">{cartCount} items • {tempFormatCurrency(cartTotal)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setCart([])}
                  className="p-2 bg-[#CC3F00] bg-opacity-50 rounded-lg hover:bg-[#993000] transition-colors"
                  title="Clear cart"
                >
                  <X size={18} className="text-white" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
              {cart.map((item, index) => (
                <div key={`cart-item-${index}`} className="bg-[#FFF5F0] rounded-lg border border-[#FFCDB8]">
                  <div className="flex items-center justify-between p-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-[#662000]">{item.name}</span>
                      </div>
                      <p className="text-sm text-[#FF4F00]">{tempFormatCurrency(item.price)} each</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-[#FFE8DF] border border-[#FF9E7A] rounded-lg">
                        <button
                          onClick={() => updateCartQuantity(index, -1)}
                          className="p-2 hover:bg-[#FFCDB8] transition-colors"
                        >
                          <Minus size={16} className="text-[#CC3F00]" />
                        </button>
                        <span className="font-bold w-8 text-center text-[#662000]">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(index, 1)}
                          className="p-2 hover:bg-[#FFCDB8] transition-colors"
                        >
                          <Plus size={16} className="text-[#CC3F00]" />
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          const newCart = cart.filter((_, idx) => idx !== index);
                          setCart(newCart);
                          sessionStorage.setItem('cart', JSON.stringify(newCart));
                        }}
                        className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                        title="Remove from cart"
                      >
                        <X size={18} className="text-white" />
                      </button>
                    </div>
                  </div>
                  
                  {isDrinkItem(item) && (
                    <div className="px-3 pb-3">
                      <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notColdPreferences[`cart-item-${index}`] || false}
                            onChange={() => toggleNotCold(`cart-item-${index}`)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <span className="text-sm text-blue-700 font-medium">Not Cold</span>
                          <span className="text-xs text-blue-600">(serve at room temperature)</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-[#FFCDB8] p-4 bg-[#FFF5F0]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-[#FF4F00]">Total</p>
                  <p className="text-2xl font-bold text-[#662000]">{tempFormatCurrency(cartTotal)}</p>
                </div>
                <button
                  onClick={confirmOrder}
                  disabled={submittingOrder || cart.length === 0}
                  className="bg-[#FF4F00] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#FF4F00] disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submittingOrder ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Send Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <button
          onClick={toggleCart}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:from-blue-700 hover:to-indigo-800 hover:scale-110 active:scale-95 transition-all duration-200 animate-bounce-once"
          style={{ 
            animation: 'bounceOnce 0.5s ease-out',
            boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.5), 0 10px 10px -5px rgba(79, 70, 229, 0.2)'
          }}
        >
          <div className="relative">
            <ShoppingCart size={24} />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-md">
              {cartCount}
            </span>
          </div>
        </button>
      )}

      {/* Orders Section */}
      <div ref={ordersRef} className="p-4">
        <div className="mb-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">ORDER HISTORY</h2>
        </div>
        
        {orders.length > 0 && (
          <div className="flex items-center justify-between mb-4 bg-white rounded-lg border border-gray-100 p-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Last Order</p>
              <p className="text-2xl font-bold text-gray-900">{tempFormatCurrency(lastOrderTotal)}</p>
              <p className="text-xs text-gray-400 mt-1">{lastOrderTime}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Orders</p>
              <p className="text-2xl font-bold text-[#FFF5F0]0">{tempFormatCurrency(tabTotal)}</p>
              <p className="text-xs text-transparent mt-1">-</p>
            </div>
          </div>
        )}
        <div className="bg-white rounded-lg border border-gray-100 p-4 space-y-0">
          {orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500"><p>No orders yet</p></div>
          ) : (
            orders.filter(order => order.status !== 'cancelled').map((order, index) => {
              const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
              const initiatedBy = order.initiated_by || 'customer';
              const isStaffOrder = initiatedBy === 'staff';
              const needsApproval = order.status === 'pending' && isStaffOrder;
              const orderNumber = order.order_number || '?';
              
              return (
                <div key={order.id}>
                  <div className="py-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-gray-900">Order #{orderNumber}</span>
                        <span className="text-xs text-gray-400">{timeAgo(order.created_at)}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{tempFormatCurrency(order.total)}</p>
                    </div>
                    <div className="space-y-1">
                      {items.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between">
                          <p className="text-xs text-gray-600">{item.quantity}x {item.name}</p>
                          <p className="text-xs text-gray-500">{tempFormatCurrency(item.total)}</p>
                        </div>
                      ))}
                    </div>
                    {needsApproval && (
                      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mt-3">
                        <div className="flex items-start gap-2 mb-3">
                          <UserCog size={20} className="text-yellow-700 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-yellow-900 mb-1">Staff Member Added This Order</p>
                            <p className="text-xs text-yellow-800">Please review and approve or reject</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleApproveOrder(order.id)} disabled={approvingOrder === order.id} className="flex-1 bg-green-500 text-white py-3 rounded-lg text-sm font-semibold hover:bg-green-600 disabled:bg-gray-300 flex items-center justify-center gap-2">
                            <ThumbsUp size={16} />
                            {approvingOrder === order.id ? 'Approving...' : 'Approve'}
                          </button>
                          <button onClick={() => handleRejectOrder(order.id)} disabled={approvingOrder === order.id} className="flex-1 bg-red-500 text-white py-3 rounded-lg text-sm font-semibold hover:bg-red-600 disabled:bg-gray-300 flex items-center justify-center gap-2">
                            <X size={16} />
                            {approvingOrder === order.id ? 'Rejecting...' : 'Reject'}
                          </button>
                        </div>
                      </div>
                    )}
                    {order.status === 'pending' && !isStaffOrder && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mt-3">
                        <p className="text-xs text-yellow-700 flex items-center gap-1">
                          <Clock size={12} />
                          Waiting for staff confirmation...
                        </p>
                      </div>
                    )}
                  </div>
                  {index < orders.length - 1 && (
                    <div className="border-b border-gray-100"></div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Payment Section */}
      {balance > 0 && (
        <div ref={paymentRef} className="p-4">
          <div className="mb-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">PAYMENT</h2>
          </div>
          
          {tab?.id && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600">
                Outstanding balance: {tempFormatCurrency(balance)}
              </div>
            </div>
          )}

          {payments && payments.length > 0 && (
            <div className="mb-4 bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700">Payment History</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {payments
                  .filter(payment => payment.status === 'success')
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((payment, index) => {
                    console.log('💳 Payment display data:', {
                      id: payment.id,
                      method: payment.method,
                      amount: payment.amount,
                      mpesa_receipt: payment.reference,
                      reference: payment.reference,
                      status: payment.status,
                      mpesa_transactions: payment.reference ? [{ mpesa_receipt_number: payment.reference }] : []
                    });
                    
                    return (
                      <div key={payment.id} className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            payment.method === 'mpesa' 
                              ? 'bg-green-100 text-green-600' 
                              : payment.method === 'cash'
                              ? 'bg-[#FFE8DF] text-[#FF4F00]'
                              : 'bg-blue-100 text-blue-600'
                          }`}>
                            {payment.method === 'mpesa' ? (
                              <Phone size={14} />
                            ) : payment.method === 'cash' ? (
                              <DollarSign size={14} />
                            ) : (
                              <CreditCardIcon size={14} />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {tempFormatCurrency(payment.amount)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {payment.method === 'mpesa' && payment.reference ? (
                                <span>Receipt: {payment.reference}</span>
                              ) : payment.method === 'cash' && payment.reference ? (
                                <span>Ref: {payment.reference}</span>
                              ) : payment.method === 'card' && payment.reference ? (
                                <span>Card: {payment.reference}</span>
                              ) : (
                                <span className="capitalize">{payment.method} payment</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">
                            {new Date(payment.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
          
          <div className="bg-white border-b border-gray-100 overflow-hidden rounded-lg">
            <div className="bg-white p-4">
              <div className="flex border-b border-gray-200 mb-4">
                {paymentSettings.mpesa_enabled && (
                  <button
                    onClick={() => setActivePaymentMethod('mpesa')}
                    className={`px-4 py-2 font-medium text-sm ${activePaymentMethod === 'mpesa'
                        ? 'text-green-600 border-b-2 border-green-500'
                        : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <Phone size={16} />
                      M-Pesa
                    </div>
                  </button>
                )}
                {paymentSettings.card_enabled && (
                  <button
                    onClick={() => setActivePaymentMethod('cards')}
                    className={`px-4 py-2 font-medium text-sm ${activePaymentMethod === 'cards'
                        ? 'text-[#FFF5F0]0 border-b-2 border-[#FF4F00]'
                        : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <CreditCardIcon size={16} />
                      Cards
                    </div>
                  </button>
                )}
                {paymentSettings.cash_enabled && (
                  <button
                    onClick={() => setActivePaymentMethod('cash')}
                    className={`px-4 py-2 font-medium text-sm ${activePaymentMethod === 'cash'
                        ? 'text-[#FFF5F0]0 border-b-2 border-[#FF4F00]'
                        : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} />
                      Cash
                    </div>
                  </button>
                )}
              </div>
              {activePaymentMethod === 'cards' && (
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">VISA</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900">•••• 4242</p>
                      <p className="text-xs text-gray-400">Expires 12/26</p>
                    </div>
                  </div>
                  <button className="text-xs text-[#FFF5F0]0 font-medium">Change</button>
                </div>
              )}
              <div className="border-t border-gray-100 pt-4">
                <div className="bg-[#FFF5F0] border border-[#FFCDB8] rounded-xl p-4 mb-4">
                  <p className="text-sm text-gray-600 mb-1">Outstanding Balance</p>
                  <p className="text-3xl font-bold text-[#FF4F00]">{tempFormatCurrency(balance)}</p>
                </div>
                <div className="space-y-4">
                  {activePaymentMethod === 'mpesa' && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">M-Pesa Number</label>
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                          placeholder="0712345678"
                          disabled={isProcessing}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Amount to Pay</label>
                        <input
                          type="number"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                          placeholder="0"
                          max={balance}
                          min="1"
                          disabled={isProcessing}
                        />
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                        <p className="text-sm text-green-700">
                          You will be prompted to enter your M-Pesa PIN on your phone.
                        </p>
                      </div>
                    </>
                  )}
                  {activePaymentMethod === 'cards' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Amount to Pay</label>
                      <input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#FF4F00] focus:outline-none"
                        placeholder="0"
                        max={balance}
                        min="1"
                        disabled={isProcessing}
                      />
                    </div>
                  )}
                  {activePaymentMethod === 'cash' && (
                    <div className="text-center py-4">
                      <div className="bg-gray-100 rounded-xl p-6 mb-4">
                        <DollarSign size={48} className="mx-auto text-gray-400 mb-3" />
                        <p className="text-gray-600">Please request cash payment from staff</p>
                        <p className="text-sm text-gray-500 mt-2">Your payment will be confirmed by the restaurant system</p>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={processPayment}
                    disabled={!tab?.id || isProcessing || (activePaymentMethod === 'mpesa' && (!phoneNumber.trim() || !paymentAmount || parseFloat(paymentAmount) <= 0))}
                    className={`w-full py-3 rounded-lg text-sm font-medium transition-colors ${
                      activePaymentMethod === 'mpesa' 
                        ? 'bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-300 disabled:text-gray-500'
                        : activePaymentMethod === 'cash'
                        ? 'bg-[#FF4F00] hover:bg-[#FF4F00] text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-300 disabled:text-gray-500'
                    } disabled:cursor-not-allowed`}
                  >
                    {!tab?.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Loading Tab...
                      </span>
                    ) : isProcessing ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Processing...
                      </span>
                    ) : activePaymentMethod === 'mpesa' ? (
                      'Send M-Pesa Request'
                    ) : activePaymentMethod === 'cash' ? (
                      'Confirm Cash Payment'
                    ) : (
                      'Process Payment'
                    )}
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Please pay at the bar using
                    {(() => {
                      const methods = [];
                      if (paymentSettings.cash_enabled) methods.push('cash');
                      if (paymentSettings.mpesa_enabled) methods.push('M-Pesa');
                      if (paymentSettings.mpesa_enabled && paymentSettings.cash_enabled) methods.push('Airtel Money');
                      return methods.join(', ');
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {balance === 0 && orders.filter(order => order.status === 'confirmed').length > 0 && (
        <div className="bg-white p-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">All Paid! 🎉</h2>
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-4 text-center">
            <div className="text-5xl mb-3">✓</div>
            <p className="text-lg font-bold text-green-800 mb-2">Your tab is fully paid!</p>
            <p className="text-sm text-gray-600">You can close your tab or continue ordering</p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => setShowCloseConfirm(true)}
              className="w-full bg-green-500 text-white py-4 rounded-xl font-semibold hover:bg-green-600 shadow-lg flex items-center justify-center gap-2"
            >
              <CheckCircle size={20} />
              Close My Tab
            </button>
            <button
              onClick={() => menuRef.current?.scrollIntoView({ behavior: 'smooth' })} 
              className="w-full bg-gray-200 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-300"
            >
              Order More Food
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center mt-4">
            💡 Tip: Close your tab when you're done to avoid confusion on your next visit
          </p>
        </div>
      )}
      
      {/* Acceptance Modal */}
      {acceptanceModal.show && (
        <div className="fixed inset-x-0 bottom-0 bg-black bg-opacity-50 flex items-end justify-center z-[9999]">
          <div className="bg-white rounded-t-3xl w-full max-w-lg mx-auto shadow-2xl transform animate-slideUp max-h-[80vh] flex flex-col">
            <div className="flex-shrink-0 p-6 text-center border-b">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Accepted! 🎉</h2>
              <p className="text-gray-600">{acceptanceModal.message}</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-[#FFF5F0]0">{formatCurrency(parseFloat(acceptanceModal.orderTotal))}</div>
              </div>
              
              <div className="space-y-3 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Order Details</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Order items will appear here when available</p>
                </div>
              </div>
            </div>
            
            <div className="flex-shrink-0 p-6 border-t">
              <button 
                onClick={() => setAcceptanceModal({ show: false, orderTotal: '', message: '' })}
                className="w-full bg-[#FF4F00] text-white py-3 rounded-xl font-semibold hover:bg-[#FF4F00] transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageCircle size={24} className="text-blue-500" />
                <h2 className="text-xl font-bold text-gray-900">Message Staff</h2>
              </div>
              <button onClick={() => setShowMessageModal(false)}>
                <X size={24} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                Send a message to the staff about special requests, questions, or anything else you need.
              </p>
              
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => setMessageInput('Can I get some extra napkins?')}
                  className="text-xs p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-left"
                >
                  Extra napkins
                </button>
                <button
                  onClick={() => setMessageInput('Can we have the bill split?')}
                  className="text-xs p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-left"
                >
                  Split bill
                </button>
                <button
                  onClick={() => setMessageInput('Table needs cleaning')}
                  className="text-xs p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-left"
                >
                  Clean table
                </button>
                <button
                  onClick={() => setMessageInput('Can I get a recommendation?')}
                  className="text-xs p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-left"
                >
                  Recommendations
                </button>
              </div>
              
              <textarea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type your message here... (e.g., 'Can we get more water?', 'Special dietary request', etc.)"
                className="w-full h-32 p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
                maxLength={500}
              />
              <div className="text-right mt-1">
                <span className={`text-xs ${messageInput.length > 450 ? 'text-red-500' : 'text-gray-400'}`}>
                  {messageInput.length}/500
                </span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowMessageModal(false)}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={sendTelegramMessage}
                disabled={!messageInput.trim() || sendingMessage}
                className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sendingMessage ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Send Message
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Message Sent Confirmation Modal */}
      {messageSentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center animate-fadeIn">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
            <p className="text-gray-600 mb-4">
              Your message has been sent to staff. They will respond shortly.
            </p>
            <button
              onClick={() => setMessageSentModal(false)}
              className="w-full bg-green-500 text-white py-3 rounded-xl font-medium hover:bg-green-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {/* Rejection Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Reject Order</h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Please select a reason for rejecting this staff order:
            </p>
            
            <div className="space-y-2 mb-6">
              {rejectionReasons.map((reason) => (
                <label
                  key={reason.value}
                  className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-[#FF9E7A] transition-colors"
                >
                  <input
                    type="radio"
                    name="rejectionReason"
                    value={reason.value}
                    checked={selectedRejectionReason === reason.value}
                    onChange={(e) => setSelectedRejectionReason(e.target.value)}
                    className="w-4 h-4 text-[#FFF5F0]0 focus:ring-[#FF4F00]"
                  />
                  <span className="text-sm text-gray-700">{reason.label}</span>
                </label>
              ))}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmRejectOrder}
                disabled={!selectedRejectionReason || approvingOrder === rejectingOrderId}
                className="flex-1 bg-red-500 text-white px-4 py-3 rounded-lg font-medium hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {approvingOrder === rejectingOrderId ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Rejecting...
                  </>
                ) : (
                  'Reject Order'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* New Message Alert */}
      {newMessageAlert && (
        <div className="fixed top-4 right-4 z-50 animate-slideIn">
          <div className={`rounded-xl shadow-lg p-4 max-w-sm ${
            newMessageAlert.type === 'acknowledged' ? 'bg-blue-500 text-white' :
            newMessageAlert.type === 'completed' ? 'bg-green-500 text-white' :
            'bg-yellow-500 text-white'
          }`}>
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 rounded-full p-2">
                {newMessageAlert.type === 'acknowledged' ? (
                  <CheckCircle size={20} />
                ) : (
                  <AlertCircle size={20} />
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{newMessageAlert.message}</p>
                <p className="text-xs opacity-90">{timeAgo(newMessageAlert.timestamp)}</p>
              </div>
              <button
                onClick={() => setNewMessageAlert(null)}
                className="p-1 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Close Tab Section */}
      <div className="bg-white p-4 border-t">
        <button
          onClick={() => {
            if (balance > 0) {
              showToast({
                type: 'error',
                title: 'Cannot Close Tab',
                message: 'You have outstanding balance. Please pay at the bar before closing your tab.'
              });
              return;
            }
            setShowCloseConfirm(true);
          }}
          className={`w-full py-3 rounded-xl font-medium transition ${
            orders.filter(order => order.status === 'confirmed').length === 0 
              ? 'text-green-600 hover:bg-green-50' 
              : balance > 0 
                ? 'text-red-600 hover:bg-red-50'
                : 'text-green-600 hover:bg-green-50'
          }`}
        >
          Close Tab
        </button>
      </div>
      
      {/* Close Tab Confirmation Modal */}
      {showCloseConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-3">Close Your Tab?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to close your tab? You'll need to start a new one if you want to order again later.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseConfirm(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowCloseConfirm(false);
                  handleCloseTab();
                }}
                className="flex-1 bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600"
              >
                Close Tab
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Table Selection Modal */}
      {showTableModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto transform animate-slideUp">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#FFE8DF] rounded-full flex items-center justify-center mx-auto mb-4">
                <Utensils size={32} className="text-[#FFF5F0]0" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What's your table number?</h2>
              <p className="text-gray-600">
                Please select your table number to help staff serve you better
              </p>
            </div>
            
            <div className="grid grid-cols-5 gap-3 mb-6">
              {barTables.map((tableNum) => (
                <button
                  key={tableNum}
                  onClick={() => {
                    console.log('🪑 Table button clicked:', tableNum);
                    selectTable(tableNum);
                  }}
                  className="aspect-square bg-[#FFF5F0] border-2 border-[#FFCDB8] rounded-lg hover:bg-[#FFE8DF] hover:border-[#FF9E7A] transition-all duration-200 flex items-center justify-center font-bold text-[#CC3F00] hover:scale-105"
                >
                  {tableNum}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => {
                console.log('🪑 Skip button clicked');
                setShowTableModal(false);
              }}
              className="w-full text-gray-500 py-2 text-sm hover:text-gray-700"
            >
              Skip for now
            </button>
          </div>
        </div>
      )}

      {/* Spend prompt */}
      {spendPrompt && (
        <div
          className="fixed bottom-20 left-4 right-4 z-50 animate-fadeIn"
          style={{ animation: 'slideUp 0.3s ease-out' }}
        >
          <div
            className="rounded-xl px-4 py-3 flex items-center justify-between gap-3 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #FF4F00, #CC3F00)', color: '#1a1a2e' }}
          >
            <p className="text-sm font-medium flex-1">{spendPrompt}</p>
            <button
              onClick={() => setSpendPrompt(null)}
              className="shrink-0 p-1 rounded-full hover:bg-black hover:bg-opacity-10"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Message Panel */}
      <MessagePanel
        isOpen={showMessagePanel}
        onClose={() => setShowMessagePanel(false)}
        tabId={tab!.id}
        initialMessages={telegramMessages}
        onMessageSent={loadTelegramMessages}
      />
    </div>
    </>
  );
}