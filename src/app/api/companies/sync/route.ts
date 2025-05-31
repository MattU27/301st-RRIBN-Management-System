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

// POST /api/companies/sync - Synchronize company statistics
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
        { error: 'Unauthorized. You need appropriate permissions to sync company data.' },
        { status: 403 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Check if we have a valid connection
    if (!mongoose.connection || !mongoose.connection.db) {
      throw new Error('Database connection not established');
    }
    
    // Get personnel statistics per company
    const personnelStats = await mongoose.connection.db.collection('users').aggregate([
      { 
        $match: { 
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
    
    // Get document completion statistics from documents collection
    const documentStats = await mongoose.connection.db.collection('documents').aggregate([
      { 
        $match: { 
          status: 'verified',
          'owner.company': { $in: APPROVED_COMPANIES, $ne: null, $exists: true }
        } 
      },
      {
        $group: {
          _id: '$owner.company',
          verifiedDocuments: { $sum: 1 }
        }
      }
    ]).toArray();
    
    // Get trainings completion statistics
    const trainingStats = await mongoose.connection.db.collection('trainingattendances').aggregate([
      { 
        $match: { 
          status: 'completed',
          'user.company': { $in: APPROVED_COMPANIES, $ne: null, $exists: true }
        } 
      },
      {
        $group: {
          _id: '$user.company',
          completedTrainings: { $sum: 1 }
        }
      }
    ]).toArray();
    
    // Get or create companies and update stats
    const updateOperations = [];

    // Make sure all approved companies exist and are updated
    for (const companyName of APPROVED_COMPANIES) {
      // Find company stats
      const stat = personnelStats.find(s => s._id === companyName);
      const docStat = documentStats.find(d => d._id === companyName);
      const trainingStat = trainingStats.find(t => t._id === companyName);
      
      // Default values
      const totalPersonnel = stat?.totalPersonnel || 0;
      const activePersonnel = stat?.activePersonnel || 0;
      
      // Calculate readiness score (simple weighted average)
      const activeRate = (activePersonnel / (totalPersonnel || 1)) * 100;
      
      // Calculate document completion rate (assuming we expect about 5 docs per person)
      const expectedDocs = totalPersonnel * 5;
      const docCompletionRate = Math.min(100, ((docStat?.verifiedDocuments || 0) / (expectedDocs || 1)) * 100);
      
      // Calculate training completion (assuming we expect about 10 trainings per person)
      const expectedTrainings = totalPersonnel * 10;
      const trainingCompletionRate = Math.min(100, ((trainingStat?.completedTrainings || 0) / (expectedTrainings || 1)) * 100);
      
      // Calculate overall readiness score (weighted average)
      const readinessScore = Math.round(
        (activeRate * 0.2) + 
        (docCompletionRate * 0.3) + 
        (trainingCompletionRate * 0.5)
      );
      
      const companyCode = companyName.split(' ')[0].toUpperCase();
      
      // First check if company exists to avoid duplicate key error
      const existingCompany = await Company.findOne({ name: companyName });
      
      if (existingCompany) {
        // Update existing company
        updateOperations.push(
          Company.findOneAndUpdate(
            { _id: existingCompany._id },
            {
              $set: {
                totalPersonnel: totalPersonnel,
                activePersonnel: activePersonnel,
                readinessScore: readinessScore,
                documentsComplete: Math.round(docCompletionRate),
                trainingsComplete: Math.round(trainingCompletionRate),
                updatedAt: new Date()
              }
            },
            { new: true }
          )
        );
      } else {
        // Create new company if it doesn't exist
        updateOperations.push(
          Company.create({
            name: companyName,
            code: companyCode,
            totalPersonnel: totalPersonnel,
            activePersonnel: activePersonnel,
            readinessScore: readinessScore,
            documentsComplete: Math.round(docCompletionRate),
            trainingsComplete: Math.round(trainingCompletionRate),
            createdAt: new Date(),
            updatedAt: new Date()
          })
        );
      }
    }
    
    // Wait for all updates to complete
    await Promise.all(updateOperations);
    
    // Delete any companies that are not in the approved list
    await Company.deleteMany({ name: { $nin: APPROVED_COMPANIES } });
    
    return NextResponse.json({
      success: true,
      message: 'Company statistics synchronized successfully'
    });
  } catch (error: any) {
    console.error('Error synchronizing company statistics:', error);
    return NextResponse.json(
      { error: 'Error synchronizing company statistics: ' + error.message },
      { status: 500 }
    );
  }
} 