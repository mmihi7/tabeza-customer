'use client';

import React, { useEffect, useState } from 'react';
import { X, Clock, Calendar, Store } from 'lucide-react';
import { getOpenState, type BarSchedule, type AdvancedHours } from '@tabeza/schedule';

interface BarClosedSlideInProps {
  isOpen: boolean;
  onClose: () => void;
  barName: string;
  nextOpenTime: string;
  /** The venue's full schedule. Authoritative source for the countdown. */
  schedule?: BarSchedule;
  /** Advanced hours as stored on `bars` — an ARRAY, or a legacy day-keyed object. */
  businessHours?: AdvancedHours;
}

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Normalise the stored advanced-hours shape into a day-indexed lookup. */
function normalizeAdvanced(hours: AdvancedHours) {
  const byDay: Record<number, { open: string; close: string; nextDay: boolean }> = {};
  if (!hours) return byDay;

  const entries = Array.isArray(hours) ? hours : Object.values(hours);
  for (const entry of entries) {
    if (!entry) continue;
    const label = (entry.day ?? entry.label ?? '').toString().trim().toLowerCase();
    const dayIndex = DAY_LABELS.findIndex((d) => d.toLowerCase().startsWith(label.slice(0, 3)));
    if (dayIndex < 0) continue;

    const openTime = entry.openTime ?? (typeof entry.open === 'string' ? entry.open : null);
    const closeTime = entry.closeTime ?? entry.close ?? null;
    if (!openTime || !closeTime) continue;

    // `open: false` means the venue does not trade that day.
    if (entry.open === false) continue;

    byDay[dayIndex] = {
      open: openTime,
      close: closeTime,
      nextDay: Boolean(entry.openNextDay ?? entry.closeNextDay),
    };
  }
  return byDay;
}

export const BarClosedSlideIn: React.FC<BarClosedSlideInProps> = ({
  isOpen,
  onClose,
  barName,
  nextOpenTime,
  schedule,
  businessHours
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [countdown, setCountdown] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isToday: boolean;
    known: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, isToday: true, known: false });

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Prevent body scroll when slide-in is open
      document.body.style.overflow = 'hidden';
    } else {
      setIsVisible(false);
      // Restore body scroll
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Countdown to the venue's next opening moment.
  useEffect(() => {
    if (!isOpen) return;

    const calculateCountdown = () => {
      const now = new Date();
      let nextOpeningTime: Date | null = null;
      let isToday = true;

      // Prefer the schedule evaluator: it is timezone-aware and already handles
      // overnight and closed-today venues. The previous version re-derived this
      // from the browser's clock and assumed a day-keyed object, so the countdown
      // disagreed with the open/closed answer.
      if (schedule) {
        const state = getOpenState(schedule, now);
        if (state.opensAt && state.opensAt > now) {
          nextOpeningTime = state.opensAt;
          isToday = new Date(state.opensAt).toDateString() === now.toDateString();
        }
      }

      // Fallback: parse a "at HH:MM" label when no schedule was supplied.
      if (!nextOpeningTime && nextOpenTime.includes('at')) {
        const timeMatch = nextOpenTime.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
        if (timeMatch) {
          const [, hourStr, minuteStr, period] = timeMatch;
          let hour = parseInt(hourStr);
          const minute = parseInt(minuteStr);

          if (period?.toLowerCase() === 'pm' && hour < 12) hour += 12;
          if (period?.toLowerCase() === 'am' && hour === 12) hour = 0;

          const targetDate = new Date();
          targetDate.setHours(hour, minute, 0, 0);

          if (targetDate <= now) {
            targetDate.setDate(targetDate.getDate() + 1);
            isToday = false;
          }

          nextOpeningTime = targetDate;
        }
      }

      if (!nextOpeningTime) {
        // Nothing known — hide the countdown rather than invent "8 hours".
        return { hours: 0, minutes: 0, seconds: 0, isToday: false, known: false };
      }

      const diff = nextOpeningTime.getTime() - now.getTime();

      if (diff <= 0) {
        return { hours: 0, minutes: 0, seconds: 0, isToday: true, known: false };
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return { hours, minutes, seconds, isToday, known: true };
    };

    // Initial calculation
    setCountdown(calculateCountdown());

    const interval = setInterval(() => {
      setCountdown(calculateCountdown());
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, nextOpenTime, schedule]);


  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const formatCountdown = () => {
    const { hours, minutes, seconds, isToday } = countdown;
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h ${minutes}m`;
    }
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    
    return `${minutes}m ${seconds}s`;
  };

  const formatBusinessHours = () => {
    if (!businessHours) return null;

    // `business_hours_advanced` is stored as an ARRAY; the old code indexed it
    // by day name, so this table rendered nothing at all.
    const byDay = normalizeAdvanced(businessHours);
    const today = new Date().getDay();

    const rows = DAY_LABELS.map((day, index) => ({ day, hours: byDay[index] })).filter(
      (r) => r.hours,
    );

    if (rows.length === 0) return null;

    return (
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-800 mb-3">Business Hours</h4>
        <div className="space-y-2">
          {rows.map(({ day, hours }, ) => {
            if (!hours) return null;

            const isToday = DAY_LABELS.indexOf(day) === today;

            return (
              <div 
                key={day} 
                className={`flex justify-between items-center py-1 px-2 rounded ${
                  isToday ? 'bg-[#FFF3F0] font-semibold text-[#CC2500]' : 'text-gray-600'
                }`}
              >
                <span className="text-sm">{day}</span>
                <span className="text-sm">
                  {hours.open} - {hours.close}
                  {hours.nextDay && ' (next day)'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      
      {/* Slide-in panel */}
      <div 
        className={`relative bg-white rounded-t-3xl shadow-2xl w-full max-w-lg transform transition-transform duration-300 ease-out ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>
        
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
        >
          <X size={20} className="text-gray-600" />
        </button>
        
        {/* Content */}
        <div className="px-6 pb-8 pt-4">
          {/* Icon and title */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-[#FFE4DE] rounded-full flex items-center justify-center mx-auto mb-4">
              <Store size={40} className="text-[#FF2E00]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{barName}</h2>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 rounded-full">
              <Clock size={16} className="text-red-600" />
              <span className="text-red-600 font-semibold">Currently Closed</span>
            </div>
          </div>
          
          {/* Countdown Timer — only when we actually know when it reopens */}
          {countdown.known && (
            <div className="text-center mb-6">
              <p className="text-gray-700 mb-3">
                {countdown.isToday ? 'Opens later today' : 'Opens next time in'}:
              </p>
              <div className="bg-gradient-to-r from-[#FF2E00] to-[#CC2500] text-white rounded-2xl p-4 shadow-lg">
                <div className="text-3xl font-bold mb-1">
                  {formatCountdown()}
                </div>
                <div className="text-sm opacity-90">
                  {countdown.isToday ? 'Later today' : nextOpenTime}
                </div>
              </div>
            </div>
          )}
          
          {/* Business hours (if available) */}
          {businessHours && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              {formatBusinessHours()}
            </div>
          )}
          
          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={handleClose}
              className="w-full bg-gradient-to-r from-[#FF2E00] to-[#CC2500] text-white py-3 rounded-xl font-semibold hover:from-[#FF2E00] hover:to-red-700 transition-all shadow-lg"
            >
              Set Reminder
            </button>
            <button
              onClick={handleClose}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
          
          {/* Footer note */}
          <div className="text-center mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              🔔 We'll notify you when {barName} opens
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
