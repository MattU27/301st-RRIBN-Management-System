"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/ui/Card';
import AnalyticsNav from '@/components/AnalyticsNav';
import { 
  LightBulbIcon, 
  UserIcon,
  ChartBarIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentCheckIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';

// Promotion policy analytics data interface
interface PromotionPolicyData {
  policies: Array<{
    id: string;
    rank: string;
    targetRank: string;
    requirementsMet: number;
    totalEligible: number;
    criteria: Array<{
      name: string;
      description: string;
      weight: number;
    }>;
  }>;
  recommendedPromotions: Array<{
    id: string;
    name: string;
    currentRank: string;
    recommendedRank: string;
    company: string;
    score: number;
    yearsOfService: number;
    trainingScore: number;
    evaluationScore: number;
    accomplishments: number;
  }>;
  metrics: {
    averageTimeInRank: number;
    promotionRate: number;
    retentionAfterPromotion: number;
  };
}

// Mock data for promotion policies
const mockPromotionData: PromotionPolicyData = {
  policies: [
    {
      id: "pol1",
      rank: "Private",
      targetRank: "Private First Class",
      requirementsMet: 42,
      totalEligible: 45,
      criteria: [
        { name: "Time in Rank", description: "Minimum of 1 year in current rank", weight: 30 },
        { name: "Training Completion", description: "Complete all required training courses", weight: 25 },
        { name: "Performance Evaluation", description: "Above average performance ratings", weight: 35 },
        { name: "Disciplinary Record", description: "No major disciplinary actions", weight: 10 }
      ]
    },
    {
      id: "pol2",
      rank: "Private First Class",
      targetRank: "Corporal",
      requirementsMet: 18,
      totalEligible: 30,
      criteria: [
        { name: "Time in Rank", description: "Minimum of 2 years in current rank", weight: 25 },
        { name: "Leadership Course", description: "Completion of basic leadership course", weight: 30 },
        { name: "Performance Evaluation", description: "Above average performance for 2 consecutive years", weight: 30 },
        { name: "Special Assignments", description: "Participation in special missions or assignments", weight: 15 }
      ]
    },
    {
      id: "pol3",
      rank: "Corporal",
      targetRank: "Sergeant",
      requirementsMet: 7,
      totalEligible: 15,
      criteria: [
        { name: "Time in Rank", description: "Minimum of 3 years in current rank", weight: 20 },
        { name: "Advanced Training", description: "Completion of advanced combat and leadership training", weight: 30 },
        { name: "Performance Evaluation", description: "Excellent performance ratings", weight: 25 },
        { name: "Team Leadership", description: "Demonstrated leadership of small teams", weight: 25 }
      ]
    }
  ],
  recommendedPromotions: [
    {
      id: "p001",
      name: "Miguel Santos",
      currentRank: "Private",
      recommendedRank: "Private First Class",
      company: "Alpha",
      score: 92,
      yearsOfService: 1.5,
      trainingScore: 95,
      evaluationScore: 90,
      accomplishments: 3
    },
    {
      id: "p002",
      name: "Juan Dela Cruz",
      currentRank: "Private",
      recommendedRank: "Private First Class",
      company: "Bravo",
      score: 88,
      yearsOfService: 1.2,
      trainingScore: 90,
      evaluationScore: 85,
      accomplishments: 2
    },
    {
      id: "p003",
      name: "Ana Reyes",
      currentRank: "Private First Class",
      recommendedRank: "Corporal",
      company: "Charlie",
      score: 94,
      yearsOfService: 2.5,
      trainingScore: 98,
      evaluationScore: 92,
      accomplishments: 4
    },
    {
      id: "p004",
      name: "Carlo Mendoza",
      currentRank: "Corporal",
      recommendedRank: "Sergeant",
      company: "Alpha",
      score: 91,
      yearsOfService: 4.2,
      trainingScore: 87,
      evaluationScore: 95,
      accomplishments: 5
    },
    {
      id: "p005",
      name: "Patricia Lim",
      currentRank: "Private First Class",
      recommendedRank: "Corporal",
      company: "HQ",
      score: 89,
      yearsOfService: 2.3,
      trainingScore: 92,
      evaluationScore: 88,
      accomplishments: 3
    }
  ],
  metrics: {
    averageTimeInRank: 2.4,
    promotionRate: 0.75,
    retentionAfterPromotion: 0.92
  }
};

export default function PromotionPoliciesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [promotionData, setPromotionData] = useState<PromotionPolicyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);

  // Simulate fetching promotion policy data
  const fetchPromotionData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real application, this would be an API call
      // For now, we'll use mock data and a timeout to simulate a network request
      setTimeout(() => {
        setPromotionData(mockPromotionData);
        setLoading(false);
      }, 800);
      
    } catch (err) {
      console.error('Error fetching promotion policy data:', err);
      setError('Failed to load promotion policy data. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'director' && user?.role !== 'administrator') {
      router.push('/dashboard');
      return;
    }

    fetchPromotionData();
  }, [isLoading, isAuthenticated, router, user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
            <h3 className="text-sm font-medium text-red-800">Error loading promotion policy data</h3>
          </div>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <button 
            className="mt-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
            onClick={() => fetchPromotionData()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!promotionData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
            <h3 className="text-sm font-medium text-yellow-800">No data available</h3>
          </div>
          <p className="mt-2 text-sm text-yellow-700">No promotion policy data is currently available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Promotion Policies Analytics</h1>
        <button 
          onClick={() => fetchPromotionData()} 
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Data
        </button>
      </div>

      {/* Analytics Navigation */}
      <div className="mb-6">
        <AnalyticsNav />
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6">
        {/* Promotion Metrics Overview Card */}
        <Card>
          <div className="p-6">
            <div className="flex items-center mb-4">
              <ChartBarIcon className="h-8 w-8 text-indigo-600" />
              <h2 className="ml-3 text-lg font-medium text-gray-900">Promotion Metrics</h2>
            </div>
            <p className="text-gray-600 mb-6">Key metrics for battalion-wide promotion analysis.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                <div className="flex items-center mb-2">
                  <UserGroupIcon className="h-5 w-5 text-indigo-700 mr-2" />
                  <h3 className="text-md font-semibold text-gray-900">Promotion Rate</h3>
                </div>
                <div className="mt-2">
                  <div className="text-3xl font-bold text-indigo-600">{promotionData.metrics.promotionRate * 100}%</div>
                  <div className="text-sm text-gray-600">Personnel promoted on time</div>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-sm text-gray-600">Target:</span>
                    <span className="text-sm font-bold text-indigo-600">80%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${promotionData.metrics.promotionRate * 100}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                <div className="flex items-center mb-2">
                  <ClipboardDocumentCheckIcon className="h-5 w-5 text-emerald-700 mr-2" />
                  <h3 className="text-md font-semibold text-gray-900">Avg. Time in Rank</h3>
                </div>
                <div className="mt-2">
                  <div className="text-3xl font-bold text-emerald-600">{promotionData.metrics.averageTimeInRank.toFixed(1)}</div>
                  <div className="text-sm text-gray-600">Years before promotion</div>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-sm text-gray-600">Target:</span>
                    <span className="text-sm font-bold text-emerald-600">2.0 years</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${Math.min(100, (promotionData.metrics.averageTimeInRank/3) * 100)}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                <div className="flex items-center mb-2">
                  <TrophyIcon className="h-5 w-5 text-amber-700 mr-2" />
                  <h3 className="text-md font-semibold text-gray-900">Retention</h3>
                </div>
                <div className="mt-2">
                  <div className="text-3xl font-bold text-amber-600">{promotionData.metrics.retentionAfterPromotion * 100}%</div>
                  <div className="text-sm text-gray-600">Retention after promotion</div>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-sm text-gray-600">Target:</span>
                    <span className="text-sm font-bold text-amber-600">95%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div className="bg-amber-600 h-2 rounded-full" style={{ width: `${promotionData.metrics.retentionAfterPromotion * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Promotion Policies Card */}
        <Card>
          <div className="p-6">
            <div className="flex items-center mb-4">
              <ClipboardDocumentCheckIcon className="h-8 w-8 text-indigo-600" />
              <h2 className="ml-3 text-lg font-medium text-gray-900">Promotion Policies</h2>
            </div>
            <p className="text-gray-600 mb-6">Current promotion criteria and eligibility by rank.</p>
            
            <div className="space-y-4">
              {promotionData.policies.map((policy) => (
                <div 
                  key={policy.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedPolicy === policy.id ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 hover:border-indigo-200'}`}
                  onClick={() => setSelectedPolicy(selectedPolicy === policy.id ? null : policy.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-md font-semibold text-gray-900">{policy.rank} → {policy.targetRank}</h3>
                      <p className="text-xs text-gray-600 mt-1">
                        {policy.requirementsMet} of {policy.totalEligible} personnel meet promotion criteria ({Math.round((policy.requirementsMet/policy.totalEligible)*100)}%)
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full" 
                          style={{ width: `${(policy.requirementsMet/policy.totalEligible)*100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {selectedPolicy === policy.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Promotion Criteria</h4>
                      <div className="space-y-3">
                        {policy.criteria.map((criterion, idx) => (
                          <div key={idx}>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">{criterion.name} ({criterion.weight}%)</span>
                            </div>
                            <p className="text-xs text-gray-500 mb-1">{criterion.description}</p>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-indigo-600 h-1.5 rounded-full" 
                                style={{ width: `${criterion.weight}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Recommended Promotions */}
        <Card>
          <div className="p-6">
            <div className="flex items-center mb-4">
              <UserIcon className="h-8 w-8 text-indigo-600" />
              <h2 className="ml-3 text-lg font-medium text-gray-900">Recommended Promotions</h2>
            </div>
            <p className="text-gray-600 mb-6">Personnel who meet or exceed promotion criteria and are recommended for promotion.</p>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Rank
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recommendation
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Years of Service
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {promotionData.recommendedPromotions.map((person) => (
                    <tr key={person.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {person.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {person.currentRank}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                          {person.recommendedRank}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`text-sm font-medium ${
                            person.score >= 90 ? 'text-green-700' : 
                            person.score >= 80 ? 'text-yellow-700' : 
                            'text-red-700'
                          }`}>
                            {person.score}%
                          </span>
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${
                              person.score >= 90 ? 'bg-green-500' : 
                              person.score >= 80 ? 'bg-yellow-500' : 
                              'bg-red-500'
                            }`} style={{ width: `${person.score}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {person.company}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {person.yearsOfService} years
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 flex items-center">
                Export Promotion Report
                <ArrowTopRightOnSquareIcon className="ml-1 h-4 w-4" />
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 