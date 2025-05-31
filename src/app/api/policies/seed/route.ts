import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Policy from '@/models/Policy';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// This route adds sample policies to the database for testing
export async function GET(request: NextRequest) {
  try {
    // Connect to the database
    await connectToDatabase();
    
    // Create uploads directory if it doesn't exist
    const publicDir = path.join(process.cwd(), 'public');
    const uploadsDir = path.join(publicDir, 'uploads', 'policies');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Create a sample PDF file if it doesn't exist
    const samplePdfPath = path.join(uploadsDir, 'sample-policy.pdf');
    if (!fs.existsSync(samplePdfPath)) {
      fs.writeFileSync(samplePdfPath, 'This is a sample policy document for testing purposes.');
      console.log('Created sample PDF file');
    }
    
    // Create sample policies
    const samplePolicies = [
      {
        title: 'Sample Policy - Promotions',
        description: 'This is a sample policy for testing the document viewer functionality. It outlines the promotion guidelines for personnel.',
        content: 'This policy was uploaded as a file. Please refer to the attached document.',
        category: 'Promotions',
        version: '1.0',
        status: 'published',
        effectiveDate: new Date(),
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        documentUrl: '/uploads/policies/sample-policy.pdf',
        createdBy: new mongoose.Types.ObjectId('000000000000000000000001') // Dummy ObjectId
      },
      {
        title: 'Sample Policy - Security Guidelines',
        description: 'This policy describes the security protocols to be followed by all personnel.',
        content: 'This policy was uploaded as a file. Please refer to the attached document.',
        category: 'Security',
        version: '1.0',
        status: 'published',
        effectiveDate: new Date(),
        documentUrl: '/uploads/policies/sample-policy.pdf',
        createdBy: new mongoose.Types.ObjectId('000000000000000000000001') // Dummy ObjectId
      }
    ];
    
    // Add policies to database
    let createdCount = 0;
    
    for (const policy of samplePolicies) {
      // Check if a policy with this title already exists
      const existingPolicy = await Policy.findOne({ title: policy.title });
      
      if (!existingPolicy) {
        await Policy.create(policy);
        createdCount++;
      }
    }
    
    return NextResponse.json({
      message: `Added ${createdCount} sample policies to the database`,
      samplePdfPath: '/uploads/policies/sample-policy.pdf'
    });
    
  } catch (error: any) {
    console.error('Error seeding policies:', error);
    return NextResponse.json(
      { error: 'Failed to seed policies', message: error.message },
      { status: 500 }
    );
  }
} 