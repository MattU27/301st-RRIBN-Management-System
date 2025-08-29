import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/utils/dbConnect';
import Training from '@/models/Training';
import TrainingRegistration from '@/models/TrainingRegistration';
import Personnel from '@/models/Personnel';
import { verifyJWT } from '@/utils/auth';

// Add dynamic directive to ensure route is dynamic
export const dynamic = 'force-dynamic';

/**
 * GET handler to fetch past trainings for the authenticated user
 * This endpoint ensures only the session user's past trainings are returned
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

    // Get user ID from session (this is the key fix)
    const sessionUserId = decoded.userId;
    
    // Log session information for debugging
    console.log('🔍 USER PAST TRAININGS API CALL:');
    console.log('  - Session User ID:', sessionUserId);
    console.log('  - Request Time:', new Date().toISOString());
    console.log('  - User Agent:', request.headers.get('user-agent'));
    
    if (!sessionUserId) {
      console.log('❌ No user ID found in session');
      return NextResponse.json(
        { success: false, error: 'User ID not found in session' },
        { status: 400 }
      );
    }

    // Validate that sessionUserId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(sessionUserId)) {
      console.log('❌ Invalid user ID format in session:', sessionUserId);
      return NextResponse.json(
        { success: false, error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Get user details from personnel collection
    const user = await Personnel.findById(sessionUserId).lean() as any;
    
    if (!user) {
      console.log('❌ User not found in personnel collection:', sessionUserId);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('✅ User found:', {
      id: user._id,
      name: user.name,
      email: user.email,
      rank: user.rank,
      company: user.company
    });

    // Find all completed training registrations for this specific user
    console.log('📊 Querying training registrations for user:', sessionUserId);
    
    // Log the exact MongoDB query being executed
    const query = {
      userId: sessionUserId,
      status: 'completed'
    };
    console.log('🔍 EXECUTED QUERY:');
    console.log('  Collection: trainingregistrations');
    console.log('  Query:', JSON.stringify(query, null, 2));
    console.log('  Equivalent SQL: SELECT * FROM trainingregistrations WHERE userId = "' + sessionUserId + '" AND status = "completed"');
    
    const registrations = await TrainingRegistration.find(query).lean();

    console.log('📊 Found training registrations:', registrations.length);

    // If no registrations found, return empty array (this is correct for new users)
    if (!registrations || registrations.length === 0) {
      console.log('✅ No past trainings found for user (correct for new accounts)');
      return NextResponse.json({
        success: true,
        data: {
          trainings: [],
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            rank: user.rank,
            company: user.company
          },
          summary: {
            totalPastTrainings: 0,
            message: 'No past trainings found for this user'
          }
        }
      });
    }

    // Extract training IDs from registrations
    const trainingIds = registrations.map(reg => reg.trainingId);
    
    console.log('📊 Training IDs found:', trainingIds.length);

    // Fetch the actual training details
    const trainingQuery = {
      _id: { $in: trainingIds }
    };
    console.log('🔍 EXECUTED QUERY 2:');
    console.log('  Collection: trainings');
    console.log('  Query:', JSON.stringify(trainingQuery, null, 2));
    console.log('  Training IDs:', trainingIds.map(id => id.toString()));
    console.log('  Equivalent SQL: SELECT * FROM trainings WHERE _id IN (' + trainingIds.map(id => '"' + id.toString() + '"').join(', ') + ')');
    
    const trainings = await Training.find(trainingQuery).lean();

    console.log('📊 Training details fetched:', trainings.length);

    // Merge training details with completion dates and performance scores from registrations
    const pastTrainings = trainings.map((training: any) => {
      // Find the matching registration to get completion date and performance score
      const registration = registrations.find(
        (reg: any) => reg.trainingId.toString() === training._id.toString()
      );
      
      return {
        ...training,
        completionDate: registration?.completionDate || training.endDate,
        performanceScore: registration?.performanceScore || null,
        registrationDate: registration?.registrationDate || null,
        registrationId: registration?._id || null
      };
    });

    // Sort by completion date (most recent first)
    pastTrainings.sort((a, b) => {
      const dateA = new Date(a.completionDate || a.endDate);
      const dateB = new Date(b.completionDate || b.endDate);
      return dateB.getTime() - dateA.getTime();
    });

    console.log('✅ Past trainings processed:', pastTrainings.length);

    // Return the past trainings with user information
    return NextResponse.json({
      success: true,
      data: {
        trainings: pastTrainings,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          rank: user.rank,
          company: user.company
        },
        summary: {
          totalPastTrainings: pastTrainings.length,
          message: `Found ${pastTrainings.length} past training(s) for ${user.name}`
        }
      }
    });
    
  } catch (error: any) {
    console.error('❌ Error fetching user past trainings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error fetching user past trainings' },
      { status: 500 }
    );
  }
}
