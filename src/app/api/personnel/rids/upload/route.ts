import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import RIDS from '@/models/RIDS';
import User from '@/models/User';
import { verifyJWT } from '@/utils/auth';
import { hasPermission } from '@/utils/rolePermissions';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export const config = {
  api: {
    // We need to disable the built-in Next.js body parser
    // to handle form data and file uploads manually
    bodyParser: false,
  },
};

/**
 * POST handler to upload a new RIDS
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
    
    // Only staff, admin, and director roles can upload RIDS
    if (!(['staff', 'admin', 'director', 'administrator'].includes(decoded.role))) {
      return NextResponse.json(
        { success: false, error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    console.log('Starting file upload process...');
    
    try {
      // Handle form data with file
      const formData = await request.formData();
      console.log('Form data received');
      
      const serviceId = formData.get('serviceId') as string;
      console.log('Service ID:', serviceId);
      
      const ridsFile = formData.get('ridsFile') as File;
      console.log('File received:', ridsFile ? ridsFile.name : 'No file');
      
      // Validate required fields
      if (!serviceId) {
        return NextResponse.json(
          { success: false, error: 'Service ID is required' },
          { status: 400 }
        );
      }
      
      if (!ridsFile) {
        return NextResponse.json(
          { success: false, error: 'RIDS PDF file is required' },
          { status: 400 }
        );
      }
      
      console.log('File type:', ridsFile.type);
      console.log('File size:', ridsFile.size);
      
      // Check if a user with this service ID already exists
      const existingUser = await User.findOne({ serviceId });
      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'duplicate_service_id', message: 'A reservist with this Service ID already exists' },
          { status: 400 }
        );
      }
      
      // Create upload directory - ensure the full path exists
      const rootDir = process.cwd();
      const publicDir = path.join(rootDir, 'public');
      const uploadsDir = path.join(publicDir, 'uploads');
      const ridsDir = path.join(uploadsDir, 'rids');
      
      console.log('Directory structure:');
      console.log('- Root directory:', rootDir);
      console.log('- Public directory:', publicDir);
      console.log('- Uploads directory:', uploadsDir);
      console.log('- RIDS directory:', ridsDir);
      
      try {
        // Create directories if they don't exist
        if (!fs.existsSync(publicDir)) {
          console.log('Creating public directory');
          await mkdir(publicDir, { recursive: true });
        }
        
        if (!fs.existsSync(uploadsDir)) {
          console.log('Creating uploads directory');
          await mkdir(uploadsDir, { recursive: true });
        }
        
        if (!fs.existsSync(ridsDir)) {
          console.log('Creating RIDS directory');
          await mkdir(ridsDir, { recursive: true });
        }
      } catch (dirError: any) {
        console.error('Error creating directories:', dirError);
        return NextResponse.json(
          { success: false, error: `Failed to create upload directories: ${dirError.message}` },
          { status: 500 }
        );
      }
      
      // Process and save the file
      const bytes = await ridsFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Generate a unique filename
      const uniqueId = uuidv4();
      const filename = `rids_${serviceId}_${uniqueId}.pdf`;
      
      // Full path to save the file
      const filePath = path.join(ridsDir, filename);
      console.log('Saving file to:', filePath);
      
      try {
        // Write the file
        await writeFile(filePath, buffer);
        console.log('File saved successfully');
      } catch (fileError: any) {
        console.error('Error saving file:', fileError);
        return NextResponse.json(
          { success: false, error: `Failed to save file: ${fileError.message}` },
          { status: 500 }
        );
      }
      
      // Create a new user with reservist role
      try {
        console.log('Creating new user in database');
        const newUser = new User({
          firstName: 'Pending', // Will be updated during registration
          lastName: 'Registration',
          fullName: 'Pending Registration',
          email: `pending_${serviceId}@pending.afp`, // Temporary email to pass validation
          password: uuidv4(), // Generate a random password
          serviceId,
          role: 'reservist',
          status: 'pending',
          isVerified: false,
          isEnabled: true,
          createdBy: decoded.userId,
          canRegister: true, // This allows the reservist to register using this Service ID
        });
        
        await newUser.save();
        console.log('User created with ID:', newUser._id);
        
        // Create an empty RIDS record linked to this user
        console.log('Creating RIDS record');
        const newRIDS = new RIDS({
          userId: newUser._id,
          isComplete: false,
          isSubmitted: false,
          isVerified: false,
          filePath: `/uploads/rids/${filename}`,
          personalInformation: {
            fullName: 'Pending Registration'
          },
          identificationInfo: {
            serviceId: serviceId
          },
          sectionCompletion: {
            personalInfo: false,
            contactInfo: false,
            identificationInfo: false,
            educationalBackground: false,
            occupationInfo: false,
            militaryTraining: false
          }
        });
        
        await newRIDS.save();
        console.log('[RIDS Upload Route] RIDS record created successfully with ID:', newRIDS._id);
        
        return NextResponse.json({
          success: true,
          message: 'RIDS uploaded successfully',
          data: {
            userId: newUser._id,
            ridsId: newRIDS._id,
            filePath: `/uploads/rids/${filename}`
          }
        });
      } catch (dbError: any) {
        console.error('Database error:', dbError);
        
        // If we got this far, the file was saved but the database entry failed
        // Try to clean up the file
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('Deleted file after database error');
          }
        } catch (cleanupError) {
          console.error('Error cleaning up file after database error:', cleanupError);
        }
        
        return NextResponse.json(
          { success: false, error: `Database error: ${dbError.message}` },
          { status: 500 }
        );
      }
    } catch (innerError: any) {
      console.error('Inner error during upload:', innerError);
      return NextResponse.json(
        { success: false, error: `Processing error: ${innerError.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error uploading RIDS:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error uploading RIDS' },
      { status: 500 }
    );
  }
} 