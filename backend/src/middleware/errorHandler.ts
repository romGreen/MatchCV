import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { statusCode = 500, message, stack } = error;

  // Log error details
  logger.error('Error occurred:', {
    error: {
      message,
      statusCode,
      stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    }
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorResponse = {
    success: false,
    error: {
      message: isDevelopment ? message : 'Internal Server Error',
      ...(isDevelopment && { stack, details: error })
    },
    timestamp: new Date().toISOString(),
    path: req.url
  };

  res.status(statusCode).json(errorResponse);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const createError = (message: string, statusCode: number = 500): CustomError => {
  return new CustomError(message, statusCode);
};

export const validationError = (message: string): CustomError => {
  return new CustomError(message, 400);
};

export const notFoundError = (resource: string = 'Resource'): CustomError => {
  return new CustomError(`${resource} not found`, 404);
};

export const unauthorizedError = (message: string = 'Unauthorized'): CustomError => {
  return new CustomError(message, 401);
};

export const forbiddenError = (message: string = 'Forbidden'): CustomError => {
  return new CustomError(message, 403);
};
