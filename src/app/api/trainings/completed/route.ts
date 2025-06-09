import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import { verifyJWT } from '@/utils/auth';
import TrainingRegistration, { ITrainingRegistration } from '@/models/TrainingRegistration';
import Training, { ITraining } from '@/models/Training';
import mongoose from 'mongoose';

// Add dynamic directive to ensure route is dynamic
export const dynamic = 'force-dynamic';

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
    
    // Parse URL to get query parameters
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Validate that userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID format' },
        { status: 400 }
      );
    }
    
    // Find all completed training registrations for the user
    const registrations = await TrainingRegistration.find({
      userId: userId,
      status: 'completed'
    }).lean();
    
    // If no registrations found, return empty array
    if (!registrations || registrations.length === 0) {
      return NextResponse.json({
        success: true,
        trainings: []
      });
    }
    
    // Extract training IDs from registrations
    const trainingIds = registrations.map(reg => reg.trainingId);
    
    // Fetch the actual training details
    const trainings = await Training.find({
      _id: { $in: trainingIds }
    }).lean();
    
    // Merge training details with completion dates from registrations
    const completedTrainings = trainings.map((training: any) => {
      // Find the matching registration to get completion date
      const registration = registrations.find(
        (reg: any) => reg.trainingId.toString() === training._id.toString()
      );
      
      return {
        ...training,
        completionDate: registration?.completionDate || training.endDate
      };
    });
    
    // Return the completed trainings
    return NextResponse.json({
      success: true,
      trainings: completedTrainings
    });
    
  } catch (error: any) {
    console.error('Error fetching completed trainings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error fetching completed trainings' },
      { status: 500 }
    );
  }
} 