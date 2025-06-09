"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { TrendingUp, Users, Target, AlertCircle, CheckCircle, Clock, Award, Download, Search, Filter } from 'lucide-react';
import { jsPDF } from 'jspdf';

// Interface for training completion
interface TrainingCompletion {
  id: string;
  title: string;
  completionDate: string;
  score?: number;
  type?: string;
  location?: string;
}

// Interface for promotion recommendation
interface PromotionRecommendation {
  id: string;
  name: string;
  currentRank: string;
  recommendedRank: string;
  company: string;
  score: number;
  serviceId: string;
  militaryEmail: string;
  eligibilityDate: string;
  completedTrainings?: TrainingCompletion[];
}

// Interface for prescriptive analytics data
interface PrescriptiveData {
  promotionRecommendations: {
    personnel: PromotionRecommendation[];
    suggestion: string;
  };
  trainingRecommendations: {
    companies: Array<{
      company: string;
      currentTrainingCompletion: number;
      potentialImprovement: number;
      currentReadiness: number;
      projectedReadiness: number;
    }>;
    overallSuggestion: string;
  };
  resourceAllocation: {
    imbalances: Array<{
      company: string;
      currentCount: number;
      deviation: number;
      recommendation: string;
    }>;
    suggestion: string;
  };
  documentVerification: {
    backlog: Array<{
      company: string;
      count: number;
      oldestPendingDate: string;
    }>;
    growthRate: number;
    suggestion: string;
  };
}

const PrescriptiveAnalytics = () => {
  const { user, isAuthenticated, isLoading, getToken } = useAuth();
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<PrescriptiveData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [lastAnalysisDate, setLastAnalysisDate] = useState<string>("");
  const [isLoadingTrainings, setIsLoadingTrainings] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRank, setFilterRank] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterScore, setFilterScore] = useState('');
  
  // List of available ranks and companies for filters
  const [availableRanks, setAvailableRanks] = useState<string[]>([]);
  const [availableCompanies, setAvailableCompanies] = useState<string[]>([]);

  // Fetch data from the API
  const fetchAnalyticsData = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      
      // Get authentication token
      const token = await getToken();
      
      if (!token) {
        setError('Authentication required. Please log in again.');
        setIsGenerating(false);
        return;
      }
      
      // Call the API endpoint
      const response = await fetch('/api/analytics/prescriptive', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch analytics data');
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        // Get the promotion recommendations
        const recommendations = data.data.promotionRecommendations.personnel;
        
        // Fetch completed trainings for each personnel
        await fetchCompletedTrainings(recommendations, token);
        
        setAnalyticsData(data.data);
        setLastAnalysisDate(new Date().toLocaleString());
        
        // Extract unique ranks and companies for filters
        if (data.data.promotionRecommendations && data.data.promotionRecommendations.personnel) {
          const personnel = data.data.promotionRecommendations.personnel;
          
          // Extract unique ranks
          const ranks = [...new Set([
            ...personnel.map((p: PromotionRecommendation) => p.currentRank),
            ...personnel.map((p: PromotionRecommendation) => p.recommendedRank)
          ])].filter(Boolean).sort();
          
          // Extract unique companies
          const companies = [...new Set(
            personnel.map((p: PromotionRecommendation) => p.company)
          )].filter(Boolean).sort();
          
          setAvailableRanks(ranks as string[]);
          setAvailableCompanies(companies as string[]);
          
          // Calculate total pages based on filtered recommendations
          const filteredCount = personnel.length;
          setTotalPages(Math.max(1, Math.ceil(filteredCount / 3)));
        }
      } else {
        throw new Error(data.error || 'Invalid data format received');
      }
    } catch (error: any) {
      console.error('Error fetching analytics data:', error);
      setError(error.message || 'An error occurred while fetching data');
    } finally {
      setIsGenerating(false);
    }
  };

  // Fetch completed trainings for each personnel
  const fetchCompletedTrainings = async (personnel: PromotionRecommendation[], token: string) => {
    try {
      setIsLoadingTrainings(true);
      
      // For each personnel, fetch their completed trainings
      for (const person of personnel) {
        try {
          const response = await fetch(`/api/trainings/completed?userId=${person.id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.trainings) {
              // Map the trainings to the required format
              person.completedTrainings = data.trainings.map((training: any) => ({
                id: training._id || training.id,
                title: training.title,
                completionDate: new Date(training.completionDate || training.endDate).toLocaleDateString(),
                score: training.performance?.score,
                type: training.type,
                location: training.location?.name
              }));
            }
          }
        } catch (error) {
          console.error(`Error fetching trainings for ${person.name}:`, error);
          // Continue with next person even if one fails
        }
      }
    } catch (error) {
      console.error('Error fetching completed trainings:', error);
    } finally {
      setIsLoadingTrainings(false);
    }
  };

  // Check authentication and redirect if needed
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Reset to first page when filters change
  useEffect(() => {
    if (analyticsData) {
      const filteredCount = getFilteredPersonnel().length;
      setTotalPages(Math.max(1, Math.ceil(filteredCount / 3)));
      setCurrentPage(1);
    }
  }, [searchTerm, filterRank, filterCompany, filterScore]);

  // Handle page navigation
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Filter personnel based on search and filter criteria
  const getFilteredPersonnel = () => {
    if (!analyticsData?.promotionRecommendations?.personnel) {
      return [];
    }
    
    return analyticsData.promotionRecommendations.personnel.filter(person => {
      // Search term filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === '' || 
        person.name.toLowerCase().includes(searchLower) ||
        person.serviceId.toLowerCase().includes(searchLower) ||
        person.militaryEmail.toLowerCase().includes(searchLower);
      
      // Rank filter
      const matchesRank = filterRank === '' || 
        person.currentRank === filterRank || 
        person.recommendedRank === filterRank;
      
      // Company filter
      const matchesCompany = filterCompany === '' || person.company === filterCompany;
      
      // Score filter
      let matchesScore = true;
      if (filterScore === 'high') {
        matchesScore = person.score >= 80;
      } else if (filterScore === 'medium') {
        matchesScore = person.score >= 60 && person.score < 80;
      } else if (filterScore === 'low') {
        matchesScore = person.score < 60;
      }
      
      return matchesSearch && matchesRank && matchesCompany && matchesScore;
    });
  };

  // Get current items for pagination
  const getCurrentPageItems = () => {
    const filteredPersonnel = getFilteredPersonnel();
    const itemsPerPage = 3;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPersonnel.slice(startIndex, startIndex + itemsPerPage);
  };

  // Calculate statistics
  const getEligiblePersonnelCount = () => {
    return getFilteredPersonnel().length;
  };

  const getAverageBasisScore = () => {
    const personnel = getFilteredPersonnel();
    if (!personnel || personnel.length === 0) {
      return 0;
    }
    
    const sum = personnel.reduce((total, person) => total + person.score, 0);
    return Math.round(sum / personnel.length);
  };
  
  // Calculate total completed trainings across all personnel
  const getTotalCompletedTrainings = () => {
    if (!analyticsData?.promotionRecommendations?.personnel) {
      return 0;
    }
    
    return analyticsData.promotionRecommendations.personnel.reduce((total, person) => {
      return total + (person.completedTrainings?.length || 0);
    }, 0);
  };

  // Generate PDF for a specific personnel
  const generatePersonnelPDF = (person: PromotionRecommendation) => {
    const doc = new jsPDF();
    
    // Define colors
    const armyGreen = [34, 71, 57];
    const armyGold = [212, 175, 55];
    const darkBlue = [0, 32, 96];
    
    // Add subtle watermark first (so it's behind everything)
    doc.setFontSize(70);
    doc.setTextColor(248, 248, 248); // Very light gray, almost invisible
    doc.setFont('helvetica', 'bold');
    // Position the watermark diagonally
    doc.text('301st RRIBN', 45, 140, { angle: 45 });
    
    // Add background elements
    // Header background
    doc.setFillColor(armyGreen[0], armyGreen[1], armyGreen[2]);
    doc.rect(0, 0, 210, 30, 'F');
    
    // Gold border
    doc.setDrawColor(armyGold[0], armyGold[1], armyGold[2]);
    doc.setLineWidth(1.5);
    doc.rect(5, 5, 200, 287, 'D');
    
    // Add military insignia/header
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('301st RRIBN', 105, 15, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(armyGold[0], armyGold[1], armyGold[2]);
    doc.text('PHILIPPINE ARMY', 105, 22, { align: 'center' });
    
    // Add subtitle
    doc.setFillColor(armyGold[0], armyGold[1], armyGold[2]);
    doc.rect(40, 35, 130, 10, 'F');
    
    doc.setFontSize(16);
    doc.setTextColor(armyGreen[0], armyGreen[1], armyGreen[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('PERSONNEL PROMOTION REPORT', 105, 42, { align: 'center' });
    
    // Add classification marking
    doc.setFontSize(10);
    doc.setTextColor(255, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('CONFIDENTIAL - FOR OFFICIAL USE ONLY', 105, 52, { align: 'center' });
    
    // Add personnel info section header
    doc.setFillColor(armyGreen[0], armyGreen[1], armyGreen[2]);
    doc.rect(15, 60, 180, 8, 'F');
    
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text('PERSONNEL INFORMATION', 105, 66, { align: 'center' });
    
    // Add personnel info
    doc.setFontSize(14);
    doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(`Name: ${person.name}`, 20, 80);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    // Left column
    doc.text(`Service ID: ${person.serviceId}`, 20, 90);
    doc.text(`Current Rank: ${person.currentRank}`, 20, 100);
    doc.text(`Company: ${person.company}`, 20, 110);
    
    // Right column
    doc.text(`Email: ${person.militaryEmail}`, 110, 90);
    doc.text(`Recommended Rank: ${person.recommendedRank}`, 110, 100);
    doc.text(`Eligible Date: ${person.eligibilityDate}`, 110, 110);
    
    // Add promotion score section with visual indicator
    doc.setFillColor(armyGreen[0], armyGreen[1], armyGreen[2]);
    doc.rect(15, 120, 180, 8, 'F');
    
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text('PROMOTION ASSESSMENT', 105, 126, { align: 'center' });
    
    // Score visualization
    doc.setFontSize(14);
    doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(`Promotion Score: ${person.score}%`, 20, 140);
    
    // Draw score bar background
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(20, 145, 160, 10, 2, 2, 'FD');
    
    // Draw score bar fill
    let scoreColor = [255, 0, 0]; // Red for low scores
    if (person.score >= 80) {
      scoreColor = [0, 128, 0]; // Green for high scores
    } else if (person.score >= 60) {
      scoreColor = [255, 165, 0]; // Orange for medium scores
    }
    
    doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    const scoreWidth = Math.min(160 * (person.score / 100), 160);
    doc.roundedRect(20, 145, scoreWidth, 10, 2, 2, 'F');
    
    // Add recommendation
    doc.setFontSize(12);
    doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
    doc.setFont('helvetica', 'normal');
    
    let recommendation = "Schedule for promotion review";
    if (person.score >= 90) {
      recommendation = "Immediate promotion recommended";
    } else if (person.score >= 80) {
      recommendation = "Fast-track to promotion board";
    }
    
    doc.text(`Recommendation: ${recommendation}`, 20, 165);
    
    // Add training information section
    doc.setFillColor(armyGreen[0], armyGreen[1], armyGreen[2]);
    doc.rect(15, 175, 180, 8, 'F');
    
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text('COMPLETED TRAININGS', 105, 181, { align: 'center' });
    
    // Add training list
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    if (person.completedTrainings && person.completedTrainings.length > 0) {
      person.completedTrainings.forEach((training, index) => {
        const y = 195 + (index * 10);
        if (y < 260) { // Ensure we don't go off the page
          doc.text(`${index + 1}. ${training.title}`, 25, y);
          doc.setFont('helvetica', 'italic');
          doc.text(`Completed: ${training.completionDate}`, 140, y);
          doc.setFont('helvetica', 'normal');
        }
      });
      
      if (person.completedTrainings.length > 6) {
        doc.text(`+ ${person.completedTrainings.length - 6} more trainings completed`, 25, 255);
      }
    } else {
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.text('No training records available', 105, 195, { align: 'center' });
    }
    
    // Add footer with authentication
    doc.setFillColor(armyGreen[0], armyGreen[1], armyGreen[2]);
    doc.rect(0, 277, 210, 20, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 105, 283, { align: 'center' });
    doc.text('301st RRIBN - Infantry Battalion - Philippine Army', 105, 288, { align: 'center' });
    
    // Save the PDF
    doc.save(`${person.name.replace(/\s+/g, '_')}_promotion_report.pdf`);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilterRank('');
    setFilterCompany('');
    setFilterScore('');
  };

    return (
    <div className="min-h-screen bg-white">
      <div className="flex flex-col h-screen">
        {/* Header - Reduced padding */}
        <div className="px-4 py-2 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
                <TrendingUp className="text-blue-600" size={18} />
                Prescriptive Analytics - Personnel Promotion
              </h1>
            </div>
              <button
              onClick={fetchAnalyticsData}
              disabled={isGenerating}
              className="flex items-center gap-1 px-4 py-2 text-sm text-white transition-colors bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-300"
            >
              {isGenerating ? (
                <>
                  <div className="w-3 h-3 border-2 border-white rounded-full animate-spin border-t-transparent"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Award size={14} />
                  Generate Promotion Eligibility
                </>
              )}
              </button>
          </div>
        </div>

        {/* Main Content Area - Horizontal Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Analytics and Metrics */}
          <div className="w-1/3 p-3 overflow-y-auto bg-white border-r border-gray-200">
            {/* Current Status Overview - Reduced spacing */}
            <div className="mb-4 space-y-2">
              <h2 className="mb-2 text-sm font-bold text-gray-900">Current Performance Metrics</h2>
              <div className="p-2 border border-blue-200 rounded-lg bg-blue-50">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
            <div>
                    <h3 className="text-xs font-semibold text-gray-900">Total Eligible Personnel</h3>
                    <p className="text-sm font-bold text-blue-600">{getEligiblePersonnelCount()}</p>
            </div>
            </div>
              </div>
              <div className="p-2 border border-green-200 rounded-lg bg-green-50">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-600" />
            <div>
                    <h3 className="text-xs font-semibold text-gray-900">Average Basis Score</h3>
                    <p className="text-sm font-bold text-green-600">{getAverageBasisScore()}%</p>
            </div>
          </div>
        </div>
              <div className="p-2 border rounded-lg border-amber-200 bg-amber-50">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-600" />
                  <div>
                    <h3 className="text-xs font-semibold text-gray-900">Total Completed Trainings</h3>
                    <p className="text-sm font-bold text-amber-600">{getTotalCompletedTrainings()}</p>
                  </div>
                </div>
                  </div>
              <div className="p-2 border border-purple-200 rounded-lg bg-purple-50">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <div>
                    <h3 className="text-xs font-semibold text-gray-900">Last Analysis Update</h3>
                    <p className="text-xs text-gray-700">{lastAnalysisDate || "Not yet generated"}</p>
                </div>
                </div>
              </div>
            </div>
            
            {/* Filter Section */}
            <div className="p-3 mb-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold text-gray-900">Filter Personnel</h2>
                    <button 
                  onClick={clearFilters}
                  className="text-xs text-blue-600 hover:text-blue-800"
                    >
                  Clear Filters
                    </button>
                  </div>
                  
              {/* Search */}
              <div className="mb-2">
                <div className="relative">
                  <Search className="absolute w-3 h-3 text-gray-400 transform -translate-y-1/2 left-2 top-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name or ID..."
                    className="w-full py-1 pr-2 text-xs border border-gray-300 rounded pl-7"
                  />
                    </div>
                      </div>
              
              {/* Rank Filter */}
              <div className="mb-2">
                <label className="block mb-1 text-xs text-gray-700">Rank</label>
                <select
                  value={filterRank}
                  onChange={(e) => setFilterRank(e.target.value)}
                  className="w-full p-1 text-xs border border-gray-300 rounded"
                >
                  <option value="">All Ranks</option>
                  {availableRanks.map(rank => (
                    <option key={rank} value={rank}>{rank}</option>
                  ))}
                </select>
                  </div>
                  
              {/* Company Filter */}
              <div className="mb-2">
                <label className="block mb-1 text-xs text-gray-700">Company</label>
                <select
                  value={filterCompany}
                  onChange={(e) => setFilterCompany(e.target.value)}
                  className="w-full p-1 text-xs border border-gray-300 rounded"
                >
                  <option value="">All Companies</option>
                  {availableCompanies.map(company => (
                    <option key={company} value={company}>{company}</option>
                  ))}
                </select>
        </div>

              {/* Score Filter */}
              <div>
                <label className="block mb-1 text-xs text-gray-700">Score</label>
                <select
                  value={filterScore}
                  onChange={(e) => setFilterScore(e.target.value)}
                  className="w-full p-1 text-xs border border-gray-300 rounded"
                >
                  <option value="">All Scores</option>
                  <option value="high">High (80%+)</option>
                  <option value="medium">Medium (60-79%)</option>
                  <option value="low">Low (&lt;60%)</option>
                </select>
              </div>
            </div>

            {/* Text-based Analytics Insights */}
            <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
              <h2 className="mb-2 text-sm font-bold text-gray-900">Prescriptive System Analysis</h2>
              <div className="space-y-2 text-xs text-gray-700">
                {analyticsData ? (
                  <>
                    <p>
                      <strong className="text-gray-900">Performance Overview:</strong> {analyticsData.promotionRecommendations.suggestion || 
                        `Current promotion system shows ${getEligiblePersonnelCount()} personnel meeting eligibility criteria with ${getAverageBasisScore()}% average performance score.`}
                    </p>
                    <p>
                      <strong className="text-gray-900">Training Analysis:</strong> {analyticsData.trainingRecommendations.overallSuggestion || 
                        "Training completion data shows opportunities for improvement through targeted interventions."}
                    </p>
                    <p>
                      <strong className="text-gray-900">Resource Allocation:</strong> {analyticsData.resourceAllocation.suggestion || 
                        "Personnel distribution analysis indicates potential for optimization across companies."}
                    </p>
                    <p>
                      <strong className="text-gray-900">Document Verification:</strong> {analyticsData.documentVerification.suggestion || 
                        "Document processing efficiency can be improved to support promotion readiness."}
                    </p>
                  </>
                ) : (
                  <p className="text-center text-gray-500">
                    {error ? error : "Click 'Generate Promotion Eligibility' to view analysis"}
                  </p>
                )}
        </div>
        </div>
      </div>

          {/* Right Panel - Recommendations */}
          <div className="flex-1 p-3 overflow-hidden bg-gray-50">
            {analyticsData ? (
              <div className="flex flex-col h-full">
                {/* Pagination controls - Top */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex space-x-2">
                          <button
                      onClick={handlePreviousPage} 
                      disabled={currentPage === 1}
                      className="flex items-center px-3 py-1 text-xs text-white bg-blue-600 border border-blue-700 rounded-md disabled:bg-gray-300 disabled:border-gray-400 disabled:text-gray-500 hover:bg-blue-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Prev
                          </button>
                          <button
                      onClick={handleNextPage} 
                      disabled={currentPage === totalPages}
                      className="flex items-center px-3 py-1 text-xs text-white bg-blue-600 border border-blue-700 rounded-md disabled:bg-gray-300 disabled:border-gray-400 disabled:text-gray-500 hover:bg-blue-700"
                    >
                      Next
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                          </button>
                  </div>
                </div>
                
                {/* Recommendations grid */}
                <div className="grid flex-1 grid-cols-3 gap-3 overflow-auto">
                  {getCurrentPageItems().map((person, index) => (
                    <div key={index} className="flex flex-col h-auto p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                      <div className="py-1 pl-2 mb-2 border-l-4 border-green-500 rounded-r-lg bg-green-50">
                        <div className="flex items-start justify-between">
                          <h4 className="text-xs font-semibold text-gray-900">{person.name}</h4>
                          <button
                            onClick={() => generatePersonnelPDF(person)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Download PDF Report"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                        <p className="text-xs text-gray-600">{person.currentRank} → {person.recommendedRank}</p>
                        <p className="text-xs text-gray-600">Score: {person.score}%</p>
                          </div>

                      <div className="space-y-1 text-xs">
                        <div className="flex">
                          <div className="w-1/3 font-semibold text-gray-700">Service ID:</div>
                          <div className="w-2/3 text-gray-900">{person.serviceId}</div>
                            </div>
                        <div className="flex">
                          <div className="w-1/3 font-semibold text-gray-700">Company:</div>
                          <div className="w-2/3 text-gray-900">{person.company}</div>
                                    </div>
                        <div className="flex">
                          <div className="w-1/3 font-semibold text-gray-700">Email:</div>
                          <div className="w-2/3 text-gray-900">{person.militaryEmail}</div>
                                  </div>
                        <div className="flex">
                          <div className="w-1/3 font-semibold text-gray-700">Eligible:</div>
                          <div className="w-2/3 text-gray-900">{person.eligibilityDate}</div>
                            </div>
                          </div>

                      {/* Training Completions Section */}
                      <div className="pt-3 mt-2 border-t border-gray-100">
                        <h5 className="mb-2 text-base font-semibold text-gray-800">Completed Trainings:</h5>
                        {isLoadingTrainings ? (
                          <div className="flex items-center justify-center py-2">
                            <div className="w-3 h-3 mr-2 border-2 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
                            <span className="text-xs text-gray-500">Loading trainings...</span>
                              </div>
                        ) : person.completedTrainings && person.completedTrainings.length > 0 ? (
                          <ul className="pl-4 text-sm text-gray-700 list-disc">
                            {person.completedTrainings.map((training, idx) => (
                              <li key={idx} className="mb-1">
                                {training.title}
                                <span className="text-xs text-gray-500"> ({training.completionDate})</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs italic text-gray-500">No training records available</p>
                        )}
                      </div>
                      
                      <div className="pt-2 mt-2 border-t border-gray-100">
                        <p className="text-xs font-medium text-green-700">
                          {person.score >= 90 ? "Immediate promotion recommended" :
                           person.score >= 80 ? "Fast-track to promotion board" :
                           "Schedule for promotion review"}
                        </p>
                                      </div>
                                    </div>
                                  ))}
                  
                  {/* Empty state when no items on current page */}
                  {getCurrentPageItems().length === 0 && (
                    <div className="flex items-center justify-center h-full col-span-3">
                      <div className="text-center">
                        <Award className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                        <h3 className="text-sm font-semibold text-gray-900">No promotion candidates found</h3>
                        <p className="mt-1 text-xs text-gray-500">Try adjusting your filters or generate new analysis</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="max-w-md p-4 text-center bg-white border border-gray-200 rounded-lg shadow-sm">
                  <Award className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                  <h3 className="mb-1 text-sm font-semibold text-gray-900">Ready to Generate Prescriptive Analytics?</h3>
                  <p className="mb-2 text-xs text-gray-600">
                    Click the "Generate Promotion Eligibility" button to receive
                    recommendations based on training completion data and personnel records.
                  </p>
                  {error && (
                    <p className="p-2 mt-2 text-xs text-red-600 rounded bg-red-50">
                      Error: {error}
                    </p>
                  )}
                </div>
                    </div>
                  )}
            </div>
          </div>
      </div>
    </div>
  );
};

export default PrescriptiveAnalytics; 