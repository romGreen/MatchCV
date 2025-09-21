import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Placeholder discovery routes - will be implemented with Prisma
router.get('/nearby', asyncHandler(async (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      message: 'Discovery endpoints not yet implemented',
      code: 'NOT_IMPLEMENTED'
    }
  });
}));

router.get('/matches', asyncHandler(async (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      message: 'Discovery endpoints not yet implemented',
      code: 'NOT_IMPLEMENTED'
    }
  });
}));

export { router as discoveryRoutes };
