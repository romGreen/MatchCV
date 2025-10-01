// Shared types for both mobile and backend
export interface UserProfile {
  id: string;
  displayName: string;
  bio: string;
  photos?: UserPhoto[];
  hobbies: HobbyTag[];
  location: GeoPoint;
  useLocation: boolean;
  matchRadius?: number;
  country?: string;
  city?: string;
  
  // Optional profile information
  age?: number;
  job?: string;
  company?: string;
  education?: string;
  university?: string;
  relationshipStatus?: string;
  lookingFor?: string;
  interests?: string;
  languages?: string;
  height?: number;
  lifestyle?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface HobbyTag {
  id: string;
  name: string;
  category: string;
}

export interface UserPhoto {
  id: string;
  photoUrl: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface MatchScore {
  userId: string;
  score: number;
  sharedHobbies: HobbyTag[];
  distance: number; // in meters
}

export interface NearbyUser {
  profile: UserProfile;
  matchScore: MatchScore;
}

export interface NearbyUsersResponse {
  users: NearbyUser[];
  total: number;
}

export interface ProfileFormData {
  displayName: string;
  bio: string;
  hobbies: string[];
  photos?: string[]; // Array of photo URLs
  useLocation: boolean;
  matchRadius?: number;
  country?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  
  // Optional profile information
  age?: number;
  job?: string;
  company?: string;
  education?: string;
  university?: string;
  relationshipStatus?: string;
  lookingFor?: string;
  interests?: string;
  languages?: string;
  height?: number;
  lifestyle?: string;
}


// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Chat types
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

export interface ChatRoom {
  id: string;
  participants: string[];
  lastMessage?: Message;
  createdAt: Date;
  updatedAt: Date;
}

// Authentication types
export interface AuthUser {
  id: string;
  email: string;
  profile?: UserProfile;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  bio?: string;
  hobbies?: string[];
  country: string;
  city: string;
  // Location coordinates (either from GPS or geocoding)
  latitude?: number;
  longitude?: number;
  useLocation?: boolean; // true if using GPS, false if manual selection
  
  // Optional profile information
  age?: number;
  job?: string;
  company?: string;
  education?: string;
  university?: string;
  relationshipStatus?: string;
  lookingFor?: string;
  interests?: string;
  languages?: string;
  height?: number;
  lifestyle?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  token?: string;
  error?: string;
}
