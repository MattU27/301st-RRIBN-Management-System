import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Personnel from '@/models/Personnel';
import Company from '@/models/Company';
import Document from '@/models/Document';
import Training from '@/models/Training';
import { validateToken } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    await connectToDatabase();

    // Verify authentication
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const decoded = await validateToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ success: false, message: 'Invalid authentication token' }, { status: 401 });
    }

    // Fetch user information to check role
    const user = await Personnel.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Only directors can access analytics
    if (user.role !== 'director') {
      return NextResponse.json({ success: false, message: 'Unauthorized access to analytics' }, { status: 403 });
    }

    // Get actual data from the database to inform our predictions
    const companies = await Company.find({}).sort({ name: 1 });
    const companyIds = companies.map(company => company._id);
    
    // Get personnel count by company
    const personnelCounts = await Promise.all(
      companyIds.map(async (companyId) => {
        const count = await Personnel.countDocuments({ company: companyId });
        return { companyId, count };
      })
    );

    // Get document compliance rates
    const documentStats = await Document.aggregate([
      {
        $group: {
          _id: '$company',
          total: { $sum: 1 },
          verified: { 
            $sum: { 
              $cond: [
                { $eq: ['$status', 'verified'] }, 
                1, 
                0
              ] 
            } 
          }
        }
      }
    ]);

    // Map company IDs to names for better readability
    const companyMap = companies.reduce((acc, company) => {
      acc[company._id.toString()] = company.name;
      return acc;
    }, {} as Record<string, string>);

    // Calculate current overall readiness based on document verification and training completion
    const companyReadiness = await Promise.all(
      companyIds.map(async (companyId) => {
        const docStat = documentStats.find((stat: any) => stat._id && stat._id.toString() === companyId.toString());
        const docComplianceRate = docStat ? (docStat.verified / docStat.total) * 100 : 0;
        
        // Get training completion rate
        const personnelInCompany = await Personnel.find({ company: companyId });
        const personnelIds = personnelInCompany.map((p: any) => p._id);
        
        let trainingCompletionRate = 0;
        if (personnelIds.length > 0) {
          const completedTrainings = await Training.countDocuments({
            participant: { $in: personnelIds },
            status: 'completed'
          });
          
          const totalTrainings = await Training.countDocuments({
            participant: { $in: personnelIds }
          });
          
          trainingCompletionRate = totalTrainings > 0 ? (completedTrainings / totalTrainings) * 100 : 0;
        }
        
        // Calculate overall readiness (weighted average of document compliance and training completion)
        const readinessScore = Math.round((docComplianceRate * 0.6) + (trainingCompletionRate * 0.4));
        
        return {
          companyId,
          name: companyMap[companyId.toString()],
          currentReadiness: readinessScore
        };
      })
    );

    // Generate predictive data based on current statistics
    const predictiveData = {
      readinessProjection: {
        organizations: companyReadiness.map(company => {
          // Generate projections with slight improvements each month
          const projected = [
            { month: 'Jul', value: Math.min(100, Math.round(company.currentReadiness + 2)) },
            { month: 'Aug', value: Math.min(100, Math.round(company.currentReadiness + 4)) },
            { month: 'Sep', value: Math.min(100, Math.round(company.currentReadiness + 6)) },
            { month: 'Oct', value: Math.min(100, Math.round(company.currentReadiness + 8)) },
            { month: 'Nov', value: Math.min(100, Math.round(company.currentReadiness + 10)) },
            { month: 'Dec', value: Math.min(100, Math.round(company.currentReadiness + 12)) }
          ];
          
          return {
            name: company.name,
            current: company.currentReadiness,
            projected
          };
        }),
        overallProjection: [
          { month: 'Jul', value: calculateOverallReadiness(companyReadiness, 2) },
          { month: 'Aug', value: calculateOverallReadiness(companyReadiness, 4) },
          { month: 'Sep', value: calculateOverallReadiness(companyReadiness, 6) },
          { month: 'Oct', value: calculateOverallReadiness(companyReadiness, 8) },
          { month: 'Nov', value: calculateOverallReadiness(companyReadiness, 10) },
          { month: 'Dec', value: calculateOverallReadiness(companyReadiness, 12) }
        ]
      },
      
      personnelTrends: {
        projectedGrowth: [
          { month: 'Jul', value: 1.2 },
          { month: 'Aug', value: 2.5 },
          { month: 'Sep', value: 1.8 },
          { month: 'Oct', value: -0.5 },
          { month: 'Nov', value: 0.8 },
          { month: 'Dec', value: 3.2 }
        ],
        attritionRisk: companyReadiness.map((company, index) => {
          // Companies with lower readiness scores have higher attrition risk
          const baseRisk = 100 - company.currentReadiness;
          // Add some variability
          const risk = Math.max(5, Math.min(95, baseRisk + (Math.random() * 20 - 10)));
          
          return {
            company: company.name,
            risk: Math.round(risk),
            personnel: personnelCounts.find(pc => pc.companyId.toString() === company.companyId.toString())?.count || 0
          };
        })
      },
      
      documentCompliance: {
        complianceTrend: [
          { month: 'Jul', value: calculateDocumentComplianceTrend(documentStats, 1) },
          { month: 'Aug', value: calculateDocumentComplianceTrend(documentStats, 2) },
          { month: 'Sep', value: calculateDocumentComplianceTrend(documentStats, 3) },
          { month: 'Oct', value: calculateDocumentComplianceTrend(documentStats, 4) },
          { month: 'Nov', value: calculateDocumentComplianceTrend(documentStats, 5) },
          { month: 'Dec', value: calculateDocumentComplianceTrend(documentStats, 6) }
        ],
        riskAssessment: generateComplianceRiskAssessment(documentStats, companyReadiness)
      }
    };

    return NextResponse.json({
      success: true,
      data: predictiveData
    });
  } catch (error) {
    console.error('Error in predictive analytics API:', error);
    return NextResponse.json({ success: false, message: 'An error occurred while generating predictive analytics' }, { status: 500 });
  }
}

// Helper functions for calculations

function calculateOverallReadiness(companyReadiness: any[], increment: number): number {
  if (companyReadiness.length === 0) return 0;
  
  let totalReadiness = 0;
  let totalCompanies = companyReadiness.length;
  
  for (const company of companyReadiness) {
    // Add projected improvement for each company
    totalReadiness += Math.min(100, company.currentReadiness + increment);
  }
  
  return Math.round(totalReadiness / totalCompanies);
}

function calculateDocumentComplianceTrend(documentStats: any[], monthsAhead: number): number {
  // Calculate current document compliance rate
  let totalDocs = 0;
  let totalVerified = 0;
  
  documentStats.forEach((stat: any) => {
    totalDocs += stat.total || 0;
    totalVerified += stat.verified || 0;
  });
  
  const currentCompliance = totalDocs > 0 ? (totalVerified / totalDocs) * 100 : 0;
  
  // Project improved compliance with diminishing returns
  const improvementFactor = 1 / (1 + (0.1 * monthsAhead));
  const maxImprovement = 15; // Maximum improvement in percentage points
  const projectedImprovement = maxImprovement * (1 - improvementFactor);
  
  return Math.min(100, Math.round(currentCompliance + projectedImprovement));
}

function generateComplianceRiskAssessment(documentStats: any[], companyReadiness: any[]): string {
  // Identify companies with the lowest document compliance
  let lowestComplianceCompany = '';
  let lowestComplianceRate = 100;
  
  documentStats.forEach((stat: any) => {
    const complianceRate = stat.total > 0 ? (stat.verified / stat.total) * 100 : 0;
    if (complianceRate < lowestComplianceRate) {
      lowestComplianceRate = complianceRate;
      const company = companyReadiness.find(c => c.companyId.toString() === stat._id?.toString());
      if (company) {
        lowestComplianceCompany = company.name;
      }
    }
  });
  
  // Generate assessment based on overall compliance
  let totalDocs = 0;
  let totalVerified = 0;
  
  documentStats.forEach((stat: any) => {
    totalDocs += stat.total || 0;
    totalVerified += stat.verified || 0;
  });
  
  const overallCompliance = totalDocs > 0 ? (totalVerified / totalDocs) * 100 : 0;
  
  if (overallCompliance >= 90) {
    return `Overall document compliance is excellent at ${Math.round(overallCompliance)}%. Focus on maintaining the current verification standards while planning for upcoming regulation changes.`;
  } else if (overallCompliance >= 75) {
    return `Overall document compliance is good at ${Math.round(overallCompliance)}%. Continue improving verification processes, with special attention to ${lowestComplianceCompany} which shows lower compliance rates.`;
  } else if (overallCompliance >= 60) {
    return `Overall document compliance needs improvement at ${Math.round(overallCompliance)}%. Consider allocating additional resources to ${lowestComplianceCompany} where compliance is significantly lower than the organizational average.`;
  } else {
    return `Document compliance is at a concerning level of ${Math.round(overallCompliance)}%. Immediate attention is required, particularly for ${lowestComplianceCompany}. Consider implementing a compliance improvement program with weekly progress reviews.`;
  }
} 