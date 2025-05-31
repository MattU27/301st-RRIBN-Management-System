import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Policy from '@/models/Policy';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// This route fixes policies that don't have document URLs
export async function GET(request: NextRequest) {
  try {
    // Connect to the database
    await connectToDatabase();
    
    // Get all policies without documentUrl
    const policies = await Policy.find({ $or: [
      { documentUrl: { $exists: false } },
      { documentUrl: null },
      { documentUrl: "" }
    ]});
    
    console.log(`Found ${policies.length} policies without document URLs`);
    
    // Create uploads directory if it doesn't exist
    const publicDir = path.join(process.cwd(), 'public');
    const uploadsDir = path.join(publicDir, 'uploads', 'policies');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Create placeholder files and update policies
    const results = [];
    
    for (const policy of policies) {
      try {
        // Generate a filename based on policy ID
        const fileName = `policy_${policy._id}.pdf`;
        const documentUrl = `/uploads/policies/${fileName}`;
        const filePath = path.join(publicDir, 'uploads', 'policies', fileName);
        
        // Create a placeholder PDF file with policy details
        const placeholderContent = `Policy: ${policy.title}
        
This is a placeholder document for policy ID: ${policy._id}

Category: ${policy.category}
Effective Date: ${policy.effectiveDate}

Description:
${policy.description}

Content:
${policy.content}
`;
        
        // Write the placeholder file
        fs.writeFileSync(filePath, placeholderContent);
        
        // Update the policy with the document URL
        policy.documentUrl = documentUrl;
        await policy.save();
        
        results.push({
          policyId: policy._id,
          title: policy.title,
          documentUrl,
          status: 'fixed'
        });
        
        console.log(`Created placeholder file for policy ${policy._id}: ${filePath}`);
      } catch (error) {
        console.error(`Error creating placeholder for policy ${policy._id}:`, error);
        results.push({
          policyId: policy._id,
          title: policy.title,
          status: 'error',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    return NextResponse.json({
      message: `Fixed ${results.filter(r => r.status === 'fixed').length} of ${policies.length} policies`,
      results
    });
    
  } catch (error: any) {
    console.error('Error fixing policy documents:', error);
    return NextResponse.json(
      { error: 'Failed to fix policy documents', message: error.message },
      { status: 500 }
    );
  }
} 