import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import Training, { TrainingStatus } from '@/models/Training';
import { verifyJWT } from '@/utils/auth';

/**
 * GET handler to retrieve training statistics
 */
export async function GET(request: Request) {
  try {
    // Connect to MongoDB
    await dbConnect();
    
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = await verifyJWT(token);
    
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    // Get training counts by status
    const upcomingCount = await Training.countDocuments({ status: TrainingStatus.UPCOMING });
    const ongoingCount = await Training.countDocuments({ status: TrainingStatus.ONGOING });
    const completedCount = await Training.countDocuments({ status: TrainingStatus.COMPLETED });
    const cancelledCount = await Training.countDocuments({ status: TrainingStatus.CANCELLED });
    
    // Get total count
    const totalCount = await Training.countDocuments();
    
    // Get registration statistics
    const allTrainings = await Training.find().lean();
    
    let totalRegistrations = 0;
    let completedRegistrations = 0;
    
    // Calculate registration counts
    allTrainings.forEach(training => {
      if (training.attendees && Array.isArray(training.attendees)) {
        // Count total registrations
        totalRegistrations += training.attendees.length;
        
        // Count completed registrations
        training.attendees.forEach(attendee => {
          if (attendee.status === 'completed') {
            completedRegistrations++;
          }
        });
      }
    });
    
    // Build response data
    const stats = {
      total: totalCount,
      upcoming: upcomingCount,
      ongoing: ongoingCount,
      completed: completedCount,
      cancelled: cancelledCount,
      totalRegistrations,
      completedRegistrations,
      completionRate: totalRegistrations > 0 
        ? Math.round((completedRegistrations / totalRegistrations) * 100) 
        : 0
    };
    
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error fetching training statistics:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error fetching training statistics' },
      { status: 500 }
    );
  }
} 