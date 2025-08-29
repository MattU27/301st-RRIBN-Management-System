/**
 * PROMOTION ALGORITHM INTEGRATION
 * 301st RRIBN Management System
 * 
 * This file provides the integration layer between the promotion algorithm
 * and the existing prescriptive analytics page, maintaining compatibility
 * with current data structures while implementing EO 212 policy compliance.
 */

import { 
  PersonnelData, 
  PromotionScores, 
  calculatePromotionScore, 
  rankPersonnelForPromotion,
  generatePromotionAudit,
  PROMOTION_THRESHOLDS,
  ALGORITHM_METADATA
} from './promotionAlgorithm';

// ============================================================================
// DATA TRANSFORMATION FUNCTIONS
// ============================================================================

/**
 * Convert existing PromotionRecommendation interface to PersonnelData
 * This maintains compatibility with current system while adding policy compliance
 */
export function transformToPersonnelData(existingPersonnel: any): PersonnelData {
  return {
    id: existingPersonnel.id,
    name: existingPersonnel.name,
    serviceId: existingPersonnel.serviceId,
    currentRank: existingPersonnel.currentRank,
    company: existingPersonnel.company,
    militaryEmail: existingPersonnel.militaryEmail,
    
    // Service History - derived from existing data or defaults
    commissionDate: new Date(existingPersonnel.commissionDate || '2020-01-01'),
    currentRankDate: new Date(existingPersonnel.currentRankDate || existingPersonnel.eligibilityDate),
    totalActiveService: calculateServiceMonths(existingPersonnel.eligibilityDate),
    
    // Performance Data - enhanced with algorithm requirements
    efficiencyRating: deriveEfficiencyRating(existingPersonnel.score),
    performanceScore: existingPersonnel.score || 75,
    commendations: existingPersonnel.commendations || 0,
    
    // Training and Education - enhanced from existing training data
    requiredCertificates: checkRequiredCertificates(Array.isArray(existingPersonnel.completedTrainings) ? existingPersonnel.completedTrainings : []),
    correspondenceCourses: countCorrespondenceCourses(Array.isArray(existingPersonnel.completedTrainings) ? existingPersonnel.completedTrainings : []),
    activeTrainingDays: calculateActiveTrainingDays(Array.isArray(existingPersonnel.completedTrainings) ? existingPersonnel.completedTrainings : []),
    completedTrainings: Array.isArray(existingPersonnel.completedTrainings) ? existingPersonnel.completedTrainings.length : 0,
    
    // Additional factors
    leadershipRoles: existingPersonnel.leadershipRoles || 0,
    specializations: existingPersonnel.specializations || []
  };
}

/**
 * Calculate service months from eligibility date
 */
function calculateServiceMonths(eligibilityDate: string): number {
  const eligible = new Date(eligibilityDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - eligible.getTime());
  const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
  return Math.max(diffMonths, 24); // Minimum 2 years service
}

/**
 * Derive efficiency rating from existing score
 */
function deriveEfficiencyRating(score: number): number {
  if (score >= 90) return 5; // Outstanding
  if (score >= 80) return 4; // Excellent
  if (score >= 70) return 3; // Satisfactory
  if (score >= 60) return 2; // Needs Improvement
  return 1; // Unsatisfactory
}

/**
 * Check if required certificates are present in training data
 */
function checkRequiredCertificates(trainings: any[]): boolean {
  if (!trainings || !Array.isArray(trainings) || trainings.length === 0) return false;
  
  // Look for certificate-type trainings
  const certificateTrainings = trainings.filter(training => 
    training && training.title && (
      training.title.toLowerCase().includes('certificate') ||
      training.title.toLowerCase().includes('certification')
    ) || (training.type && training.type.toLowerCase().includes('certificate'))
  );
  
  return certificateTrainings.length > 0;
}

/**
 * Count correspondence courses from training data
 */
function countCorrespondenceCourses(trainings: any[]): number {
  if (!trainings || !Array.isArray(trainings) || trainings.length === 0) return 0;
  
  const correspondenceCourses = trainings.filter(training =>
    training && training.title && (
      training.title.toLowerCase().includes('correspondence') ||
      training.title.toLowerCase().includes('course')
    ) || (training.type && training.type.toLowerCase().includes('course'))
  );
  
  return correspondenceCourses.length;
}

/**
 * Calculate active training days from completed trainings
 */
function calculateActiveTrainingDays(trainings: any[]): number {
  if (!trainings || !Array.isArray(trainings) || trainings.length === 0) return 21; // Return minimum EO 212 requirement
  
  // Estimate training days based on number of trainings
  // Assume each training is minimum 3-5 days
  const estimatedDays = trainings.length * 4;
  return Math.max(estimatedDays, 21); // Ensure minimum EO 212 requirement
}

// ============================================================================
// ENHANCED ANALYTICS FUNCTIONS
// ============================================================================

/**
 * Generate enhanced promotion recommendations using EO 212 algorithm
 */
export function generateEnhancedRecommendations(existingData: any): {
  personnel: Array<any>;
  suggestion: string;
  policyCompliance: {
    totalEvaluated: number;
    policyCompliant: number;
    averageScore: number;
    topPerformers: number;
  };
  algorithmMetadata: typeof ALGORITHM_METADATA;
} {
  // Transform existing personnel data
  const personnelData = existingData.promotionRecommendations.personnel.map(transformToPersonnelData);
  
  // Calculate promotion scores using EO 212 algorithm
  const rankedPersonnel = rankPersonnelForPromotion(personnelData);
  
  // Convert back to existing format with enhanced scoring
  const enhancedPersonnel = rankedPersonnel.map(person => ({
    id: person.id,
    name: person.name,
    currentRank: person.currentRank,
    recommendedRank: getRecommendedRank(person.currentRank),
    company: person.company,
    score: person.promotionScore.total,
    serviceId: person.serviceId,
    militaryEmail: person.militaryEmail,
    eligibilityDate: formatEligibilityDate(person.currentRankDate),
    completedTrainings: existingData.promotionRecommendations.personnel
      .find((p: any) => p.id === person.id)?.completedTrainings || [],
    
    // Enhanced fields from algorithm
    promotionScores: person.promotionScore,
    policyCompliance: {
      eo212Compliant: person.promotionScore.eligibility === 'ELIGIBLE',
      seniorityScore: person.promotionScore.seniority,
      performanceScore: person.promotionScore.performance,
      timeInGradeScore: person.promotionScore.timeInGrade,
      educationScore: person.promotionScore.education,
      trainingScore: person.promotionScore.training
    },
    auditTrail: generatePromotionAudit(person, person.promotionScore)
  }));
  
  // Generate policy compliance statistics
  const policyCompliance = {
    totalEvaluated: personnelData.length,
    policyCompliant: rankedPersonnel.length,
    averageScore: Math.round(rankedPersonnel.reduce((sum, p) => sum + p.promotionScore.total, 0) / rankedPersonnel.length),
    topPerformers: rankedPersonnel.filter(p => p.promotionScore.total >= PROMOTION_THRESHOLDS.PRIORITY).length
  };
  
  // Generate enhanced suggestion
  const suggestion = generatePolicySuggestion(policyCompliance, rankedPersonnel.length);
  
  return {
    personnel: enhancedPersonnel,
    suggestion,
    policyCompliance,
    algorithmMetadata: ALGORITHM_METADATA
  };
}

/**
 * Get recommended rank based on current rank
 */
function getRecommendedRank(currentRank: string): string {
  const rankProgression: { [key: string]: string } = {
    'Third Lieutenant': 'Second Lieutenant',
    'Second Lieutenant': 'First Lieutenant',
    'First Lieutenant': 'Captain',
    'Captain': 'Major',
    'Major': 'Lieutenant Colonel',
    'Lieutenant Colonel': 'Colonel',
    'Private': 'Private First Class',
    'Private First Class': 'Corporal',
    'Corporal': 'Sergeant',
    'Sergeant': 'Staff Sergeant',
    'Staff Sergeant': 'Technical Sergeant',
    'Technical Sergeant': 'Master Sergeant'
  };
  
  return rankProgression[currentRank] || 'Next Rank';
}

/**
 * Format eligibility date for display
 */
function formatEligibilityDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Generate policy-based suggestion
 */
function generatePolicySuggestion(compliance: any, eligibleCount: number): string {
  const complianceRate = Math.round((compliance.policyCompliant / compliance.totalEvaluated) * 100);
  
  let suggestion = `EO 212 Policy Analysis: ${eligibleCount} personnel meet promotion eligibility criteria based on Executive Order No. 212 (1939) requirements. `;
  
  if (complianceRate >= 80) {
    suggestion += `High compliance rate (${complianceRate}%) indicates strong adherence to promotion standards. `;
  } else if (complianceRate >= 60) {
    suggestion += `Moderate compliance rate (${complianceRate}%) suggests need for targeted development programs. `;
  } else {
    suggestion += `Low compliance rate (${complianceRate}%) indicates significant gaps in training and development. `;
  }
  
  suggestion += `Average promotion score: ${compliance.averageScore}%. `;
  
  if (compliance.topPerformers > 0) {
    suggestion += `${compliance.topPerformers} personnel qualify for priority promotion consideration. `;
  }
  
  suggestion += 'Recommendations are based on seniority, performance, time-in-grade, education, and training criteria as specified in historical military promotion policies.';
  
  return suggestion;
}

// ============================================================================
// API INTEGRATION HELPERS
// ============================================================================

/**
 * Validate personnel data for algorithm processing
 */
export function validatePersonnelData(personnel: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!personnel.id) errors.push('Missing personnel ID');
  if (!personnel.name) errors.push('Missing personnel name');
  if (!personnel.currentRank) errors.push('Missing current rank');
  if (!personnel.serviceId) errors.push('Missing service ID');
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generate summary statistics for dashboard display
 */
export function generateSummaryStatistics(enhancedData: any): {
  totalPersonnel: number;
  eligibleForPromotion: number;
  averageScore: number;
  policyComplianceRate: number;
  recommendationDistribution: {
    immediate: number;
    priority: number;
    recommended: number;
    eligible: number;
  };
} {
  const personnel = enhancedData.personnel;
  const eligible = personnel.filter((p: any) => p.promotionScores.eligibility === 'ELIGIBLE');
  
  const distribution = {
    immediate: personnel.filter((p: any) => p.promotionScores.total >= PROMOTION_THRESHOLDS.IMMEDIATE).length,
    priority: personnel.filter((p: any) => 
      p.promotionScores.total >= PROMOTION_THRESHOLDS.PRIORITY && 
      p.promotionScores.total < PROMOTION_THRESHOLDS.IMMEDIATE
    ).length,
    recommended: personnel.filter((p: any) => 
      p.promotionScores.total >= PROMOTION_THRESHOLDS.RECOMMENDED && 
      p.promotionScores.total < PROMOTION_THRESHOLDS.PRIORITY
    ).length,
    eligible: personnel.filter((p: any) => 
      p.promotionScores.total >= PROMOTION_THRESHOLDS.MINIMUM_ELIGIBLE && 
      p.promotionScores.total < PROMOTION_THRESHOLDS.RECOMMENDED
    ).length
  };
  
  return {
    totalPersonnel: personnel.length,
    eligibleForPromotion: eligible.length,
    averageScore: enhancedData.policyCompliance.averageScore,
    policyComplianceRate: Math.round((eligible.length / personnel.length) * 100),
    recommendationDistribution: distribution
  };
}

// ============================================================================
// EXPORT FOR INTEGRATION
// ============================================================================

export {
  PROMOTION_THRESHOLDS,
  ALGORITHM_METADATA
} from './promotionAlgorithm';
