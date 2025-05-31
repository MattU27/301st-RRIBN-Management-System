import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/utils/dbConnect';
import Training from '@/models/Training';
import TrainingRegistration from '@/models/TrainingRegistration';  
import User from '@/models/User';
import { verifyJWT } from '@/utils/auth';

// Add dynamic directive to ensure route is dynamic
export const dynamic = 'force-dynamic';

// Define a type for user data to help with type checking
interface UserData {
  firstName?: string;
  lastName?: string;
  rank?: string;
  company?: string;
  email?: string;
  militaryId?: string;
  serviceId?: string;
  [key: string]: any;
}

// Define an interface for attendee records
interface AttendeeRecord {
  userId: string | mongoose.Types.ObjectId;
  status?: string;
  registrationDate?: Date;
  userData?: UserData;
  [key: string]: any;
}

// Define a type for the training document
interface TrainingDocument {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  registered: number;
  capacity: number;
  attendees?: AttendeeRecord[];
  [key: string]: any;
}

/**
 * GET handler to fetch personnel data for a training
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
    
    // Get training ID from URL
    const url = new URL(request.url);
    const trainingId = url.searchParams.get('trainingId');
    
    if (!trainingId) {
      return NextResponse.json(
        { success: false, error: 'Training ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`Fetching personnel data for training ID: ${trainingId}`);
    
    // Find the training
    const training = await Training.findById(trainingId).lean() as any;
    
    if (!training) {
      console.log(`Training with ID ${trainingId} not found`);
      return NextResponse.json(
        { success: false, error: 'Training not found' },
        { status: 404 }
      );
    }
    
    console.log(`Found training: ${training.title}, Registered count: ${training.registered || 0}`);
    console.log(`Attendees in training doc: ${training.attendees?.length || 0}`);
    
    // Get attendees - first from the training document, then from the registrations collection
    let allRegistrations: AttendeeRecord[] = [];
    
    // Step 1: Try to get attendees from the training document's attendees array
    if (training.attendees && training.attendees.length > 0) {
      console.log('Getting attendees from training.attendees array');
      allRegistrations = [...training.attendees];
    }
    
    // Step 2: Try to get registrations from the TrainingRegistration collection
    try {
      console.log('Querying training_registrations collection directly');
      const registrationDocs = await TrainingRegistration.find({ 
        trainingId: mongoose.Types.ObjectId.createFromHexString(trainingId) 
      }).lean();
      
      console.log(`Found ${registrationDocs.length} registrations in the training_registrations collection`);
      
      // Map the registration docs to the format we need
      const mappedRegistrations = registrationDocs.map(reg => ({
        userId: reg.userId,
        status: reg.status || 'registered',
        registrationDate: reg.registrationDate || reg.createdAt || new Date(),
      }));
      
      // Add any registrations not already in allRegistrations
      const existingUserIds = new Set(allRegistrations.map(r => 
        r.userId?.toString ? r.userId.toString() : String(r.userId)));
      
      for (const reg of mappedRegistrations) {
        const regUserId = reg.userId?.toString ? reg.userId.toString() : String(reg.userId);
        if (!existingUserIds.has(regUserId)) {
          console.log(`Adding registration for userId ${regUserId} from registrations collection`);
          allRegistrations.push(reg);
          existingUserIds.add(regUserId);
        }
      }
    } catch (error) {
      console.error('Error fetching from training_registrations collection:', error);
      // Continue with whatever registrations we have
    }
    
    console.log(`Total registrations after combining sources: ${allRegistrations.length}`);
    
    // If we still have no registrations but training.registered > 0, add a fallback
    if (allRegistrations.length === 0 && training.registered > 0) {
      console.log(`Creating fallback registration entries for ${training.registered} registered users`);
      // Create a fallback entry for each registered count
      for (let i = 0; i < training.registered; i++) {
        allRegistrations.push({
          userId: `fallback-${i}`,
          status: 'registered',
          registrationDate: new Date(),
          userData: {
            firstName: 'Mobile',
            lastName: `User ${i+1}`,
            fullName: `Mobile User ${i+1}`,
            rank: '',
            company: '',
            serviceId: '',
            militaryId: ''
          }
        });
      }
    }
    
    // Process attendees to include complete personnel information
    const processedAttendees = await Promise.all(allRegistrations.map(async (attendee) => {
      // Default status
      let status = attendee.status || 'registered';
      
      // Get user data (either from userData or userId)
      let userData = attendee.userData || {};
      
      // Get userId, handling different possible formats
      let userId;
      if (typeof attendee.userId === 'object' && attendee.userId !== null) {
        // Handle mongoose ObjectId or object with _id property
        userId = (attendee.userId as any)._id || attendee.userId;
        } else {
        userId = attendee.userId;
      }
      
      console.log(`Processing attendee with userId: ${userId}`);
      
      // Try to get user data if we have a userId
      if (userId && !userData.firstName && !userData.lastName) {
          try {
          const userIdStr = userId.toString ? userId.toString() : String(userId);
          console.log(`Looking up user data for ID: ${userIdStr}`);
          
          // Skip lookup for fallback IDs
          if (!userIdStr.startsWith('fallback-')) {
            // First try to find user in User collection
            const user = await User.findById(userIdStr).lean() as any;
            
            if (user) {
              console.log(`Found user in Users collection: ${user.firstName || ''} ${user.lastName || ''}`);
              
              // Enhanced service ID lookup - check several possible field names
              const serviceId = user.serviceId || user.militaryId || user.serialNumber || user.serviceNumber || '';
              console.log(`Found service ID: ${serviceId}`);
              
              userData = {
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                rank: user.rank || '',
                company: user.company || '',
                email: user.email || '',
                serviceId: serviceId,
                militaryId: serviceId // Also set militaryId for compatibility
              };
            } else {
              // If not found in User collection, try the personnels collection
              console.log(`User not found in Users, checking personnels collection for ID: ${userIdStr}`);
              try {
                // Ensure db connection is available
                if (!mongoose.connection || !mongoose.connection.db) {
                  throw new Error('Database connection not available');
                }
                
                const personnel = await mongoose.connection.db.collection('personnels').findOne({ 
                  _id: mongoose.Types.ObjectId.isValid(userIdStr) ? 
                    mongoose.Types.ObjectId.createFromHexString(userIdStr) : userIdStr 
                });
                
                if (personnel) {
                  console.log(`Found personnel: ${personnel.firstName || ''} ${personnel.lastName || ''}`);
                  
                  // Enhanced service ID lookup for personnels collection
                  const serviceId = personnel.serviceId || personnel.serialNumber || personnel.serviceNumber || 
                                   personnel.militaryId || personnel.afpSerialNumber || '';
                  console.log(`Found service ID: ${serviceId}`);
                  
                  userData = {
                    firstName: personnel.firstName || '',
                    lastName: personnel.lastName || '',
                    fullName: `${personnel.firstName || ''} ${personnel.lastName || ''}`.trim(),
                    rank: personnel.rank || '',
                    company: personnel.company || personnel.unit || '',
                    email: personnel.email || '',
                    serviceId: serviceId,
                    militaryId: serviceId // Also set militaryId for compatibility
                  };
                } else {
                  // If personnel not found, try searching by different field patterns
                  console.log(`Personnel not found by ID, attempting secondary searches`);
                  
                  // Try to find personnel by using the user ID as the service number
                  const secondaryPersonnel = await mongoose.connection.db.collection('personnels').findOne({
                    $or: [
                      { serviceId: userIdStr },
                      { serialNumber: userIdStr },
                      { militaryId: userIdStr }
                    ]
                  });
                  
                  if (secondaryPersonnel) {
                    console.log(`Found personnel through secondary search: ${secondaryPersonnel.firstName || ''} ${secondaryPersonnel.lastName || ''}`);
                    
                    const serviceId = secondaryPersonnel.serviceId || secondaryPersonnel.serialNumber || 
                                     secondaryPersonnel.militaryId || secondaryPersonnel.serviceNumber || userIdStr;
                    
                    userData = {
                      firstName: secondaryPersonnel.firstName || '',
                      lastName: secondaryPersonnel.lastName || '',
                      fullName: `${secondaryPersonnel.firstName || ''} ${secondaryPersonnel.lastName || ''}`.trim(),
                      rank: secondaryPersonnel.rank || '',
                      company: secondaryPersonnel.company || secondaryPersonnel.unit || '',
                      email: secondaryPersonnel.email || '',
                      serviceId: serviceId,
                      militaryId: serviceId
                    };
                  } else {
                    console.log(`Personnel not found for ID: ${userIdStr}, using userId as identifier`);
                    userData = {
                      firstName: 'User',
                      lastName: `${userIdStr.substring(0, 6)}`,
                      fullName: `User ${userIdStr.substring(0, 6)}`,
                      rank: '',
                      company: '',
                      email: '',
                      serviceId: userIdStr, // Use userId as serviceId
                      militaryId: userIdStr
                    };
                  }
                }
              } catch (err) {
                console.error(`Error fetching from personnels collection:`, err);
                userData = {
                  firstName: 'User',
                  lastName: `${userIdStr.substring(0, 6)}`,
                  fullName: `User ${userIdStr.substring(0, 6)}`,
                  rank: '',
                  company: '',
                  email: '',
                  serviceId: userIdStr, // Use userId as serviceId
                  militaryId: userIdStr
                };
              }
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
      
      // Return processed attendee with updated status and userData
      return {
        ...attendee,
        status,
        userData: {
          ...userData,
          fullName: userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Personnel'
        }
      };
    }));
    
    console.log(`Processed ${processedAttendees.length} attendees`);
    
    // Filter out duplicate entries based on userId
    const uniqueAttendees = [];
    const seenUserIds = new Set();
    
    for (const attendee of processedAttendees) {
      // Handle different possible formats of userId
      let userId;
      if (typeof attendee.userId === 'object' && attendee.userId !== null) {
        userId = attendee.userId._id || attendee.userId;
      } else {
        userId = attendee.userId;
      }
      
      // Skip if userId is missing
      if (!userId) {
        console.log(`Skipping attendee with missing userId`);
        continue;
      }
      
      // Skip if this is a duplicate
      const userIdStr = userId.toString ? userId.toString() : String(userId);
      if (seenUserIds.has(userIdStr)) {
        console.log(`Skipping duplicate attendee with userId: ${userIdStr}`);
        continue;
      }
      
      // Add the attendee
      seenUserIds.add(userIdStr);
      uniqueAttendees.push(attendee);
    }
    
    console.log(`Final unique attendees: ${uniqueAttendees.length}`);
    
    // Return the processed attendees
    return NextResponse.json({
      success: true,
      data: {
        attendees: uniqueAttendees
      }
    });
  } catch (error: unknown) {
    console.error('Error fetching training personnel:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error fetching training personnel';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 