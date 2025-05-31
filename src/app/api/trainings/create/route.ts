import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import Training from '@/models/Training';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import { verifyJWT } from '@/utils/auth';
import { TrainingStatus } from '@/models/Training';

// Add dynamic directive to ensure route is dynamic
export const dynamic = 'force-dynamic';

/**
 * POST handler to create a new training
 */
export async function POST(request: Request) {
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
    
    // Get user info to check permissions and for audit log
    const user = await User.findById(decoded.userId, 'firstName lastName role');
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Only staff can create trainings
    if (user.role !== 'staff') {
      return NextResponse.json(
        { success: false, error: 'Only staff can create trainings' },
        { status: 403 }
      );
    }
    
    // Get training data from request
    const requestData = await request.json();
    const { training: trainingData } = requestData;
    
    if (!trainingData) {
      return NextResponse.json(
        { success: false, error: 'Training data is required' },
        { status: 400 }
      );
    }
    
    // Validate required fields
    if (!trainingData.title) {
      return NextResponse.json(
        { success: false, error: 'Training title is required' },
        { status: 400 }
      );
    }
    
    if (!trainingData.startDate || !trainingData.endDate) {
      return NextResponse.json(
        { success: false, error: 'Start and end dates are required' },
        { status: 400 }
      );
    }
    
    // Create new training with default values
    const newTraining = new Training({
      title: trainingData.title,
      description: trainingData.description || '',
      type: trainingData.type || '',
      status: trainingData.status || TrainingStatus.UPCOMING,
      startDate: new Date(trainingData.startDate),
      endDate: new Date(trainingData.endDate),
      location: trainingData.location || { name: '', address: '' },
      capacity: trainingData.capacity || 20,
      instructor: trainingData.instructor || { name: '', rank: '' },
      mandatory: trainingData.mandatory || false,
      attendees: [], // Start with empty attendees
      tags: trainingData.tags || [],
      createdBy: decoded.userId // Just use the userId as an ObjectId
    });
    
    // Save the new training
    const savedTraining = await newTraining.save();
    
    // Create audit log entry
    try {
      const auditLog = new AuditLog({
        timestamp: new Date(),
        userId: decoded.userId,
        userName: `${user.firstName} ${user.lastName}`,
        userRole: user.role,
        action: 'create',
        resource: 'training',
        resourceId: savedTraining._id,
        details: `Created new training: ${savedTraining.title}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      });
      
      await auditLog.save();
      console.log('Training creation logged to audit system');
    } catch (auditError) {
      // Don't fail the main operation if audit logging fails
      console.error('Error logging to audit system:', auditError);
    }
    
    // Return the new training
    return NextResponse.json({
      success: true,
      data: {
        training: savedTraining
      }
    });
  } catch (error: any) {
    console.error('Error creating training:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error creating training' },
      { status: 500 }
    );
  }
} 