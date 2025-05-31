import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Personnel from '@/models/Personnel';
import { Company } from '@/models/Company';
import { verifyJWT } from '@/utils/auth';
import mongoose from 'mongoose';

// POST /api/personnel/unassign-company - Remove personnel from company
export async function POST(req: NextRequest) {
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
    if (!decoded || !['admin', 'administrator', 'director', 'staff'].includes(decoded.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. You need appropriate permissions to unassign personnel.' },
        { status: 403 }
      );
    }

    // Parse request body
    const data = await req.json();
    const { personnelIds } = data;

    if (!personnelIds || !Array.isArray(personnelIds) || personnelIds.length === 0) {
      return NextResponse.json(
        { error: 'No personnel selected for unassignment' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Find the personnel records first to get their current companies
    const personnelRecords = await Personnel.find({
      _id: { $in: personnelIds.map(id => new mongoose.Types.ObjectId(id)) }
    });

    // Create a map of company IDs to count of personnel being removed
    const companyCountMap = new Map<string, number>();
    
    // Count personnel by company
    personnelRecords.forEach(person => {
      if (person.company) {
        const companyId = person.company.toString();
        companyCountMap.set(companyId, (companyCountMap.get(companyId) || 0) + 1);
      }
    });

    // Update personnel records to remove company assignment
    const result = await Personnel.updateMany(
      { _id: { $in: personnelIds.map(id => new mongoose.Types.ObjectId(id)) } },
      { $set: { company: null } }
    );

    // Update company statistics for each affected company
    const companyUpdates = [];
    for (const [companyId, count] of companyCountMap.entries()) {
      companyUpdates.push(
        Company.updateOne(
          { _id: new mongoose.Types.ObjectId(companyId) },
          { 
            $inc: { totalPersonnel: -count },
            $set: { updatedAt: new Date() }
          }
        )
      );
    }

    // Wait for all company updates to complete
    if (companyUpdates.length > 0) {
      await Promise.all(companyUpdates);
    }

    return NextResponse.json({
      success: true,
      message: 'Personnel unassigned from company successfully',
      count: result.modifiedCount
    });
  } catch (error: any) {
    console.error('Error unassigning personnel from company:', error);
    return NextResponse.json(
      { error: 'Error unassigning personnel from company: ' + error.message },
      { status: 500 }
    );
  }
} 