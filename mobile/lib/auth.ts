import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginRequest, RegisterRequest, AuthResponse, AuthUser } from '@matchcv/shared';
import { locationService } from './location';

const API_BASE_URL = 'http://192.168.7.20:3001/api';
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

class AuthService {
  private static instance: AuthService;
  private currentUser: AuthUser | null = null;
  private token: string | null = null;

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Initialize auth service - load stored token and user
   */
  async initialize(): Promise<void> {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY)
      ]);

      if (storedToken && storedUser) {
        this.token = storedToken;
        this.currentUser = JSON.parse(storedUser);
      }
    } catch (error) {
      console.error('Failed to initialize auth service:', error);
    }
  }

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success && result.token) {
        await this.setAuthData(result.user, result.token);
      }

      return result;
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Network error during registration'
      };
    }
  }

  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success && result.token) {
        await this.setAuthData(result.user, result.token);
      }

      return result;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Network error during login'
      };
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      if (this.token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await this.clearAuthData();
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(forceRefresh: boolean = false): Promise<AuthUser | null> {
    // Always fetch fresh data from server to ensure photos are up to date
    if (this.currentUser && !forceRefresh) {
      // Still return cached data for performance, but also fetch fresh data in background
      this.refreshUserData();
      return this.currentUser;
    }

    try {
      if (!this.token) {
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      const result = await response.json();


      if (result.success && result.user) {
        console.log('getCurrentUser - received user data:', result.user);
        console.log('getCurrentUser - user photos:', result.user.profile?.photos);
        this.currentUser = result.user;
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(result.user));
        return result.user;
      } else {
        // Token is invalid, clear auth data
        await this.clearAuthData();
        return null;
      }
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!(this.token && this.currentUser);
  }

  /**
   * Get auth token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Set auth data (user and token)
   */
  private async setAuthData(user: AuthUser, token: string): Promise<void> {
    this.currentUser = user;
    this.token = token;

    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, token),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(user))
    ]);

    // Auto-update location if user has location enabled
    if (user.profile?.useLocation === true) {
      this.updateLocationOnLogin();
    }
  }

  /**
   * Update location automatically on login
   */
  private async updateLocationOnLogin(): Promise<void> {
    try {
        const locationData = await locationService.getCurrentLocationWithCity();
        
        if (locationData && this.currentUser?.profile) {
        
        // Update profile with new location
        const profileData = {
          displayName: this.currentUser.profile.displayName,
          bio: this.currentUser.profile.bio,
          hobbies: this.currentUser.profile.hobbies.map(h => h.name),
          useLocation: true,
          country: locationData.country,
          city: locationData.city,
          matchRadius: this.currentUser.profile.matchRadius || 10,
          latitude: locationData.location.latitude,
          longitude: locationData.location.longitude,
        };

        const response = await fetch(`${API_BASE_URL}/profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
          },
          body: JSON.stringify(profileData)
        });
        
        const result = await response.json();
        if (result.success) {
          // Update the current user with new location
          this.currentUser = result.data;
        }
      }
    } catch (error) {
      // Silent fail for location auto-update
    }
  }

  /**
   * Clear auth data
   */
  private async clearAuthData(): Promise<void> {
    this.currentUser = null;
    this.token = null;

    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY)
    ]);
  }

  /**
   * Refresh user data in background
   */
  private async refreshUserData(): Promise<void> {
    try {
      if (!this.token) return;

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      const result = await response.json();
      if (result.success && result.user) {
        this.currentUser = result.user;
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(result.user));
      }
    } catch (error) {
      console.error('Background refresh error:', error);
    }
  }

  /**
   * Make authenticated API request
   */
  async authenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return fetch(url, {
      ...options,
      headers,
    });
  }
}

export const authService = AuthService.getInstance();
