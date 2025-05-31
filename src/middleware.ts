import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// JWT secret key - in production, this should be an environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-for-jwt-signing';

// Define paths that require authentication
const protectedPaths = [
  '/dashboard',
  '/documents',
  '/trainings',
  '/personnel',
  '/profile',
];

// Define paths that are only accessible to specific roles
const roleRestrictedPaths = {
  '/personnel': ['staff', 'admin', 'administrator', 'director'],
  '/admin': ['admin', 'administrator', 'director'],
  '/analytics': ['director'],
  '/reports': ['admin', 'administrator', 'director'],
};

// Public paths that shouldn't redirect even when not authenticated
const publicPaths = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/api',
  '/_next',
  '/favicon.ico',
  '/static',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for public paths and static assets
  if (publicPaths.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }
  
  // Check if the path is protected
  const isProtectedPath = protectedPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );

  if (isProtectedPath) {
    // Get the token from the Authorization header or cookie
    const token = request.cookies.get('token')?.value;
    
    // If there's no token, redirect to login
    if (!token) {
      const url = new URL('/login', request.url);
      if (pathname !== '/dashboard') {
        url.searchParams.set('callbackUrl', pathname);
      }
      return NextResponse.redirect(url);
    }

    try {
      // Verify the token
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(JWT_SECRET)
      );
      
      const userRole = payload.role as string;
      const userStatus = payload.status as string;
      
      // Check if account is deactivated
      if (userStatus === 'deactivated' || userStatus === 'inactive') {
        // Redirect to login with deactivated message
        const url = new URL('/login', request.url);
        url.searchParams.set('deactivated', 'true');
        return NextResponse.redirect(url);
      }

      // Check if the path is restricted by role
      for (const [path, roles] of Object.entries(roleRestrictedPaths)) {
        if (pathname === path || pathname.startsWith(`${path}/`)) {
          if (!roles.includes(userRole)) {
            // Redirect to dashboard if the user doesn't have the required role
            return NextResponse.redirect(new URL('/dashboard', request.url));
          }
        }
      }
    } catch (error) {
      // If there's an error verifying the token, redirect to login
      console.error('Token verification failed:', error);
      const url = new URL('/login', request.url);
      if (pathname !== '/dashboard') {
        url.searchParams.set('callbackUrl', pathname);
      }
      return NextResponse.redirect(url);
    }
  }

  // Log API requests for debugging
  if (pathname.startsWith('/api/')) {
    console.log(`API Request: ${request.method} ${pathname}`);
  }

  return NextResponse.next();
}

// Error handling for API routes
export function handleAPIError(error: any) {
  console.error('API Error:', error);
  
  // Return a structured error response
  return new Response(
    JSON.stringify({
      success: false,
      error: error.message || 'An unexpected error occurred',
      details: error.stack,
    }),
    {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 