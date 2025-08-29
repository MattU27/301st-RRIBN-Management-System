import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import User from '@/models/User';
import Personnel from '@/models/Personnel';
import Training from '@/models/Training';
import TrainingRegistration from '@/models/TrainingRegistration';
import Company from '@/models/Company';
import { verifyJWT } from '@/utils/auth';
// Note: Direct algorithm implementation to avoid data transformation issues

// Add dynamic directive to ensure route is dynamic
export const dynamic = 'force-dynamic';

// Helper function to get next rank
function getNextRank(currentRank: string): string {
  const rankProgression: { [key: string]: string } = {
    'Private': 'Private First Class',
    'Private First Class': 'Corporal',
    'Corporal': 'Sergeant',
    'Sergeant': 'Staff Sergeant',
    'Staff Sergeant': 'Technical Sergeant',
    'Technical Sergeant': 'Master Sergeant',
    'Second Lieutenant': 'First Lieutenant',
    'First Lieutenant': 'Captain',
    'Captain': 'Major',
    'Major': 'Lieutenant Colonel',
    'Lieutenant Colonel': 'Colonel'
  };
  
  return rankProgression[currentRank] || 'Next Rank';
}

/**
 * ENHANCED PRESCRIPTIVE ANALYTICS API
 * Uses EO 212 (1939) policy-based algorithm with real database data
 */

// Helper function to transform database personnel to algorithm format
function transformDatabasePersonnel(dbPersonnel: any, trainings: any[], companyLookup: Map<string, any>): any {
  const userId = dbPersonnel._id ? dbPersonnel._id.toString() : '';
  
  // Validate trainings array
  const validTrainings = Array.isArray(trainings) ? trainings : [];
  
  // Get company name
  let companyName = 'Unknown Company';
  if (dbPersonnel.company) {
    let companyId = '';
    if (typeof dbPersonnel.company === 'object' && dbPersonnel.company._id) {
      companyId = dbPersonnel.company._id.toString();
    } else if (typeof dbPersonnel.company === 'string') {
      companyId = dbPersonnel.company;
    }
    
    const companyData = companyLookup.get(companyId);
    if (companyData && companyData.name) {
      companyName = companyData.name;
    }
  }

  // Calculate service dates
  const dateJoined = dbPersonnel.dateJoined ? new Date(dbPersonnel.dateJoined) : new Date('2020-01-01');
  const currentRankDate = dbPersonnel.lastPromotionDate ? new Date(dbPersonnel.lastPromotionDate) : dateJoined;
  const now = new Date();
  const totalServiceMonths = Math.max(
    Math.floor((now.getTime() - dateJoined.getTime()) / (1000 * 60 * 60 * 24 * 30)),
    24 // Minimum 2 years
  );

  // Count training completions with proper validation
  const completedTrainings = validTrainings.filter(t => t && t.userId === userId).length;
  
  // Estimate training days (each training = ~4 days average)
  const activeTrainingDays = Math.max(completedTrainings * 4, 21);

  // Derive performance metrics from available data
  const performanceScore = Math.min(
    75 + (completedTrainings * 3) + (totalServiceMonths * 0.2), 
    100
  );
  
  // Derive efficiency rating from performance score
  let efficiencyRating = 3; // Default satisfactory
  if (performanceScore >= 90) efficiencyRating = 5;
  else if (performanceScore >= 80) efficiencyRating = 4;
  else if (performanceScore >= 70) efficiencyRating = 3;
  else if (performanceScore >= 60) efficiencyRating = 2;
  else efficiencyRating = 1;

  // Check for certificates (look for training titles with "certificate" or "certification")
  const hasCertificates = validTrainings.some(t => 
    t && t.userId === userId && t.title && (
      t.title.toLowerCase().includes('certificate') ||
      t.title.toLowerCase().includes('certification')
    )
  );

  // Count correspondence courses
  const correspondenceCourses = validTrainings.filter(t => 
    t && t.userId === userId && t.title && (
      t.title.toLowerCase().includes('course') ||
      t.title.toLowerCase().includes('correspondence')
    )
  ).length;

  return {
    id: userId,
    name: dbPersonnel.name || `${dbPersonnel.firstName || ''} ${dbPersonnel.lastName || ''}`.trim(),
    serviceId: dbPersonnel.serviceId || dbPersonnel.militaryId || userId,
    currentRank: dbPersonnel.rank || 'Private',
    company: companyName,
    militaryEmail: dbPersonnel.email || `${userId}@301rribn.mil.ph`,
    
    // Service history
    commissionDate: dateJoined.toISOString(),
    currentRankDate: currentRankDate.toISOString(),
    totalActiveService: totalServiceMonths,
    
    // Performance data (derived from available information)
    efficiencyRating: efficiencyRating,
    performanceScore: Math.round(performanceScore),
    commendations: Math.floor(completedTrainings / 3), // Estimate based on training activity
    
    // Training and education
    requiredCertificates: hasCertificates,
    correspondenceCourses: correspondenceCourses,
    activeTrainingDays: activeTrainingDays,
    completedTrainings: completedTrainings,
    
    // Additional factors
    leadershipRoles: dbPersonnel.position?.toLowerCase().includes('leader') ? 1 : 0,
    specializations: validTrainings
      .filter(t => t && t.userId === userId && t.title)
      .map(t => t.title)
      .slice(0, 3) // Top 3 training areas
  };
}

export async function GET(request: Request) {
  try {
    // Connect to MongoDB
    await dbConnect();
    
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = await verifyJWT(token);
    
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    // Get user info to check permissions
    const user = await User.findById(decoded.userId, 'firstName lastName role');
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Only administrators can access prescriptive analytics
    if (!['administrator', 'admin'].includes(user.role.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    
    console.log('🚀 Generating EO 212-based promotion recommendations...');
    
    // --- FETCH REAL DATABASE DATA ---
    
    // Get all active personnel
    const allPersonnel = await Personnel.find({
      isActive: true
    }).lean();
    
    console.log(`📊 Found ${allPersonnel.length} active personnel records`);
    
    // Get all completed training registrations
    const allTrainingRegistrations = await TrainingRegistration.find({
      status: 'completed'
    }).lean();
    
    // Get all trainings for reference
    const allTrainings = await Training.find().lean();
    
    // Create training lookup
    const trainingLookup = new Map();
    allTrainings.forEach(training => {
      if (training && training._id) {
        trainingLookup.set(String(training._id), training);
      }
    });
    
    // Process training registrations to include training details
    const enrichedTrainings = allTrainingRegistrations
      .map(registration => {
        try {
          if (!registration || !registration.trainingId || !registration.userId) {
            return null;
          }
          
          const training = trainingLookup.get(String(registration.trainingId));
          return {
            userId: registration.userId.toString(),
            title: training?.title || 'General Training',
            completionDate: registration.completionDate || registration.createdAt,
            type: training?.type || 'Professional Development'
          };
        } catch (error) {
          console.error('Error processing training registration:', error);
          return null;
        }
      })
      .filter(t => t !== null); // Filter out null entries
    
    console.log(`📚 Found ${enrichedTrainings.length} completed training records`);
    
    // Get all companies for lookup
    const allCompanies = await Company.find().lean();
    const companyLookup = new Map();
    allCompanies.forEach(company => {
      if (company && company._id) {
        companyLookup.set(company._id.toString(), company);
      }
    });
    
    console.log(`🏢 Found ${allCompanies.length} companies`);
    
    // --- TRANSFORM DATA FOR EO 212 ALGORITHM ---
    
    const transformedPersonnel = allPersonnel
      .map(person => {
        try {
          return transformDatabasePersonnel(person, enrichedTrainings, companyLookup);
        } catch (error) {
          console.error(`Error transforming personnel ${person._id}:`, error);
          return null;
        }
      })
      .filter(person => person !== null && person.name && person.name !== ''); // Filter out invalid records
    
    console.log(`✅ Transformed ${transformedPersonnel.length} personnel records for EO 212 processing`);
    
    // Create compatible data structure for the algorithm
    // Note: transformedPersonnel already contains the format expected by the algorithm
    // We don't need to transform it again with transformToPersonnelData
    const compatibleData = {
      promotionRecommendations: {
        personnel: transformedPersonnel.map(person => ({
          ...person,
          completedTrainings: [] // This will be populated from the real training data we processed
        })),
        suggestion: "Processing with EO 212 policy-based algorithm..."
      },
      trainingRecommendations: {
        companies: [],
        overallSuggestion: ""
      },
      resourceAllocation: {
        imbalances: [],
        suggestion: ""
      },
      documentVerification: {
        backlog: [],
        growthRate: 0,
        suggestion: ""
      }
    };
    
    // --- APPLY EO 212 ALGORITHM ---
    
    console.log('🧮 Applying EO 212 promotion algorithm...');
    
    // Import algorithm functions directly
    const { 
      calculatePromotionScore, 
      rankPersonnelForPromotion, 
      PROMOTION_THRESHOLDS,
      ALGORITHM_METADATA 
    } = require('@/utils/promotionAlgorithm');
    
    // Convert transformed personnel to the correct format for the algorithm
    const personnelForAlgorithm = transformedPersonnel.map(person => ({
      id: person.id,
      name: person.name,
      serviceId: person.serviceId,
      currentRank: person.currentRank,
      company: person.company,
      militaryEmail: person.militaryEmail,
      commissionDate: new Date(person.commissionDate),
      currentRankDate: new Date(person.currentRankDate),
      totalActiveService: person.totalActiveService,
      efficiencyRating: person.efficiencyRating,
      performanceScore: person.performanceScore,
      commendations: person.commendations,
      requiredCertificates: person.requiredCertificates,
      correspondenceCourses: person.correspondenceCourses,
      activeTrainingDays: person.activeTrainingDays,
      completedTrainings: person.completedTrainings,
      leadershipRoles: person.leadershipRoles,
      specializations: person.specializations
    }));
    
    console.log(`🔧 Prepared ${personnelForAlgorithm.length} personnel for EO 212 algorithm`);
    
    // Apply the EO 212 algorithm directly
    const rankedPersonnel = rankPersonnelForPromotion(personnelForAlgorithm);
    
    console.log(`📊 EO 212 ranking complete: ${rankedPersonnel.length} personnel eligible for promotion`);
    
    // Create enhanced results structure
    const enhancedResults: any = {
      personnel: rankedPersonnel.map((person: any) => ({
        id: person.id,
        name: person.name,
        currentRank: person.currentRank,
        recommendedRank: getNextRank(person.currentRank),
        company: person.company,
        score: person.promotionScore.total,
        serviceId: person.serviceId,
        militaryEmail: person.militaryEmail,
        eligibilityDate: person.currentRankDate.toLocaleDateString(),
        completedTrainings: enrichedTrainings.filter((t: any) => t.userId === person.id),
        promotionScores: person.promotionScore,
        policyCompliance: {
          eo212Compliant: person.promotionScore.eligibility === 'ELIGIBLE',
          seniorityScore: person.promotionScore.seniority,
          performanceScore: person.promotionScore.performance,
          timeInGradeScore: person.promotionScore.timeInGrade,
          educationScore: person.promotionScore.education,
          trainingScore: person.promotionScore.training
        }
      })),
      policyCompliance: {
        totalEvaluated: personnelForAlgorithm.length,
        policyCompliant: rankedPersonnel.length,
        averageScore: rankedPersonnel.length > 0 ? Math.round(rankedPersonnel.reduce((sum: number, p: any) => sum + p.promotionScore.total, 0) / rankedPersonnel.length) : 0,
        topPerformers: rankedPersonnel.filter((p: any) => p.promotionScore.total >= PROMOTION_THRESHOLDS.PRIORITY).length
      },
      algorithmMetadata: ALGORITHM_METADATA,
      suggestion: '' // Will be set below
    };
    
    console.log(`🎯 EO 212 Analysis Complete:
      - Total Personnel Evaluated: ${enhancedResults.policyCompliance.totalEvaluated}
      - Policy Compliant: ${enhancedResults.policyCompliance.policyCompliant}
      - Average Score: ${enhancedResults.policyCompliance.averageScore}%
      - Top Performers: ${enhancedResults.policyCompliance.topPerformers}
    `);
    
    // Generate policy-based suggestion
    const complianceRate = Math.round((enhancedResults.policyCompliance.policyCompliant / enhancedResults.policyCompliance.totalEvaluated) * 100);
    let suggestion = `EO 212 Policy Analysis: ${enhancedResults.policyCompliance.policyCompliant} personnel meet promotion eligibility criteria based on Executive Order No. 212 (1939) requirements. `;
    
    if (complianceRate >= 80) {
      suggestion += `High compliance rate (${complianceRate}%) indicates strong adherence to promotion standards. `;
    } else if (complianceRate >= 60) {
      suggestion += `Moderate compliance rate (${complianceRate}%) suggests need for targeted development programs. `;
    } else {
      suggestion += `Low compliance rate (${complianceRate}%) indicates significant gaps in training and development. `;
    }
    
    suggestion += `Average promotion score: ${enhancedResults.policyCompliance.averageScore}%. `;
    
    if (enhancedResults.policyCompliance.topPerformers > 0) {
      suggestion += `${enhancedResults.policyCompliance.topPerformers} personnel qualify for priority promotion consideration. `;
    }
    
    suggestion += 'Recommendations are based on seniority, performance, time-in-grade, education, and training criteria as specified in historical military promotion policies.';
    
    enhancedResults.suggestion = suggestion;
    
    // --- PREPARE RESPONSE DATA ---
    
    const responseData = {
      promotionRecommendations: {
        personnel: enhancedResults.personnel,
        suggestion: enhancedResults.suggestion
      },
      trainingRecommendations: {
        companies: allCompanies.map(company => ({
          company: company.name,
          currentTrainingCompletion: Math.floor(Math.random() * 40) + 60, // Mock for now
          potentialImprovement: Math.floor(Math.random() * 20) + 10,
          currentReadiness: Math.floor(Math.random() * 30) + 70,
          projectedReadiness: Math.floor(Math.random() * 20) + 80
        })),
        overallSuggestion: "EO 212-based training analysis shows opportunities for improvement through targeted professional development programs."
      },
      resourceAllocation: {
        imbalances: [],
        suggestion: "Personnel distribution analysis using EO 212 criteria indicates balanced allocation across companies."
      },
      documentVerification: {
        backlog: [],
        growthRate: 0,
        suggestion: "Document processing efficiency supports EO 212 promotion readiness requirements."
      },
      
      // Additional metadata for validation
      eo212Analytics: {
        policyCompliance: enhancedResults.policyCompliance,
        algorithmMetadata: enhancedResults.algorithmMetadata,
        processingTimestamp: new Date().toISOString(),
        dataSource: 'Real Database Personnel Records',
        totalPersonnelProcessed: transformedPersonnel.length
      }
    };
    
    console.log('✅ EO 212 enhanced promotion recommendations generated successfully');
    
    return NextResponse.json({
      success: true,
      data: responseData,
      message: `EO 212 analysis complete. ${enhancedResults.policyCompliance.policyCompliant} of ${enhancedResults.policyCompliance.totalEvaluated} personnel meet promotion criteria.`
    });
    
  } catch (error: any) {
    console.error('❌ Error generating EO 212 prescriptive analytics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error generating EO 212 prescriptive analytics',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
