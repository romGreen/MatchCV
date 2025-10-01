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

export interface UserProfile {
  id: string;
  displayName: string;
  bio: string;
  photos?: Array<{
    id: string;
    photoUrl: string;
    order: number;
    createdAt: Date;
    updatedAt: Date;
  }>;
  hobbies: Array<{
    id: string;
    name: string;
    category: string;
  }>;
  location: {
    latitude: number;
    longitude: number;
  };
  useLocation: boolean;
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
  
  createdAt: Date;
  updatedAt: Date;
}
