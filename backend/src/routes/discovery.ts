import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { DiscoveryController } from '../controllers/discoveryController';

const router = Router();
const discoveryController = new DiscoveryController();

// Discovery routes using controllers
router.get('/nearby', authenticateToken, (req, res) => discoveryController.getNearbyUsers(req, res));

export { router as discoveryRoutes };