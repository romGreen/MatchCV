// App constants
export const APP_CONFIG = {
  name: 'MatchCV',
  version: '1.0.0',
  description: 'Discover nearby people who share your hobbies',
} as const;

// Location constants
export const LOCATION_CONFIG = {
  defaultRadius: 10, // km
  maxRadius: 50, // km
  gridPrecision: 0.001, // degrees (approximately 100m)
  updateInterval: 30000, // 30 seconds
} as const;

// Match scoring constants
export const MATCH_CONFIG = {
  maxDistancePenalty: 50, // percentage
  distancePenaltyPerKm: 10, // percentage per 5km
  minMatchScore: 0,
  maxMatchScore: 100,
} as const;

// UI constants
export const UI_CONFIG = {
  borderRadius: 8,
  elevation: 2,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  colors: {
    primary: '#6200ea',
    secondary: '#03dac6',
    error: '#d32f2f',
    warning: '#f57c00',
    success: '#2e7d32',
    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#333333',
    textSecondary: '#666666',
  },
} as const;

// API constants
export const API_CONFIG = {
  timeout: 10000, // 10 seconds
  retryAttempts: 3,
  staleTime: 5 * 60 * 1000, // 5 minutes
} as const;

// Privacy constants
export const PRIVACY_CONFIG = {
  defaultVisibility: 'neighborhood' as const,
  locationRetentionDays: 7,
  maxHobbies: 10,
  minHobbies: 1,
} as const;
