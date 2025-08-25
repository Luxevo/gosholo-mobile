# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native mobile app built with Expo SDK 53, using TypeScript and Expo Router for navigation. The app connects to a Supabase backend and features location-based functionality with Mapbox integration.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm start
# or
expo start

# Platform-specific development
npm run android    # Start Android emulator
npm run ios        # Start iOS simulator  
npm run web        # Start web version

# Linting
npm run lint       # Run ESLint

# Reset project (moves starter code to app-example/)
npm run reset-project
```

## Architecture & Key Patterns

### Navigation Structure
- Uses Expo Router v5 with file-based routing
- Root layout: `app/_layout.tsx` (Stack navigation, no headers)
- Tab navigation: `app/(tabs)/_layout.tsx` with CustomTabBar component
- Authentication screens: `app/(auth)/` folder
- Main tabs: `index`, `offers`, `compass`, `events`, `profile`

### Database & State Management
- **Supabase Client**: `lib/supabase.ts` - handles database connection and type definitions
- **Custom Hooks**: Located in `hooks/` folder for data fetching (e.g., `useOffers.ts`, `useEvents.ts`)
- **Data Flow**: Components use custom hooks → hooks query Supabase → RLS policies handle security

### Component Architecture
- **Themed Components**: `ThemedView.tsx`, `ThemedText.tsx` support light/dark modes
- **UI Components**: Located in `components/ui/` folder
- **Card Components**: `OfferCard.tsx`, `EventCard.tsx`, `RestaurantCard.tsx` with consistent design patterns
- **Custom Tab Bar**: `CustomTabBar.tsx` handles special compass tab styling

### Styling Patterns
- Uses StyleSheet.create() with consistent color and spacing tokens
- Color scheme: Primary (#FF6233), Ink (#111827), Background (#FFFFFF)
- Spacing scale: xs(4), sm(8), md(12), lg(16), xl(20)
- Border radius: md(12), lg(16), pill(999)

### Location & Maps
- **Mapbox Integration**: Uses @rnmapbox/maps with download token in app.json
- **Location Permissions**: Configured for "when in use" access in app.json
- **Distance Calculations**: Haversine formula implementation in useOffers.ts

## Database Schema (Supabase)

Key entities with RLS enabled (project: `ilvsqelnfrmzeeisdhxg`):

### Core Business Entities
- **commerces**: Business listings with 12 categories (Restaurant, Café, Boulangerie, etc.)
  - Location data: `latitude`, `longitude`, `postal_code`, `address`
  - Social media links: `facebook_url`, `instagram_url`, `linkedin_url`
  - Status tracking: `status` (defaults to 'active')

- **offers**: Promotional offers with boost system
  - Enum types: `offer_type_enum` (in_store, online, both), `boost_type_enum` (en_vedette, visibilite)
  - Location flexibility: `uses_commerce_location` boolean, optional `custom_location`
  - Date ranges: `start_date`, `end_date` with `is_active` flag

- **events**: Similar to offers but with additional social media fields
  - Same boost system and location handling as offers
  - Enhanced social media integration

### User Management
- **profiles**: Extended user data beyond auth.users
  - Contains: `first_name`, `last_name`, `phone`, `avatar_url`
  - Subscription flag: `is_subscribed`

### Monetization System
- **user_boost_credits**: Credit tracking for boost features
  - Two credit types: `available_en_vedette`, `available_visibilite`
  - Unique constraint on `user_id`

- **boost_transactions**: Payment history via Stripe
  - Stripe integration: `stripe_payment_intent_id`, `card_last_four`, `card_brand`
  - Amounts stored in cents: `amount_cents`

- **subscriptions**: Plan management
  - Plan types: `subscription_plan_enum` (free, pro)
  - RLS forced for security

## Environment Configuration

Required environment variables:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Build Configuration

- **EAS Build**: Configured in `eas.json` with development, preview, and production profiles
- **iOS Bundle ID**: com.jostinjarry1.gosholomobile
- **App Scheme**: gosholomobile
- **New Architecture**: Enabled for React Native

## TypeScript Configuration

- Extends expo/tsconfig.base with strict mode enabled
- Path alias: `@/*` maps to project root
- Includes expo-env.d.ts for Expo-specific types

## Supabase MCP Integration

The project connects to Supabase project `gosholo-partner-prod` (`ilvsqelnfrmzeeisdhxg`) in the ca-central-1 region. All tables use Row Level Security (RLS) policies, with the subscriptions table having forced RLS for enhanced security. The database includes comprehensive foreign key relationships linking all entities to auth.users.