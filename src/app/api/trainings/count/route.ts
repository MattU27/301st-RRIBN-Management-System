import { NextResponse } from 'next/server';
import { dbConnect, isUsingLocalFallback, readLocalJSONCollection } from '@/utils/dbConnect';
import Training from '@/models/Training';
import TrainingRegistration from '@/models/TrainingRegistration';
import { verifyJWT } from '@/utils/auth';

// Add dynamic directive to ensure route is dynamic
export const dynamic = 'force-dynamic';

/**
 * GET handler to fetch accurate registration counts for trainings
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
    
    // Get URL parameters
    const url = new URL(request.url);
    const trainingId = url.searchParams.get('trainingId');
    
    // Process based on whether we're using local fallback or MongoDB
    if (isUsingLocalFallback()) {
      // Use local JSON files
      console.log('Using local JSON files for count data');
      
      // Get data from JSON files
      const trainingsData = await readLocalJSONCollection('trainings');
      const registrationsData = await readLocalJSONCollection('training_registrations');
      
      // Filter for specific training if trainingId is provided
      if (trainingId) {
        const training = trainingsData.find((t: any) => {
          const tId = t._id?.$oid || t._id;
          return tId === trainingId;
        });
        
        if (!training) {
          return NextResponse.json(
            { success: false, error: 'Training not found' },
            { status: 404 }
          );
        }
        
        // Count registrations for this training
        const registrations = registrationsData.filter((r: any) => {
          const rTrainingId = r.trainingId?.$oid || r.trainingId;
          return rTrainingId === trainingId;
        });
        
        // Return the count
        return NextResponse.json({
          success: true,
          data: {
            count: registrations.length,
            capacity: training.capacity || 0,
            percentage: training.capacity 
              ? Math.round((registrations.length / training.capacity) * 100) 
              : 0
          }
        });
      }
      
      // If no trainingId is provided, return counts for all trainings
      const trainingCounts = trainingsData.map((training: any) => {
        const tId = training._id?.$oid || training._id;
        
        // Count registrations for this training
        const registrations = registrationsData.filter((r: any) => {
          const rTrainingId = r.trainingId?.$oid || r.trainingId;
          return rTrainingId === tId;
        });
        
        return {
          trainingId: tId,
          title: training.title,
          registered: registrations.length,
          capacity: training.capacity || 0,
          percentage: training.capacity 
            ? Math.round((registrations.length / training.capacity) * 100) 
            : 0
        };
      });
      
      return NextResponse.json({
        success: true,
        data: {
          counts: trainingCounts
        }
      });
      
    } else {
      // Use MongoDB
      
      // If trainingId is provided, return count for specific training
      if (trainingId) {
        // Find the training
        const training = await Training.findById(trainingId);
        
        if (!training) {
          return NextResponse.json(
            { success: false, error: 'Training not found' },
            { status: 404 }
          );
        }
        
        // Count registrations
        const count = await TrainingRegistration.countDocuments({ trainingId });
        
        // Update the training's registered count if it's different
        if (training.registered !== count) {
          training.registered = count;
          await training.save();
        }
        
        // Return the count
        return NextResponse.json({
          success: true,
          data: {
            count,
            capacity: training.capacity || 0,
            percentage: training.capacity 
              ? Math.round((count / training.capacity) * 100) 
              : 0
          }
        });
      }
      
      // If no trainingId is provided, return counts for all trainings
      const trainings = await Training.find().select('_id title capacity registered').lean();
      
      // Aggregate registrations by trainingId
      const aggregatedCounts = await TrainingRegistration.aggregate([
        { $group: { _id: "$trainingId", count: { $sum: 1 } } }
      ]);
      
      // Create a map of counts by training ID
      const countsMap = new Map();
      aggregatedCounts.forEach(item => {
        countsMap.set(item._id.toString(), item.count);
      });
      
      // Prepare response data
      const trainingCounts = await Promise.all(trainings.map(async (training: any) => {
        const trainingId = training._id.toString();
        const count = countsMap.get(trainingId) || 0;
        
        // Update the training's registered count if it's different
        if (training.registered !== count) {
          await Training.findByIdAndUpdate(trainingId, { registered: count });
        }
        
        return {
          trainingId,
          title: training.title,
          registered: count,
          capacity: training.capacity || 0,
          percentage: training.capacity 
            ? Math.round((count / training.capacity) * 100) 
            : 0
        };
      }));
      
      return NextResponse.json({
        success: true,
        data: {
          counts: trainingCounts
        }
      });
    }
    
  } catch (error: any) {
    console.error('Error fetching registration counts:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error fetching registration counts' },
      { status: 500 }
    );
  }
} 