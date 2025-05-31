import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Personnel from '@/models/Personnel';
import { Company } from '@/models/Company';
import { verifyJWT } from '@/utils/auth';
import mongoose from 'mongoose';

// GET /api/personnel/company/[company] - Get personnel assigned to a specific company
export async function GET(
  req: NextRequest,
  { params }: { params: { company: string } }
) {
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
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Get company slug from URL params
    const companySlug = params.company;
    
    if (!companySlug) {
      return NextResponse.json(
        { error: 'Company slug is required' },
        { status: 400 }
      );
    }
    
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
        { success: true, data: [], message: `Company "${companyName}" not found` }
      );
    }
    
    // Find personnel assigned to this company
    const personnel = await Personnel.find({ company: company._id })
      .select('_id name rank serviceNumber email status')
      .sort({ name: 1 });
    
    // Map results
    const formattedPersonnel = personnel.map(person => ({
      id: person._id.toString(),
      name: person.name,
      rank: person.rank,
      serviceNumber: person.serviceNumber,
      email: person.email,
      status: person.status
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedPersonnel,
      count: formattedPersonnel.length,
      company: {
        id: company._id.toString(),
        name: company.name,
        code: company.code
      }
    });
  } catch (error: any) {
    console.error('Error fetching company personnel:', error);
    return NextResponse.json(
      { error: 'Error fetching company personnel: ' + error.message },
      { status: 500 }
    );
  }
} 