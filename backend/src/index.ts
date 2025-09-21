import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './lib/prisma';
import { 
  createUserWithProfile, 
  getUserByEmail, 
  getUserById,
  verifyPassword, 
  generateToken, 
  formatAuthUser,
  LoginRequest,
  RegisterRequest 
} from './lib/auth';
import { authenticateToken } from './middleware/auth';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = '0.0.0.0'; // Force listen on all network interfaces

// Basic security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// CORS configuration - Allow all origins for testing
app.use(cors({
  origin: true, // Allow all origins for testing
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} ${req.method} ${req.url} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'MatchCV API',
    version: '1.0.0',
    description: 'Backend API for MatchCV mobile application',
    endpoints: {
      health: '/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
        logout: 'POST /api/auth/logout'
      },
      profile: {
        create: 'POST /api/profile',
        get: 'GET /api/profile/:id',
        updateLocation: 'POST /api/profile/location'
      },
      users: {
        list: 'GET /api/users',
        delete: 'DELETE /api/users/:id',
        deleteMe: 'DELETE /api/users/me'
      },
      hobbies: 'GET /api/hobbies',
      discovery: '/api/discovery (coming soon)',
      debug: '/api/debug/db'
    }
  });
});

// API routes
app.get('/api/hobbies', async (req, res) => {
  try {
    const hobbies = await prisma.hobby.findMany({
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: hobbies });
  } catch (error) {
    console.error('Error fetching hobbies:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch hobbies' });
  }
});

// Authentication endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, displayName, bio, hobbies, visibilityLevel }: RegisterRequest = req.body;

    // Validate required fields
    if (!email || !password || !displayName) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and display name are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Create user with profile
    const user = await createUserWithProfile({
      email,
      password,
      displayName,
      bio,
      hobbies,
      visibilityLevel
    });

    // Generate JWT token
    const token = generateToken(user.id);

    // Format response
    const authUser = formatAuthUser(user);

    res.status(201).json({
      success: true,
      user: authUser,
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed'
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password }: LoginRequest = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Get user by email
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken(user.id);

    // Format response
    const authUser = formatAuthUser(user);

    res.json({
      success: true,
      user: authUser,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Login failed'
    });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await getUserById(req.user!.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const authUser = formatAuthUser(user);
    res.json({
      success: true,
      user: authUser
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user'
    });
  }
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
  // For JWT tokens, logout is handled client-side by removing the token
  // In a more advanced setup, you might maintain a blacklist of tokens
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Location update endpoint
app.post('/api/profile/location', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const userId = req.user!.id;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ 
        success: false, 
        error: 'Latitude and longitude are required' 
      });
    }
    
    // Update user's location in profile
    await prisma.profile.update({
      where: { userId },
      data: {
        latitude,
        longitude,
      }
    });
    
    res.json({ success: true, message: 'Location updated successfully' });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ success: false, error: 'Failed to update location' });
  }
});

// Profile endpoints
app.post('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { displayName, bio, hobbies, visibilityLevel, matchRadius } = req.body;
    const userId = req.user!.id;
    
    console.log('Received profile data:', { displayName, bio, hobbies, visibilityLevel, userId });
    
    // Convert visibilityLevel to uppercase for Prisma enum
    const prismaVisibilityLevel = visibilityLevel.toUpperCase();
    
    // Validate that all hobby IDs exist
    const existingHobbies = await prisma.hobby.findMany({
      where: { id: { in: hobbies } }
    });
    
    if (existingHobbies.length !== hobbies.length) {
      return res.status(400).json({ 
        success: false, 
        error: 'Some hobby IDs are invalid',
        received: hobbies,
        found: existingHobbies.map(h => h.id)
      });
    }
    
    // Update existing profile or create new one
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        profile: {
          upsert: {
            create: {
              displayName,
              bio,
              visibilityLevel: prismaVisibilityLevel,
              matchRadius: matchRadius || 10,
              hobbies: {
                create: hobbies.map((hobbyId: string) => ({
                  hobby: {
                    connect: { id: hobbyId }
                  }
                }))
              }
            },
            update: {
              displayName,
              bio,
              visibilityLevel: prismaVisibilityLevel,
              matchRadius: matchRadius || 10,
              hobbies: {
                deleteMany: {}, // Remove all existing hobbies
                create: hobbies.map((hobbyId: string) => ({
                  hobby: {
                    connect: { id: hobbyId }
                  }
                }))
              }
            }
          }
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
    
    res.json({ success: true, data: user.profile });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

app.get('/api/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const profile = await prisma.profile.findUnique({
      where: { id },
      include: {
        hobbies: {
          include: {
            hobby: true
          }
        }
      }
    });
    
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }
    
    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
});

// User management endpoints
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
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
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ 
      success: true, 
      data: users.map(user => ({
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        profile: user.profile
      }))
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// Test endpoint without auth to see if route works
app.delete('/api/users/test', (req, res) => {
  console.log('=== TEST DELETE ENDPOINT REACHED ===');
  res.json({ success: true, message: 'Test endpoint works' });
});

app.delete('/api/users/me', authenticateToken, async (req, res) => {
  console.log('=== DELETE ACCOUNT ENDPOINT REACHED ===');
  try {
    const userId = req.user!.id;
    console.log('Delete account request - User ID from token:', userId);
    
    // Get user info before deletion
    console.log('Searching for user with ID:', userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });
    
    console.log('User found in database:', user ? 'Yes' : 'No');
    if (user) {
      console.log('User email:', user.email);
    } else {
      // Let's see what users actually exist
      const allUsers = await prisma.user.findMany();
      console.log('All users in database:', allUsers.map(u => ({ id: u.id, email: u.email })));
    }
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    // Delete user (this will cascade delete profile, user_hobbies, etc.)
    await prisma.user.delete({
      where: { id: userId }
    });
    
    console.log(`User ${user.email} deleted their own account`);
    
    res.json({ 
      success: true, 
      message: 'Account deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting user account:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete account' 
    });
  }
});

app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.id;
    
    // Prevent users from deleting themselves
    if (id === currentUserId) {
      return res.status(400).json({ 
        success: false, 
        error: 'You cannot delete your own account' 
      });
    }
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      include: { profile: true }
    });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    // Delete user (this will cascade delete profile, user_hobbies, etc. due to Prisma relations)
    await prisma.user.delete({
      where: { id }
    });
    
    console.log(`User ${user.email} deleted successfully`);
    
    res.json({ 
      success: true, 
      message: `User ${user.email} deleted successfully` 
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete user' 
    });
  }
});

app.get('/api/discovery', (req, res) => {
  res.json({ message: 'Discovery endpoints coming soon' });
});

// Debug endpoint to check database
app.get('/api/debug/db', async (req, res) => {
  try {
    const hobbies = await prisma.hobby.findMany();
    const users = await prisma.user.findMany();
    const profiles = await prisma.profile.findMany();
    
    res.json({
      success: true,
      data: {
        hobbies: hobbies.length,
        users: users.length,
        profiles: profiles.length,
        hobbyIds: hobbies.map(h => h.id),
        sampleHobby: hobbies[0],
        allUsers: users.map(u => ({ id: u.id, email: u.email, createdAt: u.createdAt }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Debug endpoint to check specific user
app.get('/api/debug/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: { profile: true }
    });
    
    res.json({
      success: true,
      data: {
        userExists: !!user,
        user: user ? { id: user.id, email: user.email, profile: user.profile } : null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(`🚀 MatchCV Backend Server running on http://localhost:${PORT}`);
  console.log(`📱 Mobile access: http://192.168.7.20:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Documentation: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

export default app;