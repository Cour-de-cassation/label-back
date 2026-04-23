import { Request, Response, NextFunction } from 'express';
import { jwtHandler } from './jwtHandler';
import { logger } from '../logger';

export { jwtMiddleware };

function jwtMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      logger.info({
        operations: ['other', 'JWT Middleware'],
        path: './src/backend/utils/jwt/jwtMiddleware.ts',
        message: `No authorization header, continuing without user`,
      });
      return next();
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    const decoded = jwtHandler.verifyToken(token);

    req.user = {
      _id: decoded._id,
      name: decoded.name,
      role: decoded.role,
      email: decoded.email,
      sessionIndex: decoded.sessionIndex,
    };
    next();
  } catch (error) {
    logger.error({
      operations: ['other', 'JWT Middleware'],
      path: './src/backend/utils/jwt/jwtMiddleware.ts',
      message: `Token verification failed`,
      stack: error instanceof Error ? error.stack : undefined,
    });
    next();
  }
}
