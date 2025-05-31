import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import User from '@/models/User';
import { verifyJWT } from '@/utils/auth';
import { UserStatus } from '@/types/auth';
import { sendNotificationToUser } from '@/app/api/ws/route';
import { WebSocketEventType } from '@/utils/websocketService';
import mongoose from 'mongoose';
import { UserRole } from '@/types/auth';
import AuditLog from '@/models/AuditLog';

/**
 * GET handler to retrieve user accounts with filtering options
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
    
    // Only directors can manage users
    if (decoded.role !== 'director') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Only directors can manage user accounts.' },
        { status: 403 }
      );
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const archived = searchParams.get('archived');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Build query
    const query: any = {};
    
    if (role) query.role = role;
    if (status) query.status = status;
    
    // Handle archived parameter
    if (archived === 'true') {
      query.isArchived = true;
      console.log('Setting query.isArchived = true to filter for archived users');
    } else if (archived === 'false') {
      query.isArchived = false;
      console.log('Setting query.isArchived = false to filter for non-archived users');
    }

    console.log('Final MongoDB query:', JSON.stringify(query));
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { militaryId: { $regex: search, $options: 'i' } },
        { serviceId: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Fetch users with pagination
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    console.log(`MongoDB found ${users.length} users matching query:`, JSON.stringify(query));
    console.log('Archive status of users found:', users.map(u => ({
      id: u._id,
      name: `${u.firstName} ${u.lastName}`,
      status: u.status,
      isArchived: u.isArchived
    })));
    
    // Filter out the super director account
    const filteredUsers = users.filter(user => 
      !(user.role === 'director' && user.firstName === 'Super' && user.lastName === 'Director')
    );
    
    // Count total users for pagination (excluding super director)
    const total = filteredUsers.length;
    
    // Ensure deactivation reason is included for inactive users
    const usersWithDeactivationInfo = filteredUsers.map(user => {
      // Make sure deactivationReason is included for inactive users
      if (user.status === UserStatus.INACTIVE) {
        console.log(`Inactive user ${user._id} (${user.firstName} ${user.lastName}), deactivation reason:`, user.deactivationReason || 'None');
        if (!user.deactivationReason) {
          return { ...user, deactivationReason: "No reason provided" };
        }
      }
      return user;
    });
    
    console.log('Final users with deactivation info:', JSON.stringify(usersWithDeactivationInfo.map(u => ({
      _id: u._id,
      firstName: u.firstName, 
      lastName: u.lastName,
      status: u.status,
      deactivationReason: u.deactivationReason
    }))));
    
    // Return users list
    return NextResponse.json({
      success: true,
      data: {
        users: usersWithDeactivationInfo,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

/**
 * PATCH handler to update user status
 */
export async function PATCH(request: Request) {
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
    
    // Only directors can update user status
    if (decoded.role !== 'director') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Only directors can update user accounts.' },
        { status: 403 }
      );
    }
    
    // Get request body or URL params
    let data;
    
    // First check URL parameters for activation
    const { searchParams } = new URL(request.url);
    const queryUserId = searchParams.get('userId');
    const queryAction = searchParams.get('action');
    
    if (queryUserId && queryAction === 'activate') {
      console.log('Processing activation via URL params for user:', queryUserId);
      data = {
        userId: queryUserId,
        status: UserStatus.ACTIVE,
        isArchived: false
      };
    } else {
      // Otherwise get data from request body
      data = await request.json();
    }
    
    console.log('PATCH request received with data:', JSON.stringify(data));
    
    if (!data.userId || !data.status) {
      return NextResponse.json(
        { success: false, error: 'User ID and status are required' },
        { status: 400 }
      );
    }
    
    // Check if the user exists before updating
    const existingUser = await User.findById(data.userId);
    if (!existingUser) {
      console.error(`User not found with ID: ${data.userId}`);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log(`Found user to update: ${existingUser.firstName} ${existingUser.lastName} (${existingUser._id})`);
    console.log(`Current status: ${existingUser.status}, isArchived: ${existingUser.isArchived}`);
    
    // Validate status
    if (!Object.values(UserStatus).includes(data.status as UserStatus)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }
    
    // Prepare update object with debugging
    console.log('Updating user status with data:', JSON.stringify(data));
    
    const updateData: any = { 
      status: data.status, 
      updatedAt: new Date() 
    };
    
    // Handle isArchived property if it's provided
    if (data.isArchived !== undefined) {
      console.log(`Setting isArchived to ${data.isArchived}`);
      updateData.isArchived = data.isArchived;
    }
    
    // Add deactivation reason if provided and status is INACTIVE
    if (data.status === UserStatus.INACTIVE) {
      if (data.reason) {
        console.log(`PATCH: Setting explicit deactivation reason for user ${data.userId}: "${data.reason}"`);
        updateData.deactivationReason = data.reason;
      } else {
        console.log(`PATCH: No deactivation reason provided for user ${data.userId}, setting default`);
        updateData.deactivationReason = 'No reason provided';
      }
    } else if (data.status === UserStatus.ACTIVE) {
      // Clear deactivation reason if reactivating the account
      console.log(`PATCH: Clearing deactivation reason for user ${data.userId} (account reactivation)`);
      updateData.deactivationReason = null;
    }
    
    console.log('PATCH: Final update data:', JSON.stringify(updateData));
    
    try {
      // Update user status with the deactivation reason
      const user = await User.findByIdAndUpdate(
        data.userId,
        updateData,
        { new: true }
      ).select('-password');
      
      console.log('PATCH: User after update:', JSON.stringify({
        _id: user?._id,
        firstName: user?.firstName,
        lastName: user?.lastName,
        status: user?.status,
        isArchived: user?.isArchived,
        deactivationReason: user?.deactivationReason
      }));
  
      // Send real-time notification if user is deactivated
      if (data.status === UserStatus.INACTIVE) {
        console.log(`PATCH: Sending WebSocket deactivation notification to user ${data.userId}`);
        
        // Create notification payload
        const notificationPayload = { 
          reason: updateData.deactivationReason || 'Account deactivated by administrator'
        };
        
        console.log(`PATCH: Deactivation notification payload: ${JSON.stringify(notificationPayload)}`);
        
        // Send the notification
        try {
          const sent = sendNotificationToUser(
            data.userId, 
            WebSocketEventType.ACCOUNT_DEACTIVATED,
            notificationPayload
          );
          
          console.log(`PATCH: WebSocket notification ${sent ? 'sent successfully' : 'failed to send'}`);
          
          // If WebSocket notification fails, still continue with the update
          if (!sent) {
            console.log(`PATCH: User ${data.userId} might not be connected to WebSocket. Deactivation will take effect on next request.`);
          }
        } catch (wsError) {
          console.error(`PATCH: Error sending WebSocket notification: ${wsError}`);
        }
      }
      
      // Verify the update worked correctly
      const updatedUser = await User.findById(data.userId).select('-password');
      console.log('PATCH: Verification check - user after update:', JSON.stringify({
        _id: updatedUser?._id,
        firstName: updatedUser?.firstName,
        lastName: updatedUser?.lastName,
        status: updatedUser?.status,
        isArchived: updatedUser?.isArchived,
        deactivationReason: updatedUser?.deactivationReason
      }));
      
      // If setting to inactive and should be archived, ensure the isArchived flag is set using direct MongoDB update
      if (data.status === UserStatus.INACTIVE && data.isArchived) {
        console.log('PATCH: Ensuring isArchived flag is set using direct MongoDB update');
        // Use direct MongoDB driver for most reliable update
        const collection = mongoose.connection.collection('users');
        const result = await collection.updateOne(
          { _id: new mongoose.Types.ObjectId(data.userId) },
          { 
            $set: { 
              isArchived: true,
              updatedAt: new Date()
            } 
          }
        );
        
        console.log('PATCH: Direct MongoDB update result:', result);
        
        // Final verification check
        const finalUser = await User.findById(data.userId).select('-password');
        console.log('PATCH: Final user state after direct update:', {
          id: finalUser?._id,
          name: `${finalUser?.firstName} ${finalUser?.lastName}`,
          status: finalUser?.status,
          isArchived: finalUser?.isArchived,
          deactivationReason: finalUser?.deactivationReason
        });
      }
      
      if (!updatedUser) {
        console.error(`PATCH: Failed to find user after update!`);
        return NextResponse.json(
          { success: false, error: 'User not found after update' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: { user: updatedUser }
      });
    } catch (error) {
      console.error('PATCH: Error during user update or notification:', error);
      return NextResponse.json(
        { success: false, error: 'Error updating user: ' + (error instanceof Error ? error.message : String(error)) },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error updating user status:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update user status' },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler to remove a user account
 */
export async function DELETE(request: Request) {
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
    
    // Only directors can delete users
    if (decoded.role !== 'director') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Only directors can delete user accounts.' },
        { status: 403 }
      );
    }
    
    // Get user ID from query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Find and delete user
    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'User account deleted successfully'
    });
    
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete user account' },
      { status: 500 }
    );
  }
} 