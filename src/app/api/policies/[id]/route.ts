import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Policy from '@/models/Policy';
import { validateToken } from '@/lib/auth';
import mongoose from 'mongoose';

// Define route segment config
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET handler to retrieve a single policy by ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Get the ID parameter
    const { id } = params;
    
    // Verify authentication token
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      console.error('No authentication token provided');
      return NextResponse.json(
        { error: 'Authentication token is required' },
        { status: 401 }
      );
    }

    // Validate the token
    const decoded = await validateToken(token);
    if (!decoded) {
      console.error('Invalid authentication token');
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }
    
    // Allow staff, admin and director roles to access policies
    const allowedRoles = ['staff', 'admin', 'administrator', 'director'];
    if (!allowedRoles.includes(decoded.role.toLowerCase())) {
      console.error('User role not authorized:', decoded.role);
      return NextResponse.json(
        { error: 'Unauthorized. You do not have permission to access policies.' },
        { status: 403 }
      );
    }
    
    // Connect to the database
    await connectToDatabase();

    // Check that ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid policy ID format' },
        { status: 400 }
      );
    }

    // Find policy by ID
    const policy = await Policy.findById(id).populate('createdBy', 'firstName lastName email');

    if (!policy) {
      return NextResponse.json(
        { error: 'Policy not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ policy }, { status: 200 });
  } catch (error) {
    console.error('Error fetching policy:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch policy' },
      { status: 500 }
    );
  }
} 