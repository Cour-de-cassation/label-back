import { Request, Response, NextFunction } from 'express';
import { jwtHandler } from './jwtHandler';
import { logger } from '../logger';

export { jwtMiddleware };

function jwtMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    logger.log({
      operationName: 'JWT Middleware',
      msg: `[${req.method}] ${req.path} - Authorization header: ${authHeader ? 'present' : 'missing'} - Origin: ${req.headers.origin || 'none'} - Referer: ${req.headers.referer || 'none'}`,
    });

    if (!authHeader) {
      logger.log({
        operationName: 'JWT Middleware',
        msg: `No authorization header, continuing without user`,
      });
      return next(); // No token provided, continue without user
    }

    // Check if Bearer token format
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    logger.log({
      operationName: 'JWT Middleware',
      msg: `Token extracted (length: ${token.length})`,
    });

    // Verify and decode token
    const decoded = jwtHandler.verifyToken(token);

    // Attach user to request
    req.user = {
      _id: decoded._id,
      name: decoded.name,
      role: decoded.role,
      email: decoded.email,
      sessionIndex: decoded.sessionIndex,
    };

    logger.log({
      operationName: 'JWT Middleware',
      msg: `User authenticated: ${decoded.email} (role: ${decoded.role})`,
    });

    next();
  } catch (error) {
    // Token is invalid or expired, continue without user
    // The authenticated controller will handle the missing user
    logger.error({
      operationName: 'JWT Middleware',
      msg: `Token verification failed: ${error}`,
    });
    next();
  }
}
