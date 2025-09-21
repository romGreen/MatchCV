// Export all shared types and utilities
export * from './types';

// Shared constants
export const APP_CONFIG = {
  MAX_HOBBIES: 10,
  MAX_BIO_LENGTH: 500,
  MAX_DISPLAY_NAME_LENGTH: 50,
  DEFAULT_SEARCH_RADIUS: 5000, // 5km in meters
  MAX_SEARCH_RADIUS: 50000, // 50km in meters
} as const;

export const HOBBY_CATEGORIES = [
  'Sports & Fitness',
  'Arts & Crafts',
  'Music & Entertainment',
  'Technology & Gaming',
  'Food & Cooking',
  'Travel & Adventure',
  'Learning & Education',
  'Health & Wellness',
  'Business & Networking',
  'Other'
] as const;

export type HobbyCategory = typeof HOBBY_CATEGORIES[number];
