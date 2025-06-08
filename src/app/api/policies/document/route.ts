import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { validateToken } from '@/lib/auth';
import Policy from '@/models/Policy';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getFileFromGridFS, getFileMetadata } from '@/lib/gridfs';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Set maximum execution time to 60 seconds

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
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

    // Get the query parameters
    const url = new URL(request.url);
    const policyId = url.searchParams.get('id');
    const directPath = url.searchParams.get('path');
    const download = url.searchParams.get('download') === 'true';
    
    // Get the base path where policy documents are stored
    const publicDir = path.join(process.cwd(), 'public');
    const uploadsDir = path.join(publicDir, 'uploads', 'policies');

    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    let filePath;
    let fileName;
    let fileBuffer: Buffer | null = null;
    let contentType = 'application/pdf';

    // If a direct path is provided
    if (directPath) {
      // Security check: Ensure the path only points to the uploads directory
      const cleanPath = directPath.replace(/^\/+/, ''); // Remove leading slashes
      if (!cleanPath.startsWith('uploads/policies/')) {
        console.error(`Security warning: Attempted to access invalid path: ${directPath}`);
        return NextResponse.json(
          { error: 'Invalid document path. Path must be in the uploads/policies directory.' },
          { status: 400 }
        );
      }
      
      filePath = path.join(publicDir, cleanPath);
      fileName = path.basename(filePath);
      
      // Check if file exists at the direct path
      if (!fs.existsSync(filePath)) {
        console.error(`File not found at direct path: ${filePath}`);
      }
    } 
    // If a policy ID is provided
    else if (policyId) {
      // Connect to the database
      await connectToDatabase();
      
      // Fetch the policy document to get the correct document URL
      const policy = await Policy.findById(policyId);
      
      if (!policy) {
        return NextResponse.json(
          { error: 'Policy not found' },
          { status: 404 }
        );
      }
      
      // First try to get the file from GridFS if fileId exists
      if (policy.fileId) {
        try {
          console.log(`Attempting to retrieve file from GridFS with ID: ${policy.fileId}`);
          // Get file metadata first to get content type
          const fileMetadata = await getFileMetadata(new ObjectId(policy.fileId.toString()));
          contentType = fileMetadata.contentType || 'application/pdf';
          
          // Get the file from GridFS
          fileBuffer = await getFileFromGridFS(new ObjectId(policy.fileId.toString()));
          fileName = fileMetadata.filename || `policy_${policyId}.pdf`;
          
          console.log(`Successfully retrieved file from GridFS: ${fileName}, size: ${fileBuffer.length} bytes`);
        } catch (error) {
          console.error(`Error retrieving file from GridFS: ${error}`);
          fileBuffer = null; // Reset to try other methods
        }
      }
      
      // If GridFS retrieval failed or wasn't available, try using documentUrl
      if (!fileBuffer) {
        // Get the document URL from the policy
        let documentUrl = policy.documentUrl;
        
        // If documentUrl exists, resolve the file path
        if (documentUrl) {
          // Remove leading slash if present
          documentUrl = documentUrl.replace(/^\/+/, '');
          filePath = path.join(publicDir, documentUrl);
          fileName = path.basename(filePath);
          
          // Check if file exists
          if (!fs.existsSync(filePath)) {
            console.error(`File not found for policy: ${policyId}, path: ${filePath}`);
          } else {
            try {
              fileBuffer = fs.readFileSync(filePath);
              console.log(`Read file from filesystem: ${filePath}, size: ${fileBuffer.length} bytes`);
            } catch (error) {
              console.error(`Error reading file from filesystem: ${error}`);
            }
          }
        } else {
          // Policy doesn't have a document URL - create a placeholder file for it
          console.log(`Policy ${policyId} does not have a documentUrl - creating placeholder`);
          
          try {
            // Generate a filename based on policy ID
            fileName = `policy_${policyId}.pdf`;
            documentUrl = `uploads/policies/${fileName}`;
            filePath = path.join(publicDir, documentUrl);
            
            // Create a placeholder PDF file with policy details
            const placeholderContent = `Policy: ${policy.title}\n\nThis is a placeholder document for policy ID: ${policyId}\n\nCategory: ${policy.category}\nEffective Date: ${policy.effectiveDate}\n\nDescription:\n${policy.description}`;
            
            // Ensure directory exists
            if (!fs.existsSync(uploadsDir)) {
              fs.mkdirSync(uploadsDir, { recursive: true });
            }
            
            // Write the placeholder file
            fs.writeFileSync(filePath, placeholderContent);
            fileBuffer = Buffer.from(placeholderContent);
            
            // Update the policy with the document URL
            policy.documentUrl = `/${documentUrl}`;
            await policy.save();
            
            console.log(`Created placeholder file at ${filePath} and updated policy`);
          } catch (error) {
            console.error('Error creating placeholder document:', error);
            return NextResponse.json(
              { error: 'Policy does not have an associated document and failed to create placeholder' },
              { status: 404 }
            );
          }
        }
      }
    } else {
      return NextResponse.json(
        { error: 'Either policy ID or document path is required' },
        { status: 400 }
      );
    }
    
    // If we have a fileBuffer already, use it
    if (fileBuffer) {
      console.log(`Serving file buffer: ${fileName}, size: ${fileBuffer.length} bytes`);
    }
    // If we still don't have a file path or the file doesn't exist
    else if (!filePath || !fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      
      // Check for the sample policy as a fallback
      const samplePath = path.join(uploadsDir, 'sample-policy.pdf');
      if (fs.existsSync(samplePath)) {
        console.log(`Serving sample policy as fallback: ${samplePath}`);
        filePath = samplePath;
        fileName = 'sample-policy.pdf';
        fileBuffer = fs.readFileSync(filePath);
      } else {
        // Try to find any PDF in the uploads directory as a last resort
        try {
          const files = fs.readdirSync(uploadsDir).filter(file => file.endsWith('.pdf'));
          if (files.length > 0) {
            console.log(`Found ${files.length} PDF files in uploads directory. Using: ${files[0]}`);
            filePath = path.join(uploadsDir, files[0]);
            fileName = files[0];
            fileBuffer = fs.readFileSync(filePath);
          } else {
            console.log('No PDF files found in uploads directory');
            return NextResponse.json(
              { error: 'Document not found', path: directPath || policyId },
              { status: 404 }
            );
          }
        } catch (err) {
          console.error('Error checking uploads directory:', err);
          return NextResponse.json(
            { error: 'Document not found', details: err instanceof Error ? err.message : 'Unknown error' },
            { status: 404 }
          );
        }
      }
    } else {
      // Read the file if we haven't already
      if (!fileBuffer) {
        console.log(`Reading file from disk: ${filePath}`);
        fileBuffer = fs.readFileSync(filePath);
      }
    }

    // Set appropriate headers based on whether it's a download or inline view
    const disposition = download ? 'attachment' : 'inline';

    return new Response(new Uint8Array(fileBuffer!), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `${disposition}; filename="${fileName}"`,
        'Cache-Control': 'public, max-age=3600'
      }
    });
    
  } catch (error: any) {
    console.error('Error serving policy document:', error);
    return NextResponse.json(
      { error: 'Failed to serve document', message: error.message },
      { status: 500 }
    );
  }
} 