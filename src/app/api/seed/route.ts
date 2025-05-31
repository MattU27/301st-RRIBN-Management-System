import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Company } from '@/models/Company';
import Personnel from '@/models/Personnel';
import { verifyJWT } from '@/utils/auth';
import mongoose from 'mongoose';

// Approved companies list - make sure this matches with other sync endpoints
const APPROVED_COMPANIES = [
  'Alpha',
  'Bravo',
  'Charlie',
  'Headquarters',
  'NERRSC (NERR-Signal Company)',
  'NERRFAB (NERR-Field Artillery Battery)'
];

// Ranks for random assignment
const RANKS = [
  'PFC', 'PVT', 'CPL', 'SGT', 'SSG', 
  '2LT', '1LT', 'CPT', 'MAJ', 'LTC'
];

// Sample personnel names
const NAMES = [
  'John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Williams', 
  'David Brown', 'Lisa Davis', 'Robert Miller', 'Jennifer Wilson',
  'Michael Moore', 'Linda Martin', 'James Taylor', 'Patricia Anderson',
  'Charles Thomas', 'Barbara Jackson', 'Joseph White', 'Elizabeth Harris',
  'Richard Martinez', 'Susan Robinson', 'Daniel Clark', 'Jessica Lewis',
  'Paul Walker', 'Nancy Lee', 'Mark Hall', 'Karen Young', 'Donald King'
];

// Statuses
const STATUSES = ['Ready', 'Standby', 'Retired'];

// POST /api/seed - Initialize database with sample data
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
    if (!decoded || !['admin', 'administrator', 'director'].includes(decoded.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Only administrators can seed the database.' },
        { status: 403 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // 1. Create Companies
    const companyOperations = [];
    const companyMap = new Map();
    
    // First, check for existing companies to avoid duplicate key errors
    const existingCompanies = await Company.find({});
    const existingCompanyNames = existingCompanies.map(c => c.name);
    const existingCompanyCodes = existingCompanies.map(c => c.code);
    
    for (const companyName of APPROVED_COMPANIES) {
      // Skip if company already exists
      if (existingCompanyNames.includes(companyName)) {
        const company = existingCompanies.find(c => c.name === companyName);
        companyMap.set(companyName, company);
        continue;
      }
      
      // Generate a unique code
      let companyCode = companyName
        .replace(/\(.*\)/g, '')
        .trim()
        .split(' ')[0]
        .toUpperCase();
      
      // Ensure code uniqueness by adding a suffix if needed
      let counter = 1;
      let uniqueCode = companyCode;
      while (existingCompanyCodes.includes(uniqueCode)) {
        uniqueCode = `${companyCode}${counter}`;
        counter++;
      }
      
      // Create new company
      const company = new Company({
        name: companyName,
        code: uniqueCode,
        totalPersonnel: 0,
        activePersonnel: 0,
        readinessScore: Math.floor(Math.random() * 100),
        documentsComplete: Math.floor(Math.random() * 100),
        trainingsComplete: Math.floor(Math.random() * 100),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      companyOperations.push(company.save());
      companyMap.set(companyName, company);
    }
    
    // Wait for all company creations to complete
    await Promise.all(companyOperations);
    console.log(`Created/Updated ${companyOperations.length} companies`);
    
    // 2. Create Personnel (only if none exist)
    const personnelCount = await Personnel.countDocuments();
    
    if (personnelCount === 0) {
      // Create personnel records
      const personnelOperations = [];
      
      // Distribute personnel among companies
      for (let i = 0; i < 50; i++) {
        const randomCompanyName = APPROVED_COMPANIES[Math.floor(Math.random() * APPROVED_COMPANIES.length)];
        const company = companyMap.get(randomCompanyName);
        
        const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
        const rank = RANKS[Math.floor(Math.random() * RANKS.length)];
        const name = NAMES[Math.floor(Math.random() * NAMES.length)] + ' ' + (i + 1);
        
        const personnel = new Personnel({
          name,
          rank,
          serviceNumber: `SN${100000 + i}`,
          email: `${name.toLowerCase().replace(/\s+/g, '.')}@military.gov`,
          status,
          company: company ? company._id : null,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        personnelOperations.push(personnel.save());
      }
      
      // Wait for all personnel creations to complete
      await Promise.all(personnelOperations);
      console.log(`Created ${personnelOperations.length} personnel records`);
    } else {
      console.log(`Skipped personnel creation, ${personnelCount} records already exist`);
    }
    
    // 3. Update company statistics
    const companyUpdateOperations = [];
    
    for (const company of companyMap.values()) {
      const totalCount = await Personnel.countDocuments({ company: company._id });
      const activeCount = await Personnel.countDocuments({ 
        company: company._id,
        status: { $in: ["Ready", "Active"] }
      });
      
      companyUpdateOperations.push(
        Company.updateOne(
          { _id: company._id },
          { 
            $set: { 
              totalPersonnel: totalCount,
              activePersonnel: activeCount,
              updatedAt: new Date()
            } 
          }
        )
      );
    }
    
    // Wait for all company updates to complete
    if (companyUpdateOperations.length > 0) {
      await Promise.all(companyUpdateOperations);
      console.log(`Updated statistics for ${companyUpdateOperations.length} companies`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        companies: companyOperations.length,
        personnel: personnelCount === 0 ? 50 : 0
      }
    });
  } catch (error: any) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      { error: 'Error seeding database: ' + error.message },
      { status: 500 }
    );
  }
} 