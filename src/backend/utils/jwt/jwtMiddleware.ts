import { Request, Response, NextFunction } from 'express';
import { jwtHandler } from './jwtHandler';
import { logger } from '../logger';

export { jwtMiddleware };

function jwtMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      logger.log({
        operationName: 'JWT Middleware',
        msg: `No authorization header, continuing without user`,
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

    logger.log({
      operationName: 'JWT Middleware',
      msg: `User authenticated: ${decoded.email} (role: ${decoded.role})`,
    });

    next();
  } catch (error) {
    logger.error({
      operationName: 'JWT Middleware',
      msg: `Token verification failed: ${error}`,
    });
    next();
  }
}
