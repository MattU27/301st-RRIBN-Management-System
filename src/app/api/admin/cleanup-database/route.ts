import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { cleanupDatabase } from '@/app/utils/cleanupDatabase';
import { auditLog } from '@/lib/audit';

// Basic auth options for server-side auth
const authOptions = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async session({ session, token }) {
      if (session?.user && token?.sub) {
        session.user.id = token.sub;
      }
      if (token?.role) {
        session.user.role = token.role;
      }
      return session;
    },
  },
};

export async function POST() {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only allow admins to perform this operation
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Run the database cleanup
    const results = await cleanupDatabase();
    
    // Create audit log
    await auditLog('DATABASE_CLEANUP', {
      userId: session.user.id,
      details: `Cleaned up database: ${results.success ? 'Successfully completed' : 'Failed'}`
    });

    return NextResponse.json({
      message: 'Database cleanup completed successfully',
      results
    });
  } catch (error: any) {
    console.error('Database cleanup failed:', error);
    return NextResponse.json(
      { message: 'Database cleanup failed', error: error.message || 'Unknown error occurred' },
      { status: 500 }
    );
  }
} 