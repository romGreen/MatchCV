// Shared types for both mobile and backend
export interface UserProfile {
  id: string;
  displayName: string;
  bio: string;
  avatarUrl?: string;
  hobbies: HobbyTag[];
  location: GeoPoint;
  visibilityLevel: VisibilityLevel;
  matchRadius?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface HobbyTag {
  id: string;
  name: string;
  category: string;
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
  visibilityLevel: VisibilityLevel;
  matchRadius?: number;
}

export type VisibilityLevel = 'precise' | 'neighborhood' | 'hidden';

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
  visibilityLevel?: VisibilityLevel;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  token?: string;
  error?: string;
}
