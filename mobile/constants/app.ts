export const APP_CONFIG = {
  name: 'MatchCV',
  version: '1.0.0',
  description: 'Find your perfect match based on shared hobbies and interests',
} as const;

export const API_CONFIG = {
  baseUrl: 'http://192.168.7.20:3001',
  timeout: 10000,
  retryAttempts: 3,
} as const;

export const STORAGE_KEYS = {
  authToken: '@matchcv/auth_token',
  userData: '@matchcv/user_data',
  onboardingComplete: '@matchcv/onboarding_complete',
  locationPermission: '@matchcv/location_permission',
} as const;

export const VALIDATION_RULES = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address',
  },
  password: {
    required: true,
    minLength: 6,
    message: 'Password must be at least 6 characters long',
  },
  displayName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    message: 'Display name must be between 2 and 50 characters',
  },
  bio: {
    required: true,
    minLength: 10,
    maxLength: 200,
    message: 'Bio must be between 10 and 200 characters',
  },
} as const;

export const LOCATION_CONFIG = {
  defaultRadius: 10,
  minRadius: 1,
  maxRadius: 100,
  defaultLocation: {
    latitude: 31.9293,
    longitude: 34.7987, // Nes Ziona, Israel
  },
} as const;

export const CHAT_CONFIG = {
  messagesPerPage: 20,
  autoRefreshInterval: 3000, // 3 seconds
  typingIndicatorTimeout: 2000, // 2 seconds
} as const;

export const DISCOVERY_CONFIG = {
  maxResults: 50,
  defaultSearchRadius: 10,
  refreshInterval: 30000, // 30 seconds
} as const;
