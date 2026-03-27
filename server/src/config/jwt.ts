import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from './env';
import { JWTPayload } from '../types';

const JWT_EXPIRY_HOURS = 24;
const JWT_EXPIRY_SECONDS = JWT_EXPIRY_HOURS * 60 * 60;

export function generateToken(): { token: string; expiresIn: number } {
  const userId = uuidv4();
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId,
    type: 'anonymous',
  };

  const token = jwt.sign(payload, env.jwtSecret, {
    expiresIn: `${JWT_EXPIRY_HOURS}h`,
  });

  return {
    token,
    expiresIn: JWT_EXPIRY_SECONDS,
  };
}

export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, env.jwtSecret) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    throw new Error('Token verification failed');
  }
}
