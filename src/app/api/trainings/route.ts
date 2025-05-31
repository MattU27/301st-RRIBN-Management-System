import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect, isUsingLocalFallback, readLocalJSONCollection } from '@/utils/dbConnect';
import Training from '@/models/Training';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import { verifyJWT } from '@/utils/auth';
import { TrainingStatus } from '@/models/Training';

// Add dynamic directive to ensure route is dynamic
export const dynamic = 'force-dynamic';

/**
 * GET handler to fetch trainings
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
    
    let trainings = [];
    let user = null;
    let allUsers = [];
    
    if (isUsingLocalFallback()) {
      // Use local JSON files if we're in fallback mode
      console.log('Using local JSON files for trainings data');
      
      // Get trainings and users from local JSON
      trainings = await readLocalJSONCollection('trainings');
      allUsers = await readLocalJSONCollection('personnels');
      
      // Find current user
      user = allUsers.find((u: any) => u._id.$oid === decoded.userId);
      
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found in local database' },
          { status: 404 }
        );
      }
    } else {
      // Use MongoDB normally
      // Get all trainings
      trainings = await Training.find({})
        .populate('attendees.userId', 'firstName lastName rank company email militaryId serviceId')
        .lean();
      
      console.log(`Found ${trainings.length} trainings`);
      
      // Get user info for attendee filtering and logging
      user = await User.findById(decoded.userId, 'firstName lastName role rank company');
      
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }
      
      // Log for debugging
      console.log(`User found: ${user.firstName} ${user.lastName}`, {
        id: user._id,
        role: user.role,
        rank: user.rank,
        company: user.company
      });
      
      // Check if there are any trainings in the system at all
      const totalTrainings = await Training.countDocuments({});
      console.log(`Total trainings in database: ${totalTrainings}`);
      
      if (totalTrainings === 0) {
        console.log('No trainings exist in the database. Consider seeding data.');
      }
    }
    
    // Process trainings to add registration status and format attendee data
    const processedTrainings = trainings.map((training: any) => {
      const attendees = training.attendees || [];
      
      // Find if current user is registered for this training
      let userAttendee = null;
      
      if (isUsingLocalFallback()) {
        // For local JSON file structure
        userAttendee = attendees.find((attendee: any) => {
          const attendeeUserId = attendee.userId?.$oid || attendee.userId;
          return attendeeUserId === decoded.userId;
        });
      } else {
        // For MongoDB structure
        userAttendee = attendees.find((attendee: any) => {
          const attendeeUserId = attendee.userId?._id?.toString() || attendee.userId?.toString();
          return attendeeUserId === decoded.userId;
        });
      }
      
      // Set registration status based on user attendance
      let registrationStatus = 'not_registered';
      if (userAttendee) {
        registrationStatus = userAttendee.status || 'registered';
      }
      
      // Build the training object with registration status
      return {
        ...training,
        registrationStatus
      };
    });
    
    // Always return all trainings regardless of user role - administrators and directors should see everything
    // We'll let the frontend handle role-specific filtering if needed
    
    return NextResponse.json({
      success: true,
      data: {
        trainings: processedTrainings
      }
    });
  } catch (error: any) {
    console.error('Error fetching trainings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error fetching trainings' },
      { status: 500 }
    );
  }
}

/**
 * POST handler to register for a training
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
    
    // Get data from request body
    const data = await request.json();
    const { trainingId, action } = data;
    
    if (!trainingId) {
      return NextResponse.json(
        { success: false, error: 'Training ID is required' },
        { status: 400 }
      );
    }
    
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
    
    // Get user info for audit log
    const user = await User.findById(decoded.userId, 'firstName lastName role');
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if training is upcoming or ongoing
    if (training.status === TrainingStatus.COMPLETED || training.status === TrainingStatus.CANCELLED) {
      return NextResponse.json(
        { success: false, error: 'Cannot register for completed or cancelled trainings' },
        { status: 400 }
      );
    }
    
    const userId = new mongoose.Types.ObjectId(decoded.userId);
    
    // Check if user is already registered
    const attendeeIndex = training.attendees?.findIndex(
      (attendee: { userId: mongoose.Types.ObjectId | string }) => 
        attendee.userId.toString() === decoded.userId
    );
    
    let actionTaken = '';
    
    if (action === 'register') {
      // Check capacity
      if (training.capacity && training.attendees && training.attendees.length >= training.capacity) {
        return NextResponse.json(
          { success: false, error: 'Training has reached maximum capacity' },
          { status: 400 }
        );
      }
      
      // Determine the appropriate status based on training dates
      const now = new Date();
      const startDate = new Date(training.startDate);
      const endDate = new Date(training.endDate);
      
      // For upcoming trainings, the status should always be 'registered'
      // For ongoing trainings, it can be 'attended'
      // For completed trainings, it should be 'completed'
      let registrationStatus = 'registered';
      
      // Set both dates to start of day for accurate comparison
      const nowDate = new Date(now.setHours(0, 0, 0, 0));
      const trainingEndDate = new Date(endDate.setHours(23, 59, 59, 999)); // End of the day
      
      if (startDate <= now && trainingEndDate >= now) {
        // Training is ongoing
        registrationStatus = 'registered'; // Default for registration is still 'registered'
      } else if (trainingEndDate < nowDate) {
        // Training is completed, so they can't really register
        return NextResponse.json(
          { success: false, error: 'Cannot register for past trainings' },
          { status: 400 }
        );
      }
      
      // Register user
      if (attendeeIndex !== undefined && attendeeIndex >= 0) {
        // User is already registered, update their status
        training.attendees[attendeeIndex].status = registrationStatus;
        actionTaken = 'updated registration for';
      } else {
        // Add user to attendees
        if (!training.attendees) {
          training.attendees = [];
        }
        
        // Get more user details for storing with the attendee record
        const userDetails = await User.findById(decoded.userId, 'firstName lastName rank company email militaryId serviceId');
        
        training.attendees.push({
          userId,
          status: registrationStatus,
          registrationDate: new Date(),
          // Store user data directly with the attendee record for easier access
          userData: {
            firstName: userDetails.firstName,
            lastName: userDetails.lastName,
            fullName: `${userDetails.firstName} ${userDetails.lastName}`,
            rank: userDetails.rank || '',
            company: userDetails.company || '',
            email: userDetails.email || '',
            militaryId: userDetails.militaryId || userDetails.serviceId || ''
          }
        });
        actionTaken = 'registered for';
      }
    } else if (action === 'cancel') {
      // Cancel registration
      if (attendeeIndex !== undefined && attendeeIndex >= 0) {
        // Remove from attendees array
        training.attendees.splice(attendeeIndex, 1);
        actionTaken = 'cancelled registration for';
      } else {
        return NextResponse.json(
          { success: false, error: 'User is not registered for this training' },
          { status: 400 }
        );
      }
    }
    
    // Save the updated training
    await training.save();
    
    // Update the registered count to match the actual number of valid attendees
    // Count only attendees with a valid status
    const validAttendees = training.attendees ? training.attendees.filter((attendee: { 
      userId: mongoose.Types.ObjectId | string;
      status?: string;
    }) => 
      attendee && attendee.userId && 
      (!attendee.status || attendee.status === 'registered' || 
       attendee.status === 'attended' || attendee.status === 'completed')
    ) : [];
    
    training.registered = validAttendees.length;
    await training.save();
    
    // Create audit log entry
    try {
      const auditLog = new AuditLog({
        timestamp: new Date(),
        userId: decoded.userId,
        userName: `${user.firstName} ${user.lastName}`,
        userRole: user.role,
        action: action === 'register' ? 'register' : 'cancel',
        resource: 'training',
        resourceId: training._id,
        details: `${actionTaken} training: ${training.title}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      });
      
      await auditLog.save();
      console.log(`Training ${action} action logged to audit system`);
    } catch (auditError) {
      // Don't fail the main operation if audit logging fails
      console.error('Error logging to audit system:', auditError);
    }
    
    // Return the updated training
    return NextResponse.json({
      success: true,
      data: {
        training: {
          ...training.toObject(),
          registrationStatus: action === 'register' ? 'registered' : 'not_registered'
        }
      }
    });
  } catch (error: any) {
    console.error('Error updating training registration:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error updating training registration' },
      { status: 500 }
    );
  }
}

// Helper function to extract first and last name from email
function extractNameFromEmail(email: string): { firstName: string, lastName: string } | null {
  try {
    // Format: firstname.lastname@domain.com
    const localPart = email.split('@')[0];
    if (!localPart) return null;
    
    const nameParts = localPart.split('.');
    if (nameParts.length < 2) return null;
    
    // Convert to title case
    const firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
    const lastName = nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1);
    
    return { firstName, lastName };
  } catch (e) {
    return null;
  }
} 