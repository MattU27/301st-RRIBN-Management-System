import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Personnel from '@/models/Personnel';
import { Company } from '@/models/Company';
import { verifyJWT } from '@/utils/auth';
import mongoose from 'mongoose';

// GET /api/personnel/available - Get personnel not assigned to a company or excluding specific company
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
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Check for query parameters
    const url = new URL(req.url);
    const excludeCompanySlug = url.searchParams.get('exclude');
    
    let query: any = {};
    
    if (excludeCompanySlug) {
      // Format company name from slug
      const companyName = excludeCompanySlug
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
      
      if (company) {
        // Exclude personnel from this company
        query = {
          $or: [
            { company: { $exists: false } },
            { company: null },
            { company: { $ne: company._id } }
          ]
        };
      } else {
        // If company not found, just return personnel without company
        query = {
          $or: [
            { company: { $exists: false } },
            { company: null }
          ]
        };
      }
    } else {
      // No specific company to exclude, just find personnel without company
      query = {
        $or: [
          { company: { $exists: false } },
          { company: null }
        ]
      };
    }
    
    // Find personnel matching the query
    const personnel = await Personnel.find(query)
      .select('_id name rank serviceNumber email status')
      .sort({ name: 1 })
      .limit(500);
    
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
      count: formattedPersonnel.length
    });
  } catch (error: any) {
    console.error('Error fetching available personnel:', error);
    return NextResponse.json(
      { error: 'Error fetching available personnel: ' + error.message },
      { status: 500 }
    );
  }
} 