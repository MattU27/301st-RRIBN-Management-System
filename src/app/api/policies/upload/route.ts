import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/auth';
import Policy from '@/models/Policy';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication token
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication token is required' },
        { status: 401 }
      );
    }

    const decoded = await validateToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Get the form data
    const formData = await request.formData();
    
    // Extract policy data
    const title = formData.get('title') as string;
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const effectiveDate = formData.get('effectiveDate') as string;
    const expirationDate = formData.get('expirationDate') as string || undefined;
    
    // Extract file data
    const file = formData.get('file') as File;
    
    // Validate required fields
    if (!title || !category || !description || !effectiveDate || !file) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // In a production environment, you would upload the file to a storage service
    // and get back a URL. For this example, we'll simulate a file upload and URL generation.
    
    // Generate a filename based on the current timestamp and original filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `policy_${Date.now()}.${fileExtension}`;
    const documentUrl = `/uploads/policies/${fileName}`;
    
    // Parse dates
    const parsedEffectiveDate = new Date(effectiveDate);
    const parsedExpirationDate = expirationDate ? new Date(expirationDate) : undefined;
    
    // Generate a version number
    const version = '1.0'; // For new policies
    
    // Create a new policy document
    const policy = new Policy({
      title,
      description,
      content: 'This policy was uploaded as a file. Please refer to the attached document.',
      category,
      version,
      status: 'published', // Default to published
      effectiveDate: parsedEffectiveDate,
      expirationDate: parsedExpirationDate,
      documentUrl,
      createdBy: new mongoose.Types.ObjectId(decoded.userId)
    });
    
    // Save to the database
    await policy.save();
    
    // In a real implementation, you would save the file to storage here
    // For example, using AWS S3, Google Cloud Storage, etc.
    
    return NextResponse.json(
      { 
        message: 'Policy uploaded successfully',
        policy
      },
      { status: 201 }
    );
    
  } catch (error: any) {
    console.error('Error uploading policy:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(
        (err: any) => err.message
      );
      return NextResponse.json(
        { error: 'Validation error', details: validationErrors },
        { status: 400 }
      );
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'A policy with this title already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to upload policy' },
      { status: 500 }
    );
  }
} 