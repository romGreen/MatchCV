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
export async function authenticateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ 
      success: false, 
      error: 'Access token required' 
    });
    return;
  }

  try {
    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(403).json({ 
        success: false, 
        error: 'Invalid or expired token' 
      });
      return;
    }

    // Get user from database to ensure they still exist
    const user = await getUserById(decoded.userId);
    
    if (!user) {
      res.status(403).json({ 
        success: false, 
        error: 'User not found' 
      });
      return;
    }

    // Add user to request object
    req.user = {
      id: user.id,
      email: user.email
    };

    next();
  } catch (error) {
    res.status(403).json({ 
      success: false, 
      error: 'Invalid token' 
    });
    return;
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
