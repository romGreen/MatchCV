import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { AuthController } from '../controllers/authController';

const router = Router();
const authController = new AuthController();

// Auth routes using controllers
router.post('/register', (req, res) => authController.register(req, res));
router.post('/login', (req, res) => authController.login(req, res));
router.get('/me', authenticateToken, (req, res) => authController.getCurrentUser(req, res));
router.post('/logout', authenticateToken, (req, res) => authController.logout(req, res));

export { router as authRoutes };