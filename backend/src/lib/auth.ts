import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';
import { AuthUser } from '../types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';


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
  country: string;
  city: string;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  token?: string;
  error?: string;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): { userId: string } | null {
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
export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
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
 * Get user by ID
 */
export async function getUserById(id: string) {
  console.log('getUserById - Searching for user with ID:', id);
  
  const user = await prisma.user.findUnique({
    where: { id },
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
  
  console.log('getUserById - User found:', !!user);
  if (user) {
    console.log('getUserById - User email:', user.email);
    console.log('getUserById - Profile exists:', !!user.profile);
    if (user.profile) {
      console.log('getUserById - Profile age:', (user.profile as any).age);
      console.log('getUserById - Profile fields:', Object.keys(user.profile));
    }
  }
  
  return user;
}

/**
 * Create a new user with profile
 */
export async function createUserWithProfile(data: RegisterRequest) {
  const hashedPassword = await hashPassword(data.password);
  
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

  return prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      profile: {
        create: {
          displayName: data.displayName,
          bio: data.bio || '',
          useLocation: data.useLocation ?? true,
          country: data.country,
          city: data.city,
          ...hobbyConnections
        } as any
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

