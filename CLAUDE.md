# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GoSholo is a React Native mobile app built with Expo SDK 54, TypeScript, and Expo Router v5. It's a local discovery platform connecting users with nearby businesses, promotional offers, and events. The app features location-based functionality with Mapbox integration and connects to a Supabase backend.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Platform-specific development
npm run android    # Start Android emulator
npm run ios        # Start iOS simulator
npm run web        # Start web version

# Linting
npm run lint       # Run ESLint

# Build commands (via EAS)
npx eas build --profile development --platform ios
npx eas build --profile development --platform android
npx eas build --profile preview --platform ios
npx eas build --profile preview --platform android
npx eas build --profile production --platform ios
npx eas build --profile production --platform android
```

## Architecture & Key Patterns

### Navigation Structure
- **Root Layout**: `app/_layout.tsx` - Stack navigation with I18nextProvider wrapper and WelcomeModal
- **Entry Point**: `app/index.tsx` - Animated splash screen that redirects to tabs after 1.5s
- **Tab Navigation**: `app/(tabs)/_layout.tsx` with CustomTabBar component
- **Main Tabs**: `index` (home), `offers`, `compass` (map), `events`, `profile`
- **Special Screens**: `loading.tsx`, `+not-found.tsx`

### Screen Features

**Home** (`app/(tabs)/index.tsx`):
- Welcome section with logo and tagline
- Three navigation cards (Explore map, Offers, Events)
- Compact language switcher

**Offers** (`app/(tabs)/offers.tsx`):
- Category filtering from database
- Distance filters (100m, 250m, 500m, 1km)
- Sort toggle (new to old / old to new)
- Search with accent-insensitive matching
- Pull-to-refresh, expiration handling
- Navigate to map with coordinates

**Events** (`app/(tabs)/events.tsx`):
- Date filters (all, ongoing, upcoming)
- Distance filters and sort toggle
- Search, pull-to-refresh
- Navigate to map with coordinates

**Compass/Map** (`app/(tabs)/compass.tsx`):
- Mapbox integration (native builds only, not Expo Go)
- Turn-by-turn navigation with voice guidance (expo-speech)
- Route alternatives, traffic-aware routing
- Routing profiles: driving-traffic, driving, walking, cycling
- Marker clustering for co-located businesses
- Search overlay for addresses and businesses
- Business detail modal with get directions

**Profile** (`app/(tabs)/profile.tsx`):
- Coming soon placeholder
- Language switcher
- Feature preview list (favorites, wishlist, recommendations)

### Data Layer & State Management

**Supabase Client** (`lib/supabase.ts`):
- Database connection with mobile-optimized auth config
- TypeScript type definitions for Commerce, Offer, Event, MobileUserProfile, favorites

**Custom Hooks** (`hooks/`):
| Hook | Purpose |
|------|---------|
| `useOffers.ts` | Fetches offers with commerce joins, distance calculation (Haversine), boosted sorting |
| `useEvents.ts` | Fetches events with similar patterns, date filtering (this_week, upcoming) |
| `useCommerces.ts` | Fetches active commerces with category/sub_category joins |
| `useCategories.ts` | Fetches internationalized categories (name_fr, name_en) |
| `useCommerceHours.ts` | Business hours with open/closed status calculation, special hours support |
| `useMobileUser.ts` | Mobile user profile management with auth state listener |
| `useThemeColor.ts` | Theme-aware color resolution |
| `useColorScheme.ts` | System color scheme detection (light/dark) |
| `useSafeAreaPadding.ts` | Safe area insets for tab bar |

### Component Architecture

**Card Components**:
- `OfferCard.tsx` - Full-featured with boost badges, share, time remaining, category chip
- `EventCard.tsx` - Similar to OfferCard with event-specific features
- `RestaurantCard.tsx` - Commerce card variant
- `HomeCard.tsx` - Navigation card for home screen

**Modal Components**:
- `BusinessDetailModal.tsx` - Full business info with hours, contact, social links, navigation
- `OfferDetailModal.tsx` - Offer details with get directions
- `EventDetailModal.tsx` - Event details with get directions
- `WelcomeModal.tsx` - First-time user onboarding (shown once via AsyncStorage)
- `POIModal.tsx` - Map POI details

**Map & Navigation** (`components/navigation/`):
- `NavigationBanner.tsx` - Turn-by-turn instruction banner
- `SimpleNavigationBar.tsx` - Bottom bar with distance/duration/arrival
- `NavigationBottomSheet.tsx` - Expandable navigation sheet
- `ManeuverIcon.tsx` - Turn direction icons
- `TrafficRoute.tsx` - Traffic-aware route visualization

**Shared Components** (`components/shared/`):
- `AppHeader.tsx` - Screen header with title and city
- `SearchBar.tsx` - Search input component
- `CategoriesSection.tsx` - Horizontal category filter chips
- `FiltersSection.tsx` - Filter pills (distance, sort)
- `PromoBanner.tsx` - Promotional content banner

**UI Components** (`components/ui/`):
- `IconSymbol.tsx/.ios.tsx` - Platform-specific SF Symbol icons
- `TabBarBackground.tsx/.ios.tsx` - Platform-specific tab styling

**Utility Components**:
- `CustomTabBar.tsx` - Custom tab bar with special compass button styling
- `ThemedView.tsx`, `ThemedText.tsx` - Theme-aware containers
- `OpeningHours.tsx` - Business hours display with open/closed status
- `LinkableText.tsx` - Text with clickable URLs
- `SearchOverlay.tsx` - Full-screen search modal
- `LanguageSwitcher.tsx`, `CompactLanguageSwitcher.tsx` - Language selection
- `ButtonSvg.tsx` - SVG button for compass tab
- `LogoBase64.ts` - Base64 encoded logo for map markers
- `ExternalLink.tsx` - Opens URLs in browser
- `HapticTab.tsx` - Tab with haptic feedback
- `ParallaxScrollView.tsx` - Parallax scroll effect
- `Collapsible.tsx` - Expandable content section
- `HelloWave.tsx` - Animated wave emoji

### Utilities (`utils/`)
- `mapboxSearch.ts` - Mapbox Search Box API with session tokens for cost optimization
- `navigationHelpers.ts` - ETA calculation, getCurrentStepIndex, getDistanceFromLine
- `markerClustering.ts` - Groups commerces by location (20m threshold)
- `searchUtils.ts` - Accent-insensitive search matching (matchesSearch)

### Styling System

**Color Palette** (`constants/Colors.ts`):
```
Primary: #FF6233 (Orange)
Secondary/Teal: #016167
Accent Green: #B2FD9D
Accent Blue: #5BC4DB
Ink: #111827
```

**Spacing Scale**: xs: 4, sm: 8, md: 12, lg: 16, xl: 20

**Border Radius**: md: 12, lg: 16, pill: 999

### Internationalization
- **i18next** with French default (`i18n/index.ts`)
- **Locales**: `locales/fr/common.json`, `locales/en/common.json`
- All UI text uses `t()` function from `useTranslation()`
- Database categories have `name_fr` and `name_en` fields

## Database Schema (Supabase)

**Project**: `gosholo-partner-prod` (`ilvsqelnfrmzeeisdhxg`) - ca-central-1 region
**All tables have RLS enabled**

### Core Business Entities

**commerces** (17 rows):
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | FK to auth.users |
| name | text | Business name |
| address | text | Street address |
| description | text | Optional description |
| email, phone, website | text | Contact info |
| image_url | text | Logo/image URL |
| latitude, longitude | numeric | Coordinates |
| postal_code | varchar | Postal code |
| category_id | int | FK to category |
| sub_category_id | int | FK to sub_category |
| facebook_url, instagram_url | text | Social links |
| status | text | 'active' default |
| boosted | boolean | Is promoted |
| boosted_at | timestamptz | When boosted |
| boost_type | enum | 'en_vedette' or 'visibilite' |

**offers** (9 rows):
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| title, description | text | Offer content |
| offer_type | enum | 'in_store', 'online', 'both' |
| uses_commerce_location | boolean | Use commerce address |
| custom_location | text | Optional custom address |
| condition | text | Offer conditions |
| commerce_id | uuid | FK to commerces |
| user_id | uuid | FK to auth.users |
| start_date, end_date | date | Validity period |
| is_active | boolean | Active flag |
| image_url | text | Offer image |
| latitude, longitude | numeric | Coordinates |
| category_id, sub_category_id | int | Category FKs |
| boosted, boosted_at, boost_type | - | Boost system |

**events** (2 rows):
- Similar to offers with `category_events_id` instead
- Additional: `facebook_url`, `instagram_url`, `linkedin_url`

### Category System

**category** (106 rows):
| Column | Type |
|--------|------|
| id | bigint |
| name_fr | text |
| name_en | text |

**sub_category** (51 rows):
| Column | Type |
|--------|------|
| id | int |
| category_id | int (FK) |
| name_fr | text |
| name_en | text |

**category_events** (14 rows):
| Column | Type |
|--------|------|
| id | bigint |
| name_fr | text |
| name_en | text |

### Business Hours

**commerce_hours** (119 rows):
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| commerce_id | uuid | FK to commerces |
| day_of_week | int | 0=Monday to 6=Sunday |
| open_time | time | Opening time |
| close_time | time | Closing time |
| is_closed | boolean | Closed this day |

**commerce_special_hours** (12 rows):
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| commerce_id | uuid | FK to commerces |
| date | date | Specific date |
| open_time, close_time | time | Hours |
| is_closed | boolean | Closed flag |
| label_fr, label_en | text | Holiday label |

### User Management

**profiles** (37 rows) - Partner users:
| Column | Type |
|--------|------|
| id | uuid (FK to auth.users) |
| email | text |
| first_name, last_name | text |
| phone | text |
| avatar_url | text |
| is_subscribed | boolean |
| preferred_locale | varchar | 'fr' or 'en' |

**mobile_user_profiles** (32 rows) - Mobile app users:
| Column | Type |
|--------|------|
| id | uuid (FK to auth.users) |
| username | text (unique) |
| email | text |

### Favorites System

**user_favorite_offers**, **user_favorite_events**, **user_favorite_commerces**:
| Column | Type |
|--------|------|
| id | uuid |
| user_id | uuid (FK to auth.users) |
| offer_id/event_id/commerce_id | uuid (FK) |
| created_at | timestamptz |

### Monetization

**user_boost_credits** (4 rows):
| Column | Type |
|--------|------|
| id | uuid |
| user_id | uuid (unique) |
| available_en_vedette | int |
| available_visibilite | int |

**boost_transactions** (5 rows):
| Column | Type |
|--------|------|
| id | uuid |
| user_id | uuid |
| boost_type | enum |
| amount_cents | int |
| stripe_payment_intent_id | text |
| card_last_four, card_brand | text |
| status | text |

**subscriptions** (1 row):
| Column | Type |
|--------|------|
| id | uuid |
| user_id | uuid |
| plan_type | enum | 'free', 'pro' |
| status | text |

## Environment Configuration

Required:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`

## Build Configuration

- **EAS Build**: development, preview, production profiles in `eas.json`
- **New Architecture**: Enabled (RCT_NEW_ARCH_ENABLED=1)
- **iOS Bundle ID**: `com.jostinjarry1.gosholomobile`
- **Android Package**: `com.gosholo.gosholo`
- **App Scheme**: `gosholomobile`
- **Typed Routes**: Enabled
- **iOS Tablet**: Disabled (`supportsTablet: false`)
- **Current Version**: 1.0.9 (Build 32)

## TypeScript Configuration

- Extends `expo/tsconfig.base` with strict mode
- Path alias: `@/*` → project root

## Key Dependencies

- **expo**: ^54.0.9
- **react-native**: ^0.81.4
- **@rnmapbox/maps**: ^10.1.40
- **@supabase/supabase-js**: ^2.56.0
- **expo-router**: ~6.0.7
- **i18next**: ^25.5.2
- **react-i18next**: ^15.7.3
- **expo-location**: ~19.0.7
- **expo-speech**: ~14.0.7
