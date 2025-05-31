import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined');
}

const JWT_SECRET = process.env.JWT_SECRET;

// User roles
export enum UserRole {
  DIRECTOR = 'director',
  ADMIN = 'administrator',
  STAFF = 'staff',
  RESERVIST = 'reservist',
}

// Token interface
export interface DecodedToken {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * Generate a JWT token for the user
 */
export const generateToken = (
  userId: string,
  email: string,
  role: UserRole
): string => {
  return jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

/**
 * Validate a JWT token
 */
export const validateToken = async (token: string): Promise<DecodedToken | null> => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    return decoded;
  } catch (error) {
    console.error('Token validation error:', error);
    return null;
  }
};

/**
 * Set authentication token in cookies
 */
export const setAuthCookie = (token: string): void => {
  const cookieStore = cookies();
  cookieStore.set({
    name: 'auth_token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
};

/**
 * Remove authentication token from cookies
 */
export const removeAuthCookie = (): void => {
  const cookieStore = cookies();
  cookieStore.delete('auth_token');
};

/**
 * Get authentication token from cookies or authorization header
 */
export const getAuthToken = (req: Request): string | null => {
  // Try to get token from Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // If no token in header, try to get from cookies
  const cookieStore = cookies();
  const token = cookieStore.get('auth_token')?.value;
  
  return token || null;
}; 