import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect, isUsingLocalFallback, readLocalJSONCollection } from '@/utils/dbConnect';
import Training from '@/models/Training';
import TrainingRegistration from '@/models/TrainingRegistration';
import User from '@/models/User';
import { verifyJWT } from '@/utils/auth';

// Add dynamic directive to ensure route is dynamic
export const dynamic = 'force-dynamic';

/**
 * GET handler to fetch registrations for a specific training
 */
export async function GET(
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
    
    const { trainingId } = params;
    
    if (!trainingId) {
      return NextResponse.json(
        { success: false, error: 'Training ID is required' },
        { status: 400 }
      );
    }
    
    // Find the training to verify it exists
    const training = await Training.findById(trainingId);
    
    if (!training) {
      return NextResponse.json(
        { success: false, error: 'Training not found' },
        { status: 404 }
      );
    }
    
    // Get registrations for this training
    let registrations = [];
    
    if (isUsingLocalFallback()) {
      // Use local JSON files
      console.log('Using local JSON files for registrations data');
      
      // Get registrations from local JSON
      const allRegistrations = await readLocalJSONCollection('training_registrations');
      
      // Filter for this training
      registrations = allRegistrations.filter((registration: any) => {
        const regTrainingId = registration.trainingId?.$oid || registration.trainingId;
        return regTrainingId === trainingId;
      });
      
    } else {
      // Use MongoDB
      registrations = await TrainingRegistration.find({ trainingId }).lean();
    }
    
    // Return the registrations
    return NextResponse.json({
      success: true,
      data: {
        count: registrations.length,
        registrations
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching training registrations:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error fetching training registrations' },
      { status: 500 }
    );
  }
}

/**
 * POST handler to register for a training using the new TrainingRegistration model
 */
export async function POST(
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
    
    const { trainingId } = params;
    
    if (!trainingId) {
      return NextResponse.json(
        { success: false, error: 'Training ID is required' },
        { status: 400 }
      );
    }
    
    // Get data from request body
    const data = await request.json();
    const { action } = data; // action can be 'register' or 'cancel'
    
    if (!action || !['register', 'cancel'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Valid action (register or cancel) is required' },
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
    
    // Get user info
    const user = await User.findById(decoded.userId, 'firstName lastName rank company email militaryId serviceId');
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if user is already registered
    const existingRegistration = await TrainingRegistration.findOne({
      trainingId,
      userId: decoded.userId
    });
    
    // Process based on action
    if (action === 'register') {
      // Check if already registered
      if (existingRegistration) {
        return NextResponse.json(
          { success: false, error: 'You are already registered for this training' },
          { status: 400 }
        );
      }
      
      // Check capacity
      const currentRegistrations = await TrainingRegistration.countDocuments({ trainingId });
      
      if (training.capacity && currentRegistrations >= training.capacity) {
        return NextResponse.json(
          { success: false, error: 'Training has reached maximum capacity' },
          { status: 400 }
        );
      }
      
      // Create registration
      const registration = new TrainingRegistration({
        trainingId,
        userId: decoded.userId,
        status: 'registered',
        registrationDate: new Date(),
        userData: {
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: `${user.firstName} ${user.lastName}`,
          rank: user.rank || '',
          company: user.company || '',
          email: user.email || '',
          militaryId: user.militaryId || user.serviceId || ''
        }
      });
      
      // Save registration
      await registration.save();
      
      // Add to training's attendees list
      if (!training.attendees) {
        training.attendees = [];
      }
      
      // Add user to attendees list
      training.attendees.push({
        userId: decoded.userId,
        status: 'registered',
        registrationDate: new Date(),
        userData: {
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: `${user.firstName} ${user.lastName}`,
          rank: user.rank || '',
          company: user.company || '',
          email: user.email || '',
          militaryId: user.militaryId || user.serviceId || ''
        }
      });
      
      // Update training's registered count
      const newCount = await TrainingRegistration.countDocuments({ trainingId });
      training.registered = newCount;
      await training.save();
      
      return NextResponse.json({
        success: true,
        data: {
          registration,
          message: 'Successfully registered for training'
        }
      });
      
    } else if (action === 'cancel') {
      // Check if registration exists
      if (!existingRegistration) {
        return NextResponse.json(
          { success: false, error: 'You are not registered for this training' },
          { status: 400 }
        );
      }
      
      // Delete registration
      await TrainingRegistration.deleteOne({
        trainingId,
        userId: decoded.userId
      });
      
      // Update training's registered count
      const newCount = await TrainingRegistration.countDocuments({ trainingId });
      training.registered = newCount;
      await training.save();
      
      return NextResponse.json({
        success: true,
        data: {
          message: 'Successfully cancelled registration'
        }
      });
    }
    
  } catch (error: any) {
    console.error('Error processing training registration:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error processing training registration' },
      { status: 500 }
    );
  }
} 