
export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface HobbyTag {
  id: string;
  name: string;
  category?: string;
}

export type VisibilityLevel = 'precise' | 'neighborhood' | 'hidden';

export interface UserProfile {
  id: string;
  displayName: string;
  bio: string;
  avatar?: string;
  hobbies: HobbyTag[];
  location?: GeoPoint;
  visibility: VisibilityLevel;
  createdAt: Date;
  updatedAt: Date;
}

export interface MatchScore {
  sharedHobbies: number;
  totalHobbies: number;
  distance: number; // in kilometers
  score: number; // 0-100
}

export interface NearbyUser extends UserProfile {
  matchScore: MatchScore;
}

export interface SessionState {
  currentUser?: UserProfile;
  isLocationEnabled: boolean;
  locationPermission: 'granted' | 'denied' | 'not-requested';
}

export interface LocationState {
  currentLocation?: GeoPoint;
  approximateLocation?: GeoPoint; // rounded to grid
  isLocationEnabled: boolean;
}

export interface AppState {
  session: SessionState;
  location: LocationState;
}

// Form types
export interface ProfileFormData {
  displayName: string;
  bio: string;
  avatar?: string;
  hobbies: string[];
  visibility: VisibilityLevel;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface NearbyUsersResponse {
  users: NearbyUser[];
  total: number;
}
