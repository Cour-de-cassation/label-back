import jwt from 'jsonwebtoken';
import { userType } from '@src/core';

export { jwtHandler };

const JWT_SECRET = process.env.JWT_SECRET || 'test';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';

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
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  const payload: JwtPayload = {
    _id: user._id.toString(),
    name: user.name as string,
    role: user.role as string,
    email: user.email as string,
    sessionIndex,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRATION as string | number,
    algorithm: 'HS256',
  } as jwt.SignOptions);
}

function verifyToken(token: string): JwtPayload {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as JwtPayload;
  } catch (error) {
    throw new Error(`Invalid or expired token: ${error}`);
  }
}
