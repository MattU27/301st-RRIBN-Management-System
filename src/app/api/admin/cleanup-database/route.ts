import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cleanupDatabase } from '@/app/utils/cleanupDatabase';
import { createAuditLog } from '@/lib/audit';

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
    await createAuditLog({
      action: 'DATABASE_CLEANUP',
      userId: session.user.id,
      details: `Cleaned up database: ${results.removedCompanies.length} companies removed, ${results.updatedPersonnel} personnel status updated`
    });

    return NextResponse.json({
      message: 'Database cleanup completed successfully',
      results
    });
  } catch (error) {
    console.error('Database cleanup failed:', error);
    return NextResponse.json(
      { message: 'Database cleanup failed', error: error.message },
      { status: 500 }
    );
  }
} 