import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Company } from '@/models/Company';
import { verifyJWT } from '@/utils/auth';

// GET /api/companies - Get all companies
export async function GET(req: NextRequest) {
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
    if (!decoded || !['staff', 'admin', 'director'].includes(decoded.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. You need staff, admin, or director permissions to access this endpoint.' },
        { status: 403 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Get query parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const page = parseInt(url.searchParams.get('page') || '1');
    const sort = url.searchParams.get('sort') || 'name';
    const order = url.searchParams.get('order') === 'desc' ? -1 : 1;
    
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Fetch companies with pagination
    const companies = await Company.find({})
      .sort({ [sort]: order })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await Company.countDocuments({});

    return NextResponse.json({
      success: true,
      data: companies,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { error: 'Error fetching companies: ' + error.message },
      { status: 500 }
    );
  }
}

// POST /api/companies - Create a new company
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
    if (!decoded || !['admin', 'director'].includes(decoded.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Only administrators and directors can create companies.' },
        { status: 403 }
      );
    }

    // Parse the request body
    const data = await req.json();
    
    // Validate required fields
    if (!data.name || !data.code) {
      return NextResponse.json(
        { error: 'Name and code are required fields' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Check if company with same name or code already exists
    const existingCompany = await Company.findOne({
      $or: [
        { name: data.name },
        { code: data.code }
      ]
    });

    if (existingCompany) {
      return NextResponse.json(
        { error: 'A company with this name or code already exists' },
        { status: 409 }
      );
    }

    // Create new company
    const company = new Company({
      name: data.name,
      code: data.code,
      description: data.description,
      location: data.location,
      commandingOfficer: data.commandingOfficer,
      totalPersonnel: data.totalPersonnel || 0,
      activePersonnel: data.activePersonnel || 0,
      readinessScore: data.readinessScore || 0,
      documentsComplete: data.documentsComplete || 0,
      trainingsComplete: data.trainingsComplete || 0
    });

    // Save to database
    await company.save();

    return NextResponse.json({
      success: true,
      message: 'Company created successfully',
      data: company
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating company:', error);
    return NextResponse.json(
      { error: 'Error creating company: ' + error.message },
      { status: 500 }
    );
  }
}

// PUT /api/companies - Bulk update companies (used for sync)
export async function PUT(req: NextRequest) {
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
    if (!decoded || !['admin', 'director'].includes(decoded.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Only administrators and directors can bulk update companies.' },
        { status: 403 }
      );
    }

    // Parse the request body
    const data = await req.json();
    
    if (!Array.isArray(data.companies) || data.companies.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request. Expected companies array.' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Process each company update using bulk operations
    const operations = data.companies.map((company: any) => {
      if (!company.code) {
        throw new Error('Each company must have a code field');
      }
      
      return {
        updateOne: {
          filter: { code: company.code },
          update: { $set: company },
          upsert: true // Create if doesn't exist
        }
      };
    });

    // Execute bulk operation
    const result = await Company.bulkWrite(operations);

    return NextResponse.json({
      success: true,
      message: 'Companies updated successfully',
      result: {
        matched: result.matchedCount,
        modified: result.modifiedCount,
        upserted: result.upsertedCount
      }
    });
  } catch (error: any) {
    console.error('Error updating companies:', error);
    return NextResponse.json(
      { error: 'Error updating companies: ' + error.message },
      { status: 500 }
    );
  }
} 