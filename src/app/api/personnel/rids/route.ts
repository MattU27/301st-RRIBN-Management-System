import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import RIDS from '@/models/RIDS';
import User from '@/models/User';
import { verifyJWT } from '@/utils/auth';
import { hasPermission } from '@/utils/rolePermissions';

/**
 * GET handler to retrieve a specific RIDS by userId
 */
export async function GET(request: Request) {
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
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Find the reservist
    const reservist = await User.findById(userId).lean();
    
    if (!reservist) {
      return NextResponse.json(
        { success: false, error: 'Reservist not found' },
        { status: 404 }
      );
    }
    
    // Staff can only view RIDS for reservists in their company
    if (decoded.role === 'staff' && decoded.company !== reservist.company) {
      return NextResponse.json(
        { success: false, error: 'Permission denied: You can only view RIDS for reservists in your company' },
        { status: 403 }
      );
    }
    
    // Find the RIDS document
    const ridsDoc = await RIDS.findOne({ userId }).lean();
    
    if (!ridsDoc) {
      // Return empty structure if no RIDS document exists yet
      return NextResponse.json({
        success: true,
        data: {
          rids: {
            userId,
            isComplete: false,
            isSubmitted: false,
            isVerified: false,
            personalInformation: {},
            contactInformation: {},
            identificationInfo: {},
            educationalBackground: {},
            occupationInfo: {},
            militaryTraining: [],
            specialSkills: [],
            awards: [],
            assignments: [],
            sectionCompletion: {
              personalInfo: false,
              contactInfo: false,
              identificationInfo: false,
              educationalBackground: false,
              occupationInfo: false,
              militaryTraining: false
            }
          }
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        rids: ridsDoc
      }
    });
  } catch (error: any) {
    console.error('Error retrieving RIDS:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error retrieving RIDS' },
      { status: 500 }
    );
  }
}

/**
 * PUT handler to update a RIDS document
 */
export async function PUT(request: Request) {
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
    
    // Check if user has permission to manage documents
    if (!hasPermission(decoded.role, 'manage_documents')) {
      return NextResponse.json(
        { success: false, error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    // Get request body
    const body = await request.json();
    const { userId, ridsData } = body;
    
    if (!userId || !ridsData) {
      return NextResponse.json(
        { success: false, error: 'User ID and RIDS data are required' },
        { status: 400 }
      );
    }
    
    // Find the reservist
    const reservist = await User.findById(userId).lean();
    
    if (!reservist) {
      return NextResponse.json(
        { success: false, error: 'Reservist not found' },
        { status: 404 }
      );
    }
    
    // Staff can only update RIDS for reservists in their company
    if (decoded.role === 'staff' && decoded.company !== reservist.company) {
      return NextResponse.json(
        { success: false, error: 'Permission denied: You can only update RIDS for reservists in your company' },
        { status: 403 }
      );
    }
    
    // Find the RIDS document or create a new one
    let ridsDoc = await RIDS.findOne({ userId });
    
    if (!ridsDoc) {
      ridsDoc = new RIDS({
        userId,
        ...ridsData
      });
    } else {
      // Update the existing document with new data
      // Calculate section completion status
      const personalInfoComplete = Boolean(
        ridsData.personalInformation?.fullName && 
        ridsData.personalInformation?.dateOfBirth && 
        ridsData.personalInformation?.gender
      );
      
      const contactInfoComplete = Boolean(
        ridsData.contactInformation?.residentialAddress && 
        ridsData.contactInformation?.mobileNumber && 
        ridsData.contactInformation?.emailAddress
      );
      
      const idInfoComplete = Boolean(
        ridsData.identificationInfo?.serviceId &&
        ridsData.identificationInfo?.height &&
        ridsData.identificationInfo?.weight
      );
      
      const educationComplete = Boolean(
        ridsData.educationalBackground?.highestEducation &&
        ridsData.educationalBackground?.school &&
        ridsData.educationalBackground?.yearGraduated
      );
      
      const occupationComplete = Boolean(
        ridsData.occupationInfo?.occupation
      );
      
      const militaryTrainingComplete = Array.isArray(ridsData.militaryTraining) && ridsData.militaryTraining.length > 0;
      
      // Update fields
      Object.assign(ridsDoc, {
        personalInformation: ridsData.personalInformation || ridsDoc.personalInformation,
        contactInformation: ridsData.contactInformation || ridsDoc.contactInformation,
        identificationInfo: ridsData.identificationInfo || ridsDoc.identificationInfo,
        educationalBackground: ridsData.educationalBackground || ridsDoc.educationalBackground,
        occupationInfo: ridsData.occupationInfo || ridsDoc.occupationInfo,
        militaryTraining: ridsData.militaryTraining || ridsDoc.militaryTraining,
        specialSkills: ridsData.specialSkills || ridsDoc.specialSkills,
        awards: ridsData.awards || ridsDoc.awards,
        assignments: ridsData.assignments || ridsDoc.assignments,
        sectionCompletion: {
          personalInfo: personalInfoComplete,
          contactInfo: contactInfoComplete,
          identificationInfo: idInfoComplete,
          educationalBackground: educationComplete,
          occupationInfo: occupationComplete,
          militaryTraining: militaryTrainingComplete
        }
      });
      
      // Update overall completion status
      ridsDoc.isComplete = 
        personalInfoComplete && 
        contactInfoComplete && 
        idInfoComplete && 
        educationComplete && 
        occupationComplete;
      
      // If this was a staff edit, check the submission status
      if (ridsData.isSubmitted === true) {
        ridsDoc.isSubmitted = true;
        ridsDoc.submissionDate = new Date();
      }
      
      // If staff is verifying the RIDS
      if (ridsData.isVerified === true) {
        ridsDoc.isVerified = true;
        ridsDoc.verificationDate = new Date();
        ridsDoc.verifiedBy = decoded.userId;
      } else if (ridsData.isVerified === false) {
        ridsDoc.isVerified = false;
        // If explicitly setting to not verified, capture rejection reason
        if (ridsData.rejectionReason) {
          ridsDoc.rejectionReason = ridsData.rejectionReason;
        }
      }
    }
    
    // Save the RIDS document
    await ridsDoc.save();
    
    return NextResponse.json({
      success: true,
      message: 'RIDS updated successfully',
      data: {
        rids: ridsDoc
      }
    });
  } catch (error: any) {
    console.error('Error updating RIDS:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error updating RIDS' },
      { status: 500 }
    );
  }
} 