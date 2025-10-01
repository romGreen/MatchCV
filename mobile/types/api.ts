// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// User and Profile types
export interface UserProfile {
  id: string;
  userId: string;
  displayName: string;
  bio: string;
  hobbies: HobbyTag[];
  location: GeoPoint;
  useLocation: boolean;
  matchRadius?: number;
  country?: string;
  city?: string;
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


// Match and Discovery types
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
  useLocation?: boolean;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  token?: string;
  error?: string;
}

// Profile Form types
export interface ProfileFormData {
  displayName: string;
  bio: string;
  hobbies: string[];
  useLocation: boolean;
  matchRadius?: number;
  country?: string;
  city?: string;
}

// Message and Chat types
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

export interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  isFromMe: boolean;
  read: boolean;
}

export interface ChatSummary {
  chatId: string;
  otherUser: {
    id: string;
    displayName: string;
  };
  lastMessage?: {
    id: string;
    content: string;
    timestamp: Date;
    isFromMe: boolean;
  };
  unreadCount: number;
}
