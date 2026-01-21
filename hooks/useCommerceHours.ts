import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

export type CommerceHours = {
  id: string;
  commerce_id: string;
  day_of_week: number; // 0=Monday, 1=Tuesday, ..., 6=Sunday
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
  created_at: string;
  updated_at: string;
};

export type CommerceSpecialHours = {
  id: string;
  commerce_id: string;
  date: string;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
  label_fr: string | null;
  label_en: string | null;
  created_at: string;
};

interface UseCommerceHoursResult {
  regularHours: CommerceHours[];
  specialHours: CommerceSpecialHours[];
  loading: boolean;
  error: string | null;
  isOpenNow: boolean;
  todayHours: CommerceHours | null;
}

export const useCommerceHours = (commerceId: string | null): UseCommerceHoursResult => {
  const [regularHours, setRegularHours] = useState<CommerceHours[]>([]);
  const [specialHours, setSpecialHours] = useState<CommerceSpecialHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!commerceId) {
      setLoading(false);
      return;
    }

    const fetchHours = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch regular hours
        const { data: regularData, error: regularError } = await supabase
          .from('commerce_hours')
          .select('*')
          .eq('commerce_id', commerceId)
          .order('day_of_week', { ascending: true });

        if (regularError) throw regularError;

        // Fetch special hours (upcoming only)
        const today = new Date().toISOString().split('T')[0];
        const { data: specialData, error: specialError } = await supabase
          .from('commerce_special_hours')
          .select('*')
          .eq('commerce_id', commerceId)
          .gte('date', today)
          .order('date', { ascending: true })
          .limit(10);

        if (specialError) throw specialError;

        setRegularHours(regularData || []);
        setSpecialHours(specialData || []);
      } catch (err) {
        console.error('Error fetching commerce hours:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch hours');
      } finally {
        setLoading(false);
      }
    };

    fetchHours();
  }, [commerceId]);

  // Calculate if business is open now
  const { isOpenNow, todayHours } = calculateOpenStatus(regularHours, specialHours);

  return {
    regularHours,
    specialHours,
    loading,
    error,
    isOpenNow,
    todayHours,
  };
};

// Helper function to check if commerce is currently open
const calculateOpenStatus = (
  regularHours: CommerceHours[],
  specialHours: CommerceSpecialHours[]
): { isOpenNow: boolean; todayHours: CommerceHours | null } => {
  const now = new Date();
  const todayDate = now.toISOString().split('T')[0];

  // Get ISO day of week (0=Monday, 6=Sunday)
  const jsDay = now.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  const isoDay = jsDay === 0 ? 6 : jsDay - 1; // Convert to ISO: 0=Monday, 6=Sunday

  // Check special hours first (they override regular hours)
  const todaySpecial = specialHours.find(sh => sh.date === todayDate);
  if (todaySpecial) {
    if (todaySpecial.is_closed) {
      return { isOpenNow: false, todayHours: null };
    }
    if (todaySpecial.open_time && todaySpecial.close_time) {
      const isOpen = isWithinHours(now, todaySpecial.open_time, todaySpecial.close_time);
      return { isOpenNow: isOpen, todayHours: null };
    }
  }

  // Fall back to regular hours
  const todayHours = regularHours.find(h => h.day_of_week === isoDay);
  if (!todayHours) {
    return { isOpenNow: false, todayHours: null };
  }

  if (todayHours.is_closed) {
    return { isOpenNow: false, todayHours };
  }

  if (todayHours.open_time && todayHours.close_time) {
    const isOpen = isWithinHours(now, todayHours.open_time, todayHours.close_time);
    return { isOpenNow: isOpen, todayHours };
  }

  return { isOpenNow: false, todayHours };
};

// Helper to check if current time is within opening hours
// Handles overnight hours (e.g., bar open 16:00-03:00)
const isWithinHours = (now: Date, openTime: string, closeTime: string): boolean => {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [openHour, openMin] = openTime.split(':').map(Number);
  const openMinutes = openHour * 60 + openMin;

  const [closeHour, closeMin] = closeTime.split(':').map(Number);
  const closeMinutes = closeHour * 60 + closeMin;

  // Handle overnight hours (close time is before open time, meaning it closes after midnight)
  if (closeMinutes < openMinutes) {
    // Business closes after midnight
    // Open if: current >= open OR current < close
    return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
  }

  // Normal same-day hours
  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
};

// Helper function to format time
export const formatTime = (time: string | null): string => {
  if (!time) return '';

  try {
    const [hours, minutes] = time.split(':').map(Number);
    const isPM = hours >= 12;
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    const period = isPM ? 'PM' : 'AM';

    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch {
    return time;
  }
};

// Helper to get day name
export const getDayName = (dayIndex: number, language: string = 'fr'): string => {
  const daysFr = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const daysEn = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const days = language === 'fr' ? daysFr : daysEn;
  return days[dayIndex] || '';
};
