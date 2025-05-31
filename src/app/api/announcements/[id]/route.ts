import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Announcement from '@/models/Announcement';
import { verifyJWT } from '@/utils/auth';
import mongoose from 'mongoose';

// GET /api/announcements/[id] - Get a specific announcement
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`API: Fetching announcement with ID: ${params.id}`);
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

    // Get announcement ID from URL params
    const id = params.id;
    
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      console.log(`API: Invalid announcement ID: ${id}`);
      return NextResponse.json(
        { error: 'Invalid announcement ID' },
        { status: 400 }
      );
    }
    
    // Find announcement by ID
    const announcement = await Announcement.findById(id)
      .populate('author', 'name role')
      .lean();
    
    if (!announcement) {
      console.log(`API: Announcement not found with ID: ${id}`);
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      );
    }
    
    console.log(`API: Successfully retrieved announcement with ID: ${id}`);
    // We're no longer incrementing view count here as it's done via the /view endpoint
    
    return NextResponse.json({
      success: true,
      data: announcement
    });
  } catch (error: any) {
    console.error('Error fetching announcement:', error);
    return NextResponse.json(
      { error: 'Error fetching announcement: ' + error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/announcements/[id] - Update a specific announcement
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get announcement ID from URL params
    const id = params.id;
    
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid announcement ID' },
        { status: 400 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    
    // Find announcement and check ownership
    const existingAnnouncement = await Announcement.findById(id);
    
    if (!existingAnnouncement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      );
    }
    
    // Only the owner can update the announcement
    const isOwner = existingAnnouncement.author.toString() === decoded.userId;
    
    if (!isOwner) {
      return NextResponse.json(
        { error: 'You can only update announcements you created' },
        { status: 403 }
      );
    }
    
    // Update announcement
    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    ).populate('author', 'name role');
    
    if (!updatedAnnouncement) {
      return NextResponse.json(
        { error: 'Failed to update announcement' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Announcement updated successfully',
      data: updatedAnnouncement
    });
  } catch (error: any) {
    console.error('Error updating announcement:', error);
    return NextResponse.json(
      { error: 'Error updating announcement: ' + error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/announcements/[id] - Delete a specific announcement
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: 'Unauthorized. Only staff members can delete announcements.' },
        { status: 403 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Get announcement ID from URL params
    const id = params.id;
    
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid announcement ID' },
        { status: 400 }
      );
    }
    
    // Delete announcement
    const result = await Announcement.findByIdAndDelete(id);
    
    if (!result) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json(
      { error: 'Error deleting announcement: ' + error.message },
      { status: 500 }
    );
  }
}

// POST /api/announcements/[id] - Increment view count for an announcement
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get announcement ID from URL params
    const id = params.id;
    
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid announcement ID' },
        { status: 400 }
      );
    }
    
    // Check if this is a view count increment request
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    
    if (action === 'view') {
      // Increment view count
      const result = await Announcement.findByIdAndUpdate(
        id,
        { $inc: { viewCount: 1 } },
        { new: true }
      );
      
      if (!result) {
        return NextResponse.json(
          { error: 'Announcement not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'View count incremented successfully'
      });
    }
    
    // Parse request body for other actions
    const body = await req.json();
    
    // TODO: Add other POST actions here
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error processing announcement action:', error);
    return NextResponse.json(
      { error: 'Error processing announcement action: ' + error.message },
      { status: 500 }
    );
  }
} 