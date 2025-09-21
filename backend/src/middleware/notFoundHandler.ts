import { Request, Response } from 'express';
import { logger } from '../utils/logger';

export const notFoundHandler = (req: Request, res: Response): void => {
  const message = `Route ${req.method} ${req.url} not found`;
  
  logger.warn('Route not found:', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  res.status(404).json({
    success: false,
    error: {
      message,
      code: 'ROUTE_NOT_FOUND'
    },
    timestamp: new Date().toISOString(),
    path: req.url
  });
};
