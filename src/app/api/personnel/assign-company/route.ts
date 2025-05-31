import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Personnel from '@/models/Personnel';
import { Company } from '@/models/Company';
import { verifyJWT } from '@/utils/auth';
import mongoose from 'mongoose';

// POST /api/personnel/assign-company - Assign personnel to a company
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
        { error: 'Unauthorized. You need appropriate permissions to assign personnel.' },
        { status: 403 }
      );
    }

    // Parse request body
    const data = await req.json();
    const { personnelIds, companySlug } = data;

    if (!personnelIds || !Array.isArray(personnelIds) || personnelIds.length === 0) {
      return NextResponse.json(
        { error: 'No personnel selected for assignment' },
        { status: 400 }
      );
    }

    if (!companySlug) {
      return NextResponse.json(
        { error: 'Company slug is required' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Format company name from slug
    const companyName = companySlug
      .split('-')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Find the company by name
    const company = await Company.findOne({ 
      $or: [
        { name: companyName },
        { name: { $regex: new RegExp(companyName, 'i') } }
      ]
    });

    if (!company) {
      return NextResponse.json(
        { error: `Company "${companyName}" not found` },
        { status: 404 }
      );
    }

    // Update personnel records to assign them to the company
    const result = await Personnel.updateMany(
      { _id: { $in: personnelIds.map(id => new mongoose.Types.ObjectId(id)) } },
      { $set: { company: company._id } }
    );

    // Update company statistics
    await Company.updateOne(
      { _id: company._id },
      { 
        $inc: { totalPersonnel: result.modifiedCount },
        $set: { updatedAt: new Date() }
      }
    );

    return NextResponse.json({
      success: true,
      message: `Personnel assigned to company "${company.name}" successfully`,
      count: result.modifiedCount
    });
  } catch (error: any) {
    console.error('Error assigning personnel to company:', error);
    return NextResponse.json(
      { error: 'Error assigning personnel to company: ' + error.message },
      { status: 500 }
    );
  }
} 