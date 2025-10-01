import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  return res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// API documentation endpoint
router.get('/api', (req: Request, res: Response) => {
  return res.json({
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

// Hobbies endpoint
router.get('/api/hobbies', async (req: Request, res: Response) => {
  try {
    const hobbies = await prisma.hobby.findMany({
      orderBy: { name: 'asc' }
    });
    return res.json({ success: true, data: hobbies });
  } catch (error) {
    console.error('Error fetching hobbies:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch hobbies' });
  }
});

export { router as healthRoutes };