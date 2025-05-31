import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Announcement from '@/models/Announcement';
import { verifyJWT } from '@/utils/auth';
import mongoose from 'mongoose';

// GET /api/announcements - List all announcements with filtering
export async function GET(req: NextRequest) {
  try {
    // Verify authentication token
    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication token is required' },
        { status: 401 }
      );
    }

    const decoded = await verifyJWT(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Parse query parameters
    const url = new URL(req.url);
    const status = url.searchParams.get('status') || 'published';
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const page = parseInt(url.searchParams.get('page') || '1');
    const sort = url.searchParams.get('sort') || '-createdAt'; // Default sort by newest
    const company = url.searchParams.get('company') || null;
    const role = url.searchParams.get('role') || null;

    console.log(`API: Fetching announcements with status: ${status}`); // Debug log

    // Build query
    const query: any = {};
    
    // Status filter
    if (status !== 'all') {
      query.status = status;
    }
    
    // Company filter
    if (company) {
      query.$or = [
        { targetCompanies: null }, // targeted to all companies
        { targetCompanies: { $in: [new mongoose.Types.ObjectId(company)] } } // targeted to this company
      ];
    }
    
    // Role filter
    if (role) {
      query.$or = query.$or || [];
      query.$or.push(
        { targetRoles: null }, // targeted to all roles
        { targetRoles: { $in: [role] } } // targeted to this role
      );
    }
    
    // Limit announcements to current and non-expired ones if viewing published
    if (status === 'published') {
      const now = new Date();
      query.publishDate = { $lte: now };
      query.$or = query.$or || [];
      query.$or.push(
        { expiryDate: null }, // no expiry
        { expiryDate: { $gt: now } } // not yet expired
      );
    }
    
    console.log('MongoDB query:', JSON.stringify(query, null, 2)); // Debug log
    
    // Execute query with pagination
    const skip = (page - 1) * limit;
    const announcements = await Announcement.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
    
    console.log(`Found ${announcements.length} announcements`); // Debug log
    
    // Count total documents for pagination
    const total = await Announcement.countDocuments(query);
    
    // Format dates for frontend
    const formattedAnnouncements = announcements.map(announcement => ({
      ...announcement,
      publishDate: announcement.publishDate ? announcement.publishDate.toISOString() : null,
      expiryDate: announcement.expiryDate ? announcement.expiryDate.toISOString() : null,
      createdAt: announcement.createdAt ? announcement.createdAt.toISOString() : null,
      updatedAt: announcement.updatedAt ? announcement.updatedAt.toISOString() : null
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedAnnouncements,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { error: 'Error fetching announcements: ' + error.message },
      { status: 500 }
    );
  }
}

// POST /api/announcements - Create a new announcement
export async function POST(req: NextRequest) {
  try {
    // Verify authentication token
    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication token is required' },
        { status: 401 }
      );
    }

    const decoded = await verifyJWT(token);
    if (!decoded || decoded.role !== 'staff') {
      return NextResponse.json(
        { error: 'Unauthorized. Only staff members can create announcements.' },
        { status: 403 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Parse request body
    const body = await req.json();
    
    console.log('Creating announcement with data:', JSON.stringify(body, null, 2)); // Debug log
    
    // Validate required fields
    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }
    
    // Create new announcement
    const announcement = new Announcement({
      ...body,
      author: decoded.userId, // Use userId from JWT
      status: body.status || 'draft',
      viewCount: 0 // Ensure viewCount starts at 0
    });
    
    console.log('Saving announcement with:', JSON.stringify(announcement, null, 2)); // Debug log
    
    // Save to database
    await announcement.save();
    
    return NextResponse.json({
      success: true,
      message: 'Announcement created successfully',
      data: announcement
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating announcement:', error);
    return NextResponse.json(
      { error: 'Error creating announcement: ' + error.message },
      { status: 500 }
    );
  }
}

// PUT /api/announcements - Bulk update announcements (archive old ones)
export async function PUT(req: NextRequest) {
  try {
    // Verify authentication token
    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication token is required' },
        { status: 401 }
      );
    }

    const decoded = await verifyJWT(token);
    if (!decoded || decoded.role !== 'staff') {
      return NextResponse.json(
        { error: 'Unauthorized. Only staff members can update announcements.' },
        { status: 403 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Parse request body
    const body = await req.json();
    const { action, ids, data } = body;
    
    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }
    
    let result;
    
    // Handle different bulk actions
    switch (action) {
      case 'archive':
        // Archive announcements with specified IDs
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
          return NextResponse.json(
            { error: 'IDs array is required for archive action' },
            { status: 400 }
          );
        }
        
        result = await Announcement.updateMany(
          { _id: { $in: ids.map(id => new mongoose.Types.ObjectId(id)) } },
          { $set: { status: 'archived' } }
        );
        
        break;
        
      case 'archive-expired':
        // Archive all expired published announcements
        const now = new Date();
        
        result = await Announcement.updateMany(
          { 
            status: 'published',
            expiryDate: { $lt: now }
          },
          { $set: { status: 'archived' } }
        );
        
        break;
        
      case 'update-status':
        // Update status for specified IDs
        if (!ids || !Array.isArray(ids) || ids.length === 0 || !data || !data.status) {
          return NextResponse.json(
            { error: 'IDs array and status are required for update-status action' },
            { status: 400 }
          );
        }
        
        result = await Announcement.updateMany(
          { _id: { $in: ids.map(id => new mongoose.Types.ObjectId(id)) } },
          { $set: { status: data.status } }
        );
        
        break;
        
      default:
        return NextResponse.json(
          { error: `Unsupported action: ${action}` },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
      message: `Bulk ${action} completed successfully`,
      result: {
        matched: result.matchedCount,
        modified: result.modifiedCount
      }
    });
  } catch (error: any) {
    console.error('Error in bulk announcement update:', error);
    return NextResponse.json(
      { error: 'Error in bulk announcement update: ' + error.message },
      { status: 500 }
    );
  }
} 