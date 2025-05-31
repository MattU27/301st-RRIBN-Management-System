import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import RIDS from '@/models/RIDS';
import User from '@/models/User';
import { verifyJWT } from '@/utils/auth';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET handler to verify and fix RIDS and User documents
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
    
    // Only staff, admin, and director roles can perform this action
    if (!(['staff', 'admin', 'director', 'administrator'].includes(decoded.role))) {
      return NextResponse.json(
        { success: false, error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    console.log('Starting document verification...');
    
    // Find users with missing fields
    const invalidUsers = await User.find({
      $or: [
        { email: { $exists: false } },
        { email: '' },
        { password: { $exists: false } }
      ]
    }).lean();
    
    console.log(`Found ${invalidUsers.length} user(s) with missing required fields`);
    
    let fixedCount = 0;
    
    // Fix each invalid user
    for (const user of invalidUsers) {
      try {
        const fixedData = {
          email: user.email || `pending_${user.serviceId || uuidv4()}@pending.afp`,
          password: user.password || uuidv4()
        };
        
        await User.updateOne(
          { _id: user._id },
          { $set: fixedData }
        );
        
        fixedCount++;
      } catch (error) {
        console.error(`Error fixing user ${user._id}:`, error);
      }
    }
    
    // Check for RIDS documents with missing fields
    const invalidRIDS = await RIDS.find({
      $or: [
        { 'personalInformation.fullName': { $exists: false } },
        { 'identificationInfo.serviceId': { $exists: false } }
      ]
    }).lean();
    
    console.log(`Found ${invalidRIDS.length} RIDS document(s) with missing required fields`);
    
    let fixedRIDSCount = 0;
    
    // Fix each invalid RIDS document
    for (const rids of invalidRIDS) {
      try {
        const user = await User.findById(rids.userId).lean();
        
        const fixedData = {
          personalInformation: rids.personalInformation || {},
          identificationInfo: rids.identificationInfo || {}
        };
        
        if (!fixedData.personalInformation.fullName) {
          fixedData.personalInformation.fullName = user?.fullName || 'Pending Registration';
        }
        
        if (!fixedData.identificationInfo.serviceId) {
          fixedData.identificationInfo.serviceId = user?.serviceId || 'Unknown';
        }
        
        await RIDS.updateOne(
          { _id: rids._id },
          { $set: fixedData }
        );
        
        fixedRIDSCount++;
      } catch (error) {
        console.error(`Error fixing RIDS ${rids._id}:`, error);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Document verification completed',
      usersChecked: invalidUsers.length,
      usersFixed: fixedCount,
      ridsChecked: invalidRIDS.length,
      ridsFixed: fixedRIDSCount
    });
  } catch (error: any) {
    console.error('Error verifying documents:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error verifying documents' },
      { status: 500 }
    );
  }
} 