import jwt from 'jsonwebtoken';

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-for-jwt-signing';

/**
 * Verifies a JWT token and returns the decoded payload
 * @param token - The JWT token to verify
 * @returns The decoded token payload or null if invalid
 */
export async function verifyJWT(token: string): Promise<{ userId: string; role: string; email?: string } | null> {
  try {
    if (!token) {
      console.error('No token provided for verification');
      return null;
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string; email?: string };
    
    // Validate required fields in the token
    if (!decoded.userId || !decoded.role) {
      console.error('Invalid token structure: missing userId or role');
      return null;
    }
    
    return decoded;
  } catch (error: any) {
    if (error instanceof jwt.JsonWebTokenError) {
      console.error('JWT verification failed:', error.message);
    } else if (error instanceof jwt.TokenExpiredError) {
      console.error('JWT token expired');
    } else {
      console.error('JWT verification error:', error);
    }
    return null;
  }
}

/**
 * Generates a JWT token for a user
 * @param userId - The user ID
 * @param role - The user role
 * @param email - Optional email address
 * @returns The generated JWT token
 */
export function generateJWT(userId: string, role: string, email?: string): string {
  return jwt.sign({ userId, role, email }, JWT_SECRET, { expiresIn: '7d' });
} 