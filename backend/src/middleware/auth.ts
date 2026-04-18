import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.js';
import { PublicUser } from '../types/index.js';

export interface AuthRequest extends Request {
  user?: PublicUser;
  token?: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const token = authService.extractToken(
      req.headers.authorization,
      typeof req.query.session_token === 'string' ? req.query.session_token : undefined
    );

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'No authentication token provided',
      });
      return;
    }

    const user = authService.getUserFromSession(token);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
      return;
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Authentication error',
    });
  }
};

export const optionalAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const token = authService.extractToken(
      req.headers.authorization,
      typeof req.query.session_token === 'string' ? req.query.session_token : undefined
    );

    if (token) {
      const user = authService.getUserFromSession(token);
      if (user) {
        req.user = user;
        req.token = token;
      }
    }
    next();
  } catch (error) {
    next();
  }
};

export const errorHandler = (
  err: Error & { statusCode?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  res.status(statusCode).json({
    success: false,
    message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
