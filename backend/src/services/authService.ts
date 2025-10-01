import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { AuthUser, LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';
import { GeocodingService } from './geocodingService';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';

export class AuthService {
  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify a password against its hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate a JWT token for a user
   */
  generateToken(userId: string): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
  }

  /**
   * Verify and decode a JWT token
   */
  verifyToken(token: string): { userId: string } | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        profile: {
          include: {
            hobbies: {
              include: {
                hobby: true
              }
            },
            photos: {
              orderBy: {
                order: 'asc'
              }
            }
          }
        }
      }
    });
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        profile: {
          include: {
            hobbies: {
              include: {
                hobby: true
              }
            },
            photos: {
              orderBy: {
                order: 'asc'
              }
            }
          }
        }
      }
    });
  }

  /**
   * Create a new user with profile
   */
  async createUserWithProfile(data: RegisterRequest) {

    const hashedPassword = await this.hashPassword(data.password);
    
    // Handle location coordinates
    let latitude: number | null = null;
    let longitude: number | null = null;
    
    if (data.useLocation && data.latitude && data.longitude) {
      // User provided GPS coordinates
      latitude = data.latitude;
      longitude = data.longitude;
    } else {
      // User selected country/city manually - geocode to get coordinates
      const geocodingService = GeocodingService.getInstance();
      const geocodingResult = await geocodingService.getCoordinatesFromCityCountry(data.city, data.country);
      
      if (geocodingResult) {
        latitude = geocodingResult.latitude;
        longitude = geocodingResult.longitude;
      } else {
        // No fallback - geocoding failed
        throw new Error(`Unable to find coordinates for ${data.city}, ${data.country}. Please check the city and country names.`);
      }
    }
    
    // Get hobby IDs if hobbies are provided
    let hobbyConnections = {};
    if (data.hobbies && data.hobbies.length > 0) {
      const existingHobbies = await prisma.hobby.findMany({
        where: { id: { in: data.hobbies } }
      });
      
      if (existingHobbies.length !== data.hobbies.length) {
        throw new Error('Some hobby IDs are invalid');
      }
      
      hobbyConnections = {
        hobbies: {
          create: data.hobbies.map((hobbyId: string) => ({
            hobby: {
              connect: { id: hobbyId }
            }
          }))
        }
      };
    }

    const profileData = {
      displayName: data.displayName,
      bio: data.bio || '',
      useLocation: data.useLocation ?? true,
      country: data.country,
      city: data.city,
      latitude,
      longitude,
      // Optional profile fields - only include if they exist and have values
      ...(data.age !== undefined && data.age !== null && { age: data.age }),
      ...(data.job !== undefined && data.job !== null && data.job.trim() && { job: data.job }),
      ...(data.company !== undefined && data.company !== null && data.company.trim() && { company: data.company }),
      ...(data.education !== undefined && data.education !== null && data.education.trim() && { education: data.education }),
      ...(data.university !== undefined && data.university !== null && data.university.trim() && { university: data.university }),
      ...(data.relationshipStatus !== undefined && data.relationshipStatus !== null && data.relationshipStatus.trim() && { relationshipStatus: data.relationshipStatus }),
      ...(data.lookingFor !== undefined && data.lookingFor !== null && data.lookingFor.trim() && { lookingFor: data.lookingFor }),
      ...(data.interests !== undefined && data.interests !== null && data.interests.trim() && { interests: data.interests }),
      ...(data.languages !== undefined && data.languages !== null && data.languages.trim() && { languages: data.languages }),
      ...(data.height !== undefined && data.height !== null && { height: data.height }),
      ...(data.lifestyle !== undefined && data.lifestyle !== null && data.lifestyle.trim() && { lifestyle: data.lifestyle }),
      ...hobbyConnections
    };



    return prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        profile: {
          create: profileData as any
        }
      },
      include: {
        profile: {
          include: {
            hobbies: {
              include: {
                hobby: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Convert database user to AuthUser format
   */
  formatAuthUser(user: any): AuthUser {
    return {
      id: user.id,
      email: user.email,
      profile: user.profile ? {
        id: user.profile.id,
        displayName: user.profile.displayName,
        bio: user.profile.bio,
        photos: user.profile.photos?.map((photo: any) => ({
          id: photo.id,
          photoUrl: photo.photoUrl,
          order: photo.order,
          createdAt: photo.createdAt,
          updatedAt: photo.updatedAt
        })) || [],
        useLocation: user.profile.useLocation ?? true,
        hobbies: user.profile.hobbies?.map((uh: any) => ({
          id: uh.hobby.id,
          name: uh.hobby.name,
          category: uh.hobby.category
        })) || [],
        location: user.profile.latitude && user.profile.longitude 
          ? { latitude: user.profile.latitude, longitude: user.profile.longitude }
          : { latitude: 31.9293, longitude: 34.7987 }, // Fallback to Nes Ziona, Israel
        matchRadius: user.profile.matchRadius || 10,
        country: user.profile.country,
        city: user.profile.city,
        // Optional profile information
        age: user.profile.age ?? undefined,
        job: user.profile.job ?? undefined,
        company: user.profile.company ?? undefined,
        education: user.profile.education ?? undefined,
        university: user.profile.university ?? undefined,
        relationshipStatus: user.profile.relationshipStatus ?? undefined,
        lookingFor: user.profile.lookingFor ?? undefined,
        interests: user.profile.interests ?? undefined,
        languages: user.profile.languages ?? undefined,
        height: user.profile.height ?? undefined,
        lifestyle: user.profile.lifestyle ?? undefined
      } : undefined
    };
  }

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await this.getUserByEmail(data.email);
      if (existingUser) {
        return {
          success: false,
          error: 'User with this email already exists'
        };
      }

      // Create user with profile
      const user = await this.createUserWithProfile(data);

      // Generate JWT token
      const token = this.generateToken(user.id);

      // Format response
      const authUser = this.formatAuthUser(user);

      return {
        success: true,
        user: authUser,
        token
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      // Get user by email
      const user = await this.getUserByEmail(email);
      if (!user) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(password, user.password);
      if (!isValidPassword) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Generate JWT token
      const token = this.generateToken(user.id);

      // Format response
      const authUser = this.formatAuthUser(user);

      return {
        success: true,
        user: authUser,
        token
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }
}
