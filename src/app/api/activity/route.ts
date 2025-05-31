import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import { verifyJWT } from '@/utils/auth';
import mongoose, { Model } from 'mongoose';

// Define activity schema interface
interface IActivity {
  type: 'personnel' | 'document' | 'training' | 'system';
  action: string;
  details: string;
  userId?: mongoose.Types.ObjectId;
  user?: string;
  timestamp: Date;
}

// Create a schema for activity logs if one doesn't already exist
let Activity: Model<IActivity>;
try {
  Activity = mongoose.model<IActivity>('Activity');
} catch {
  const ActivitySchema = new mongoose.Schema({
    type: {
      type: String,
      enum: ['personnel', 'document', 'training', 'system'],
      required: true
    },
    action: {
      type: String,
      required: true
    },
    details: {
      type: String,
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    user: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  });
  
  Activity = mongoose.model<IActivity>('Activity', ActivitySchema);
}

/**
 * GET handler to retrieve recent activities
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
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const type = searchParams.get('type');
    
    // Build query
    const query: any = {};
    
    if (type) {
      query.type = type;
    }
    
    // Get activities with pagination
    const skip = (page - 1) * limit;
    const activities = await Activity.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count for pagination
    const total = await Activity.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      data: {
        activities,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error fetching activities' },
      { status: 500 }
    );
  }
}

/**
 * POST handler to log a new activity
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
    
    // Validate required fields
    if (!data.type || !data.action || !data.details) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type, action, details' },
        { status: 400 }
      );
    }
    
    // Create a new activity log
    const activity = new Activity({
      type: data.type,
      action: data.action,
      details: data.details,
      userId: decoded.userId,
      user: decoded.userId, // Just use the userId since we don't have name or email in the decoded token
      timestamp: new Date()
    });
    
    await activity.save();
    
    return NextResponse.json({
      success: true,
      data: {
        activity
      }
    });
  } catch (error: any) {
    console.error('Error logging activity:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error logging activity' },
      { status: 500 }
    );
  }
} 