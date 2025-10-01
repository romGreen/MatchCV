import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { UserController } from '../controllers/userController';

const router = Router();
const userController = new UserController();

// User routes using controllers
router.get('/', authenticateToken, (req, res) => userController.getAllUsers(req, res));
router.delete('/test', (req, res) => userController.testDelete(req, res));
router.delete('/me', authenticateToken, (req, res) => userController.deleteMe(req, res));
router.delete('/:id', authenticateToken, (req, res) => userController.deleteUser(req, res));

export { router as userRoutes };