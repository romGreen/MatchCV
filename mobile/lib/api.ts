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

  async deleteMyAccount(): Promise<ApiResponse<string>> {
    try {
      const response = await authService.authenticatedRequest(`${API_BASE_URL}/users/me`, {
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
   * Upload profile photo
   */
  async uploadPhoto(imageUri: string): Promise<ApiResponse<{ photoUrl: string; photoId: string }>> {
    try {
      const formData = new FormData();
      formData.append('photo', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      } as any);

      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/profile/photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          data: result.data
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to upload photo'
        };
      }
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload photo'
      };
    }
  }

  /**
   * Delete profile photo
   */
  async deletePhoto(photoId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await authService.authenticatedRequest(`${API_BASE_URL}/profile/photo/${photoId}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          data: result.data
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to delete photo'
        };
      }
    } catch (error: any) {
      console.error('Error deleting photo:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete photo'
      };
    }
  }

  /**
   * Update photo order
   */
  async updatePhotoOrder(photoOrders: { photoId: string; order: number }[]): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await authService.authenticatedRequest(`${API_BASE_URL}/profile/photo/order`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photoOrders })
      });
      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          data: result.data
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to update photo order'
        };
      }
    } catch (error: any) {
      console.error('Error updating photo order:', error);
      return {
        success: false,
        error: error.message || 'Failed to update photo order'
      };
    }
  }

  /**
   * Get nearby users with match scores
   */
  async getNearbyUsers(currentUser: UserProfile, radiusKm: number = 10): Promise<ApiResponse<NearbyUsersResponse>> {
    try {
      const response = await authService.authenticatedRequest(`${API_BASE_URL}/discovery/nearby?radius=${radiusKm}`);
      const result = await response.json();
      
      if (result.success) {
        return {
          data: result.data,
          success: true,
        };
      } else {
        throw new Error(result.error || 'Failed to fetch nearby users');
      }
    } catch (error) {
      console.error('Error fetching nearby users:', error);
      // Fallback to mock data if backend is not available
      await this.delay(800);
      
      if (!currentUser.location) {
        return {
          data: { users: [], total: 0 },
          success: false,
          message: 'User location not available',
        };
      }

      return {
        data: {
          users: [],
          total: 0,
        },
        success: false,
        message: 'No mock data available',
      };
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<ApiResponse<UserProfile | null>> {
    try {
      const response = await authService.authenticatedRequest(`${API_BASE_URL}/profile/${userId}`);
      const result = await response.json();
      
      if (result.success) {
        // Convert database profile to UserProfile format
        const user: UserProfile = {
          id: result.data.id,
          displayName: result.data.displayName,
          bio: result.data.bio,
          photos: result.data.photos?.map((photo: any) => ({
            id: photo.id,
            photoUrl: photo.photoUrl,
            order: photo.order,
            createdAt: new Date(photo.createdAt),
            updatedAt: new Date(photo.updatedAt)
          })) || [],
          hobbies: result.data.hobbies.map((hobby: any) => ({
            id: hobby.id,
            name: hobby.name,
            category: hobby.category
          })),
          location: {
            latitude: result.data.location?.latitude || 0,
            longitude: result.data.location?.longitude || 0
          },
          city: result.data.city,
          country: result.data.country,
          useLocation: result.data.useLocation ?? true,
          matchRadius: result.data.matchRadius,
          // Optional profile information
          age: result.data.age,
          job: result.data.job,
          company: result.data.company,
          education: result.data.education,
          university: result.data.university,
          relationshipStatus: result.data.relationshipStatus,
          lookingFor: result.data.lookingFor,
          interests: result.data.interests,
          languages: result.data.languages,
          height: result.data.height,
          lifestyle: result.data.lifestyle,
          createdAt: new Date(result.data.createdAt),
          updatedAt: new Date(result.data.updatedAt),
        };

        return {
          data: user,
          success: true,
        };
      } else {
        return {
          data: null,
          success: false,
          message: result.error || 'User not found',
        };
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return {
        data: null,
        success: false,
        message: 'User not found',
      };
    }
  }

  /**
   * Get match score between current user and target profile
   */
  async getMatchScore(profileId: string): Promise<ApiResponse<{ score: number; sharedHobbies: any[]; distance: number }>> {
    try {
      const response = await authService.authenticatedRequest(`${API_BASE_URL}/profile/${profileId}/match-score`);
      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          data: result.data
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to calculate match score',
        };
      }
    } catch (error) {
      console.error('Error calculating match score:', error);
      return {
        success: false,
        error: 'Failed to calculate match score',
      };
    }
  }

  /**
   * Mark chat messages as read
   */
  async markChatAsRead(chatId: string): Promise<ApiResponse<any>> {
    try {
      const response = await authService.authenticatedRequest(`${API_BASE_URL}/messages/${chatId}/read`, {
        method: 'POST',
      });
      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          data: result.data
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to mark chat as read',
        };
      }
    } catch (error) {
      console.error('Error marking chat as read:', error);
      return {
        success: false,
        error: 'Failed to mark chat as read',
      };
    }
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


      const requestBody = {
        displayName: profileData.displayName,
        bio: profileData.bio,
        hobbies: hobbyIds,
        useLocation: profileData.useLocation,
        country: profileData.country,
        city: profileData.city,
        matchRadius: profileData.matchRadius,
        latitude: profileData.latitude,
        longitude: profileData.longitude,
        // Optional profile information
        age: profileData.age,
        job: profileData.job,
        company: profileData.company,
        education: profileData.education,
        university: profileData.university,
        relationshipStatus: profileData.relationshipStatus,
        lookingFor: profileData.lookingFor,
        interests: profileData.interests,
        languages: profileData.languages,
        height: profileData.height,
        lifestyle: profileData.lifestyle,
      };


      const response = await authService.authenticatedRequest(`${API_BASE_URL}/profile`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      
      if (result.success) {
        // Convert the database profile to UserProfile format
        const user: UserProfile = {
          id: result.data.id,
          displayName: result.data.displayName,
          bio: result.data.bio,
          hobbies: result.data.hobbies,
          location: { latitude: 0, longitude: 0 }, // Default location
          useLocation: result.data.useLocation ?? true,
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
      
      return {
        data: undefined,
        success: false,
        error: 'Backend not available',
      };
    }
  }

  /**
   * Send a "Say hi" message and start a chat
   */
  async sendSayHiMessage(toUserId: string, fromUserId: string): Promise<ApiResponse<{ chatId: string }>> {
    try {
      
      const response = await authService.authenticatedRequest(`${API_BASE_URL}/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: toUserId,
          content: "Hi! I saw we have some hobbies in common. Would you like to chat?"
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        return {
          data: { chatId: result.data.chatId },
          success: true,
          message: 'Message sent successfully',
        };
      } else {
        throw new Error(result.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message',
      };
    }
  }

  /**
   * Get user's messages/chats
   */
  async getUserMessages(): Promise<ApiResponse<any[]>> {
    try {
      const response = await authService.authenticatedRequest(`${API_BASE_URL}/messages`);
      const result = await response.json();
      
      if (result.success) {
        return {
          data: result.data,
          success: true,
        };
      } else {
        throw new Error(result.error || 'Failed to fetch messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch messages',
      };
    }
  }

  /**
   * Get messages for a specific chat
   */
  async getChatMessages(chatId: string): Promise<ApiResponse<any>> {
    try {
      const response = await authService.authenticatedRequest(`${API_BASE_URL}/messages/${chatId}`);
      const result = await response.json();
      
      if (result.success) {
        return {
          data: result.data,
          success: true,
        };
      } else {
        throw new Error(result.error || 'Failed to fetch chat messages');
      }
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch chat messages',
      };
    }
  }

  /**
   * Send a message to an existing chat
   */
  async sendChatMessage(chatId: string, content: string): Promise<ApiResponse<{ messageId: string }>> {
    try {
      const response = await authService.authenticatedRequest(`${API_BASE_URL}/messages/${chatId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content })
      });
      
      const result = await response.json();
      
      if (result.success) {
        return {
          data: { messageId: result.data.messageId },
          success: true,
        };
      } else {
        throw new Error(result.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending chat message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message',
      };
    }
  }
}

export const apiService = ApiService.getInstance();
