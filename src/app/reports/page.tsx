'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  ArrowDownTrayIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import { exportToCSV, exportToExcel, exportToPDF } from '@/utils/exportUtils';
import PermissionGuard from '@/components/PermissionGuard';

// Report types
type ReportType = 
  | 'personnel_roster'
  | 'training_completion'
  | 'document_status'
  | 'readiness_summary'
  | 'audit_logs';

// Report formats
type ExportFormat = 'csv' | 'excel' | 'pdf';

interface ReportDefinition {
  id: ReportType;
  name: string;
  description: string;
  icon: React.ReactNode;
  requiredPermission: string;
  getData: () => Promise<any[]>;
}

export default function ReportsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewData, setPreviewData] = useState<any[] | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Mock data for reports
  const getMockPersonnelData = async () => {
    return [
      { id: 1, name: 'John Doe', rank: 'Captain', company: 'Alpha', status: 'Ready', dateJoined: '2023-01-01' },
      { id: 2, name: 'Jane Smith', rank: 'Lieutenant', company: 'Bravo', status: 'Standby', dateJoined: '2023-02-15' },
      { id: 3, name: 'Robert Johnson', rank: 'Sergeant', company: 'Charlie', status: 'Ready', dateJoined: '2023-03-01' },
      { id: 4, name: 'Emily Davis', rank: 'Corporal', company: 'HQ', status: 'Retired', dateJoined: '2023-01-15' },
      { id: 5, name: 'Michael Wilson', rank: 'Private', company: 'Signal', status: 'Ready', dateJoined: '2023-06-01' }
    ];
  };

  const getMockTrainingData = async () => {
    return [
      { id: 1, title: 'Basic Training', startDate: '2023-01-15', endDate: '2023-02-15', completed: 45, registered: 50, completionRate: '90%' },
      { id: 2, name: 'Advanced Combat', startDate: '2023-03-10', endDate: '2023-03-25', completed: 32, registered: 40, completionRate: '80%' },
      { id: 3, name: 'Leadership Course', startDate: '2023-04-05', endDate: '2023-04-20', completed: 18, registered: 20, completionRate: '90%' },
      { id: 4, name: 'First Aid', startDate: '2023-05-10', endDate: '2023-05-12', completed: 38, registered: 40, completionRate: '95%' },
      { id: 5, name: 'Tactical Operations', startDate: '2023-06-01', endDate: '2023-06-15', completed: 25, registered: 30, completionRate: '83%' }
    ];
  };

  const getMockDocumentData = async () => {
    return [
      { id: 1, title: 'Military ID', type: 'ID', uploadDate: '2023-01-01', status: 'Verified', verifiedBy: 'Lt. Brown' },
      { id: 2, title: 'Medical Certificate', type: 'Medical', uploadDate: '2023-12-01', status: 'Verified', verifiedBy: 'Maj. Smith' },
      { id: 3, title: 'Training Certificate', type: 'Certificate', uploadDate: '2023-02-20', status: 'Pending', verifiedBy: null },
      { id: 4, title: 'Security Clearance', type: 'Clearance', uploadDate: '2023-03-15', status: 'Verified', verifiedBy: 'Col. Johnson' },
      { id: 5, title: 'Deployment Order', type: 'Order', uploadDate: '2023-05-10', status: 'Verified', verifiedBy: 'Maj. Smith' }
    ];
  };

  const getMockReadinessData = async () => {
    return [
      { company: 'Alpha', personnel: 45, readyPersonnel: 38, documentsComplete: 92, trainingsComplete: 85, readinessScore: 88 },
      { company: 'Bravo', personnel: 42, readyPersonnel: 35, documentsComplete: 88, trainingsComplete: 82, readinessScore: 85 },
      { company: 'Charlie', personnel: 38, readyPersonnel: 30, documentsComplete: 78, trainingsComplete: 75, readinessScore: 76 },
      { company: 'HQ', personnel: 25, readyPersonnel: 23, documentsComplete: 95, trainingsComplete: 90, readinessScore: 93 },
      { company: 'Signal', personnel: 30, readyPersonnel: 24, documentsComplete: 80, trainingsComplete: 78, readinessScore: 79 },
      { company: 'FAB', personnel: 35, readyPersonnel: 28, documentsComplete: 82, trainingsComplete: 80, readinessScore: 81 }
    ];
  };

  const getMockAuditLogData = async () => {
    // Get from localStorage for demo purposes
    const storedLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
    return storedLogs.length > 0 ? storedLogs : [
      { timestamp: new Date().toISOString(), userId: 1, userName: 'John Doe', userRole: 'ADMIN', action: 'view', resource: 'report', details: 'Viewed personnel roster report' },
      { timestamp: new Date().toISOString(), userId: 1, userName: 'John Doe', userRole: 'ADMIN', action: 'export', resource: 'report', details: 'Exported personnel roster as PDF' }
    ];
  };

  // Define available reports
  const reports: ReportDefinition[] = [
    {
      id: 'personnel_roster',
      name: 'Personnel Roster',
      description: 'Complete list of all personnel with their basic information',
      icon: <UserGroupIcon className="h-8 w-8 text-indigo-600" />,
      requiredPermission: 'view_all_personnel',
      getData: getMockPersonnelData
    },
    {
      id: 'training_completion',
      name: 'Training Completion',
      description: 'Summary of training completion rates and statistics',
      icon: <AcademicCapIcon className="h-8 w-8 text-green-600" />,
      requiredPermission: 'view_trainings',
      getData: getMockTrainingData
    },
    {
      id: 'document_status',
      name: 'Document Status',
      description: 'Status of all documents and verification information',
      icon: <DocumentTextIcon className="h-8 w-8 text-blue-600" />,
      requiredPermission: 'view_documents',
      getData: getMockDocumentData
    },
    {
      id: 'readiness_summary',
      name: 'Readiness Summary',
      description: 'Overall readiness metrics by company and category',
      icon: <ChartBarIcon className="h-8 w-8 text-purple-600" />,
      requiredPermission: 'view_analytics',
      getData: getMockReadinessData
    },
    {
      id: 'audit_logs',
      name: 'Audit Logs',
      description: 'System audit logs showing user actions and events',
      icon: <ClipboardDocumentCheckIcon className="h-8 w-8 text-red-600" />,
      requiredPermission: 'view_system_logs',
      getData: getMockAuditLogData
    }
  ];

  const handleSelectReport = async (reportType: ReportType) => {
    setSelectedReport(reportType);
    setPreviewData(null);
    
    // Get preview data
    const report = reports.find(r => r.id === reportType);
    if (report) {
      try {
        const data = await report.getData();
        setPreviewData(data.slice(0, 3)); // Show only first 3 rows in preview
      } catch (error) {
        console.error('Failed to get report data:', error);
      }
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedReport) return;
    
    setIsGenerating(true);
    
    try {
      const report = reports.find(r => r.id === selectedReport);
      if (!report) return;
      
      const data = await report.getData();
      const filename = `${report.name.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}`;
      
      // Export based on selected format
      switch (exportFormat) {
        case 'csv':
          exportToCSV(data, filename);
          break;
        case 'excel':
          exportToExcel(data, filename);
          break;
        case 'pdf':
          exportToPDF(data, report.name, filename);
          break;
      }
      
      // Log the export action (in a real app, this would be sent to the server)
      if (user) {
        const auditLog = {
          timestamp: new Date().toISOString(),
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          action: 'export' as const,
          resource: 'report' as const,
          details: `Exported ${report.name} as ${exportFormat.toUpperCase()}`
        };
        
        console.log('AUDIT LOG:', auditLog);
        
        // Store in localStorage for demo purposes
        const storedLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
        storedLogs.push(auditLog);
        localStorage.setItem('auditLogs', JSON.stringify(storedLogs.slice(-100))); // Keep last 100 logs
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <ChartBarIcon className="h-8 w-8 text-indigo-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Reports</h2>
              <div className="space-y-4">
                {reports.map((report) => (
                  <PermissionGuard key={report.id} permission={report.requiredPermission}>
                    <button
                      className={`w-full text-left p-3 rounded-lg border ${
                        selectedReport === report.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => handleSelectReport(report.id)}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0">{report.icon}</div>
                        <div className="ml-4">
                          <h3 className="text-sm font-medium text-gray-900">{report.name}</h3>
                          <p className="text-sm text-gray-500">{report.description}</p>
                        </div>
                      </div>
                    </button>
                  </PermissionGuard>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {selectedReport 
                  ? `Generate ${reports.find(r => r.id === selectedReport)?.name}` 
                  : 'Select a Report'}
              </h2>
              
              {selectedReport ? (
                <div>
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Export Format</h3>
                    <div className="flex space-x-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          className="form-radio h-4 w-4 text-indigo-600"
                          name="exportFormat"
                          value="pdf"
                          checked={exportFormat === 'pdf'}
                          onChange={() => setExportFormat('pdf')}
                        />
                        <span className="ml-2 text-sm text-gray-700">PDF</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          className="form-radio h-4 w-4 text-indigo-600"
                          name="exportFormat"
                          value="excel"
                          checked={exportFormat === 'excel'}
                          onChange={() => setExportFormat('excel')}
                        />
                        <span className="ml-2 text-sm text-gray-700">Excel</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          className="form-radio h-4 w-4 text-indigo-600"
                          name="exportFormat"
                          value="csv"
                          checked={exportFormat === 'csv'}
                          onChange={() => setExportFormat('csv')}
                        />
                        <span className="ml-2 text-sm text-gray-700">CSV</span>
                      </label>
                    </div>
                  </div>
                  
                  {previewData && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Preview (First 3 rows)</h3>
                      <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              {Object.keys(previewData[0]).map((key) => (
                                <th
                                  key={key}
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {previewData.map((row, rowIndex) => (
                              <tr key={rowIndex}>
                                {Object.values(row).map((value: any, valueIndex) => (
                                  <td
                                    key={valueIndex}
                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                                  >
                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end">
                    <Button
                      onClick={handleGenerateReport}
                      disabled={isGenerating}
                      className="flex items-center"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                      {isGenerating ? 'Generating...' : `Export as ${exportFormat.toUpperCase()}`}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No report selected</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Select a report from the list to generate and export
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 