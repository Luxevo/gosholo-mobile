import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

console.log('Supabase config:', { 
  url: supabaseUrl, 
  keyPrefix: supabaseAnonKey?.substring(0, 20) + '...' 
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types based on your database schema
export type Commerce = {
  id: string;
  user_id: string;
  name: string;
  address: string;
  category: 'Restaurant' | 'Café' | 'Boulangerie' | 'Épicerie' | 'Commerce' | 'Service' | 'Santé' | 'Beauté' | 'Sport' | 'Culture' | 'Éducation' | 'Autre';
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  image_url?: string;
  status: string;
  latitude?: number;
  longitude?: number;
  postal_code?: string;
  facebook_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  created_at: string;
  updated_at: string;
};

export type Offer = {
  id: string;
  title: string;
  description: string;
  offer_type: 'in_store' | 'online' | 'both';
  uses_commerce_location: boolean;
  custom_location?: string;
  condition?: string;
  commerce_id: string;
  user_id: string;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  boosted: boolean;
  boosted_at?: string;
  boost_type?: 'en_vedette' | 'visibilite';
  image_url?: string;
  latitude?: number;
  longitude?: number;
  postal_code?: string;
  created_at: string;
  updated_at: string;
  // Join with commerce data
  commerces?: Commerce;
};

export type Event = {
  id: string;
  title: string;
  description: string;
  uses_commerce_location: boolean;
  custom_location?: string;
  condition?: string;
  commerce_id: string;
  user_id: string;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  boosted: boolean;
  boosted_at?: string;
  boost_type?: 'en_vedette' | 'visibilite';
  image_url?: string;
  latitude?: number;
  longitude?: number;
  postal_code?: string;
  facebook_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  created_at: string;
  updated_at: string;
  // Join with commerce data
  commerces?: Commerce;
};