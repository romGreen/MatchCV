import { Request, Response } from 'express';
import { DiscoveryService } from '../services/discoveryService';

export class DiscoveryController {
  private discoveryService: DiscoveryService;

  constructor() {
    this.discoveryService = new DiscoveryService();
  }

  async getNearbyUsers(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { radius } = req.query;

      const result = await this.discoveryService.getNearbyUsersByUserId(
        userId,
        radius ? parseFloat(radius as string) : undefined
      );

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error fetching nearby users:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch nearby users' });
    }
  }
}
