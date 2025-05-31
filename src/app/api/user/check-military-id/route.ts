import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import mongoose from 'mongoose';

// Define route segment config
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Connect to MongoDB
    await dbConnect();
    
    // Get the service ID from the URL
    const url = new URL(request.url);
    const serviceId = url.searchParams.get('id');
    
    if (!serviceId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Service ID is required' 
      }, { status: 400 });
    }
    
    // Check if the service ID exists in the database
    const userCollection = await mongoose.connection.collection('users');
    const existingUser = await userCollection.findOne({ serviceId });
    
    return NextResponse.json({
      success: true,
      exists: !!existingUser
    });
    
  } catch (error: any) {
    console.error('Check Service ID error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Error checking Service ID' 
    }, { status: 500 });
  }
} 