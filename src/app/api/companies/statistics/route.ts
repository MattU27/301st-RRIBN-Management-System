import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Company } from '@/models/Company';
import { verifyJWT } from '@/utils/auth';
import mongoose from 'mongoose';

// List of approved companies
const APPROVED_COMPANIES = [
  'Alpha',
  'Bravo',
  'Charlie',
  'Headquarters',
  'NERRSC (NERR-Signal Company)',
  'NERRFAB (NERR-Field Artillery Battery)'
];

// Company statistics interface
interface CompanyStats {
  name: string;
  totalPersonnel: number;
  activePersonnel: number;
  readinessScore: number;
  documentsComplete: number;
  trainingsComplete: number;
}

// GET /api/companies/statistics - Get companies with statistics
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
    if (!decoded || !['staff',  'administrator', 'director'].includes(decoded.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. You need staff, admin, or director permissions to access this endpoint.' },
        { status: 403 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Check if we have a valid connection
    if (!mongoose.connection || !mongoose.connection.db) {
      throw new Error('Database connection not established');
    }

    // Get company data with personnel counts from the User collection
    const companyStats = await mongoose.connection.db.collection('users').aggregate([
      { 
        $match: { 
          isArchived: { $ne: true },
          company: { $in: APPROVED_COMPANIES, $ne: null, $exists: true } 
        } 
      },
      {
        $group: {
          _id: '$company',
          totalPersonnel: { $sum: 1 },
          activePersonnel: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'active'] }, 1, 0] 
            } 
          }
        }
      }
    ]).toArray();

    // Get document and training statistics
    const companies = await Company.find({ name: { $in: APPROVED_COMPANIES } }).lean();

    // Create a map of all approved companies (ensuring all companies are present even if no stats)
    const companiesMap: Record<string, CompanyStats> = {};
    
    // Initialize the map with default values
    APPROVED_COMPANIES.forEach(name => {
      companiesMap[name] = {
        name,
        totalPersonnel: 0,
        activePersonnel: 0,
        readinessScore: 0,
        documentsComplete: 0,
        trainingsComplete: 0,
      };
    });

    // Merge company info from database
    companies.forEach(company => {
      const companyName = company.name as string;
      if (companiesMap[companyName]) {
        companiesMap[companyName].readinessScore = company.readinessScore || 0;
        companiesMap[companyName].documentsComplete = company.documentsComplete || 0;
        companiesMap[companyName].trainingsComplete = company.trainingsComplete || 0;
      }
    });

    // Merge personnel stats
    companyStats.forEach(stat => {
      const companyName = stat._id as string;
      if (companiesMap[companyName]) {
        companiesMap[companyName].totalPersonnel = stat.totalPersonnel || 0;
        companiesMap[companyName].activePersonnel = stat.activePersonnel || 0;
      }
    });

    // Convert map back to array
    const companiesWithStats = Object.values(companiesMap);

    // Retrieve all companies from the database
    const allCompanies = await Company.find({}).lean();
    console.log(`Found ${allCompanies.length} companies in database`);
    allCompanies.forEach(company => {
      console.log(`- ${company.name}: Total=${company.totalPersonnel}, Active=${company.activePersonnel}`);
    });

    return NextResponse.json({
      success: true,
      data: companiesWithStats
    });
  } catch (error: any) {
    console.error('Error retrieving company statistics:', error);
    return NextResponse.json(
      { error: 'Error retrieving company statistics: ' + error.message },
      { status: 500 }
    );
  }
} 