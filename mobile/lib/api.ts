import { UserProfile, NearbyUser, MatchScore, ApiResponse, ProfileFormData, HobbyTag, NearbyUsersResponse } from '@matchcv/shared';
import { locationService } from './location';
import { authService } from './auth';

// Backend API configuration
// Use your computer's IP address instead of localhost for mobile access
const API_BASE_URL = 'http://192.168.7.20:3001/api';

// Mock data for development
const MOCK_HOBBIES: HobbyTag[] = [
  { id: 'cmfsfzaz400009hu42kj3cr5v', name: 'Basketball', category: 'Sports' },
  { id: 'cmfsfzazk00019hu4kz2kob8f', name: 'Photography', category: 'Arts' },
  { id: 'cmfsfzazn00029hu4nzs3qyk8', name: 'Cooking', category: 'Lifestyle' },
  { id: 'cmfsfzazu00039hu4cfoee1de', name: 'Motorcycles', category: 'Vehicles' },
  { id: 'cmfsfzb0000049hu49nvjey60', name: 'Hiking', category: 'Outdoor' },
  { id: 'cmfsfzb0200059hu4l2ua2f9j', name: 'Gaming', category: 'Entertainment' },
  { id: 'cmfsfzb0400069hu4696j4s08', name: 'Reading', category: 'Lifestyle' },
  { id: 'cmfsfzb0a00079hu43gqpmfap', name: 'Yoga', category: 'Fitness' },
  { id: 'cmfsfzb0f00089hu4do0zahit', name: 'Gardening', category: 'Lifestyle' },
  { id: 'cmfsfzb0i00099hu4sgf8a41d', name: 'Music', category: 'Arts' },
  { id: 'cmfsfzb0j000a9hu4in5ekq1y', name: 'Cycling', category: 'Sports' },
  { id: 'cmfsfzb0l000b9hu4mi7lb7b1', name: 'Painting', category: 'Arts' },
];

const MOCK_USERS: UserProfile[] = [
  {
    id: '1',
    displayName: 'Alex Chen',
    bio: 'Love basketball and photography. Always up for a game!',
    avatarUrl: 'https://i.pravatar.cc/150?img=1',
    hobbies: [MOCK_HOBBIES[0], MOCK_HOBBIES[1], MOCK_HOBBIES[2]],
    location: { latitude: 31.9300, longitude: 34.7990 }, // Nes Ziona area
    visibilityLevel: 'neighborhood',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '2',
    displayName: 'Sarah Johnson',
    bio: 'Motorcycle enthusiast and weekend chef. Let\'s ride and eat!',
    avatarUrl: 'https://i.pravatar.cc/150?img=2',
    hobbies: [MOCK_HOBBIES[3], MOCK_HOBBIES[2], MOCK_HOBBIES[4]],
    location: { latitude: 31.9285, longitude: 34.7975 }, // Nes Ziona area
    visibilityLevel: 'precise',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    id: '3',
    displayName: 'Mike Rodriguez',
    bio: 'Gamer by night, hiker by day. Looking for adventure buddies!',
    avatarUrl: 'https://i.pravatar.cc/150?img=3',
    hobbies: [MOCK_HOBBIES[5], MOCK_HOBBIES[4], MOCK_HOBBIES[6]],
    location: { latitude: 31.9310, longitude: 34.8000 }, // Nes Ziona area
    visibilityLevel: 'neighborhood',
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-19'),
  },
  {
    id: '4',
    displayName: 'Emma Wilson',
    bio: 'Yoga instructor and book lover. Seeking mindful connections.',
    avatarUrl: 'https://i.pravatar.cc/150?img=4',
    hobbies: [MOCK_HOBBIES[7], MOCK_HOBBIES[6], MOCK_HOBBIES[8]],
    location: { latitude: 31.9270, longitude: 34.7960 }, // Nes Ziona area
    visibilityLevel: 'precise',
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-17'),
  },
  {
    id: '5',
    displayName: 'David Kim',
    bio: 'Musician and cyclist. Always looking for jam sessions and bike rides.',
    avatarUrl: 'https://i.pravatar.cc/150?img=5',
    hobbies: [MOCK_HOBBIES[9], MOCK_HOBBIES[10], MOCK_HOBBIES[11]],
    location: { latitude: 31.9325, longitude: 34.8015 }, // Nes Ziona area
    visibilityLevel: 'neighborhood',
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-21'),
  },
];

class ApiService {
  private static instance: ApiService;
  
  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  /**
   * Simulate API delay
   */
  private async delay(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get all available hobbies
   */
  async getHobbies(): Promise<ApiResponse<HobbyTag[]>> {
    try {
      const response = await authService.authenticatedRequest(`${API_BASE_URL}/hobbies`);
      const result = await response.json();
      
      if (result.success) {
        return {
          data: result.data,
          success: true,
        };
      } else {
        throw new Error(result.error || 'Failed to fetch hobbies');
      }
    } catch (error) {
      console.error('Error fetching hobbies:', error);
      // Fallback to mock data if backend is not available
      return {
        data: MOCK_HOBBIES,
        success: true,
      };
    }
  }

  /**
   * Calculate match score between two users
   */
  private calculateMatchScore(user1: UserProfile, user2: UserProfile): MatchScore {
    const sharedHobbies = user1.hobbies.filter(hobby1 => 
      user2.hobbies.some(hobby2 => hobby2.id === hobby1.id)
    );
    
    const totalHobbies = Math.max(user1.hobbies.length, user2.hobbies.length);
    const distance = user1.location && user2.location 
      ? locationService.calculateDistance(user1.location, user2.location)
      : 0;
    
    // Simple scoring: shared hobbies percentage, reduced by distance
    let score = totalHobbies > 0 ? (sharedHobbies.length / totalHobbies) * 100 : 0;
    
    // Reduce score based on distance (every 5km reduces score by 10%)
    const distancePenalty = Math.min(distance / 5 * 10, 50);
    score = Math.max(score - distancePenalty, 0);
    
    return {
      userId: user2.id,
      score: Math.round(score),
      sharedHobbies,
      distance,
    };
  }

  /**
   * Get all users (admin function)
   */
  async getAllUsers(): Promise<ApiResponse<any[]>> {
    try {
      const response = await authService.authenticatedRequest(`${API_BASE_URL}/users`);
      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          data: result.data
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to fetch users'
        };
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch users'
      };
    }
  }

  /**
   * Delete a user by ID
   */
  async deleteUser(userId: string): Promise<ApiResponse<string>> {
    try {
      const response = await authService.authenticatedRequest(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          data: result.message
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to delete user'
        };
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete user'
      };
    }
  }

  /**
   * Delete current user's account
   */
  async updateLocation(latitude: number, longitude: number): Promise<ApiResponse<string>> {
    try {
      const response = await authService.authenticatedRequest(`${API_BASE_URL}/profile/location`, {
        method: 'POST',
        body: JSON.stringify({ latitude, longitude }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          data: result.message
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to update location'
        };
      }
    } catch (error: any) {
      console.error('Error updating location:', error);
      return {
        success: false,
        error: error.message || 'Failed to update location'
      };
    }
  }

  async deleteMyAccount(): Promise<ApiResponse<string>> {
    try {
      console.log('Mobile API - Sending delete account request');
      const response = await authService.authenticatedRequest(`${API_BASE_URL}/users/me`, {
        method: 'DELETE'
      });
      console.log('Mobile API - Response status:', response.status);
      const result = await response.json();
      console.log('Mobile API - Response result:', result);
      
      if (result.success) {
        return {
          success: true,
          data: result.message
        };
      } else {
        console.log('Mobile API - Delete failed:', result.error);
        return {
          success: false,
          error: result.error || 'Failed to delete account'
        };
      }
    } catch (error: any) {
      console.error('Mobile API - Error deleting account:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete account'
      };
    }
  }

  /**
   * Get nearby users with match scores
   */
  async getNearbyUsers(currentUser: UserProfile, radiusKm: number = 10): Promise<ApiResponse<NearbyUsersResponse>> {
    await this.delay(800);
    
    if (!currentUser.location) {
      return {
        data: { users: [], total: 0 },
        success: false,
        message: 'User location not available',
      };
    }

    const nearbyUsers: NearbyUser[] = MOCK_USERS
      .filter(user => user.id !== currentUser.id && user.visibilityLevel !== 'hidden')
      .map(user => {
        const matchScore = this.calculateMatchScore(currentUser, user);
        return {
          profile: user,
          matchScore,
        };
      })
      .filter(user => user.matchScore.distance <= radiusKm)
      .sort((a, b) => b.matchScore.score - a.matchScore.score);

    return {
      data: {
        users: nearbyUsers,
        total: nearbyUsers.length,
      },
      success: true,
    };
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<ApiResponse<UserProfile | null>> {
    await this.delay(300);
    
    const user = MOCK_USERS.find(u => u.id === userId);
    return {
      data: user || null,
      success: !!user,
      message: user ? undefined : 'User not found',
    };
  }

  /**
   * Save user profile
   */
  async saveUserProfile(profileData: ProfileFormData, userId?: string): Promise<ApiResponse<UserProfile>> {
    try {
      // First, get the hobby IDs from the hobby names
      const hobbiesResponse = await this.getHobbies();
      const hobbyIds = hobbiesResponse.data
        ?.filter(hobby => profileData.hobbies.includes(hobby.name))
        .map(hobby => hobby.id) || [];

      console.log('Saving profile with hobby names:', profileData.hobbies);
      console.log('Converted to hobby IDs:', hobbyIds);

      const response = await authService.authenticatedRequest(`${API_BASE_URL}/profile`, {
        method: 'POST',
        body: JSON.stringify({
          displayName: profileData.displayName,
          bio: profileData.bio,
          hobbies: hobbyIds,
          visibilityLevel: profileData.visibilityLevel,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Convert the database profile to UserProfile format
        const user: UserProfile = {
          id: result.data.id,
          displayName: result.data.displayName,
          bio: result.data.bio,
          avatarUrl: result.data.avatarUrl,
          hobbies: result.data.hobbies,
          location: { latitude: 0, longitude: 0 }, // Default location
          visibilityLevel: result.data.visibilityLevel,
          createdAt: new Date(result.data.createdAt),
          updatedAt: new Date(result.data.updatedAt),
        };

        return {
          data: user,
          success: true,
        };
      } else {
        throw new Error(result.error || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      // Fallback to mock data if backend fails
      await this.delay(600);
      
      const hobbies = MOCK_HOBBIES.filter(hobby => 
        profileData.hobbies.includes(hobby.name)
      );
      
      const now = new Date();
      const user: UserProfile = {
        id: userId || `user_${Date.now()}`,
        displayName: profileData.displayName,
        bio: profileData.bio,
        avatarUrl: undefined,
        hobbies,
        location: { latitude: 0, longitude: 0 },
        visibilityLevel: profileData.visibilityLevel,
        createdAt: userId ? MOCK_USERS.find(u => u.id === userId)?.createdAt || now : now,
        updatedAt: now,
      };

      return {
        data: user,
        success: true,
      };
    }
  }

  /**
   * Send a "Say hi" message (stub for WhatsApp deep link)
   */
  async sendSayHiMessage(toUserId: string, fromUserId: string): Promise<ApiResponse<boolean>> {
    await this.delay(400);
    
    // In a real app, this would:
    // 1. Create a chat room
    // 2. Send a notification
    // 3. Return a WhatsApp deep link or in-app chat URL
    
    console.log(`Sending "Say hi" from ${fromUserId} to ${toUserId}`);
    
    return {
      data: true,
      success: true,
      message: 'Message sent successfully',
    };
  }
}

export const apiService = ApiService.getInstance();
