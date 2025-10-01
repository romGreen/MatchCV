import { Request, Response } from 'express';
import { UserService } from '../services/userService';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.userService.getAllUsers();
      res.json(result);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch users' 
      });
    }
  }

  async testDelete(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.userService.testDelete();
      res.json(result);
    } catch (error) {
      console.error('Error in test delete:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Test delete failed' 
      });
    }
  }

  async deleteMe(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await this.userService.deleteUser(userId);
      res.json(result);
    } catch (error) {
      console.error('Error deleting user account:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to delete account' 
      });
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const currentUserId = req.user!.id;
      const result = await this.userService.deleteUserById(id, currentUserId);
      res.json(result);
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to delete user' 
      });
    }
  }
}
