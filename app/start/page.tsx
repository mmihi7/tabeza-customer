// app/start/page.tsx - FIXED QR SCANNER
'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Bell, Store, AlertCircle, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { 
  getDeviceId,
  getBarDeviceKey,
  storeActiveTab
} from '@/lib/device-identity';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/contexts/AuthContext';
// Token feature disabled
// import { TokensService, TOKENS_CONFIG } from '@/lib/tokens-service';
// import { TokenNotifications, useTokenNotifications } from '@/components/TokenNotifications';
import { getCustomerId } from '@/lib/customer-service';
import QrScanner from 'qr-scanner';
import { BarClosedSlideIn } from '../../components/BarClosedSlideIn';
import { playCustomerNotification, requestVibrationPermission, isVibrationSupported } from '@/lib/notifications';
import { requestSystemPermissions, checkPermissions } from '@/lib/permissions';
import { isWithinBusinessHours } from '@/lib/business-hours';
import { OverdueTabModal } from '@/components/OverdueTabModal';
import { OverduePaymentModal } from '@/components/OverduePaymentModal';
import StepHome from './StepHome';
import StepIdentity from './StepIdentity';
import StepConfirm from './StepConfirm';

function ConsentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  // Customer app origin for QR code validation
  const customerOrigin = process.env.NEXT_PUBLIC_CUSTOMER_ORIGIN || 'https://app.tabeza.co.ke';
  
  // Token service and notifications - DISABLED
  // const tokensService = new TokensService(supabase);
  // const { showNotification } = useTokenNotifications();
  
  // Form states
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [barSlug, setBarSlug] = useState<string | null>(null);
  const [barId, setBarId] = useState<string | null>(null);
  const [barName, setBarName] = useState<string>('Default Bar Name');
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [systemPermissions, setSystemPermissions] = useState<any>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [nickname, setNickname] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [creating, setCreating] = useState(false);
  
  // QR Scanner states
  const [isScannerMode, setIsScannerMode] = useState(false);
  const [qrScanner, setQrScanner] = useState<QrScanner | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [debugDeviceId, setDebugDeviceId] = useState<string>('');
  
  // Bar closed slide-in state
  const [showBarClosed, setShowBarClosed] = useState(false);
  const [barClosedInfo, setBarClosedInfo] = useState<{
    barName: string;
    nextOpenTime: string;
    businessHours?: any;
  }>({
    barName: '',
    nextOpenTime: '',
    businessHours: undefined
  });

  // Overdue tab resolution state (requirements 2.1, 2.2)
  const [showOverdueModal, setShowOverdueModal] = useState(false);
  const [showOverduePaymentModal, setShowOverduePaymentModal] = useState(false);
  const [overdueTab, setOverdueTab] = useState<any>(null);

  // ── Wizard step state ──────────────────────────────────────────────────────
  const [wizardStep, setWizardStep] = useState<0 | 1 | 2 | 3 | 4>(0)
  const [selectedVenue, setSelectedVenue] = useState<{
    id: string
    slug: string
    name: string
    category?: string
  } | null>(null)
  const [identityMode, setIdentityMode] = useState<'named' | 'nickname' | 'anonymous'>('named')
  const [wizardNickname, setWizardNickname] = useState('')
  const [createdTabId, setCreatedTabId] = useState<string>('')

  // IMPROVED QR CODE EXTRACTION
  const extractSlugFromQRCode = (qrCode: string): string | null => {
    console.log(' RAW QR CODE:', JSON.stringify(qrCode));
    console.log('🔍 RAW QR CODE:', JSON.stringify(qrCode));
    
    // Clean the code
    const cleanCode = qrCode.trim();
    
    // Pattern 1: Extract from full URL format (most common from staff QR codes)
    // Example: https://app.tabeza.co.ke/menu?bar=sunset-lounge
    const urlPattern = /[?&]bar=([a-z0-9\-]+)/i;
    const urlMatch = cleanCode.match(urlPattern);
    if (urlMatch && urlMatch[1]) {
      console.log('✅ Extracted slug from URL pattern:', urlMatch[1]);
      return urlMatch[1].toLowerCase();
    }
    
    // Pattern 2: slug= parameter
    const slugPattern = /[?&]slug=([a-z0-9\-]+)/i;
    const slugMatch = cleanCode.match(slugPattern);
    if (slugMatch && slugMatch[1]) {
      console.log('✅ Extracted slug from slug parameter:', slugMatch[1]);
      return slugMatch[1].toLowerCase();
    }
    
    // Pattern 3: Direct slug format (just the slug itself)
    // Example: sunset-lounge
    if (/^[a-z0-9\-]+$/i.test(cleanCode)) {
      console.log('✅ Direct slug format detected:', cleanCode);
      return cleanCode.toLowerCase();
    }
    
    // Pattern 4: Try URL parsing as last resort
    try {
      const url = new URL(cleanCode.includes('://') ? cleanCode : `https://${cleanCode}`);
      const params = new URLSearchParams(url.search);
      const barParam = params.get('bar') || params.get('slug');
      if (barParam) {
        console.log('✅ Extracted slug from URL parsing:', barParam);
        return barParam.toLowerCase();
      }
    } catch (e) {
      // Not a valid URL
    }
    
    console.log('❌ Could not extract slug from QR code');
    return null;
  };

  // QR Scanner functions
  const startQRScanner = async () => {
    if (!videoRef.current) return;
    
    try {
      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          handleQRCodeDetected(result.data);
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment',
          maxScansPerSecond: 1,
          returnDetailedScanResult: true
        }
      );
      
      setQrScanner(scanner);
      await scanner.start();
      
    } catch (error: unknown) {
      showToast({
        type: 'error',
        title: 'Camera Error',
        message: `Unable to access camera: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };
  
  const stopScanner = () => {
    if (qrScanner) {
      qrScanner.stop();
      qrScanner.destroy();
      setQrScanner(null);
    }
  };
  
  const handleQRCodeDetected = (code: string) => {
    stopScanner();
    
    console.log('📷 QR CODE SCANNED:', code);
    
    // Extract slug using improved parser
    const extractedSlug = extractSlugFromQRCode(code);
    
    if (!extractedSlug) {
      showToast({
        type: 'error',
        title: 'Invalid QR Code',
        message: 'Could not extract bar information. Please try again or enter code manually.'
      });
      // Stay in scanner mode to allow retry
      setTimeout(() => {
        if (videoRef.current) {
          startQRScanner();
        }
      }, 2000);
      return;
    }
    
    console.log('✅ EXTRACTED SLUG:', extractedSlug);
    
    // Store and navigate directly to consent page (not landing page)
    setBarSlug(extractedSlug);
    sessionStorage.setItem('scanned_bar_slug', extractedSlug);
    sessionStorage.removeItem('qr_scan_mode'); // Clear this flag
    
    showToast({
      type: 'success',
      title: 'QR Code Scanned',
      message: 'Loading bar information...'
    });
    
    // Turn off scanner mode and load bar info — loadBarInfo will advance to wizardStep(1)
    setIsScannerMode(false);
    loadBarInfo(extractedSlug);
  };

  useEffect(() => {
    const requestPermissions = async () => {
      const perms = await requestSystemPermissions();
      setSystemPermissions(perms);
      console.log('📋 System permissions requested:', perms);
      setPermissionRequested(true);
    };
    
    // Request permissions after a short delay to allow UI to load
    setTimeout(requestPermissions, 1000);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      // Don't redirect to main page - unauthenticated users should stay here to scan QR codes
      // They can sign up/sign in from the QR scanning flow
      console.log('📱 Unauthenticated user on start page - allowing QR scanning');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const initDebugDeviceId = async () => {
      const id = await getDeviceId();
      setDebugDeviceId(id.slice(0, 20));
    };
    initDebugDeviceId();
  }, []);

  useEffect(() => {
    initializeConsent();
  }, []);

  useEffect(() => {
    return () => {
      if (qrScanner) {
        qrScanner.stop();
        qrScanner.destroy();
      }
    };
  }, [qrScanner]);

  useEffect(() => {
    if (isScannerMode && videoRef.current && !qrScanner) {
      startQRScanner();
    }
  }, [isScannerMode]);

  // Fallback reset — if wizardStep ends up in an unhandled state, reset to home.
  // Must be unconditional (Rules of Hooks) — the condition is inside the effect.
  useEffect(() => {
    if (
      !loading && !redirecting && !error && !showBarClosed && !isScannerMode &&
      wizardStep !== 0 && wizardStep !== 1 && wizardStep !== 2 && wizardStep !== 4 &&
      !selectedVenue && !createdTabId
    ) {
      setWizardStep(0);
    }
  }, [loading, redirecting, error, showBarClosed, isScannerMode, wizardStep, selectedVenue, createdTabId]);

  const initializeConsent = async () => {
    try {
      // Check if scanner mode was requested
      const urlScannerParam = searchParams?.get('scanner') === 'true';
      
      if (urlScannerParam) {
        console.log('📷 Scanner mode requested');
        setIsScannerMode(true);
        setLoading(false);
        return;
      }

      // Check if manual code entry mode was requested (from signup success screen)
      // mode=code now just shows StepHome which has the inline code input built in
      const urlModeParam = searchParams?.get('mode');
      if (urlModeParam === 'code') {
        console.log('⌨️ Manual code entry mode requested — showing StepHome');
        setWizardStep(0);
        setLoading(false);
        return;
      }
      
      // Get device ID first 
      const deviceId = await getDeviceId();
      
      // Get bar slug from URL or sessionStorage
      let slug = searchParams?.get('bar') || searchParams?.get('slug');
      
      if (!slug) {
        slug = sessionStorage.getItem('scanned_bar_slug');
      }

      if (!slug) {
        // No slug found — show the Home Screen (wizardStep 0) instead of
        // redirecting to landing. The user can pick a recent venue or scan.
        // Requirements: 7.1–7.7
        console.log('ℹ️ No slug found — showing Home Screen (wizardStep 0)');
        setWizardStep(0);
        setLoading(false);
        return;
      }

      console.log('✅ Slug found, loading bar info:', slug);
      setBarSlug(slug);
      await loadBarInfo(slug);
      
    } catch (error) {
      console.error('❌ Error in initializeConsent:', error);
      setError('Failed to load bar information. Please try again.');
      setLoading(false);
    }
  };

  const loadBarInfo = async (slug: string) => {
    try {
      console.log('🔍 Loading bar info for slug:', slug);
      
      const { data: bar, error: barError } = await (supabase as any)
        .from('bars')
        .select('id, name, active, location, slug, business_hours_mode, business_hours_simple, business_hours_advanced, business_24_hours')
        .eq('slug', slug)
        .maybeSingle();

      if (barError) {
        console.error('❌ Database error:', barError);
        setError(`Database error: ${barError.message}`);
        setLoading(false);
        return;
      }

      if (!bar) {
        console.error('❌ Bar not found:', slug);
        setError(`Bar not found with slug: "${slug}". Please scan a valid QR code.`);
        setLoading(false);
        return;
      }

      const isActive = bar.active !== false;
      
      if (!isActive) {
        console.error('❌ Bar inactive:', bar.name);
        setError('This bar is currently unavailable. Please contact staff.');
        setLoading(false);
        return;
      }

      console.log('✅ Bar loaded successfully:', bar.name);
      setBarId(bar.id);
      setBarName(bar.name || 'Bar');

      // Always route through the wizard — set selectedVenue and go to Identity step.
      // Existing tab / overdue / business-hours checks still run first (below).
      setSelectedVenue({ id: bar.id, slug, name: bar.name || 'Bar' });

      // Check if bar is currently open for business BEFORE showing consent form
      try {
        // First check if user has existing tabs for this bar.
        // Use the API route (service role) to bypass RLS — direct client queries are blocked.
        const deviceId = await getDeviceId(); // still needed for new tab creation below
        let existingTabs: any[] = [];

        if (user?.id) {
          try {
            const res = await fetch(`/api/tabs/by-customer?customerId=${user.id}&barId=${bar.id}`);
            if (res.ok) {
              const body = await res.json();
              if (body.tab) existingTabs = [body.tab];
            }
          } catch (e) {
            console.warn('⚠️ Could not check existing tab via API:', e);
          }
        }

        // Allow access if user has existing tabs (open or overdue) - they need to pay!
        const hasExistingTab = existingTabs.length > 0;
        
        if (hasExistingTab) {
          console.log('✅ User has existing tab, redirecting directly to menu');
          console.log('📊 Existing tab data:', existingTabs[0]);
          
          const existingTab = existingTabs[0];

          // Overdue status branch — intercept before the open-tab redirect (requirements 2.1, 2.2)
          if (existingTab.status === 'overdue') {
            setOverdueTab(existingTab);
            if (isWithinBusinessHours(bar)) {
              setShowOverdueModal(true);
            } else {
              setShowOverduePaymentModal(true);
            }
            setLoading(false);
            return;
          }
          // existing open-tab redirect block preserved intact below

          // Set redirecting state to prevent showing consent form
          setRedirecting(true);
          
          // Store the existing tab data and redirect to menu
          storeActiveTab(bar.id, existingTab);
          sessionStorage.setItem('currentTab', JSON.stringify(existingTab));
          sessionStorage.setItem('barName', bar.name);
          
          // Get display name from existing tab
          let displayName: string;
          try {
            const notes = JSON.parse(existingTab.notes || '{}');
            // If user chose a nickname, show it instead of tab number
            if (notes.has_nickname && notes.display_name) {
              displayName = notes.display_name;
            } else {
              displayName = notes.display_name || `Tab ${existingTab.tab_number}`;
            }
            console.log('📝 Display name from notes:', displayName);
          } catch (error) {
            displayName = `Tab ${existingTab.tab_number}`;
            console.log('📝 Fallback display name:', displayName);
          }
          sessionStorage.setItem('displayName', displayName);
          
          // Redirect to menu instead of showing consent form
          showToast({
            type: 'success',
            title: 'Welcome Back!',
            message: `Continuing to your existing tab at ${bar.name}`
          });
          
          console.log('🔄 Redirecting to menu in 500ms...');
          setTimeout(() => {
            console.log('🔄 Executing redirect to /menu');
            router.replace('/menu');
          }, 500);
          
          // Keep loading state true to prevent showing consent form during redirect
          return; // Don't show consent form and don't call setLoading(false)
        } else {
          // Check business hours only for new customers
          // Shared version extracted to lib/business-hours.ts — this inline copy is preserved per non-destructive rule
          const isWithinBusinessHours = (barData: any) => {
            try {
              // Handle 24 hours mode
              if (barData.business_24_hours === true) {
                return true;
              }
              
              // If no business hours configured, always open
              if (!barData.business_hours_mode) {
                return true;
              }
              
              const now = new Date();
              const currentHour = now.getHours();
              const currentMinute = now.getMinutes();
              const currentTotalMinutes = currentHour * 60 + currentMinute;
              
              // Get current day of week (0 = Sunday, 1 = Monday, etc.)
              const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
              const currentDay = dayNames[now.getDay()];
              
              if (barData.business_hours_mode === 'simple') {
                // Simple mode: same hours every day
                if (!barData.business_hours_simple) {
                  return true;
                }
                
                // Parse open time (format: "HH:MM")
                const [openHour, openMinute] = barData.business_hours_simple.openTime.split(':').map(Number);
                const openTotalMinutes = openHour * 60 + openMinute;
                
                // Parse close time
                const [closeHour, closeMinute] = barData.business_hours_simple.closeTime.split(':').map(Number);
                const closeTotalMinutes = closeHour * 60 + closeMinute;
                
                // Handle overnight hours (e.g., 20:00 to 04:00)
                if (barData.business_hours_simple.closeNextDay || closeTotalMinutes < openTotalMinutes) {
                  // Venue is open overnight: current time >= open OR current time <= close
                  return currentTotalMinutes >= openTotalMinutes || currentTotalMinutes <= closeTotalMinutes;
                } else {
                  // Normal hours: current time between open and close
                  return currentTotalMinutes >= openTotalMinutes && currentTotalMinutes <= closeTotalMinutes;
                }
                
              } else if (barData.business_hours_mode === 'advanced') {
                // Advanced mode: different hours per day
                if (!barData.business_hours_advanced || !barData.business_hours_advanced[currentDay]) {
                  return true; // Default to open if no hours for this day
                }
                
                const dayHours = barData.business_hours_advanced[currentDay];
                if (!dayHours.open || !dayHours.close) {
                  return true; // Default to open if missing open/close times
                }
                
                // Parse open time
                const [openHour, openMinute] = dayHours.open.split(':').map(Number);
                const openTotalMinutes = openHour * 60 + openMinute;
                
                // Parse close time
                const [closeHour, closeMinute] = dayHours.close.split(':').map(Number);
                const closeTotalMinutes = closeHour * 60 + closeMinute;
                
                // Handle overnight hours
                if (dayHours.closeNextDay || closeTotalMinutes < openTotalMinutes) {
                  // Venue is open overnight: current time >= open OR current time <= close
                  return currentTotalMinutes >= openTotalMinutes || currentTotalMinutes <= closeTotalMinutes;
                } else {
                  // Normal hours: current time between open and close
                  return currentTotalMinutes >= openTotalMinutes && currentTotalMinutes <= closeTotalMinutes;
                }
              }
            } catch (error) {
              console.error('Error checking business hours:', error);
              return true; // Default to open on error
            }
          };

          const isOpen = isWithinBusinessHours(bar);
          
          if (!isOpen) {
            // Calculate next opening time
            let nextOpenTime = 'tomorrow';
            if (bar.business_hours_simple) {
              const [openHour, openMinute] = bar.business_hours_simple.openTime.split(':').map(Number);
              const now = new Date();
              const currentHour = now.getHours();
              
              // Check if opening time is later today or tomorrow
              if (currentHour < openHour) {
                // Opens later today
                nextOpenTime = `today at ${bar.business_hours_simple.openTime} am`;
              } else {
                // Opens tomorrow
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(openHour, openMinute, 0, 0);
                nextOpenTime = `tomorrow at ${bar.business_hours_simple.openTime} am`;
              }
            }

            // Show bar closed page instead of consent form
            setBarClosedInfo({
              barName: bar.name || 'Bar',
              nextOpenTime,
              businessHours: bar.business_hours_advanced || undefined
            });
            setShowBarClosed(true);
            setLoading(false);
            return; // Don't show consent form
          }
        }
      } catch (error) {
        console.error('Error checking business hours:', error);
        // Continue with wizard if business hours check fails
      }

      setLoading(false);
      // All checks passed — route to Identity step
      setWizardStep(1);

    } catch (error) {
      console.error('❌ Error loading bar:', error);
      setError('Error loading bar information. Please try again.');
      setLoading(false);
    }
  };

  // Overdue tab handlers (requirements 2.2.1, 2.4)
  const handleOverdueReopen = async () => {
    if (!overdueTab?.id) return;
    try {
      const res = await fetch(`/api/tabs/${overdueTab.id}/reopen`, { method: 'PATCH' });
      if (!res.ok) {
        const body = await res.json();
        showToast({ type: 'error', title: 'Reopen Failed', message: body.error || 'Could not reopen tab.' });
        return;
      }
      const { tab: updatedTab } = await res.json();
      storeActiveTab(updatedTab.bar_id, updatedTab);
      sessionStorage.setItem('currentTab', JSON.stringify(updatedTab));
      if (barName) sessionStorage.setItem('barName', barName);
      router.replace('/menu');
    } catch (err: any) {
      showToast({ type: 'error', title: 'Reopen Failed', message: err.message || 'Could not reopen tab.' });
    }
  };

  const handleOverduePaymentSuccess = () => {
    router.replace('/');
  };

  const handleStartTab = async () => {
    // Check if user is fully authenticated before allowing tab creation
    if (!user?.id) {
      console.error('❌ User not authenticated - cannot create tab');
      showToast({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please sign in to create a tab.'
      });
      
      // Redirect to authentication page
      router.push('/auth/signin');
      return;
    }

    if (!barId) {
      showToast({
        type: 'error',
        title: 'Bar Information Missing',
        message: 'Bar information not found. Please scan QR code again.'
      });
      return;
    }

    setCreating(true);

    const deviceId = await getDeviceId();
    
    try {
      // Set bar context for RLS policies
      const { error: contextError } = await (supabase as any)
        .rpc('set_bar_context', { p_bar_id: barId });
      
      if (contextError) {
        console.warn('⚠️ Failed to set bar context:', contextError);
        // Continue anyway - the function might still work
      }

      // Get or create customer record for this user
      const customerId = await getCustomerId(user.id);
      console.log('👤 Customer ID for tab creation:', customerId);

      // Prepare display name based on identity mode chosen in StepIdentity
      let displayName: string | null = null;
      if (identityMode === 'nickname' && wizardNickname.trim()) {
        displayName = wizardNickname.trim();
      } else if (identityMode === 'anonymous') {
        displayName = 'Anonymous';
      } else if (identityMode === 'named') {
        // Use first name from user metadata, fall back to null (DB generates tab number)
        const firstName = user?.user_metadata?.first_name;
        displayName = firstName ? firstName.trim() : null;
      }
      // If null, the database function generates "Tab N"

      // Use atomic tab creation function to prevent race conditions
      // User is guaranteed to be authenticated at this point
      const { data: result, error } = await (supabase as any)
        .rpc('create_tab_if_not_exists', {
          p_bar_id: barId,
          p_device_id: deviceId,
          p_customer_id: customerId, // Use customer_id instead of user_id
          p_display_name: displayName,
          p_notes: {
            has_nickname: identityMode === 'nickname',
            identity_mode: identityMode,
            device_id: deviceId,
            notifications_enabled: notificationsEnabled,
            sound_enabled: soundEnabled,
            vibration_enabled: vibrationEnabled,
            terms_accepted: termsAccepted,
            accepted_at: new Date().toISOString(),
            bar_name: barName,
            created_via: 'consent_page'
          }
        });

      console.log('🔍 Tab creation response:', { result, error });

      if (error) {
        console.error('❌ Tab creation error:', error);
        throw new Error(error.message || 'Failed to create tab');
      }

      if (!result) {
        console.error('❌ No result returned from tab creation');
        throw new Error('No response from server');
      }

      // RPC returns array: [{ success, message, existing, ...tab_fields }]
      // PostgREST flattens composite return types — tab fields are merged
      // directly into the row, NOT nested under a "tab" key.
      console.log('🔍 Raw RPC result:', JSON.stringify(result));

      const rpcRow = Array.isArray(result) ? result[0] : result;
      if (!rpcRow?.success) {
        throw new Error(rpcRow?.message || 'Tab creation failed');
      }

      // Extract tab from the flattened row — PostgREST merges composite columns
      // into the parent row, so tab fields (id, bar_id, status, etc.) are at the
      // top level of rpcRow alongside success/message/existing.
      const tab = rpcRow.tab && rpcRow.tab.id
        ? rpcRow.tab  // nested (future-proof if PostgREST behaviour changes)
        : rpcRow;     // flattened (current PostgREST behaviour for composite columns)
      const isExisting = rpcRow.existing ?? false;

      if (!tab?.id) {
        console.error('❌ Tab missing from RPC response:', rpcRow);
        throw new Error('Tab was created but could not be loaded. Please refresh.');
      }

      console.log('✅ Tab ready:', tab.id, '| existing:', isExisting);

      // Get display name from tab
      let finalDisplayName: string;
      try {
        const notes = JSON.parse(tab.notes || '{}');
        // If user chose a nickname, show it instead of tab number
        if (notes.has_nickname && notes.display_name) {
          finalDisplayName = notes.display_name;
        } else {
          finalDisplayName = notes.display_name || `Tab ${tab.tab_number}`;
        }
      } catch {
        finalDisplayName = `Tab ${tab.tab_number}`;
      }

      // Store tab data - clean the object to avoid circular references
      const tabWithBarId = {
        id: tab.id,
        bar_id: barId, // Explicitly add bar_id field
        tab_number: tab.tab_number,
        status: tab.status,
        opened_at: tab.opened_at,
        closed_at: tab.closed_at,
        notes: tab.notes,
        created_at: tab.created_at,
        updated_at: tab.updated_at,
        closed_by: tab.closed_by,
        device_identifier: tab.device_identifier,
        moved_to_overdue_at: tab.moved_to_overdue_at,
        overdue_reason: tab.overdue_reason,
        sound_enabled: tab.sound_enabled,
        vibration_enabled: tab.vibration_enabled,
        user_id: tab.user_id,
        customer_id: tab.customer_id,
        is_loyalty_member: tab.is_loyalty_member,
        // Only include the fields we need, exclude any circular references
      };
      
      storeActiveTab(barId, tabWithBarId);
      sessionStorage.setItem('currentTab', JSON.stringify(tabWithBarId));
      sessionStorage.setItem('displayName', finalDisplayName);
      sessionStorage.setItem('barName', barName);
      
      if (isExisting) {
        sessionStorage.removeItem('just_created_tab');
        showToast({
          type: 'success',
          title: 'Welcome Back!',
          message: `Continuing to your ${finalDisplayName}`
        });
        setTimeout(() => { router.replace('/menu'); }, 300);
      } else {
        sessionStorage.setItem('just_created_tab', 'true');
        // Go directly to menu — no intermediate "Tab is open" screen needed
        setTimeout(() => { router.replace('/menu'); }, 300);
      }

    } catch (error: any) {
      console.error('Tab creation error:', error);
      
      // Handle specific error cases
      if (error.message?.includes('unique_violation') || error.message?.includes('duplicate')) {
        showToast({
          type: 'info',
          title: 'Tab Already Exists',
          message: 'You already have a tab at this bar. Redirecting...'
        });
        
        // Try to find and redirect to existing tab
        setTimeout(() => {
          router.replace('/menu');
        }, 1000);
      } else {
        showToast({
          type: 'error',
          title: 'Tab Creation Failed',
          message: error.message || 'Please try again or contact staff'
        });
      }
      
      setCreating(false);
    }
  };

  // Loading state
  if (loading || redirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg font-medium">
            {redirecting ? 'Welcome back! Redirecting to your tab...' : 'Loading bar information...'}
          </p>
          {barSlug && <p className="text-sm mt-2 font-mono opacity-75">{barSlug}</p>}
        </div>
      </div>
    );
  }

  // Scanner mode
  if (isScannerMode) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--ink)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Close */}
        <button
          onClick={() => { stopScanner(); setIsScannerMode(false); }}
          style={{
            position: 'absolute', top: 16, right: 16, zIndex: 10,
            padding: 8, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)',
            borderRadius: '50%', border: 'none', cursor: 'pointer', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <X size={24} />
        </button>

        {/* Camera viewfinder — takes most of the screen */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <video
            ref={videoRef}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            autoPlay
            playsInline
            muted
          />

          {/* Corner guides */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: 220, height: 220 }}>
              {/* top-left */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: 32, height: 32, borderTop: '4px solid var(--amber)', borderLeft: '4px solid var(--amber)', borderRadius: '4px 0 0 0' }} />
              {/* top-right */}
              <div style={{ position: 'absolute', top: 0, right: 0, width: 32, height: 32, borderTop: '4px solid var(--amber)', borderRight: '4px solid var(--amber)', borderRadius: '0 4px 0 0' }} />
              {/* bottom-left */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: 32, height: 32, borderBottom: '4px solid var(--amber)', borderLeft: '4px solid var(--amber)', borderRadius: '0 0 0 4px' }} />
              {/* bottom-right */}
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderBottom: '4px solid var(--amber)', borderRight: '4px solid var(--amber)', borderRadius: '0 0 4px 0' }} />
            </div>
          </div>

          <p style={{ position: 'absolute', bottom: 20, left: 0, right: 0, textAlign: 'center', color: '#fff', fontFamily: "'Lato', sans-serif", fontSize: '0.9rem', opacity: 0.85 }}>
            Point camera at QR code
          </p>
        </div>

        {/* Code entry below viewfinder — no page navigation needed */}
        <div style={{ background: 'var(--ink)', padding: '1.25rem 1.25rem 2rem', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            or enter code manually
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const input = (e.currentTarget.elements.namedItem('scannerCode') as HTMLInputElement).value.trim().toLowerCase();
              if (!input) return;
              stopScanner();
              setIsScannerMode(false);
              setBarSlug(input);
              sessionStorage.setItem('scanned_bar_slug', input);
              await loadBarInfo(input);
            }}
            style={{ display: 'flex', gap: '0.5rem' }}
          >
            <input
              name="scannerCode"
              type="text"
              placeholder="e.g. sunset-lounge"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              style={{
                flex: 1,
                padding: '0.875rem 1rem',
                background: 'var(--ink2)',
                border: '1.5px solid var(--amber-border)',
                borderRadius: '0.5rem',
                color: 'var(--cream)',
                fontFamily: "'Lato', sans-serif",
                fontSize: '0.9375rem',
                outline: 'none',
                caretColor: 'var(--amber)',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--amber)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--amber-border)' }}
            />
            <button
              type="submit"
              style={{
                padding: '0.875rem 1.25rem',
                background: 'var(--amber)',
                color: 'var(--ink)',
                border: 'none',
                borderRadius: '0.5rem',
                fontFamily: "'Lato', sans-serif",
                fontWeight: 700,
                fontSize: '0.9375rem',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              Go
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">QR Code Error</h1>
            <p className="text-gray-700 mb-4">{error}</p>
          </div>
          
          <button
            onClick={() => {
              sessionStorage.clear();
              router.replace('/');
            }}
            className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition"
          >
            Go Back Home
          </button>
          
          <p className="text-xs text-gray-400 text-center mt-4">
            Please scan a valid QR code or contact staff
          </p>
        </div>
      </div>
    );
  }

  // Bar closed state - show slide-in instead of consent form
  if (showBarClosed && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center p-4 relative">
        {/* Back arrow button */}
        <button
          onClick={() => {
            sessionStorage.clear();
            router.replace('/');
          }}
          className="absolute top-4 left-4 p-3 bg-orange-600/80 backdrop-blur-sm rounded-full text-white hover:bg-orange-700/90 transition z-10 shadow-lg border-2 border-white/30"
          title="Go Back"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        {/* Bar Closed Slide-in */}
        <BarClosedSlideIn
          isOpen={showBarClosed}
          onClose={() => {
            setShowBarClosed(false);
            sessionStorage.clear();
            router.replace('/');
          }}
          barName={barClosedInfo.barName}
          nextOpenTime={barClosedInfo.nextOpenTime}
          businessHours={barClosedInfo.businessHours}
        />
      </div>
    );
  }

  // ── wizardStep 0: Home Screen ─────────────────────────────────────────────
  // Requirements: 7.1–7.7, 11.1–11.10
  // Shown when the user opens /start with no bar slug (no QR scan yet).
  // Existing loading/error/barClosed gates above still apply when a slug IS present.
  if (!loading && !redirecting && !error && !showBarClosed && wizardStep === 0 && !barSlug) {
    return (
      <>
        {/* Overdue modals are preserved even on the home screen */}
        {showOverdueModal && overdueTab && (
          <OverdueTabModal
            tab={overdueTab}
            barName={barName}
            onReopen={handleOverdueReopen}
            onPayNow={() => {
              setShowOverdueModal(false);
              setShowOverduePaymentModal(true);
            }}
            onClose={() => setShowOverdueModal(false)}
          />
        )}
        {showOverduePaymentModal && overdueTab && (
          <OverduePaymentModal
            tab={overdueTab}
            barName={barName}
            onSuccess={handleOverduePaymentSuccess}
            onClose={() => setShowOverduePaymentModal(false)}
          />
        )}
        <StepHome
          user={user}
          onVenueSelected={(venue) => {
            setSelectedVenue(venue);
            setBarSlug(venue.slug);
            setBarId(venue.id);
            setBarName(venue.name);
            setWizardStep(1);
          }}
          onScan={() => setIsScannerMode(true)}
          onCodeSubmit={async (slug) => {
            setBarSlug(slug);
            sessionStorage.setItem('scanned_bar_slug', slug);
            await loadBarInfo(slug);
          }}
        />
      </>
    );
  }

  // ── wizardStep 1: Identity Step ──────────────────────────────────────────
  if (wizardStep === 1 && selectedVenue) {
    return (
      <StepIdentity
        venueName={selectedVenue.name}
        userName={user?.user_metadata?.first_name || user?.email || 'You'}
        identityMode={identityMode}
        nickname={wizardNickname}
        onIdentityModeChange={setIdentityMode}
        onNicknameChange={setWizardNickname}
        onConfirm={() => setWizardStep(2)}
        onBack={() => setWizardStep(0)}
      />
    )
  }

  // ── wizardStep 2: Confirm Step ────────────────────────────────────────────
  if (wizardStep === 2 && selectedVenue) {
    const identityLabel =
      identityMode === 'anonymous' ? 'Anonymous' :
      identityMode === 'nickname'  ? (wizardNickname || 'Nickname') :
      (user?.user_metadata?.first_name || user?.email || 'You')

    // Badge is earned via spend threshold in a single tab session — not tab count.
    // A new user at a venue has no badge yet. Show 'New' until loyalty API confirms otherwise.
    const spendTiers = [
      { label: 'Bronze', here: false },
      { label: 'Silver', here: false },
      { label: 'Gold',   here: false },
    ]

    return (
      <StepConfirm
        venueName={selectedVenue.name}
        venueMeta={selectedVenue.category ?? ''}
        badgeLabel="New"
        spendTiers={spendTiers}
        tierDescription="Your first visit here. Spend KES 3,000 or more in one session to earn Bronze."
        weeklyVisits={0}
        identityLabel={identityLabel}
        onConfirm={handleStartTab}
        onBack={() => setWizardStep(1)}
        onChangeIdentity={() => setWizardStep(1)}
        creating={creating}
      />
    )
  }

  // Fallback — should not be reached; the unconditional useEffect above handles reset.
  return null;
};

export default function ConsentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    }>
      <ConsentContent />
    </Suspense>
  );
}