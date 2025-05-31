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
 * PUT handler to update an existing training
 */
export async function PUT(
  request: Request,
  { params }: { params: { trainingId: string } }
) {
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
    
    // Only staff and admins can update trainings
    if (user.role.toLowerCase() !== 'staff' && user.role.toLowerCase() !== 'administrator') {
      return NextResponse.json(
        { success: false, error: 'Only staff and administrators can update trainings' },
        { status: 403 }
      );
    }
    
    const { trainingId } = params;
    
    if (!trainingId) {
      return NextResponse.json(
        { success: false, error: 'Training ID is required' },
        { status: 400 }
      );
    }
    
    // Find the training
    const training = await Training.findById(trainingId);
    
    if (!training) {
      return NextResponse.json(
        { success: false, error: 'Training not found' },
        { status: 404 }
      );
    }
    
    // Get training data from request
    const { training: trainingData } = await request.json();
    
    if (!trainingData) {
      return NextResponse.json(
        { success: false, error: 'Training data is required' },
        { status: 400 }
      );
    }
    
    // Update training fields
    if (trainingData.title) training.title = trainingData.title;
    if (trainingData.description !== undefined) training.description = trainingData.description;
    if (trainingData.type) training.type = trainingData.type;
    if (trainingData.status) training.status = trainingData.status;
    if (trainingData.startDate) training.startDate = new Date(trainingData.startDate);
    if (trainingData.endDate) training.endDate = new Date(trainingData.endDate);
    if (trainingData.location) training.location = trainingData.location;
    if (trainingData.capacity) training.capacity = trainingData.capacity;
    if (trainingData.instructor) training.instructor = trainingData.instructor;
    if (trainingData.mandatory !== undefined) training.mandatory = trainingData.mandatory;
    if (trainingData.tags) training.tags = trainingData.tags;
    
    // Track who updated it
    training.updatedBy = decoded.userId;
    training.updatedAt = new Date();
    
    // Save the updated training
    const updatedTraining = await training.save();
    
    // Create audit log entry
    try {
      const auditLog = new AuditLog({
        timestamp: new Date(),
        userId: decoded.userId,
        userName: `${user.firstName} ${user.lastName}`,
        userRole: user.role,
        action: 'update',
        resource: 'training',
        resourceId: training._id,
        details: `Updated training: ${training.title}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      });
      
      await auditLog.save();
      console.log('Training update logged to audit system');
    } catch (auditError) {
      // Don't fail the main operation if audit logging fails
      console.error('Error logging to audit system:', auditError);
    }
    
    // Return the updated training
    return NextResponse.json({
      success: true,
      data: {
        training: updatedTraining
      }
    });
  } catch (error: any) {
    console.error('Error updating training:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error updating training' },
      { status: 500 }
    );
  }
} 