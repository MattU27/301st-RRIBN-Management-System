import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { verifyJWT } from '@/utils/auth';
import Company from '@/models/Company';
import Personnel from '@/models/Personnel';

// GET /api/personnel/company-distribution - get personnel distribution by company
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
    
    // Get all companies
    const companies = await Company.find({}).lean();
    console.log(`Found ${companies.length} companies for distribution`);
    
    // Define essential companies that should always be included
    const essentialCompanies = [
      'Alpha', 
      'Bravo', 
      'Charlie', 
      'Headquarters', 
      'NERRFAB (NERR-Field Artillery Battery)', 
      'NERRSC (NERR-Signal Company)'
    ];
    
    // For each company, get the count of personnel
    const companyDistribution = [];
    
    // First, process all companies from database
    for (const company of companies) {
      // Skip companies without a name (shouldn't happen but just in case)
      if (!company.name) continue;
      
      // Get personnel counts
      const personnelCount = await Personnel.countDocuments({ company: company.name });
      const activeCount = await Personnel.countDocuments({ 
        company: company.name, 
        status: "Ready" 
      });
      
      companyDistribution.push({
        name: company.name,
        count: personnelCount,
        activeCount: activeCount
      });
    }
    
    // Ensure all essential companies are included, even if they have zero personnel
    for (const companyName of essentialCompanies) {
      if (!companyDistribution.some(c => c.name === companyName)) {
        companyDistribution.push({
          name: companyName,
          count: 0,
          activeCount: 0
        });
      }
    }
    
    // Sort by company name
    companyDistribution.sort((a, b) => a.name.localeCompare(b.name));
    
    return NextResponse.json({
      success: true,
      data: companyDistribution
    });
    
  } catch (error: any) {
    console.error('Error getting company distribution:', error);
    return NextResponse.json(
      { error: 'Error getting company distribution: ' + error.message },
      { status: 500 }
    );
  }
} 