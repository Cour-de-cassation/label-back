import jwt from 'jsonwebtoken';
import { userType } from '@src/core';
import { JWT_SECRET, JWT_EXPIRATION } from '../env';

export { jwtHandler };

interface JwtPayload {
  _id: string;
  name: string;
  role: string;
  email: string;
  sessionIndex: string;
}

const jwtHandler = {
  generateToken,
  verifyToken,
};

function generateToken(user: userType, sessionIndex: string): string {
  const payload: JwtPayload = {
    _id: user._id.toString(),
    name: user.name as string,
    role: user.role as string,
    email: user.email as string,
    sessionIndex,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRATION || '24h',
    algorithm: 'HS256',
  } as jwt.SignOptions);
}

function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as JwtPayload;
  } catch (error) {
    throw new Error(`Invalid or expired token: ${error}`);
  }
}
