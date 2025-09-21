import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Placeholder auth routes - will be implemented with Prisma
router.post('/register', asyncHandler(async (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      message: 'Authentication endpoints not yet implemented',
      code: 'NOT_IMPLEMENTED'
    }
  });
}));

router.post('/login', asyncHandler(async (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      message: 'Authentication endpoints not yet implemented',
      code: 'NOT_IMPLEMENTED'
    }
  });
}));

router.post('/logout', asyncHandler(async (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      message: 'Authentication endpoints not yet implemented',
      code: 'NOT_IMPLEMENTED'
    }
  });
}));

router.get('/me', asyncHandler(async (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      message: 'Authentication endpoints not yet implemented',
      code: 'NOT_IMPLEMENTED'
    }
  });
}));

export { router as authRoutes };
