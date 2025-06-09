import { NextRequest, NextResponse } from 'next/server';
import { ensureDbConnection } from '@/utils/dbConnect';
import { verifyJWT } from '@/utils/auth';
import { ObjectId } from 'mongodb';

/**
 * POST handler to mark a training as completed for a user
 * 
 * @param {NextRequest} req - The request object
 * @returns {NextResponse} - The response object
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication token is required' },
        { status: 401 }
      );
    }

    const decodedToken = await verifyJWT(token);
    if (!decodedToken) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Get request body
    const { trainingId, userId, completionDate, performanceScore } = await req.json();

    if (!trainingId) {
      return NextResponse.json(
        { success: false, error: 'Training ID is required' },
        { status: 400 }
      );
    }

    // Use the authenticated user's ID if userId is not provided
    const targetUserId = userId || decodedToken.userId;

    // Get the database connection
    const db = await ensureDbConnection();
    
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Check if the training exists
    const training = await db.collection('trainings').findOne({
      _id: new ObjectId(trainingId)
    });

    if (!training) {
      return NextResponse.json(
        { success: false, error: 'Training not found' },
        { status: 404 }
      );
    }

    // Check if the user exists
    const user = await db.collection('users').findOne({
      _id: new ObjectId(targetUserId)
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if the user is already registered for this training
    const existingRegistration = await db.collection('trainingregistrations').findOne({
      trainingId: new ObjectId(trainingId),
      userId: new ObjectId(targetUserId)
    });

    let registrationId;
    
    if (existingRegistration) {
      // Update existing registration to mark as completed
      registrationId = existingRegistration._id;
      
      await db.collection('trainingregistrations').updateOne(
        { _id: existingRegistration._id },
        { 
          $set: { 
            status: 'completed',
            completionDate: completionDate || new Date().toISOString(),
            performanceScore: performanceScore || null,
            updatedAt: new Date().toISOString()
          } 
        }
      );
    } else {
      // Create a new registration with completed status
      const result = await db.collection('trainingregistrations').insertOne({
        trainingId: new ObjectId(trainingId),
        userId: new ObjectId(targetUserId),
        status: 'completed',
        registrationDate: new Date().toISOString(),
        completionDate: completionDate || new Date().toISOString(),
        performanceScore: performanceScore || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      registrationId = result.insertedId;
    }

    // Also update the training's attendees list if needed
    await db.collection('trainings').updateOne(
      { _id: new ObjectId(trainingId) },
      { 
        $addToSet: { 
          attendees: {
            userId: new ObjectId(targetUserId),
            status: 'completed',
            registrationDate: existingRegistration?.registrationDate || new Date().toISOString(),
            completionDate: completionDate || new Date().toISOString()
          }
        }
      }
    );

    // Get the updated registration
    const updatedRegistration = await db.collection('trainingregistrations').findOne({
      _id: new ObjectId(registrationId)
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Training marked as completed successfully',
        registration: updatedRegistration
      }
    });
  } catch (error) {
    console.error('Error marking training as completed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark training as completed' },
      { status: 500 }
    );
  }
} 