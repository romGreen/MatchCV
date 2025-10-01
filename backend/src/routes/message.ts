import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { MessageController } from '../controllers/messageController';

const router = Router();
const messageController = new MessageController();

// Message routes using controllers
router.post('/:chatId/send', authenticateToken, (req, res) => messageController.sendChatMessage(req, res));
router.post('/send', authenticateToken, (req, res) => messageController.sendMessage(req, res));
router.post('/:chatId/read', authenticateToken, (req, res) => messageController.markChatAsRead(req, res));
router.get('/:chatId', authenticateToken, (req, res) => messageController.getChatMessages(req, res));
router.get('/', authenticateToken, (req, res) => messageController.getUserMessages(req, res));

export { router as messageRoutes };