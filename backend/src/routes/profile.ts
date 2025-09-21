import { Router, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Placeholder profile routes - will be implemented with Prisma
router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: {
      message: 'Profile endpoints not yet implemented',
      code: 'NOT_IMPLEMENTED'
    }
  });
}));

router.put('/', asyncHandler(async (_req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: {
      message: 'Profile endpoints not yet implemented',
      code: 'NOT_IMPLEMENTED'
    }
  });
}));

router.get('/hobbies', asyncHandler(async (_req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: {
      message: 'Profile endpoints not yet implemented',
      code: 'NOT_IMPLEMENTED'
    }
  });
}));

export { router as profileRoutes };
