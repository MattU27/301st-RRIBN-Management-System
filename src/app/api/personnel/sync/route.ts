import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import mongoose from 'mongoose';
import { verifyJWT } from '@/utils/auth';
import Personnel from '@/models/Personnel';
import Company from '@/models/Company';

// Status mapping from database values to UI display values
const STATUS_MAPPING = {
  "Active": "Ready",
  "Inactive": "Retired",
  "Deployed": "Standby",
  "Pending": "Standby"
};

// Essential companies that should always be included in the system
const ESSENTIAL_COMPANIES = [
  'Alpha',
  'Bravo',
  'Charlie',
  'Headquarters',
  'NERRSC (NERR-Signal Company)',
  'NERRFAB (NERR-Field Artillery Battery)'
];

// POST /api/personnel/sync - Synchronize personnel statuses
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
    if (!decoded || !['staff', 'admin', 'administrator', 'director'].includes(decoded.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. You need appropriate permissions to sync personnel data.' },
        { status: 403 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // 1. Standardize personnel status values for UI consistency
    const updateOperations = [];
    
    for (const [dbStatus, uiStatus] of Object.entries(STATUS_MAPPING)) {
      const result = await Personnel.updateMany(
        { status: dbStatus },
        { $set: { status: uiStatus } }
      );
      
      updateOperations.push({
        from: dbStatus,
        to: uiStatus,
        count: result.modifiedCount
      });
    }
    
    // 2. Get all companies from database first
    const companies = await Company.find();
    const companyUpdates = [];
    
    // Create a map of company names to their database records
    const companyMap = new Map();
    for (const company of companies) {
      companyMap.set(company.name, company);
    }
    
    // Process all companies including essential ones
    const allCompaniesToProcess = new Set([
      ...companies.map(c => c.name),
      ...ESSENTIAL_COMPANIES
    ]);
    
    // Find all unique company names/identifiers in personnel records
    const personnelCompanyAggregation = await Personnel.aggregate([
      {
        $group: {
          _id: "$company",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Add any company identifier from personnel records to our processing list
    for (const companyGroup of personnelCompanyAggregation) {
      // Handle both string company names and ObjectId references
      if (companyGroup._id) {
        // If it's an ObjectId, try to find the company name
        if (typeof companyGroup._id === 'object' && companyGroup._id !== null) {
          try {
            const companyObj = await Company.findById(companyGroup._id);
            if (companyObj && companyObj.name) {
              allCompaniesToProcess.add(companyObj.name);
            }
          } catch (error) {
            console.error(`Error processing company ObjectId ${companyGroup._id}:`, error);
          }
        } else if (typeof companyGroup._id === 'string') {
          // If it's already a string name
          allCompaniesToProcess.add(companyGroup._id);
        }
      }
    }
    
    // Process each company for statistics updates
    for (const companyName of allCompaniesToProcess) {
      // Skip empty company names
      if (!companyName) continue;
      
      // Count personnel with exact company name match
      const companyQuery = { company: companyName };
      const totalCount = await Personnel.countDocuments(companyQuery);
      const activeCount = await Personnel.countDocuments({ 
        ...companyQuery, 
        status: "Ready" 
      });
      
      const company = companyMap.get(companyName);
      
      if (company) {
        // Update existing company
        await Company.updateOne(
          { _id: company._id },
          { 
            $set: { 
              totalPersonnel: totalCount,
              activePersonnel: activeCount,
              updatedAt: new Date()
            } 
          }
        );
      } else if (ESSENTIAL_COMPANIES.includes(companyName)) {
        // Create a new company entry for essential companies if they don't exist
        try {
          const companyCode = companyName
            .replace(/\(.*\)/g, '')
            .trim()
            .substring(0, 3)
            .toUpperCase();
            
          const newCompany = await Company.create({
            name: companyName,
            code: companyCode,
            totalPersonnel: totalCount,
            activePersonnel: activeCount,
            readinessScore: 0,
            documentsComplete: 0,
            trainingsComplete: 0
          });
          
          companyMap.set(companyName, newCompany);
        } catch (error) {
          console.error(`Error creating company ${companyName}:`, error);
        }
      }
      
      companyUpdates.push({
        name: companyName,
        totalCount,
        activeCount
      });
    }
    
    // 3. Fix personnel with company names instead of references
    // Standardize personnel company values for UI consistency
    // Find all personnel with string company names and update them
    const personnelWithStringCompanies = await Personnel.find({
      company: { $type: "string" }
    });

    console.log(`Found ${personnelWithStringCompanies.length} personnel with string company names`);

    // Create a map for company name to company ID lookups
    const companyNameToIdMap = new Map();
    const allCompanies = await Company.find({});
    allCompanies.forEach(company => {
      companyNameToIdMap.set(company.name, company._id);
    });

    // Update each personnel with string company name
    for (const person of personnelWithStringCompanies) {
      const companyName = person.company;
      
      // Try to find the corresponding company
      let companyId = null;
      
      // Exact match
      if (companyNameToIdMap.has(companyName)) {
        companyId = companyNameToIdMap.get(companyName);
      } else {
        // Try case-insensitive match
        for (const [name, id] of companyNameToIdMap.entries()) {
          if (name.toLowerCase() === companyName.toLowerCase()) {
            companyId = id;
            break;
          }
        }
      }
      
      // Update the personnel with company ID or set to null if not found
      await Personnel.updateOne(
        { _id: person._id },
        { $set: { company: companyId } }
      );
    }

    console.log('Fixed personnel company references');
    
    return NextResponse.json({
      success: true,
      message: 'Personnel statuses synchronized successfully',
      data: {
        statusUpdates: updateOperations,
        companyUpdates: companyUpdates.length,
        personnelWithInvalidCompanies: personnelWithStringCompanies.length
      }
    });
    
  } catch (error: any) {
    console.error('Error synchronizing personnel statuses:', error);
    return NextResponse.json(
      { error: 'Error synchronizing personnel statuses: ' + error.message },
      { status: 500 }
    );
  }
}

// GET /api/personnel/sync - Get current status statistics
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
    
    // Get current status counts
    const statusCounts = await Personnel.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Get personnel counts per company - handle both ObjectId and string references
    const companyStats = await Personnel.aggregate([
      {
        $lookup: {
          from: 'companies',
          localField: 'company',
          foreignField: '_id',
          as: 'companyInfo'
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $isArray: "$companyInfo" },
              { $cond: [{ $gt: [{ $size: "$companyInfo" }, 0] }, { $arrayElemAt: ["$companyInfo.name", 0] }, "$company"] },
              "$company"
            ]
          },
          total: { $sum: 1 },
          active: {
            $sum: {
              $cond: [{ $eq: ["$status", "Ready"] }, 1, 0]
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Get company specific stats from companies collection
    const companyDocs = await Company.find({}).sort({ name: 1 });
    
    // Format company stats for response
    const formattedCompanyStats = companyDocs.map(company => ({
      name: company.name,
      code: company.code,
      totalPersonnel: company.totalPersonnel,
      activePersonnel: company.activePersonnel,
      readinessScore: company.readinessScore,
      documentsComplete: company.documentsComplete,
      trainingsComplete: company.trainingsComplete
    }));
    
    // Find personnel with string company names - useful for diagnostics
    const personnelWithStringCompanies = await Personnel.countDocuments({
      company: { $type: "string" }
    });
    
    // Make sure all essential companies are accounted for
    const essentialCompanyData = await Promise.all(ESSENTIAL_COMPANIES.map(async (name) => {
      const company = await Company.findOne({ name });
      return {
        name,
        exists: !!company,
        personnelCount: await Personnel.countDocuments({ company: name })
      };
    }));
    
    return NextResponse.json({
      success: true,
      statusCounts,
      companyStats: companyStats.map(stat => ({
        company: stat._id || 'Unknown',
        total: stat.total,
        active: stat.active
      })),
      companies: formattedCompanyStats,
      diagnostics: {
        personnelWithStringCompanies,
        essentialCompanies: essentialCompanyData
      }
    });
  } catch (error: any) {
    console.error('Error getting personnel stats:', error);
    return NextResponse.json(
      { error: 'Error getting personnel stats: ' + error.message },
      { status: 500 }
    );
  }
} 