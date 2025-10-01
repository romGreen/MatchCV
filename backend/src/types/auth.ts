export interface AuthUser {
  id: string;
  email: string;
  profile?: {
    id: string;
    displayName: string;
    bio: string;
    photos: Array<{
      id: string;
      photoUrl: string;
      order: number;
      createdAt: Date;
      updatedAt: Date;
    }>;
    useLocation: boolean;
    hobbies: Array<{
      id: string;
      name: string;
      category: string;
    }>;
    location: {
      latitude: number;
      longitude: number;
    };
    matchRadius: number;
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
  };
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
