import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types/types';

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN as string;
const APP_NAME = process.env.APP_NAME as string;

export const generateToken = (payload: JWTPayload): string => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.sign(
    payload,
    JWT_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: '7d', //use env variable here
      issuer: APP_NAME
    }
  );
};

export const verifyToken = (token: string) : JWTPayload => {
  

  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch(error) {
    throw new Error('Invalid or expired token');
  }
}

export const decodeToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};