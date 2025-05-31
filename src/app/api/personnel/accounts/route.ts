import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/utils/auth';
import { MongoClient, ObjectId } from 'mongodb';

// GET /api/personnel/accounts - List all pending account requests
export async function GET(req: NextRequest) {
  // Connect to MongoDB and fetch real pending account requests
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/afp_personnel_db';
  const client = new MongoClient(uri);
  
  try {
    // Verify authentication token
    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication token is required' },
        { status: 401 }
      );
    }

    const decoded = await verifyJWT(token);
    if (!decoded || !['staff', 'admin', 'administrator', 'director'].includes(decoded.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Only staff, administrators and directors can view account requests' },
        { status: 403 }
      );
    }
    
    // Connect to MongoDB
    await client.connect();
    const database = client.db();
    const collection = database.collection('personnels');
    
    // Fetch all accounts that have gone through the registration process
    const allAccounts = await collection.find({}).toArray();
    
    // Transform MongoDB documents to the expected format
    const accountRequests = allAccounts.map(account => {
      // Determine account status based on flags
      let status = 'pending';
      if (account.rejectionReason) {
        status = 'rejected';
      } else if (account.isVerified && account.isActive) {
        status = 'approved';
      }
      
      return {
        id: account._id.toString(),
        name: `${account.firstName} ${account.lastName}`,
        email: account.email,
        alternativeEmail: account.alternativeEmail,
        rank: account.rank || '',
        company: account.company || '',
        serviceNumber: account.serviceNumber || '',
        submittedAt: account.createdAt || new Date().toISOString(),
        approvedAt: account.isVerified ? (account.lastUpdated || account.updatedAt) : null,
        rejectedAt: account.rejectionReason ? (account.lastUpdated || account.updatedAt) : null,
        status: status
      };
    });
    
    console.log(`Found ${accountRequests.length} pending accounts`);
    
    return NextResponse.json({ accounts: accountRequests });
  } catch (error) {
    console.error('Error fetching account requests:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    await client.close();
  }
}

// PATCH /api/personnel/accounts/:id - Update an account request (approve/reject)
export async function PATCH(req: NextRequest) {
  try {
    // Verify authentication token
    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication token is required' },
        { status: 401 }
      );
    }

    const decoded = await verifyJWT(token);
    if (!decoded || !['staff', 'admin', 'administrator', 'director'].includes(decoded.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Only staff, administrators and directors can approve/reject account requests' },
        { status: 403 }
      );
    }
    
    // Parse the request body
    const data = await req.json();
    const { id, status, rejectionReason } = data;
    
    if (!id || !status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    
    // Connect to MongoDB and update the account status
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/afp_personnel_db';
    const client = new MongoClient(uri);

    try {
      await client.connect();
      const database = client.db();
      const collection = database.collection('personnels');

      // Convert string ID to ObjectId
      const objectId = new ObjectId(id);
      
      // Current timestamp for update tracking
      const currentTimestamp = new Date().toISOString();
      
      // Update fields based on approval status
      const updateData: Record<string, any> = {
        isVerified: status === 'approved',
        isActive: status === 'approved',
        updatedAt: currentTimestamp,
        lastUpdated: currentTimestamp,
      };
      
      // Add approval or rejection specific fields
      if (status === 'approved') {
        updateData.approvedAt = currentTimestamp;
        updateData.approvedBy = decoded.userId || 'unknown'; // Add approver ID from token
      } else if (status === 'rejected') {
        updateData.rejectedAt = currentTimestamp;
        updateData.rejectedBy = decoded.userId || 'unknown'; // Add rejecter ID from token
        
        // Add rejection reason if provided
        if (rejectionReason) {
          updateData.rejectionReason = rejectionReason;
        }
      }

      // Update the account in MongoDB
      const result = await collection.updateOne(
        { _id: objectId },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { error: 'Account not found' },
          { status: 404 }
        );
      }

      // Get updated account for response
      const updatedAccount = await collection.findOne({ _id: objectId });
      
      console.log(`Account ${id} ${status} successfully`);
      
      // Prepare email notification data (would be sent through email service)
      if (updatedAccount) {
        const notificationEmail = updatedAccount.email;
        const alternativeEmail = updatedAccount.alternativeEmail || 'none';
        console.log(`Would send notification to: ${notificationEmail} and ${alternativeEmail}`);
      }
      
      return NextResponse.json({
        success: true,
        message: `Account ${status} successfully`,
        accountId: id
      });
    } catch (mongoError) {
      console.error('MongoDB error updating account:', mongoError);
      return NextResponse.json(
        { error: 'Database error updating account' },
        { status: 500 }
      );
    } finally {
      await client.close();
    }
  } catch (error) {
    console.error('Error updating account request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 