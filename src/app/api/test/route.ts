import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import User from '@/models/User';
import Document from '@/models/Document';
import Training from '@/models/Training';

/**
 * GET handler to test MongoDB connection and data
 */
export async function GET() {
  try {
    // Connect to MongoDB
    await dbConnect();
    
    // Get count of records in each collection
    const userCount = await User.countDocuments();
    const documentCount = await Document.countDocuments();
    const trainingCount = await Training.countDocuments();
    
    // Get one sample from each collection
    const sampleUser = await User.findOne().select('-password');
    const sampleDocument = await Document.findOne();
    const sampleTraining = await Training.findOne();
    
    // Return the results
    return NextResponse.json({
      success: true,
      message: 'MongoDB connection successful',
      data: {
        counts: {
          users: userCount,
          documents: documentCount,
          trainings: trainingCount,
        },
        samples: {
          user: sampleUser,
          document: sampleDocument,
          training: sampleTraining,
        },
      },
    });
  } catch (error: any) {
    console.error('MongoDB test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error connecting to MongoDB',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 