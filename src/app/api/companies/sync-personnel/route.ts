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

// POST /api/companies/sync-personnel - Synchronize company personnel relationships
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
        { error: 'Unauthorized. You need appropriate permissions to sync company-personnel data.' },
        { status: 403 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Check if we have a valid connection
    if (!mongoose.connection || !mongoose.connection.db) {
      throw new Error('Database connection not established');
    }
    
    // 1. Ensure all approved companies exist in the database
    const existingCompanies = await Company.find({ name: { $in: APPROVED_COMPANIES } });
    const existingCompanyNames = existingCompanies.map(c => c.name);
    
    // Create any missing companies
    const missingCompanies = APPROVED_COMPANIES.filter(name => !existingCompanyNames.includes(name));
    const companyCreations = [];
    
    for (const companyName of missingCompanies) {
      const companyCode = companyName
        .replace(/\(.*\)/g, '')
        .trim()
        .split(' ')[0]
        .toUpperCase();
        
      companyCreations.push(
        Company.create({
          name: companyName,
          code: companyCode,
          totalPersonnel: 0,
          activePersonnel: 0,
          readinessScore: 0,
          documentsComplete: 0,
          trainingsComplete: 0
        })
      );
    }
    
    // Wait for all company creations to complete
    if (companyCreations.length > 0) {
      await Promise.all(companyCreations);
      console.log(`Created ${companyCreations.length} missing companies`);
    }
    
    // 2. Make sure companies have ObjectId references
    // Get all companies (including newly created ones)
    const allCompanies = await Company.find({ name: { $in: APPROVED_COMPANIES } });
    const companyIdMap = new Map();
    
    // Create a map of company names to their ObjectIds
    allCompanies.forEach(company => {
      companyIdMap.set(company.name, company._id);
    });
    
    // 3. Update personnel records to use company ObjectIds instead of string names
    const personnelUpdates = [];
    const personnelWithStringCompanies = await Personnel.find({
      company: { $in: APPROVED_COMPANIES }
    });
    
    console.log(`Found ${personnelWithStringCompanies.length} personnel with string company names`);
    
    for (const personnel of personnelWithStringCompanies) {
      const companyName = personnel.company;
      
      // Try exact match first
      let companyId = null;
      const company = await Company.findOne({ name: companyName });
      
      if (company) {
        companyId = company._id;
      } else {
        // Try case-insensitive match
        const alternativeCompany = await Company.findOne({ 
          name: { $regex: new RegExp('^' + companyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') } 
        });
        if (alternativeCompany) {
          companyId = alternativeCompany._id;
        }
      }
      
      if (companyId) {
        personnelUpdates.push(
          Personnel.updateOne(
            { _id: personnel._id },
            { $set: { company: companyId } }
          )
        );
      }
    }
    
    // Wait for all personnel updates to complete
    let updatedPersonnelCount = 0;
    if (personnelUpdates.length > 0) {
      const results = await Promise.all(personnelUpdates);
      updatedPersonnelCount = results.reduce((acc, result) => acc + result.modifiedCount, 0);
      console.log(`Updated company references for ${updatedPersonnelCount} personnel records`);
    }
    
    // 4. Update company statistics based on personnel data
    const companyUpdates = [];
    
    for (const company of allCompanies) {
      // Count personnel assigned to this company
      const companyId = company._id;
      const totalCount = await Personnel.countDocuments({ company: companyId });
      const activeCount = await Personnel.countDocuments({ 
        company: companyId,
        status: { $in: ["Ready", "Active"] }
      });
      
      companyUpdates.push(
        Company.updateOne(
          { _id: companyId },
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
    let updatedCompaniesCount = 0;
    if (companyUpdates.length > 0) {
      const results = await Promise.all(companyUpdates);
      updatedCompaniesCount = results.reduce((acc, result) => acc + result.modifiedCount, 0);
      console.log(`Updated statistics for ${updatedCompaniesCount} companies`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Company-personnel relationship synchronized successfully',
      data: {
        createdCompanies: companyCreations.length,
        updatedPersonnel: updatedPersonnelCount,
        updatedCompanies: updatedCompaniesCount
      }
    });
  } catch (error: any) {
    console.error('Error synchronizing company-personnel relationship:', error);
    return NextResponse.json(
      { error: 'Error synchronizing company-personnel relationship: ' + error.message },
      { status: 500 }
    );
  }
} 