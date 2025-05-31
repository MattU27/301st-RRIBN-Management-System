import jwt from 'jsonwebtoken';

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-for-jwt-signing';

/**
 * Verifies a JWT token and returns the decoded payload
 * @param token - The JWT token to verify
 * @returns The decoded token payload or null if invalid
 */
export async function verifyJWT(token: string): Promise<{ userId: string; role: string } | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Generates a JWT token for a user
 * @param userId - The user ID
 * @param role - The user role
 * @returns The generated JWT token
 */
export function generateJWT(userId: string, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
} 