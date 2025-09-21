import { Request, Response, NextFunction } from 'express';
import { verifyToken, getUserById } from '../lib/auth';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and adds user to request
 */
export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  console.log('Auth middleware - Token received:', token ? 'Yes' : 'No');
  console.log('Auth middleware - Auth header:', authHeader);

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Access token required' 
    });
  }

  try {
    const decoded = verifyToken(token);
    console.log('Auth middleware - Token decoded:', decoded);
    if (!decoded) {
      return res.status(403).json({ 
        success: false, 
        error: 'Invalid or expired token' 
      });
    }

    // Get user from database to ensure they still exist
    console.log('Auth middleware - Looking for user with ID:', decoded.userId);
    const user = await getUserById(decoded.userId);
    console.log('Auth middleware - User found:', user ? 'Yes' : 'No');
    if (user) {
      console.log('Auth middleware - User email:', user.email);
    }
    
    if (!user) {
      console.log('Auth middleware - User not found, returning 403');
      return res.status(403).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Add user to request object
    req.user = {
      id: user.id,
      email: user.email
    };

    console.log('Auth middleware - Calling next() to proceed to endpoint');
    next();
  } catch (error) {
    console.error('Auth middleware - Error:', error);
    return res.status(403).json({ 
      success: false, 
      error: 'Invalid token' 
    });
  }
}

/**
 * Optional authentication middleware
 * Adds user to request if token is valid, but doesn't require it
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = verifyToken(token);
      if (decoded) {
        const user = await getUserById(decoded.userId);
        if (user) {
          req.user = {
            id: user.id,
            email: user.email
          };
        }
      }
    } catch (error) {
      // Ignore token errors for optional auth
    }
  }

  next();
}
