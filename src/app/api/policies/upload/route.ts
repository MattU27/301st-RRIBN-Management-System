import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/auth';
import Policy from '@/models/Policy';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import { storeFileInGridFS } from '@/lib/gridfs';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Set maximum execution time to 60 seconds

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
    
    // Ensure it's a PDF file
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // Generate a unique filename for the uploaded file
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
    
    // Convert the file to a buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // Store the file in GridFS
    const fileId = await storeFileInGridFS(fileBuffer, fileName, {
      contentType: 'application/pdf',
      metadata: {
        title,
        category,
        uploadedBy: decoded.userId,
        originalFilename: file.name
      }
    });
    
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
      fileId: new ObjectId(fileId),
      createdBy: new mongoose.Types.ObjectId(decoded.userId)
    });
    
    // Save to the database
    await policy.save();
    
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