import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import { verifyJWT } from '@/utils/auth';
import TrainingRegistration from '@/models/TrainingRegistration';
import Training from '@/models/Training';
import mongoose from 'mongoose';

// Add dynamic directive to ensure route is dynamic
export const dynamic = 'force-dynamic';

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
    
    // Parse request body
    const body = await request.json();
    const { trainingId, userId, score } = body;
    
    if (!trainingId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Training ID and User ID are required' },
        { status: 400 }
      );
    }
    
    // Validate that IDs are valid ObjectIds
    if (!mongoose.Types.ObjectId.isValid(trainingId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }
    
    // Find the training registration
    const registration = await TrainingRegistration.findOne({
      trainingId,
      userId
    });
    
    if (!registration) {
      return NextResponse.json(
        { success: false, error: 'Registration not found' },
        { status: 404 }
      );
    }
    
    // Update the registration status to completed
    registration.status = 'completed';
    registration.completionDate = new Date();
    
    // Add performance score if provided
    if (score !== undefined) {
      if (!registration.performance) {
        registration.performance = {};
      }
      registration.performance.score = score;
    }
    
    await registration.save();
    
    // Also update the training status if all attendees have completed
    const training = await Training.findById(trainingId);
    if (training) {
      const now = new Date();
      if (training.endDate <= now && training.status !== 'completed') {
        training.status = 'completed';
        await training.save();
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Training marked as completed for user',
      data: {
        trainingId,
        userId,
        completionDate: registration.completionDate,
        status: registration.status
      }
    });
    
  } catch (error: any) {
    console.error('Error marking training as completed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error marking training as completed' },
      { status: 500 }
    );
  }
} 