import { Request, Response } from 'express';
import { MessageService } from '../services/messageService';

export class MessageController {
  private messageService: MessageService;

  constructor() {
    this.messageService = new MessageService();
  }

  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { receiverId, content } = req.body;
      const senderId = req.user!.id;

      if (!receiverId || !content) {
        res.status(400).json({
          success: false,
          error: 'Receiver ID and content are required'
        });
        return;
      }

      const result = await this.messageService.sendMessage(senderId, receiverId, content);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ success: false, error: 'Failed to send message' });
    }
  }

  async sendChatMessage(req: Request, res: Response): Promise<void> {
    try {
      const { chatId } = req.params;
      const { content } = req.body;
      const senderId = req.user!.id;

      if (!content) {
        res.status(400).json({
          success: false,
          error: 'Content is required'
        });
        return;
      }

      const result = await this.messageService.sendChatMessage(chatId, senderId, content);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error sending chat message:', error);
      res.status(500).json({ success: false, error: 'Failed to send message' });
    }
  }

  async getUserMessages(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await this.messageService.getUserMessages(userId);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error fetching user messages:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch messages' });
    }
  }

  async getChatMessages(req: Request, res: Response): Promise<void> {
    try {
      const { chatId } = req.params;
      const userId = req.user!.id;
      const result = await this.messageService.getChatMessages(chatId, userId);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch chat messages' });
    }
  }

  async markChatAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { chatId } = req.params;
      const userId = req.user!.id;
      const result = await this.messageService.markChatAsRead(chatId, userId);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('🔴 Controller: Error marking chat as read:', error);
      res.status(500).json({ success: false, error: 'Failed to mark chat as read' });
    }
  }
}
