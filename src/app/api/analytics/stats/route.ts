import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Personnel from '@/models/Personnel';
import Company from '@/models/Company';
import Document, { DocumentStatus } from '@/models/Document';
import Training, { TrainingStatus } from '@/models/Training';
import { validateToken } from '@/lib/auth';
import { PersonnelStatus } from '@/models/Personnel';

// Define route segment config
export const dynamic = 'force-dynamic';
export const revalidate = 0; // This means do not cache
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    // Connect to the database
    await connectToDatabase();
    
    // Validate user token
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication token is required' }, { status: 401 });
    }
    
    const decoded = await validateToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }
    
    // Fetch the user to check their role
    const user = await Personnel.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }
    
    // Only allow director to access analytics
    if (user.role !== 'director') {
      return NextResponse.json({ 
        success: false, 
        message: 'Access denied. Only directors can access analytics data.' 
      }, { status: 403 });
    }
    
    // Fetch analytics data
    
    // 1. Personnel analytics
    const totalPersonnelCount = await Personnel.countDocuments();
    const activePersonnelCount = await Personnel.countDocuments({ status: PersonnelStatus.READY });
    const standbyPersonnelCount = await Personnel.countDocuments({ status: PersonnelStatus.STANDBY });
    const retiredPersonnelCount = await Personnel.countDocuments({ status: PersonnelStatus.RETIRED });
    
    // 2. Company readiness data
    const companies = await Company.find().select('name readinessScore totalPersonnel activePersonnel documentsComplete trainingsComplete');
    
    // 3. Document analytics
    const totalDocuments = await Document.countDocuments();
    const pendingDocuments = await Document.countDocuments({ status: DocumentStatus.PENDING });
    const verifiedDocuments = await Document.countDocuments({ status: DocumentStatus.VERIFIED });
    const documentCompletionRate = totalDocuments > 0 
      ? Math.round((verifiedDocuments / totalDocuments) * 100) 
      : 0;
    
    // 4. Training analytics
    const upcomingTrainings = await Training.countDocuments({ status: TrainingStatus.UPCOMING });
    const completedTrainings = await Training.countDocuments({ status: TrainingStatus.COMPLETED });
    const totalTrainings = await Training.countDocuments();
    
    // Calculate training participation rate
    const totalRegistrations = await Training.aggregate([
      { $unwind: "$attendees" },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]);
    
    const completedRegistrations = await Training.aggregate([
      { $unwind: "$attendees" },
      { $match: { "attendees.status": "completed" } },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]);
    
    const trainingParticipationRate = totalRegistrations.length > 0 && completedRegistrations.length > 0
      ? Math.round((completedRegistrations[0].count / totalRegistrations[0].count) * 100)
      : 0;
    
    // 5. Get recent training completion rates by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyTrainingCompletion = await Training.aggregate([
      { $match: { 
        status: TrainingStatus.COMPLETED,
        endDate: { $gte: sixMonthsAgo }
      }},
      { $group: {
        _id: { 
          year: { $year: "$endDate" },
          month: { $month: "$endDate" }
        },
        count: { $sum: 1 }
      }},
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);
    
    // 6. Personnel distribution by company
    const personnelByCompany = await Personnel.aggregate([
      { $group: {
        _id: "$company",
        count: { $sum: 1 }
      }},
      { $lookup: {
        from: "companies",
        localField: "_id",
        foreignField: "_id",
        as: "companyInfo"
      }},
      { $unwind: "$companyInfo" },
      { $project: {
        _id: 0,
        company: "$companyInfo.name",
        count: 1
      }}
    ]);
    
    // 7. Get risk assessment - companies with low readiness scores
    const lowReadinessCompanies = await Company.find({ readinessScore: { $lt: 70 } })
      .select('name readinessScore documentsComplete trainingsComplete')
      .sort({ readinessScore: 1 })
      .limit(3);
    
    // 8. Document backlog by company
    const documentBacklog = await Document.aggregate([
      { $match: { status: DocumentStatus.PENDING } },
      { $lookup: {
        from: "personnels",
        localField: "userId",
        foreignField: "_id",
        as: "userInfo"
      }},
      { $unwind: "$userInfo" },
      { $lookup: {
        from: "companies",
        localField: "userInfo.company",
        foreignField: "_id",
        as: "companyInfo"
      }},
      { $unwind: { path: "$companyInfo", preserveNullAndEmptyArrays: true } },
      { $group: {
        _id: "$userInfo.company",
        company: { $first: "$companyInfo.name" },
        count: { $sum: 1 }
      }},
      { $project: {
        _id: 0,
        company: 1,
        count: 1
      }}
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        personnel: {
          total: totalPersonnelCount,
          active: activePersonnelCount,
          standby: standbyPersonnelCount,
          retired: retiredPersonnelCount,
          activeRate: totalPersonnelCount > 0 ? Math.round((activePersonnelCount / totalPersonnelCount) * 100) : 0
        },
        companies: companies.map(company => ({
          name: company.name,
          readinessScore: company.readinessScore,
          totalPersonnel: company.totalPersonnel,
          activePersonnel: company.activePersonnel,
          documentsComplete: company.documentsComplete,
          trainingsComplete: company.trainingsComplete
        })),
        documents: {
          total: totalDocuments,
          pending: pendingDocuments,
          verified: verifiedDocuments,
          completionRate: documentCompletionRate
        },
        trainings: {
          upcoming: upcomingTrainings,
          completed: completedTrainings,
          total: totalTrainings,
          participationRate: trainingParticipationRate,
          monthlyCompletion: monthlyTrainingCompletion.map(item => ({
            year: item._id.year,
            month: item._id.month,
            count: item.count
          }))
        },
        distribution: {
          personnelByCompany
        },
        risks: {
          lowReadinessCompanies,
          documentBacklog
        }
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error in analytics stats API:', error);
    return NextResponse.json({ 
      success: false,  
      message: 'Failed to fetch analytics data', 
      error: (error as Error).message 
    }, { status: 500 });
  }
} 