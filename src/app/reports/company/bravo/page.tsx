'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { ChartBarIcon, UserGroupIcon, DocumentTextIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

export default function BravoCompanyReportPage() {
  const { user, isAuthenticated, hasSpecificPermission } = useAuth();
  const router = useRouter();

  if (!hasSpecificPermission('run_reports')) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <div className="text-center py-12">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Access Denied</h3>
            <p className="mt-1 text-sm text-gray-500">
              You do not have permission to view company reports.
            </p>
            <div className="mt-6">
              <Button onClick={() => router.push('/dashboard')} variant="secondary">
                Return to Dashboard
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const companyStats = {
    personnel: 42,
    readyPersonnel: 35,
    documentsComplete: 88,
    trainingsComplete: 82,
    readinessScore: 85,
    recentTrainings: [
      { name: 'Combat Training Alpha', completion: 95, date: '2024-02-15' },
      { name: 'Medical Response', completion: 88, date: '2024-02-01' },
      { name: 'Field Operations', completion: 78, date: '2024-01-15' }
    ],
    personnelStatus: [
      { status: 'Ready', count: 35 },
      { status: 'Training', count: 4 },
      { status: 'Leave', count: 2 },
      { status: 'Medical', count: 1 }
    ],
    documentCompletion: [
      { type: 'Personal Records', complete: 42, total: 42 },
      { type: 'Medical Certificates', complete: 38, total: 42 },
      { type: 'Training Certificates', complete: 35, total: 42 }
    ]
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-center">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push('/dashboard')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Return to Dashboard
        </Button>
      </div>
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Bravo Company Report
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Detailed performance and readiness report
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Button variant="secondary" className="ml-3">
            Export PDF
          </Button>
          <Button variant="primary" className="ml-3">
            Share Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Overall Readiness</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-500">Personnel Readiness</span>
                <span className="text-sm font-medium text-green-600">{(companyStats.readyPersonnel / companyStats.personnel * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${(companyStats.readyPersonnel / companyStats.personnel * 100)}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-500">Document Completion</span>
                <span className="text-sm font-medium text-blue-600">{companyStats.documentsComplete}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${companyStats.documentsComplete}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-500">Training Completion</span>
                <span className="text-sm font-medium text-indigo-600">{companyStats.trainingsComplete}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${companyStats.trainingsComplete}%` }}></div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Personnel Status</h3>
          <div className="space-y-4">
            {companyStats.personnelStatus.map((status, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <UserGroupIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">{status.status}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{status.count} personnel</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Training Performance</h3>
          <div className="space-y-4">
            {companyStats.recentTrainings.map((training, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <AcademicCapIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">{training.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{training.completion}% Success</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      training.completion > 90 ? 'bg-green-600' : 
                      training.completion > 75 ? 'bg-yellow-600' : 'bg-red-600'
                    }`}
                    style={{ width: `${training.completion}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Document Status</h3>
          <div className="space-y-4">
            {companyStats.documentCompletion.map((doc, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">{doc.type}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {doc.complete}/{doc.total} Complete
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(doc.complete / doc.total * 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
} 