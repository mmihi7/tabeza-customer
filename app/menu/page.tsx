'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Plus, Search, X, CreditCard, Clock, CheckCircle, Minus, User, UserCog, ThumbsUp, ChevronDown, ChevronUp, Eye, EyeOff, Phone, CreditCardIcon, DollarSign, MessageCircle, Send, AlertCircle, FileText, ZoomIn, ZoomOut, Maximize2, Package,
  Coffee, Utensils, Pizza, Sandwich, Cookie, IceCream, Apple, Beef, Fish, Wine, Beer, Sunrise, Sunset, Moon, Star, Heart, Flame, Zap, Droplets, Leaf, Wheat, Milk, Egg, ChefHat, Cake, Candy, Popcorn, IceCream2, Glasses, Martini, LayoutGrid, UtensilsCrossed,
  Bell, LogIn, UserCheck, Settings } from 'lucide-react';
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
import { ReceiptModal } from '@/components/ReceiptModal';
import { playCustomerNotification } from '@/lib/notifications'; 
import { updateOrderInList, addOrderToList, removeOrderFromList, type TabOrder } from '@/lib/order-state-helpers';
import { CrewAvatar, CrewTipButton, CrewRatingModal, CrewProfileView, type CrewMember } from '@/components/crew';
import CustomerMediaBox from '@/components/CustomerMediaBox';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

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
  opened_at?: string;
  device_identifier?: string | null;
  bar?: {
    id: string;
    name: string;
    location?: string;
    logo_url?: string;
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
  const [crewMember, setCrewMember] = useState<CrewMember | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showProfileView, setShowProfileView] = useState(false);
  const [showTipSection, setShowTipSection] = useState(false);
  const [showPayInstructions, setShowPayInstructions] = useState(false);

  // Local activity log (alerts, tips, ratings) — persisted to sessionStorage so
  // it survives scrolls/refreshes for the active tab.
  const [localLogs, setLocalLogs] = useState<{ id: string; time: string; kind: 'alert' | 'order' | 'tip' | 'rate' | 'like' }[]>([]);

  useEffect(() => {
    if (!tab?.id) return;
    try {
      const raw = sessionStorage.getItem(`tab-log-${tab.id}`);
      setLocalLogs(raw ? JSON.parse(raw) : []);
    } catch {}
  }, [tab?.id]);

  const pushLog = useCallback((kind: 'alert' | 'order' | 'tip' | 'rate' | 'like') => {
    if (!tab?.id) return;
    const entry = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, time: new Date().toISOString(), kind };
    const next = [...localLogs, entry].slice(-60);
    setLocalLogs(next);
    try {
      sessionStorage.setItem(`tab-log-${tab.id}`, JSON.stringify(next));
    } catch {}
  }, [tab?.id, localLogs]);

  // Shared "call / ask the waiter" action.
  const sendWaiterAlert = useCallback(async () => {
    try {
      if (tab?.id) {
        await supabase.from('tab_telegram_messages').insert({
          tab_id: tab.id,
          message: 'Customer needs assistance',
          initiated_by: 'customer',
          customer_name: displayName,
          status: 'pending',
        });
        pushLog('alert');
      }
      showToast({
        type: 'success',
        title: 'Alert Sent',
        message: 'A waiter has been notified and will assist you shortly.',
      });
    } catch {
      showToast({ type: 'error', title: 'Failed', message: 'Could not send alert.' });
    }
  }, [tab?.id, displayName, pushLog, showToast]);

  // Open pay instructions — always refresh the venue's current method first so
  // a change made in the staff app is shown immediately.
  const openPayInstructions = async () => {
    const barId = tab?.bar?.id || (tab as any)?.bar_id;
    if (barId) {
      try { await loadPaymentSettings(barId); } catch { /* keep current */ }
    }
    setShowPayInstructions(true);
  };
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
    items?: { name: string; quantity: number; total: number }[];
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
    mpesa_enabled: false,
    card_enabled: false,
    cash_enabled: true,
    customer_payment_method: 'cash' as 'cash' | 'paybill' | 'till' | 'pochi' | 'send_money',
    mpesa_paybill: '',
    mpesa_account: '',
    mpesa_till: '',
    mpesa_pochi: '',
    mpesa_number: '',
  });
  const [loadingPaymentSettings, setLoadingPaymentSettings] = useState(true);
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);
  const [venueControls, setVenueControls] = useState({
    showCustomerMenu: true,
    showCustomerPromos: true,
    showCustomerOrdering: true
  });
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState<any>(null);

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
  const [menuCollapsed, setMenuCollapsed] = useState(false);

  // Product preview: first tap opens the item full-screen; a second tap (Add to
  // order) sends it to the cart. A one-time hint explains the interaction.
  const [productModal, setProductModal] = useState<{ bp: BarProduct; price: number; strikethrough: boolean } | null>(null);
  const [showMenuTapHint, setShowMenuTapHint] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');

  const [barCategories, setBarCategories] = useState<{ id: string; name: string; kind: 'food' | 'drink'; sort_order: number }[]>([]);

  const [slideshowImages, setSlideshowImages] = useState<string[]>([]);
  const [slideshowSettings, setSlideshowSettings] = useState<Record<string, any> | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isSlideshowPlaying, setIsSlideshowPlaying] = useState(false);

  const [averageResponseTime, setAverageResponseTime] = useState<number | null>(null);
  const [responseTimeLoading, setResponseTimeLoading] = useState(false);
  const [showConnectionStatus, setShowConnectionStatus] = useState(false);

  const [notificationPrefs, setNotificationPrefs] = useState({
    notificationsEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true
  });

  const [isFavorited, setIsFavorited] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [barTables, setBarTables] = useState<number[]>([]);
  const [tableSelectionRequired, setTableSelectionRequired] = useState(false);
  const [notColdPreferences, setNotColdPreferences] = useState<Record<string | number, boolean>>({});

  // ── Live promotions (known customer only) ─────────────────────────────
  const [eligiblePromos, setEligiblePromos] = useState<any[]>([]);
  const [promosLoading, setPromosLoading] = useState(false);
  const [redeemingPromoId, setRedeemingPromoId] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  
  const drinkCategories = ['Beer & Cider', 'Wine & Champagne', 'Spirits', 'Liqueurs & Specialty', 'Non-Alcoholic'];
  const loadAttempted = useRef(false);

  // Refs for scrolling
  const promoRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const ordersRef = useRef<HTMLDivElement>(null);
  const paymentRef = useRef<HTMLDivElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

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

  const isCocktailProduct = useCallback((product: any): boolean => {
    if (!product?.category) return false;
    const cat = product.category.toLowerCase();
    return cat.includes('cocktail') || cat.includes('mixology');
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


  // Check favorite status
  const checkFavorite = useCallback(async () => {
    if (!tab?.customer_id || !tab?.bar_id) return;
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const res = await fetch(`${baseUrl}/api/customer/saved-bars?customerId=${tab.customer_id}`);
      if (res.ok) {
        const { savedBars } = await res.json();
        setIsFavorited(savedBars?.some((s: any) => s.bar.id === tab.bar_id) ?? false);
      }
    } catch { /* ignore */ }
  }, [tab?.customer_id, tab?.bar_id]);

  // Toggle favorite with unsave warning
  const [unsaveConfirm, setUnsaveConfirm] = useState(false);
  const toggleFavorite = useCallback(async () => {
    if (!tab?.customer_id || !tab?.bar_id) return;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    try {
      if (isFavorited) {
        if (!unsaveConfirm) {
          setUnsaveConfirm(true);
          showToast({ type: 'warning', title: 'Unsave?', message: `Tap again to remove ${barName} from saved places`, duration: 3000 });
          setTimeout(() => setUnsaveConfirm(false), 3000);
          return;
        }
        await fetch(`${baseUrl}/api/customer/saved-bars?customerId=${tab.customer_id}&barId=${tab.bar_id}`, { method: 'DELETE' });
        setIsFavorited(false);
        setUnsaveConfirm(false);
        showToast({ type: 'info', title: 'Removed from Saved', message: `${barName} removed from your saved places` });
      } else {
        await fetch(`${baseUrl}/api/customer/saved-bars`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId: tab.customer_id, barId: tab.bar_id }),
        });
        setIsFavorited(true);
        showToast({ type: 'success', title: 'Saved!', message: `${barName} added to your saved places` });
      }
    } catch { /* ignore */ }
  }, [tab?.customer_id, tab?.bar_id, isFavorited, barName, showToast, unsaveConfirm]);

  // Load data when tab changes
  useEffect(() => {
    if (!tab?.bar_id) return;
    calculateAverageResponseTime(tab.bar_id);
    checkFavorite();
  }, [tab?.bar_id, tab?.customer_id, calculateAverageResponseTime, checkFavorite]);

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

  // ── Live promotions ────────────────────────────────────────────────────────
  const fetchEligiblePromos = useCallback(async () => {
    if (!tab?.customer_id || !tab?.bar_id || !tab?.id || !venueControls.showCustomerPromos) {
      setEligiblePromos([]);
      return;
    }
    try {
      setPromosLoading(true);
      const res = await fetch(
        `/api/promotions/eligible?customerId=${tab.customer_id}&barId=${tab.bar_id}&tabId=${tab.id}`
      );
      if (!res.ok) throw new Error('Failed to load promotions');
      const body = await res.json();
      setEligiblePromos(body.promotions ?? []);
      setPromoError(null);
    } catch (err) {
      // Non-fatal — keep whatever we had; promotions are best-effort.
      console.error('Failed to fetch eligible promotions:', err);
    } finally {
      setPromosLoading(false);
    }
  }, [tab?.customer_id, tab?.bar_id, tab?.id, venueControls.showCustomerPromos]);

  // Poll eligible promotions every 30s (and on tab/venue change).
  useEffect(() => {
    fetchEligiblePromos();
    const timer = setInterval(fetchEligiblePromos, 30 * 1000);
    return () => clearInterval(timer);
  }, [fetchEligiblePromos]);

  const handleRedeemPromo = useCallback(async (promotion: any) => {
    if (!tab?.customer_id || !tab?.bar_id || !tab?.id) return;
    setRedeemingPromoId(promotion.id);
    setPromoError(null);
    try {
      const res = await fetch('/api/promotions/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: tab.customer_id,
          barId: tab.bar_id,
          tabId: tab.id,
          promotionId: promotion.id,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to redeem promotion');
      }
      // Refresh so the redeemed promo disappears from the list.
      await fetchEligiblePromos();
      showToast({ type: 'success', title: 'Redeemed!', message: `${promotion.name} is now yours — enjoy!` });
    } catch (err) {
      setPromoError(err instanceof Error ? err.message : 'Failed to redeem promotion');
      showToast({ type: 'error', title: 'Could not redeem', message: err instanceof Error ? err.message : 'Try again' });
    } finally {
      setRedeemingPromoId(null);
    }
  }, [tab?.customer_id, tab?.bar_id, tab?.id, fetchEligiblePromos, showToast]);

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
          message: 'Your order has been accepted and is being prepared',
          items: (() => {
            try {
              const items = typeof payload.new?.items === 'string' ? JSON.parse(payload.new.items) : payload.new?.items;
              return Array.isArray(items)
                ? items.map((it: any) => ({ name: it.name || 'Item', quantity: it.quantity || 1, total: parseFloat(it.total ?? it.price ?? 0) || 0 }))
                : [];
            } catch {
              return [];
            }
          })(),
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
  }, [tab?.id, processedOrders, buzz, playAcceptanceSound, showToast]);

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
              
              setReceiptPayment({
                id: payment.id,
                amount: paymentAmount,
                method: paymentMethod,
                status: payment.status,
                reference: payment.reference,
                mpesa_receipt_number: mpesaReceipt,
                timestamp: payment.created_at || new Date().toISOString(),
              });
              setTimeout(() => setShowReceipt(true), 1500);
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
  }, [tab, handleOrderUpdate, handleOrderInsert, handleOrderDelete, router, showToast, playAcceptanceSound, buzz, notificationPrefs.soundEnabled, notificationPrefs.vibrationEnabled]);

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

  // Live bar-settings updates (payment method etc.) → reflect immediately
  useEffect(() => {
    const barId = tab?.bar?.id || (tab as any)?.bar_id;
    if (!barId || !supabase) return;
    const channel = supabase
      .channel(`bar-settings-${barId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bars', filter: `id=eq.${barId}` }, (payload: any) => {
        const d = payload?.new || {};
        const method: any = ['cash', 'paybill', 'till', 'pochi', 'send_money'].includes(d.customer_payment_method)
          ? d.customer_payment_method
          : paymentSettings.customer_payment_method;
        setPaymentSettings({
          mpesa_enabled: typeof d.mpesa_enabled === 'boolean' ? d.mpesa_enabled : paymentSettings.mpesa_enabled,
          card_enabled: typeof d.payment_card_enabled === 'boolean' ? d.payment_card_enabled : paymentSettings.card_enabled,
          cash_enabled: method === 'cash',
          customer_payment_method: method,
          mpesa_paybill: typeof d.mpesa_paybill === 'string' ? d.mpesa_paybill : paymentSettings.mpesa_paybill,
          mpesa_account: typeof d.mpesa_account === 'string' ? d.mpesa_account : paymentSettings.mpesa_account,
          mpesa_till: typeof d.mpesa_till === 'string' ? d.mpesa_till : paymentSettings.mpesa_till,
          mpesa_pochi: typeof d.mpesa_pochi === 'string' ? d.mpesa_pochi : paymentSettings.mpesa_pochi,
          mpesa_number: typeof d.mpesa_number === 'string' ? d.mpesa_number : paymentSettings.mpesa_number,
        });
        setVenueControls({
          showCustomerMenu: typeof d.show_customer_menu === 'boolean' ? d.show_customer_menu : venueControls.showCustomerMenu,
          showCustomerPromos: typeof d.show_customer_promos === 'boolean' ? d.show_customer_promos : venueControls.showCustomerPromos,
          showCustomerOrdering: typeof d.show_customer_ordering === 'boolean' ? d.show_customer_ordering : venueControls.showCustomerOrdering,
        });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab?.bar?.id, (tab as any)?.bar_id]);

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
        .select('mpesa_enabled, payment_cash_enabled, payment_card_enabled, show_customer_menu, show_customer_promos, show_customer_ordering, customer_payment_method, mpesa_paybill, mpesa_account, mpesa_till, mpesa_pochi, mpesa_number')
        .eq('id', barId)
        .single();

      if (error) {
        console.error('Error loading payment settings:', error);
        setPaymentSettings({
          mpesa_enabled: false,
          card_enabled: false,
          cash_enabled: true,
          customer_payment_method: 'cash',
          mpesa_paybill: '',
          mpesa_account: '',
          mpesa_till: '',
          mpesa_pochi: '',
          mpesa_number: '',
        });
      } else if (data) {
        console.log('✅ Payment settings loaded:', data);
        const paymentData = data as {
          mpesa_enabled?: boolean;
          payment_cash_enabled?: boolean;
          payment_card_enabled?: boolean;
          show_customer_menu?: boolean;
          show_customer_promos?: boolean;
          show_customer_ordering?: boolean;
          customer_payment_method?: 'cash' | 'paybill' | 'till' | 'pochi' | 'send_money';
          mpesa_paybill?: string;
          mpesa_account?: string;
          mpesa_till?: string;
          mpesa_pochi?: string;
          mpesa_number?: string;
        };
        const method: any = ['cash', 'paybill', 'till', 'pochi', 'send_money'].includes(paymentData.customer_payment_method as string)
          ? paymentData.customer_payment_method
          : 'cash';
        setPaymentSettings({
          mpesa_enabled: paymentData.mpesa_enabled ?? false,
          card_enabled: paymentData.payment_card_enabled ?? false,
          cash_enabled: method === 'cash',
          customer_payment_method: method,
          mpesa_paybill: paymentData.mpesa_paybill ?? '',
          mpesa_account: paymentData.mpesa_account ?? '',
          mpesa_till: paymentData.mpesa_till ?? '',
          mpesa_pochi: paymentData.mpesa_pochi ?? '',
          mpesa_number: paymentData.mpesa_number ?? '',
        });
        setVenueControls({
          showCustomerMenu: paymentData.show_customer_menu ?? true,
          showCustomerPromos: paymentData.show_customer_promos ?? true,
          showCustomerOrdering: paymentData.show_customer_ordering ?? true
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
        cash_enabled: true,
        customer_payment_method: 'cash',
        mpesa_paybill: '',
        mpesa_account: '',
        mpesa_till: '',
        mpesa_pochi: '',
        mpesa_number: '',
      });
    } finally {
      setLoadingPaymentSettings(false);
    }
  }, []);

  // Load menu configuration (menu plan + user-defined categories) — Redis-first via API route
  const loadMenuConfig = useCallback(async (barId: string) => {
    try {
      const response = await fetch(`/api/menu/config/${barId}`);
      if (!response.ok) {
        console.warn('Failed to load menu config:', response.status);
        return;
      }
      const data = await response.json();
      setBarCategories(data.bar_categories ?? []);
    } catch (error) {
      console.error('Error loading menu config:', error);
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
        await loadMenuConfig((fullTab as any).bar.id);
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
                console.log('🪑 New tab — showing table selection modal immediately');
                setShowTableModal(true);
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
  }, [router, loadPaymentSettings, loadMenuConfig, barProducts, getPendingOrderTime]);

  useEffect(() => {
    if (loadAttempted.current) {
      console.log('⏭️ Load already attempted, skipping...');
      return;
    }
    loadAttempted.current = true;
    console.log('🔄 Menu page: Starting loadTabData...');
    loadTabData();
  }, [loadTabData]);

  // Subscribe to push notifications when tab is loaded
  useEffect(() => {
    if (!tab?.id || !tab?.device_identifier) return;

    const subscribeToPush = async () => {
      try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) return;

        const applicationServerKey = urlBase64ToUint8Array(vapidKey);
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey
        });

        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceId: tab.device_identifier,
            subscription: subscription.toJSON()
          })
        });
        console.log('✅ Push subscription registered');
      } catch (err) {
        console.log('ℹ️ Push subscription skipped:', err);
      }
    };

    subscribeToPush();
  }, [tab?.id, tab?.device_identifier]);

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

    if (!venueControls.showCustomerOrdering) {
      showToast({
        type: 'info',
        title: 'Menu viewing only',
        message: 'This venue has disabled customer ordering. Please ask staff to place your order.'
      });
      return;
    }
    
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
  }, [showToast, venueControls.showCustomerOrdering]);

  // Add straight to cart and, when the cart was empty, draw the customer's eye
  // to the cart below. Used by drinks (no image → no preview flow) and food adds.
  const addToCartAndFocus = useCallback((barProduct: BarProduct, priceOverride?: number) => {
    const wasEmpty = cart.length === 0;
    addToCart(barProduct, priceOverride);
    if (wasEmpty) {
      setTimeout(() => cartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    }
  }, [cart.length, addToCart]);

  // Open a product full-screen (first tap). Shows the one-time hint pop-up.
  const openProductDetail = useCallback((bp: BarProduct, price: number, strikethrough: boolean) => {
    if (!venueControls.showCustomerOrdering) {
      // Venue disabled ordering — keep straight to a message, no modal flow.
      showToast({
        type: 'info',
        title: 'Menu viewing only',
        message: 'This venue has disabled customer ordering. Please ask staff to place your order.',
      });
      return;
    }
    setProductModal({ bp, price, strikethrough });
    try {
      if (!sessionStorage.getItem('tabeza_menu_tap_hint')) {
        sessionStorage.setItem('tabeza_menu_tap_hint', '1');
        setShowMenuTapHint(true);
      }
    } catch {
      /* ignore */
    }
  }, [showToast, venueControls.showCustomerOrdering]);

  // Add from the full-screen view (second tap) then close + focus cart.
  const addFromProductModal = useCallback(() => {
    if (!productModal) return;
    const { bp, price } = productModal;
    addToCartAndFocus(bp, price);
    setProductModal(null);
  }, [productModal, addToCartAndFocus]);

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

  // Auto-collapse the interactive menu block after ~30s idle while in view.
  // Collapses to a compact "Browse Menu" bar; re-expands on tap.
  const interactiveMenuShown = !showStaticMenu && sortedProducts.length > 0;
  useEffect(() => {
    if (!interactiveMenuShown || menuCollapsed) return;
    const el = menuRef.current;
    if (!el) return;

    let visible = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const clearTimer = () => { if (timer) { clearTimeout(timer); timer = null; } };
    const schedule = () => {
      clearTimer();
      if (!visible) return;
      timer = setTimeout(() => setMenuCollapsed(true), 30000);
    };

    const io = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? false;
      if (visible) schedule(); else clearTimer();
    }, { threshold: 0.2 });
    io.observe(el);

    const onActivity = () => { if (visible) schedule(); };
    const events: (keyof WindowEventMap)[] = ['scroll', 'touchstart', 'pointerdown', 'keydown'];
    events.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));

    schedule();
    return () => {
      io.disconnect();
      events.forEach((ev) => window.removeEventListener(ev, onActivity));
      clearTimer();
    };
  }, [interactiveMenuShown, menuCollapsed, selectedCategory]);

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
                <button
                  onClick={toggleFavorite}
                  className="p-1 rounded-full hover:bg-white hover:bg-opacity-10 transition-colors"
                  title={isFavorited ? 'Remove from saved' : 'Save this place'}
                >
                  <Star
                    size={20}
                    fill={isFavorited ? '#FFD700' : 'transparent'}
                    stroke={isFavorited ? '#FFD700' : '#fff'}
                    strokeWidth={2}
                  />
                </button>
                <p className="text-xs text-white text-opacity-90">{barName}</p>
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
            <button
              onClick={() => router.push('/settings')}
              className="p-1.5 rounded-full hover:bg-white hover:bg-opacity-10 transition-colors"
              title="Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
        
        <div className="px-4 py-2.5">
          <div className="flex items-center justify-between gap-3">
            {venueControls.showCustomerPromos && (
              <button 
                onClick={() => promoRef.current?.scrollIntoView({ behavior: 'smooth' })} 
                className="flex-1 bg-white bg-opacity-20 backdrop-blur-sm hover:bg-opacity-30 rounded-lg px-4 py-2 text-sm font-medium transition-all"
              >
                Promo
              </button>
            )}
            {venueControls.showCustomerMenu && (
              <button 
                onClick={() => menuRef.current?.scrollIntoView({ behavior: 'smooth' })} 
                className="flex-1 bg-white bg-opacity-20 backdrop-blur-sm hover:bg-opacity-30 rounded-lg px-4 py-2 text-sm font-medium transition-all"
              >
                Menu
              </button>
            )}
            <button 
              onClick={() => orders.length > 0 && ordersRef.current?.scrollIntoView({ behavior: 'smooth' })}
              disabled={orders.length === 0}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all relative ${
                orders.length === 0
                  ? 'opacity-40 cursor-not-allowed'
                  : 'bg-white bg-opacity-20 backdrop-blur-sm hover:bg-opacity-30'
              }`}
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
              onClick={() => balance > 0 && paymentRef.current?.scrollIntoView({ behavior: 'smooth' })}
              disabled={balance <= 0 && tabTotal <= 0}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                (balance <= 0 && tabTotal <= 0)
                  ? 'opacity-40 cursor-not-allowed'
                  : 'bg-white bg-opacity-20 backdrop-blur-sm hover:bg-opacity-30'
              }`}
            >
              Pay
            </button>
          </div>
        </div>
      </div>

      {/* Crew + Call Button Section */}
      <div className="border-b px-4 py-3" style={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)' }}>
        <div className="flex items-center justify-between gap-3">
          {/* Left: Waiter profile */}
          {crewMember ? (
            <div style={{ flexShrink: 0 }}>
              <CrewAvatar
                crew={crewMember}
                onOpenProfile={() => setShowProfileView(true)}
              />
            </div>
          ) : null}

          {/* Right: Call button */}
          <button
            onClick={sendWaiterAlert}
            style={{
              padding: '0.625rem 1rem', borderRadius: '0.75rem',
              background: '#FF4F00', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#CC3F00')}
            onMouseLeave={e => (e.currentTarget.style.background = '#FF4F00')}
          >
            <Bell size={16} style={{ color: 'white' }} />
            <span style={{ color: 'white', fontSize: '0.8rem', fontWeight: 600 }}>Call Waiter</span>
          </button>
        </div>
      </div>

      {/* Live Promotions — scroll target for the Promo button; known customers only */}
      <div ref={promoRef} className="px-4 mb-4">
        {venueControls.showCustomerPromos && (
          <>
            <div className="mb-3">
              <h2 className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>OFFERS FOR YOU</h2>
            </div>
            {promosLoading && eligiblePromos.length === 0 ? (
              <div className="rounded-lg p-4 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>Loading offers…</p>
              </div>
            ) : eligiblePromos.length === 0 ? (
              // No live offers — nothing shown; the Promo button simply scrolls to the activity log below.
              null
            ) : (
              <div className="space-y-2">
                {promoError && (
                  <p className="text-xs" style={{ color: '#f87171' }}>{promoError}</p>
                )}
                {eligiblePromos.map((promo: any) => (
                  <div
                    key={promo.id}
                    className="rounded-lg p-4 flex items-center justify-between gap-3"
                    style={{ backgroundColor: 'rgba(255,79,0,0.08)', border: '1px solid rgba(255,79,0,0.25)' }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold" style={{ color: 'var(--cream)' }}>
                        {promo.name}
                      </p>
                      {promo.type_config?.percentage && (
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                          {promo.type_config.percentage}% off {promo.applies_to === 'all' ? 'your whole order' : promo.applies_to}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRedeemPromo(promo)}
                      disabled={redeemingPromoId === promo.id}
                      className="shrink-0 text-xs font-semibold px-3 py-2 rounded-lg transition-opacity"
                      style={{
                        backgroundColor: '#FF4F00',
                        color: 'white',
                        opacity: redeemingPromoId === promo.id ? 0.6 : 1,
                      }}
                    >
                      {redeemingPromoId === promo.id ? 'Redeeming…' : 'Redeem'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Activity Log — shown across all menu plans */}
      <div className="px-4 mb-4">
          <div className="mb-3">
            <h2 className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>ACTIVITY</h2>
          </div>
          <div className="rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {(() => {
              const events: { id: string; time: Date; icon: React.ReactNode; message: React.ReactNode }[] = [];
              
              if (tab?.opened_at) {
                events.push({
                  id: 'tab-created',
                  time: new Date(tab.opened_at),
                  icon: <LogIn size={14} className="text-green-400" />,
                  message: <span className="text-xs" style={{ color: 'var(--muted)' }}>Connected to <span style={{ color: 'var(--cream)' }}>{tab.bar?.name || barName}</span></span>,
                });
              }
              
              if (typeof window !== 'undefined') {
                const alertLog = sessionStorage.getItem(`tab-alerts-${tab?.id}`);
                if (alertLog) {
                  try {
                    JSON.parse(alertLog).forEach((entry: any) => {
                      events.push({
                        id: `alert-${entry.time}`,
                        time: new Date(entry.time),
                        icon: <Bell size={14} className="text-red-400" />,
                        message: <span className="text-xs" style={{ color: 'var(--muted)' }}>Alert sent to waiter</span>,
                      });
                    });
                  } catch {}
                }
              }
              
              orders.filter(o => o.status !== 'cancelled').forEach(order => {
                const orderNumber = order.order_number || '?';
                if (order.status === 'served') {
                  events.push({
                    id: `served-${order.id}`,
                    time: new Date(order.updated_at || order.created_at),
                    icon: <CheckCircle size={14} className="text-green-400" />,
                    message: <span className="text-xs" style={{ color: 'var(--muted)' }}>Order #{orderNumber} served · {tempFormatCurrency(order.total)}</span>,
                  });
                } else if (order.status === 'pending') {
                  const isStaffOrder = order.initiated_by === 'staff';
                  events.push({
                    id: `pending-${order.id}`,
                    time: new Date(order.created_at),
                    icon: <Clock size={14} className="text-yellow-400" />,
                    message: isStaffOrder ? (
                      <span className="text-xs" style={{ color: 'var(--amber)' }}>
                        Order #{orderNumber} awaiting approval
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--amber)' }}>
                        Order #{orderNumber} awaiting acceptance
                      </span>
                    ),
                  });
                } else if (order.status === 'confirmed') {
                  events.push({
                    id: `confirmed-${order.id}`,
                    time: new Date(order.approved_at || order.updated_at || order.created_at),
                    icon: <CheckCircle size={14} className="text-green-400" />,
                    message: <span className="text-xs" style={{ color: 'var(--muted)' }}>Order #{orderNumber} approved · {tempFormatCurrency(order.total)}</span>,
                  });
                }
              });

              payments.filter(p => p.status === 'success').forEach(payment => {
                events.push({
                  id: `payment-${payment.id}`,
                  time: new Date(payment.created_at),
                  icon: <CreditCard size={14} className="text-emerald-400" />,
                  message: <span className="text-xs" style={{ color: 'var(--muted)' }}>Payment received · {tempFormatCurrency(payment.amount)}</span>,
                });
              });
              
              telegramMessages.filter(m => m.initiated_by === 'staff').forEach(msg => {
                events.push({
                  id: `msg-${msg.id}`,
                  time: new Date(msg.created_at),
                  icon: <MessageCircle size={14} className="text-blue-400" />,
                  message: <span className="text-xs" style={{ color: 'var(--cream)' }}>Staff: {msg.message}</span>,
                });
              });

              // System messages: staff_assigned, acknowledged
              telegramMessages.filter(m => m.initiated_by === 'system').forEach(msg => {
                const meta = (msg as any).message_metadata || {};
                if (meta.event === 'staff_assigned') {
                  events.push({
                    id: `assigned-${msg.id}`,
                    time: new Date(msg.created_at),
                    icon: <UserCheck size={14} className="text-green-400" />,
                    message: <span className="text-xs" style={{ color: 'var(--muted)' }}>You are being served by <span style={{ color: 'var(--cream)' }}>{meta.staff_name || 'staff'}</span> 👋</span>,
                  });
                }
                if (msg.status === 'acknowledged') {
                  events.push({
                    id: `ack-${msg.id}`,
                    time: new Date(msg.created_at),
                    icon: <CheckCircle size={14} className="text-green-400" />,
                    message: <span className="text-xs" style={{ color: 'var(--muted)' }}>Waiter confirmed — help is on the way</span>,
                  });
                }
              });
              
              events.sort((a, b) => b.time.getTime() - a.time.getTime());
              
              if (events.length === 0) {
                return <div className="text-center py-4"><p className="text-xs" style={{ color: 'var(--muted)' }}>No activity yet</p></div>;
              }
              
              return events.map(event => (
                <div key={event.id} className="flex items-start gap-2 py-1">
                  <div className="mt-0.5 flex-shrink-0">{event.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {event.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {event.message}
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>

          {/* Platform customer media advert — auto-playing full-screen interstitial */}
          {tab?.bar?.id && (
            <CustomerMediaBox barId={tab.bar.id} />
          )}

          {/* Menu Section */}
      {!venueControls.showCustomerMenu ? (
        <div ref={menuRef} className="px-4 mt-4 mb-4">
          <div className="flex items-center justify-center py-10">
            <div className="text-center max-w-xs">
              <UtensilsCrossed size={28} className="mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600 text-sm">The menu for this venue is not shown in the app right now. Please ask staff for the menu.</p>
            </div>
          </div>
        </div>
      ) : loading ? (
        <div className="px-4 mt-4">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF4F00] mx-auto mb-3"></div>
              <p className="text-gray-500 text-sm">Loading menu...</p>
            </div>
          </div>
        </div>
      ) : showStaticMenu ? (
        <div ref={menuRef} className="px-4 mt-4 mb-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">MENU</h2>
          {staticMenuType === 'slideshow' && slideshowImages.length > 0 ? (
            <div className="flex flex-col gap-3">
              {slideshowImages.map((url, i) => (
                <div
                  key={i}
                  className="w-full overflow-hidden rounded-lg border border-gray-100 shadow-sm"
                  style={{ aspectRatio: '9 / 16', backgroundColor: '#000' }}
                >
                  <img src={url} alt={`Menu page ${i + 1}`} className="w-full h-full object-contain" />
                </div>
              ))}
            </div>
          ) : staticMenuUrl ? (
            staticMenuType === 'pdf' ? (
              <iframe src={staticMenuUrl} title="Venue menu" className="w-full h-[70vh] rounded-lg border border-gray-100" />
            ) : (
              <img src={staticMenuUrl} alt="Venue menu" className="w-full h-auto rounded-lg border border-gray-100 shadow-sm" />
            )
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-center max-w-xs">
                <UtensilsCrossed size={28} className="mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600 text-sm">This venue&apos;s menu is available at the venue. Please ask staff for the menu.</p>
              </div>
            </div>
          )}
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
          </div>

          {menuCollapsed ? (
            <button
              onClick={() => setMenuCollapsed(false)}
              className="w-full flex items-center justify-between rounded-xl px-4 py-3.5 transition-colors"
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <span className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--cream)' }}>
                <ChevronDown size={16} style={{ color: 'var(--amber)' }} />
                Browse Menu
              </span>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>{barProducts.length} items</span>
            </button>
          ) : (
          <>
            {/* Search — quickly find a drink or dish by name */}
            <div className="relative mb-3">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.35)' }} />
              <input
                type="text"
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                placeholder="Search drinks"
                className="w-full rounded-lg pl-9 pr-3 py-2 text-sm outline-none transition-colors"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'var(--cream)',
                }}
              />
              {menuSearch && (
                <button
                  onClick={() => setMenuSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10"
                  aria-label="Clear search"
                >
                  <X size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
                </button>
              )}
            </div>

            {categoryOptions.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                {categoryOptions.map((cat) => {
                  const Icon = getCategoryIcon(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                        selectedCategory === cat
                          ? 'bg-[#FF4F00] text-white'
                          : 'bg-white bg-opacity-10 text-gray-300 hover:bg-opacity-20'
                      }`}
                    >
                      <Icon size={12} />
                      {cat}
                    </button>
                  );
                })}
              </div>
            )}

            {(() => {
            // Group products by category. Food is grouped by the venue's
            // user-defined categories (bar_categories, in bar-defined order);
            // drinks keep their product category.
            const foodCategoryNames = barCategories
              .filter((c) => c.kind === 'food')
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((c) => c.name);
            const hasDefinedFoodCategories = foodCategoryNames.length > 0;
            const foodCatSet = new Set(foodCategoryNames);

            // Apply search query, then category filter, preserving food-first order
            const q = menuSearch.trim().toLowerCase();
            const searched = q
              ? sortedProducts.filter(bp =>
                  (bp.product?.name || '').toLowerCase().includes(q) ||
                  (bp.product?.description || '').toLowerCase().includes(q) ||
                  (bp.product?.category || '').toLowerCase().includes(q))
              : sortedProducts;
            const displayProducts = selectedCategory === 'All'
              ? (q
                  // Searching: show matches across food AND drinks.
                  ? searched
                  // Not searching: hide drinks — they are found via the search box.
                  // (Drinks remain reachable by tapping a specific category chip.)
                  : searched.filter(bp => !isDrinkProduct(bp.product)))
              : searched.filter(bp => bp.product?.category === selectedCategory);

            if (displayProducts.length === 0) {
              return (
                <div className="text-center py-10" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  <p className="text-sm">No matches{menuSearch.trim() ? ` for "${menuSearch.trim()}"` : ''}</p>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Can&apos;t find it? We may still have it — just ask your waiter.
                  </p>
                  <div className="mt-3 flex flex-col items-center gap-2">
                    {menuSearch.trim() && (
                      <button
                        onClick={() => setMenuSearch('')}
                        className="text-xs px-3 py-1.5 rounded-full"
                        style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--cream)', border: '1px solid rgba(255,255,255,0.1)' }}
                      >
                        Clear search
                      </button>
                    )}
                    <button
                      onClick={sendWaiterAlert}
                      className="text-xs px-4 py-2 rounded-full font-medium"
                      style={{ backgroundColor: 'var(--amber)', color: '#1a1a2e', border: 'none', cursor: 'pointer' }}
                    >
                      <Bell size={13} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: '0.3rem' }} />
                      Ask the waiter
                    </button>
                  </div>
                </div>
              );
            }

            const categoryGroups: Record<string, BarProduct[]> = {};
            const categoryOrder: string[] = [];
            displayProducts.forEach((bp) => {
              const isDrink = isDrinkProduct(bp.product);
              const rawCat = bp.product?.category || 'Other';
              const cat = (!isDrink && hasDefinedFoodCategories)
                ? (foodCatSet.has(rawCat) ? rawCat : 'Other')
                : rawCat;
              if (!categoryGroups[cat]) {
                categoryGroups[cat] = [];
                categoryOrder.push(cat);
              }
              categoryGroups[cat].push(bp);
            });

            // Reorder: user-defined food categories first (bar order),
            // then 'Other', then drink categories.
            if (hasDefinedFoodCategories) {
              const ordered: string[] = [];
              foodCategoryNames.forEach((name) => { if (categoryGroups[name]) ordered.push(name); });
              if (categoryGroups['Other']) ordered.push('Other');
              categoryOrder.forEach((cat) => { if (!ordered.includes(cat)) ordered.push(cat); });
              categoryOrder.splice(0, categoryOrder.length, ...ordered);
            }

            const computePrice = (bp: BarProduct) => {
              return { displayPrice: bp.sale_price, showStrikethrough: false, totalDiscountPct: 0 };
            };

            return (
              <div className="flex flex-col gap-4">
                {categoryOrder.map((cat) => {
                  const items = categoryGroups[cat];
                  const isBeverage = isDrinkProduct(items[0]?.product) && !isCocktailProduct(items[0]?.product);
                  const isCocktail = isCocktailProduct(items[0]?.product);
                  const IconComponent = getCategoryIcon(cat);

                  return (
                    <div key={cat}>
                      {/* Category header */}
                      <div className="flex items-center gap-2 mb-2">
                        <IconComponent size={14} className="text-gray-500" />
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{cat}</h3>
                      </div>

                      {/* Beverages (supplier drinks): compact list, no images */}
                      {isBeverage && (
                        <div className="flex flex-col divide-y divide-white/10 rounded-lg border border-white/10 overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                          {items.map((bp) => {
                            const { displayPrice, showStrikethrough } = computePrice(bp);
                            return (
                              <button
                                key={bp.id}
                                onClick={() => addToCartAndFocus(bp, displayPrice)}
                                className="flex items-center justify-between px-3 py-2.5 hover:bg-white/5 active:bg-white/10 transition-colors text-left"
                              >
                                <span className="text-sm text-gray-100 font-medium truncate flex-1 mr-2">
                                  {bp.product?.name}
                                </span>
                                <div className="flex items-baseline gap-1.5 flex-shrink-0">
                                  {showStrikethrough && (
                                    <span className="text-gray-500 text-xs line-through">
                                      {tempFormatCurrency(bp.sale_price)}
                                    </span>
                                  )}
                                  <span className="text-[#FF4F00] text-sm font-semibold">
                                    {tempFormatCurrency(displayPrice)}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Cocktails (crafted): treated as food — photo cards + preview */}
                      {isCocktail && (
                        <div className="flex flex-col gap-3">
                          {items.map((bp) => {
                            const { displayPrice, showStrikethrough } = computePrice(bp);
                            const imageUrl = getDisplayImage(bp.product);
                            return (
                              <button
                                key={bp.id}
                                onClick={() => openProductDetail(bp, displayPrice, showStrikethrough)}
                                className="flex flex-col overflow-hidden rounded-xl active:scale-95 transition-transform text-left"
                                style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                              >
                                <div className="w-full aspect-[16/9] overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                                  {imageUrl ? (
                                    <img src={imageUrl} alt={bp.product?.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Martini size={32} style={{ color: 'rgba(255,255,255,0.18)' }} />
                                    </div>
                                  )}
                                </div>
                                <div className="p-3 flex flex-col gap-0.5">
                                  <span className="text-gray-100 text-base font-medium leading-tight line-clamp-2">
                                    {bp.product?.name}
                                  </span>
                                  {bp.product?.description && (
                                    <p className="text-xs text-gray-400 line-clamp-3">{bp.product.description}</p>
                                  )}
                                  <div className="flex items-baseline gap-1.5 flex-wrap mt-1">
                                    {showStrikethrough && (
                                      <span className="text-gray-500 text-xs line-through">
                                        {tempFormatCurrency(bp.sale_price)}
                                      </span>
                                    )}
                                    <span className="text-[#FF4F00] text-base font-semibold">
                                      {tempFormatCurrency(displayPrice)}
                                    </span>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Food: single-column cards, rectangular image */}
                      {!isBeverage && !isCocktail && (
                        <div className="flex flex-col gap-3">
                          {items.map((bp) => {
                            const { displayPrice, showStrikethrough } = computePrice(bp);
                            const imageUrl = getDisplayImage(bp.product);
                            return (
                              <button
                                key={bp.id}
                                onClick={() => openProductDetail(bp, displayPrice, showStrikethrough)}
                                className="flex flex-col overflow-hidden rounded-xl active:scale-95 transition-transform text-left"
                                style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                              >
                                <div className="w-full aspect-[16/9] overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                                  {imageUrl ? (
                                    <img src={imageUrl} alt={bp.product?.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Package size={32} style={{ color: 'rgba(255,255,255,0.18)' }} />
                                    </div>
                                  )}
                                </div>
                                <div className="p-3 flex flex-col gap-0.5">
                                  <span className="text-gray-100 text-base font-medium leading-tight line-clamp-2">
                                    {bp.product?.name}
                                  </span>
                                  {bp.product?.description && (
                                    <p className="text-xs text-gray-400 line-clamp-3">{bp.product.description}</p>
                                  )}
                                  <div className="flex items-baseline gap-1.5 flex-wrap mt-1">
                                    {showStrikethrough && (
                                      <span className="text-gray-500 text-xs line-through">
                                        {tempFormatCurrency(bp.sale_price)}
                                      </span>
                                    )}
                                    <span className="text-[#FF4F00] text-base font-semibold">
                                      {tempFormatCurrency(displayPrice)}
                                    </span>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
          </>
          )}
        </div>
      )}

      {/* Two-tap ordering guide — shown once per session */}
      {showMenuTapHint && (
        <div
          className="fixed inset-0 z-[9995] flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.65)', padding: '1rem' }}
          onClick={() => setShowMenuTapHint(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-5"
            style={{ backgroundColor: 'var(--ink2)', border: '1px solid var(--amber-border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full" style={{ backgroundColor: 'var(--amber)', color: 'var(--ink)' }}>
                <ShoppingCart size={16} />
              </span>
              <h3 style={{ fontWeight: 700, color: 'var(--cream)' }}>Order in two taps</h3>
            </div>
            <ol style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--cream)', fontSize: '0.9rem', lineHeight: 1.9 }}>
              <li>Tap a <strong>dish</strong> to view it full screen — <strong>drinks add straight to your cart</strong>.</li>
              <li>Tap <strong>Add to order</strong> to send a dish to your cart.</li>
            </ol>
            <button
              onClick={() => setShowMenuTapHint(false)}
              style={{ width: '100%', marginTop: '1rem', padding: '0.75rem', border: 'none', borderRadius: '0.75rem', fontWeight: 600, color: 'var(--ink)', backgroundColor: 'var(--amber)', cursor: 'pointer' }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Full-screen product preview — Add to order button adds to cart */}
      {productModal && (() => {
        const { bp, price, strikethrough } = productModal;
        const p = bp.product;
        const imageUrl = getDisplayImage(p);
        const IconComponent = getCategoryIcon(p?.category || 'Other');
        return (
          <div
            className="fixed inset-0 z-[9996] flex flex-col"
            style={{ backgroundColor: 'rgba(0,0,0,0.96)' }}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {p?.category || 'Item'}
              </span>
              <button
                onClick={() => setProductModal(null)}
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Close preview"
                style={{ color: 'var(--cream)' }}
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 flex items-center justify-center">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={p?.name}
                  className="block rounded-2xl mx-auto"
                  style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '55vh', width: 'auto', height: 'auto' }}
                />
              ) : (
                <div className="w-full aspect-[16/9] rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                  {IconComponent ? <IconComponent size={64} style={{ color: 'rgba(255,255,255,0.25)' }} /> : <Package size={64} style={{ color: 'rgba(255,255,255,0.25)' }} />}
                </div>
              )}
            </div>

            <div
              className="px-5 pt-4 pb-6 text-center"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}
            >
              <h3 style={{ color: 'var(--cream)', fontSize: '1.25rem', fontWeight: 700 }}>{p?.name}</h3>
              {p?.description && (
                <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>{p.description}</p>
              )}
              <div className="flex items-baseline justify-center gap-2 mt-2">
                {strikethrough && (
                  <span className="text-sm line-through" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {tempFormatCurrency(bp.sale_price)}
                  </span>
                )}
                <span style={{ color: 'var(--amber)', fontSize: '1.375rem', fontWeight: 800 }}>
                  {tempFormatCurrency(price)}
                </span>
              </div>
              <button
                onClick={addFromProductModal}
                className="w-full mt-4 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                style={{ backgroundColor: 'var(--amber)', color: 'var(--ink)', cursor: 'pointer', border: 'none' }}
              >
                <ShoppingCart size={18} />
                Add to order
              </button>
            </div>
          </div>
        );
      })()}

      {/* Cart Section */}
      {cart.length > 0 && (
        <div ref={cartRef} className="p-4 mb-4 bg-gradient-to-br from-[#FFF5F0] to-[#FFE8DF] border-t border-[#FFCDB8]">
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
      {orders.length > 0 && (
      <div ref={ordersRef} className="p-4">
        <div className="mb-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">ORDER HISTORY</h2>
        </div>
        
        {orders.length > 0 && (
          <div className="flex items-center justify-between mb-4 rounded-lg p-4" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Last Order</p>
              <p className="text-2xl font-bold text-white">{tempFormatCurrency(lastOrderTotal)}</p>
              <p className="text-xs text-gray-400 mt-1">{lastOrderTime}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Orders</p>
              <p className="text-2xl font-bold text-[#FF4F00]">{tempFormatCurrency(tabTotal)}</p>
              <p className="text-xs text-transparent mt-1">-</p>
            </div>
          </div>
        )}
        <div className="rounded-lg p-4 space-y-0" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
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
                        <span className="text-sm font-medium" style={{ color: 'var(--cream)' }}>Order #{orderNumber}</span>
                        <span className="text-xs text-gray-400">{timeAgo(order.created_at)}</span>
                      </div>
                      <p className="text-sm font-medium" style={{ color: 'var(--cream)' }}>{tempFormatCurrency(order.total)}</p>
                    </div>
                    <div className="space-y-1">
                      {items.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between">
                          <p className="text-xs" style={{ color: 'var(--muted)' }}>{item.quantity}x {item.name}</p>
                          <p className="text-xs" style={{ color: 'var(--muted)' }}>{tempFormatCurrency(item.total)}</p>
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
                    <div className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}></div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
      )}

      {/* Payment Section */}
      {balance > 0 && (
        <div ref={paymentRef} className="p-4">
          <div className="mb-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">PAYMENT</h2>
          </div>

          <div
            className="rounded-2xl p-5 text-center"
            style={{ backgroundColor: 'var(--amber)', color: '#1a1a2e' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ opacity: 0.6 }}>Your bill</p>
            <p className="text-4xl font-bold my-2">{tempFormatCurrency(balance)}</p>
            <button
              onClick={() => openPayInstructions()}
              className="w-full py-3.5 rounded-xl font-semibold"
              style={{ backgroundColor: '#1a1a2e', color: 'var(--amber)', cursor: 'pointer', border: 'none' }}
            >
              Close tab & pay
            </button>
            <p className="text-[11px] mt-2" style={{ opacity: 0.6 }}>
              The venue confirms your payment and closes the tab.
            </p>
          </div>

          {payments.filter((p: any) => p.status === 'success').length > 0 && (
            <div className="mt-4 rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {payments
                .filter((p: any) => p.status === 'success')
                .map((payment: any, i: number) => (
                  <div key={payment.id || i} className="flex items-center justify-between py-1 text-sm">
                    <span style={{ color: 'var(--muted)' }}>Payment · {payment.method}</span>
                    <span style={{ color: 'var(--cream)' }}>{tempFormatCurrency(payment.amount)}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
      {/* Service — rate/comment & tip (visible after ≥1 confirmed order; not on a closed tab) */}
      {crewMember && tab?.status !== 'closed' && (() => {
        const confirmed = orders.filter((o: any) => o.status === 'confirmed');
        if (confirmed.length === 0) return null;
        const confirmedTotal = confirmed.reduce((s: number, o: any) => s + (parseFloat(o.total || 0) || 0), 0);
        // Quick tip amounts: 2% / 3% / 5% of the confirmed total, rounded to the
        // nearest Ksh 50 (unique, > 0).
        const tipOptions = [0.02, 0.03, 0.05]
          .map((p) => Math.round((confirmedTotal * p) / 50) * 50)
          .filter((v) => v > 0)
          .filter((v, i, arr) => arr.indexOf(v) === i);
        return (
        <div className="p-4">
          <div className="mb-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">SERVICE</h2>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Rate {crewMember.display_name} or leave a tip — anytime before you leave.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setShowRatingModal(true)}
              style={{ padding: '0.85rem 1rem', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)', color: 'var(--cream)' }}
            >
              <Star size={16} style={{ color: 'var(--amber)' }} />
              Rate service or leave a comment
            </button>
            <button
              onClick={() => setShowTipSection((s) => !s)}
              style={{ padding: '0.85rem 1rem', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'var(--amber)', border: 'none', color: '#1a1a2e' }}
            >
              {showTipSection ? 'Hide tipping' : `Tip ${crewMember.display_name}`}
            </button>
            {showTipSection && (
              <>
                <CrewTipButton
                  crewName={crewMember.display_name}
                  presetAmounts={tipOptions}
                  onTip={async (amount) => {
                    const { data: sessionData } = await supabase.auth.getSession()
                    const accessToken = sessionData.session?.access_token
                    const res = await fetch('/api/crew/tip', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken || ''}` },
                      body: JSON.stringify({
                        crew_member_id: crewMember.id,
                        tab_id: tab?.id,
                        amount,
                      }),
                    })
                    const data = await res.json()
                    if (!res.ok) throw new Error(data.error || 'Failed to process tip')
                    pushLog('tip')
                    showToast({ type: 'success', title: 'Tip sent!', message: `You tipped KES ${amount} to ${crewMember.display_name}` })
                  }}
                />
              </>
            )}
          </div>
        </div>
        );
      })()}
      
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
              onClick={() => openPayInstructions()}
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
      
      {/* Pay & close — payment instructions modal */}
      {showPayInstructions && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setShowPayInstructions(false)}>
          <div
            className="w-full max-w-lg mx-auto rounded-t-3xl p-6 max-h-[82vh] overflow-y-auto"
            style={{ backgroundColor: '#FF4F00', color: '#ffffff' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-1">Close your tab</h2>
            <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.92)' }}>
              {balance > 0
                ? <>Your bill is <strong>{tempFormatCurrency(balance)}</strong>.</>
                : <>Your bill is fully paid.</>}{' '}
              Settle up and the venue will close the tab here.
            </p>

            <div className="space-y-2 mb-4">
              {(() => {
                const method = paymentSettings.customer_payment_method || 'cash';
                const info: Record<string, { title: string; body: React.ReactNode }> = {
                  cash: { title: 'Cash', body: 'Hand cash to your waiter or at the till.' },
                  paybill: {
                    title: 'M-Pesa · Paybill',
                    body: (
                      <>
                        Business number: <strong>{paymentSettings.mpesa_paybill || '—'}</strong>
                        <br />
                        Account: <strong>{paymentSettings.mpesa_account || '—'}</strong>
                      </>
                    ),
                  },
                  till: { title: 'M-Pesa · Till', body: <>Till number: <strong>{paymentSettings.mpesa_till || '—'}</strong></> },
                  pochi: { title: 'M-Pesa · Pochi', body: <>Pochi number: <strong>{paymentSettings.mpesa_pochi || '—'}</strong></> },
                  send_money: { title: 'M-Pesa · Send money', body: <>Send to: <strong>{paymentSettings.mpesa_number || '—'}</strong></> },
                };
                const m = info[method] || info.cash;
                return (
                  <div className="rounded-xl p-3 text-sm" style={{ backgroundColor: 'rgba(255,255,255,0.18)', color: '#ffffff' }}>
                    <p className="font-semibold mb-0.5">{m.title}</p>
                    <p style={{ color: 'rgba(255,255,255,0.95)' }}>{m.body}</p>
                    <p className="mt-2 font-medium" style={{ color: '#ffffff' }}>
                      Your payment will be confirmed by the manager, who will then close your tab.
                    </p>
                  </div>
                );
              })()}
            </div>

            <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.9)' }}>
              Payment confirmation and closing is done by the venue once they receive it.
            </p>

            <button
              onClick={() => setShowPayInstructions(false)}
              className="w-full py-3.5 rounded-xl font-semibold"
              style={{ backgroundColor: '#1a1a2e', color: '#ffffff', cursor: 'pointer', border: 'none' }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Acceptance Modal — amber panel, reversed text, shows accepted order */}
      {acceptanceModal.show && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div
            className="w-full max-w-lg mx-auto rounded-t-3xl p-6 max-h-[82vh] overflow-y-auto"
            style={{ backgroundColor: 'var(--amber)', color: '#1a1a2e' }}
          >
            <div className="text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'rgba(26,26,46,0.12)' }}>
                <CheckCircle size={30} style={{ color: '#1a1a2e' }} />
              </div>
              <h2 className="text-xl font-bold mb-1">Order Accepted!</h2>
              <p className="text-sm" style={{ opacity: 0.75 }}>{acceptanceModal.message}</p>
              <p className="text-3xl font-bold mt-3">{formatCurrency(parseFloat(acceptanceModal.orderTotal || '0'))}</p>
            </div>

            {acceptanceModal.items && acceptanceModal.items.length > 0 && (
              <div className="mt-5 mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide mb-2" style={{ opacity: 0.6 }}>Order details</h3>
                <div style={{ borderTop: '1px solid rgba(26,26,46,0.2)' }}>
                  {acceptanceModal.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 text-sm" style={{ borderBottom: '1px solid rgba(26,26,46,0.12)' }}>
                      <span className="font-medium">
                        {item.quantity}× {item.name}
                      </span>
                      <span className="font-semibold">{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setAcceptanceModal({ show: false, orderTotal: '', message: '' })}
              className="w-full py-3.5 rounded-xl font-semibold mt-2"
              style={{ backgroundColor: '#1a1a2e', color: 'var(--amber)', cursor: 'pointer', border: 'none' }}
            >
              OK
            </button>
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
      
      {/* Close Tab Section — removed (duplicate of payment success view Close My Tab) */}
      
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
    </div>

    {/* Crew Rating Modal */}
    <CrewRatingModal
      isOpen={showRatingModal}
      onClose={() => setShowRatingModal(false)}
      crewName={crewMember?.display_name || 'your crew member'}
      onSubmit={async (rating, comment) => {
        const { data: sessionData } = await supabase.auth.getSession()
        const accessToken = sessionData.session?.access_token
        const res = await fetch('/api/crew/rate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken || ''}` },
          body: JSON.stringify({
            crew_member_id: crewMember?.id,
            tab_id: tab?.id,
            rating,
            comment,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to submit rating')
        pushLog('rate')
        showToast({ type: 'success', title: 'Rating submitted!', message: 'Thank you for your feedback' })
      }}
    />

    {/* Crew Profile View */}
    <CrewProfileView
      isOpen={showProfileView}
      onClose={() => setShowProfileView(false)}
      crewId={crewMember?.id || ''}
    />

    <ReceiptModal
      isOpen={showReceipt}
      onClose={() => setShowReceipt(false)}
      tabNumber={tab?.tab_number ?? 0}
      tabId={tab?.id ?? ''}
      venueName={tab?.bar?.name ?? barName}
      venueLogo={tab?.bar?.logo_url ?? undefined}
      customerName={displayName}
      orders={orders}
      payment={receiptPayment || { id: '', amount: 0, method: '', status: '', timestamp: '' }}
      openedAt={tab?.opened_at ?? ''}
    />
    </>
  );
}