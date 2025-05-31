import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import User from '@/models/User';
import RIDS from '@/models/RIDS';
import { verifyJWT } from '@/utils/auth';
import { hasPermission } from '@/utils/rolePermissions';

/**
 * GET handler to retrieve reservists, potentially filtered by company
 * Staff can only view reservists in their company, admins/directors can view all
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
    
    // Check if user has permission to view personnel
    if (!hasPermission(decoded.role, 'view_personnel')) {
      return NextResponse.json(
        { success: false, error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const companyFilter = searchParams.get('company');
    const cacheParam = searchParams.get('_t'); // Used for cache busting
    
    console.log(`Processing reservists request with cache param: ${cacheParam}`);
    
    // Build query
    const query: any = { 
      role: { $in: ['reservist', 'user'] },
      isArchived: { $ne: true } 
    };
    
    // Staff can only see reservists in their company
    if (decoded.role === 'staff' && decoded.company) {
      query.company = decoded.company;
    } 
    // Apply company filter if provided (for admins/directors)
    else if (companyFilter && (decoded.role === 'admin' || decoded.role === 'director' || decoded.role === 'administrator')) {
      query.company = companyFilter;
    }
    
    // Pre-filter to specifically exclude problematic service IDs at database level
    query.serviceId = { $nin: ['CD-2019-1016780'] };
    
    // Fetch users with role='reservist'
    const reservists = await User.find(query)
      .select('firstName lastName email serviceId rank company status createdAt updatedAt isRegistrationComplete')
      .lean();
    
    // Filter out any problematic service IDs that keep reappearing as an additional safety measure
    const problematicServiceIds = ['CD-2019-1016780', 'CD-2019-101679', 'CD-2019-101680'];
    const filteredReservists = reservists.filter(r => 
      !problematicServiceIds.includes(r.serviceId)
    );
    
    if (reservists.length > filteredReservists.length) {
      console.log(`Filtered out ${reservists.length - filteredReservists.length} problematic service IDs`);
      
      // If we found problematic IDs that made it past the database filter, 
      // try to delete them directly as an additional safeguard
      const problemServiceIds = reservists
        .filter(r => problematicServiceIds.includes(r.serviceId))
        .map(r => r.serviceId);
      
      if (problemServiceIds.length > 0) {
        console.log('Found problematic IDs that bypassed filters. Attempting direct cleanup:', problemServiceIds);
        
        // Attempt immediate cleanup
        for (const problematicId of problemServiceIds) {
          try {
            await User.deleteMany({ serviceId: problematicId });
            await RIDS.deleteMany({ "identificationInfo.serviceId": problematicId });
            console.log(`Emergency cleanup completed for service ID: ${problematicId}`);
          } catch (cleanupError) {
            console.error(`Failed emergency cleanup for ${problematicId}:`, cleanupError);
          }
        }
      }
    }
    
    // Fetch RIDS data for these reservists
    const reservistsWithRIDS = await Promise.all(
      filteredReservists.map(async (reservist) => {
        const ridsData = await RIDS.findOne({ userId: reservist._id }).lean();
        
        // If no RIDS data found but user shows as having completed registration,
        // we need to fix the user record to reflect reality
        if (!ridsData && reservist.isRegistrationComplete) {
          console.log(`Fixing inconsistent data for user: ${reservist._id} - RIDS data missing but marked as registered`);
          // Update user record to match actual state
          await User.findByIdAndUpdate(reservist._id, {
            $set: {
              isRegistrationComplete: false,
              ridsStatus: 'not_submitted'
            }
          });
          // Update the local copy too
          reservist.isRegistrationComplete = false;
        }
        
        // Calculate RIDS status
        let ridsStatus = 'incomplete';
        if (ridsData) {
          if (ridsData.isVerified) {
            ridsStatus = 'verified';
          } else if (ridsData.isSubmitted) {
            ridsStatus = 'pending_verification';
          } else {
            ridsStatus = 'incomplete';
          }
        }
        
        // Skip records with the problematic service ID as final safety check
        if (problematicServiceIds.includes(reservist.serviceId)) {
          console.log(`Skipping problematic service ID: ${reservist.serviceId} for final response`);
          return null;
        }
        
        return {
          id: reservist._id,
          name: `${reservist.firstName} ${reservist.lastName}`,
          rank: reservist.rank || '',
          serviceNumber: reservist.serviceId || '',
          email: reservist.email,
          status: reservist.status || 'pending',
          company: reservist.company || '',
          dateJoined: reservist.createdAt,
          lastUpdated: reservist.updatedAt,
          isRegistrationComplete: reservist.isRegistrationComplete || false,
          ridsData: ridsData ? {
            personalInformation: ridsData.personalInformation || {},
            contactInformation: ridsData.contactInformation || {},
            identificationInfo: ridsData.identificationInfo || {},
            educationalBackground: ridsData.educationalBackground || {},
            occupationInfo: ridsData.occupationInfo || {},
            militaryTraining: ridsData.militaryTraining || [],
            specialSkills: ridsData.specialSkills || [],
            awards: ridsData.awards || [],
            assignments: ridsData.assignments || [],
            filePath: ridsData.filePath || ''
          } : undefined,
          ridsStatus
        };
      })
    );
    
    // Filter out null values (problematic records)
    const finalReservists = reservistsWithRIDS.filter(r => r !== null);
    
    // Add cache control headers to prevent caching
    const response = NextResponse.json({
      success: true,
      timestamp: new Date().getTime(), // Add timestamp to prevent response caching
      data: {
        reservists: finalReservists
      }
    });
    
    // Add no-cache headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error: any) {
    console.error('Error fetching reservists:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error fetching reservists' },
      { status: 500 }
    );
  }
} 